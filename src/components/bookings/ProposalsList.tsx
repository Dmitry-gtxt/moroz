import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { sendPushNotification } from '@/lib/pushNotifications';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Calendar, Clock, Loader2, Check, X, AlertTriangle, Coins } from 'lucide-react';
import { getCommissionRate, getPrepaymentAmount, getPerformerPayment, formatPrice } from '@/lib/pricing';

interface Proposal {
  id: string;
  booking_id: string;
  proposed_date: string;
  proposed_time: string;
  proposed_price: number | null;
  slot_id: string | null;
  status: string;
  created_at: string;
}

interface ProposalsListProps {
  bookingId: string;
  performerName: string;
  performerUserId: string | null;
  originalPrice: number;
  customerName: string;
  onAccepted: () => void;
  onRejected: () => void;
}

export function ProposalsList({
  bookingId,
  performerName,
  performerUserId,
  originalPrice,
  customerName,
  onAccepted,
  onRejected,
}: ProposalsListProps) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [commissionRate, setCommissionRate] = useState<number | null>(null);

  useEffect(() => {
    fetchProposals();
    fetchCommissionRate();
  }, [bookingId]);

  const fetchCommissionRate = async () => {
    const rate = await getCommissionRate();
    setCommissionRate(rate);
  };

  const fetchProposals = async () => {
    try {
      const { data, error } = await supabase
        .from('booking_proposals')
        .select('*')
        .eq('booking_id', bookingId)
        .eq('status', 'pending')
        .order('proposed_date', { ascending: true });

      if (error) throw error;
      setProposals(data || []);
    } catch (error) {
      toast.error('Ошибка загрузки предложений');
    } finally {
      setLoading(false);
    }
  };

  // Get proposal price (fallback to originalPrice if null)
  const getProposalPrice = (proposal: Proposal) => proposal.proposed_price ?? originalPrice;

  // Get prepayment amount for a price
  const getPrepayment = (price: number) => {
    if (commissionRate === null) return null;
    return getPrepaymentAmount(price, commissionRate);
  };

  // Get performer payment for a price
  const getPerformerAmount = (price: number) => {
    if (commissionRate === null) return null;
    return getPerformerPayment(price, commissionRate);
  };

  // Get selected proposal object
  const selectedProposalObj = proposals.find(p => p.id === selectedProposal);
  const selectedPrice = selectedProposalObj ? getProposalPrice(selectedProposalObj) : null;

  const acceptProposal = async () => {
    if (!selectedProposal) {
      toast.error('Выберите вариант');
      return;
    }

    setAccepting(true);
    try {
      const proposal = proposals.find(p => p.id === selectedProposal);
      if (!proposal) return;

      const proposalPrice = getProposalPrice(proposal);
      const prepayment = getPrepayment(proposalPrice);

      // Update booking with selected proposal
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({
          status: 'customer_accepted',
          booking_date: proposal.proposed_date,
          booking_time: proposal.proposed_time,
          price_total: proposalPrice,
          prepayment_amount: prepayment || Math.round(proposalPrice * 0.2),
          slot_id: proposal.slot_id,
        })
        .eq('id', bookingId);

      if (bookingError) throw bookingError;

      // Mark selected proposal as accepted, others as rejected
      await supabase
        .from('booking_proposals')
        .update({ status: 'accepted' })
        .eq('id', selectedProposal);

      await supabase
        .from('booking_proposals')
        .update({ status: 'rejected' })
        .eq('booking_id', bookingId)
        .neq('id', selectedProposal);

      // Notify performer
      if (performerUserId) {
        sendPushNotification({
          userId: performerUserId,
          title: 'Клиент выбрал время',
          body: `${customerName} принял(а) ваше предложение на ${format(parseISO(proposal.proposed_date), 'd MMMM', { locale: ru })}. Подтвердите бронирование.`,
          url: '/performer/bookings',
          tag: `proposal-accepted-${bookingId}`,
        });
      }

      // Send email notification to performer
      await supabase.functions.invoke('send-notification-email', {
        body: {
          type: 'proposal_accepted',
          bookingId,
          customerName,
          performerName,
          bookingDate: format(parseISO(proposal.proposed_date), 'd MMMM yyyy', { locale: ru }),
          bookingTime: proposal.proposed_time,
        }
      });

      toast.success('Предложение принято! Ожидайте финального подтверждения от исполнителя.');
      onAccepted();
    } catch (error) {
      toast.error('Ошибка при принятии предложения');
    } finally {
      setAccepting(false);
    }
  };

  const rejectAllProposals = async () => {
    setRejecting(true);
    try {
      // Cancel booking
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          cancellation_reason: 'Клиент отклонил все предложенные варианты',
          cancelled_by: 'customer',
        })
        .eq('id', bookingId);

      if (bookingError) throw bookingError;

      // Mark all proposals as rejected
      await supabase
        .from('booking_proposals')
        .update({ status: 'rejected' })
        .eq('booking_id', bookingId);

      // Notify performer
      if (performerUserId) {
        sendPushNotification({
          userId: performerUserId,
          title: 'Предложения отклонены',
          body: `${customerName} отклонил(а) все предложенные варианты времени`,
          url: '/performer/bookings',
          tag: `proposal-rejected-${bookingId}`,
        });
      }

      toast.success('Заявка отменена');
      onRejected();
    } catch (error) {
      toast.error('Ошибка при отклонении');
    } finally {
      setRejecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (proposals.length === 0) {
    return (
      <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
        Предложения пока не поступили
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-800 dark:text-amber-200">
              {performerName} предложил(а) другое время
            </p>
            <p className="text-amber-600 dark:text-amber-400">
              Выберите подходящий вариант или отклоните все предложения
            </p>
          </div>
        </div>
      </div>

      <RadioGroup value={selectedProposal || ''} onValueChange={setSelectedProposal}>
        <div className="space-y-2">
          {proposals.map((proposal) => {
            const price = getProposalPrice(proposal);
            const prepayment = getPrepayment(price);
            const performerAmount = getPerformerAmount(price);
            
            return (
              <Card
                key={proposal.id}
                className={`cursor-pointer transition-all ${
                  selectedProposal === proposal.id
                    ? 'ring-2 ring-primary border-primary'
                    : 'hover:border-primary/50'
                }`}
                onClick={() => setSelectedProposal(proposal.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <RadioGroupItem value={proposal.id} id={proposal.id} className="mt-1" />
                    <Label htmlFor={proposal.id} className="flex-1 cursor-pointer">
                      <div className="flex flex-wrap items-center gap-4 mb-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(parseISO(proposal.proposed_date), 'd MMMM yyyy', { locale: ru })}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {proposal.proposed_time}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Coins className="h-4 w-4 text-muted-foreground" />
                        {formatPrice(price)}
                      </div>
                      {commissionRate !== null && prepayment !== null && performerAmount !== null && (
                        <div className="text-xs text-muted-foreground mt-1">
                          (предоплата {formatPrice(prepayment)} + {formatPrice(performerAmount)} исполнителю при встрече)
                        </div>
                      )}
                    </Label>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </RadioGroup>

      {/* Selected proposal summary */}
      {selectedProposal && selectedPrice !== null && (
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-center gap-2 font-semibold text-lg">
            <Check className="h-5 w-5 text-primary" />
            Итого: {formatPrice(selectedPrice)}
          </div>
          {commissionRate !== null && (
            <div className="text-sm text-muted-foreground mt-1">
              (предоплата {formatPrice(getPrepayment(selectedPrice)!)} + {formatPrice(getPerformerAmount(selectedPrice)!)} исполнителю при встрече)
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button
          variant="gold"
          onClick={acceptProposal}
          disabled={!selectedProposal || accepting}
          className="flex-1"
        >
          {accepting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Check className="h-4 w-4 mr-2" />
          )}
          Принять выбранный вариант
        </Button>
        <Button
          variant="outline"
          onClick={rejectAllProposals}
          disabled={rejecting}
        >
          {rejecting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <X className="h-4 w-4 mr-2" />
          )}
          Отклонить все
        </Button>
      </div>
    </div>
  );
}
