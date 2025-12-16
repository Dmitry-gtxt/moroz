import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { CalendarIcon, Plus, Trash2, Loader2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProposalSlot {
  date: Date;
  time: string;
  price?: number;
}

interface ProposeAlternativeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  performerId: string;
  performerName: string;
  customerName: string;
  customerId: string;
  customerEmail?: string | null;
  originalDate: string;
  originalTime: string;
  basePrice: number;
  onSuccess: () => void;
}

export function ProposeAlternativeDialog({
  open,
  onOpenChange,
  bookingId,
  performerId,
  performerName,
  customerName,
  customerId,
  customerEmail,
  originalDate,
  originalTime,
  basePrice,
  onSuccess,
}: ProposeAlternativeDialogProps) {
  const [proposals, setProposals] = useState<ProposalSlot[]>([
    { date: new Date(), time: '10:00-11:00', price: basePrice }
  ]);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<{ date: string; start_time: string; end_time: string; id: string }[]>([]);

  useEffect(() => {
    if (open) {
      fetchAvailableSlots();
    }
  }, [open, performerId]);

  const fetchAvailableSlots = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('availability_slots')
      .select('id, date, start_time, end_time')
      .eq('performer_id', performerId)
      .eq('status', 'free')
      .gte('date', today)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });
    
    if (data) {
      setAvailableSlots(data);
    }
  };

  const addProposal = () => {
    if (proposals.length >= 5) {
      toast.error('Максимум 5 вариантов');
      return;
    }
    setProposals([...proposals, { date: new Date(), time: '10:00-11:00', price: basePrice }]);
  };

  const removeProposal = (index: number) => {
    if (proposals.length <= 1) {
      toast.error('Нужен хотя бы один вариант');
      return;
    }
    setProposals(proposals.filter((_, i) => i !== index));
  };

  const updateProposal = (index: number, field: keyof ProposalSlot, value: any) => {
    const updated = [...proposals];
    updated[index] = { ...updated[index], [field]: value };
    setProposals(updated);
  };

  const handleSubmit = async () => {
    if (proposals.length === 0) {
      toast.error('Добавьте хотя бы один вариант времени');
      return;
    }

    // Validate all proposals have date and time
    for (const p of proposals) {
      if (!p.date || !p.time) {
        toast.error('Заполните дату и время для всех вариантов');
        return;
      }
    }

    setSubmitting(true);

    try {
      // Create proposal records
      const proposalRecords = proposals.map(p => ({
        booking_id: bookingId,
        proposed_date: format(p.date, 'yyyy-MM-dd'),
        proposed_time: p.time,
        proposed_price: p.price || basePrice,
        status: 'pending',
      }));

      const { error: proposalError } = await supabase
        .from('booking_proposals')
        .insert(proposalRecords);

      if (proposalError) throw proposalError;

      // Update booking status to counter_proposed
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ 
          status: 'counter_proposed',
          proposal_message: message || null,
        })
        .eq('id', bookingId);

      if (bookingError) throw bookingError;

      // Send notification to customer
      await supabase.functions.invoke('send-notification-email', {
        body: {
          type: 'booking_counter_proposed',
          customerEmail,
          customerName,
          performerName,
          originalDate: format(new Date(originalDate), 'd MMMM yyyy', { locale: ru }),
          originalTime,
          proposals: proposals.map(p => ({
            date: format(p.date, 'd MMMM yyyy', { locale: ru }),
            time: p.time,
            price: p.price || basePrice,
          })),
          message,
        },
      });

      // Send push notification
      await supabase.functions.invoke('send-push-notification', {
        body: {
          userId: customerId,
          title: 'Предложено другое время',
          body: `${performerName} предложил альтернативное время для вашего бронирования`,
          url: '/customer/bookings',
        },
      });

      toast.success('Предложение отправлено клиенту');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error proposing alternative:', error);
      toast.error('Ошибка при отправке предложения');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Предложить другое время</DialogTitle>
          <DialogDescription>
            Предложите клиенту {customerName} альтернативные варианты времени вместо {format(new Date(originalDate), 'd MMMM', { locale: ru })} {originalTime}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Available slots hint */}
          {availableSlots.length > 0 && (
            <div className="p-3 bg-muted rounded-lg text-sm">
              <p className="font-medium mb-2">Ваши свободные слоты:</p>
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                {availableSlots.slice(0, 10).map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    className="px-2 py-1 bg-primary/10 text-primary rounded text-xs hover:bg-primary/20"
                    onClick={() => {
                      if (proposals.length < 5) {
                        const newDate = new Date(slot.date + 'T00:00:00');
                        setProposals([...proposals, {
                          date: newDate,
                          time: `${slot.start_time.slice(0, 5)}-${slot.end_time.slice(0, 5)}`,
                          price: basePrice,
                        }]);
                      }
                    }}
                  >
                    {format(new Date(slot.date), 'd MMM', { locale: ru })} {slot.start_time.slice(0, 5)}
                  </button>
                ))}
                {availableSlots.length > 10 && (
                  <span className="text-xs text-muted-foreground">+{availableSlots.length - 10} ещё</span>
                )}
              </div>
            </div>
          )}

          {/* Proposals list */}
          <div className="space-y-3">
            {proposals.map((proposal, index) => (
              <div key={index} className="p-3 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Вариант {index + 1}</span>
                  {proposals.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProposal(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Дата</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal h-9 text-sm",
                            !proposal.date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {proposal.date ? format(proposal.date, 'd MMM yyyy', { locale: ru }) : 'Выберите'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={proposal.date}
                          onSelect={(date) => date && updateProposal(index, 'date', date)}
                          disabled={(date) => date < new Date()}
                          locale={ru}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label className="text-xs">Время</Label>
                    <div className="relative">
                      <Clock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={proposal.time}
                        onChange={(e) => updateProposal(index, 'time', e.target.value)}
                        placeholder="10:00-11:00"
                        className="pl-8 h-9 text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Цена (₽)</Label>
                  <Input
                    type="number"
                    value={proposal.price || ''}
                    onChange={(e) => updateProposal(index, 'price', parseInt(e.target.value) || basePrice)}
                    placeholder={basePrice.toString()}
                    className="h-9 text-sm"
                  />
                </div>
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={addProposal}
            disabled={proposals.length >= 5}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Добавить вариант ({proposals.length}/5)
          </Button>

          {/* Message */}
          <div>
            <Label>Сообщение клиенту (опционально)</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Например: К сожалению, в это время у меня уже есть заказ. Предлагаю рассмотреть другие варианты..."
              rows={3}
              className="mt-1"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={submitting}
            >
              Отмена
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={submitting || proposals.length === 0}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Отправка...
                </>
              ) : (
                'Отправить предложение'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
