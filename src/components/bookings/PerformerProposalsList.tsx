import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale/ru';
import { Calendar, Clock, Coins, Loader2 } from 'lucide-react';
import { getCommissionRate, getPerformerNetAmount, formatPrice } from '@/lib/pricing';
import { Badge } from '@/components/ui/badge';

interface Proposal {
  id: string;
  proposed_date: string;
  proposed_time: string;
  proposed_price: number | null;
  status: string;
}

interface PerformerProposalsListProps {
  bookingId: string;
  basePrice: number;
}

export function PerformerProposalsList({ bookingId, basePrice }: PerformerProposalsListProps) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
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
    const { data, error } = await supabase
      .from('booking_proposals')
      .select('id, proposed_date, proposed_time, proposed_price, status')
      .eq('booking_id', bookingId)
      .order('proposed_date', { ascending: true });

    if (!error && data) {
      setProposals(data);
    }
    setLoading(false);
  };

  const getProposalPrice = (proposal: Proposal) => proposal.proposed_price ?? basePrice;

  const getNetAmount = (price: number) => {
    if (commissionRate === null) return null;
    return getPerformerNetAmount(price, commissionRate);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-2">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (proposals.length === 0) {
    return null;
  }

  return (
    <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
      <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-3">
        Вы предложили клиенту следующие варианты:
      </p>
      <div className="space-y-2">
        {proposals.map((proposal) => {
          const price = getProposalPrice(proposal);
          const netAmount = getNetAmount(price);

          return (
            <div 
              key={proposal.id} 
              className="flex flex-wrap items-center gap-3 p-2 bg-white dark:bg-background rounded-lg text-sm"
            >
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>{format(parseISO(proposal.proposed_date), 'd MMMM', { locale: ru })}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>{proposal.proposed_time}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Coins className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium">{formatPrice(price)}</span>
                {commissionRate !== null && netAmount !== null && (
                  <span className="text-xs text-muted-foreground">
                    (вам {formatPrice(netAmount)})
                  </span>
                )}
              </div>
              {proposal.status === 'accepted' && (
                <Badge variant="default" className="bg-green-600 text-xs">Выбран</Badge>
              )}
              {proposal.status === 'rejected' && (
                <Badge variant="secondary" className="text-xs">Отклонён</Badge>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
        Ожидаем выбор клиента. Как только клиент выберет вариант — вы получите уведомление.
      </p>
    </div>
  );
}
