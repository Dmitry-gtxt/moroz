import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Plus, Trash2, Loader2, Clock, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProposalSlot {
  date: Date;
  time: string;
  price?: number;
  slotId?: string;
}

interface AvailabilitySlot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  price: number | null;
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
  const [proposals, setProposals] = useState<ProposalSlot[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [allSlots, setAllSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetchAllSlots();
      setProposals([]);
    }
  }, [open, performerId]);

  const fetchAllSlots = async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    
    // Fetch all slots (free and booked)
    const { data } = await supabase
      .from('availability_slots')
      .select('id, date, start_time, end_time, status, price')
      .eq('performer_id', performerId)
      .in('status', ['free', 'booked'])
      .gte('date', today)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });
    
    if (data) {
      setAllSlots(data);
    }
    setLoading(false);
  };

  // Get dates that have slots for calendar highlighting
  const datesWithSlots = useMemo(() => {
    const dates = new Set<string>();
    allSlots.forEach(slot => dates.add(slot.date));
    return dates;
  }, [allSlots]);

  // Get slots for selected date
  const slotsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return allSlots.filter(slot => slot.date === dateStr);
  }, [allSlots, selectedDate]);

  // Check if a slot is already added to proposals
  const isSlotInProposals = (slotId: string) => {
    return proposals.some(p => p.slotId === slotId);
  };

  const addSlotToProposals = (slot: AvailabilitySlot) => {
    if (proposals.length >= 5) {
      toast.error('Максимум 5 вариантов');
      return;
    }
    if (isSlotInProposals(slot.id)) {
      toast.error('Этот слот уже добавлен');
      return;
    }
    
    const newDate = new Date(slot.date + 'T00:00:00');
    setProposals([...proposals, {
      date: newDate,
      time: `${slot.start_time.slice(0, 5)}-${slot.end_time.slice(0, 5)}`,
      price: slot.price || basePrice,
      slotId: slot.id,
    }]);
  };

  const removeProposal = (index: number) => {
    setProposals(proposals.filter((_, i) => i !== index));
  };

  const updateProposalPrice = (index: number, price: number) => {
    const updated = [...proposals];
    updated[index] = { ...updated[index], price };
    setProposals(updated);
  };

  const handleSubmit = async () => {
    if (proposals.length === 0) {
      toast.error('Выберите хотя бы один слот');
      return;
    }

    setSubmitting(true);

    try {
      // Create proposal records
      const proposalRecords = proposals.map(p => ({
        booking_id: bookingId,
        proposed_date: format(p.date, 'yyyy-MM-dd'),
        proposed_time: p.time,
        proposed_price: p.price || basePrice,
        slot_id: p.slotId,
        status: 'pending',
      }));

      const { error: proposalError } = await supabase
        .from('booking_proposals')
        .insert(proposalRecords);

      if (proposalError) throw proposalError;

      // Update booking status to counter_proposed
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ status: 'counter_proposed' })
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

  // Custom day rendering for calendar
  const modifiers = useMemo(() => {
    const hasSlots: Date[] = [];
    const hasFreeSlots: Date[] = [];
    const hasBookedSlots: Date[] = [];

    allSlots.forEach(slot => {
      const date = new Date(slot.date + 'T00:00:00');
      if (!hasSlots.some(d => isSameDay(d, date))) {
        hasSlots.push(date);
      }
      if (slot.status === 'free' && !hasFreeSlots.some(d => isSameDay(d, date))) {
        hasFreeSlots.push(date);
      }
      if (slot.status === 'booked' && !hasBookedSlots.some(d => isSameDay(d, date))) {
        hasBookedSlots.push(date);
      }
    });

    return { hasSlots, hasFreeSlots, hasBookedSlots };
  }, [allSlots]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Предложить другое время</DialogTitle>
          <DialogDescription>
            Выберите свободные слоты из вашего календаря для {customerName} вместо {format(new Date(originalDate), 'd MMMM', { locale: ru })} {originalTime}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Calendar */}
              <div className="border rounded-lg p-2">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={ru}
                  disabled={(date) => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    return date < new Date() || !datesWithSlots.has(dateStr);
                  }}
                  modifiers={modifiers}
                  modifiersClassNames={{
                    hasFreeSlots: 'bg-green-100 dark:bg-green-900/30 font-bold',
                    hasBookedSlots: 'bg-yellow-100 dark:bg-yellow-900/30',
                  }}
                  className="pointer-events-auto"
                />
                <div className="flex gap-4 mt-2 px-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-green-100 dark:bg-green-900/30 border" />
                    <span>Свободно</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-yellow-100 dark:bg-yellow-900/30 border" />
                    <span>Ожидает подтверждения</span>
                  </div>
                </div>
              </div>

              {/* Slots for selected date */}
              {selectedDate && slotsForSelectedDate.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Слоты на {format(selectedDate, 'd MMMM', { locale: ru })}:
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {slotsForSelectedDate.map((slot) => {
                      const isAdded = isSlotInProposals(slot.id);
                      const isFree = slot.status === 'free';
                      
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          disabled={isAdded}
                          onClick={() => addSlotToProposals(slot)}
                          className={cn(
                            "p-3 rounded-lg border text-left transition-all",
                            isFree 
                              ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/40"
                              : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 hover:bg-yellow-100 dark:hover:bg-yellow-900/40",
                            isAdded && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium text-sm">
                                {slot.start_time.slice(0, 5)}-{slot.end_time.slice(0, 5)}
                              </span>
                            </div>
                            {isAdded && <Check className="h-4 w-4 text-green-600" />}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {slot.price ? `${slot.price.toLocaleString()} ₽` : `${basePrice.toLocaleString()} ₽`}
                          </div>
                          {!isFree && (
                            <div className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">
                              Ожидает подтверждения
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedDate && slotsForSelectedDate.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Нет слотов на выбранную дату
                </p>
              )}

              {/* Selected proposals */}
              {proposals.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Выбранные слоты ({proposals.length}/5):</Label>
                  <div className="space-y-2">
                    {proposals.map((proposal, index) => (
                      <div key={index} className="p-3 border rounded-lg bg-primary/5">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-sm">
                              {format(proposal.date, 'd MMMM', { locale: ru })} {proposal.time}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeProposal(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <Label className="text-xs whitespace-nowrap">Цена:</Label>
                          <Input
                            type="number"
                            value={proposal.price || ''}
                            onChange={(e) => updateProposalPrice(index, parseInt(e.target.value) || basePrice)}
                            className="h-8 text-sm w-28"
                          />
                          <span className="text-xs text-muted-foreground">₽</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {allSlots.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <p>У вас нет свободных слотов в календаре.</p>
                  <p className="text-sm mt-1">Добавьте слоты в разделе "Календарь"</p>
                </div>
              )}
            </>
          )}

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
                `Отправить (${proposals.length})`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
