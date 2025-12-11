import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { PerformerLayout } from './PerformerDashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { format, isSameDay, addDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Loader2, Plus, Trash2, Clock, CalendarCheck, AlertCircle, Pencil, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCustomerPrice, getCommissionRate, formatPrice } from '@/lib/pricing';
import type { Database } from '@/integrations/supabase/types';

type AvailabilitySlot = Database['public']['Tables']['availability_slots']['Row'] & {
  price?: number | null;
};
type SlotStatus = Database['public']['Enums']['slot_status'];

// Generate hours 1-24
const HOURS = Array.from({ length: 24 }, (_, i) => i + 1);

const formatHour = (hour: number) => `${hour.toString().padStart(2, '0')}:00`;

export default function PerformerCalendar() {
  const { user, loading: authLoading } = useAuth();
  const [performerId, setPerformerId] = useState<string | null>(null);
  const [basePrice, setBasePrice] = useState<number>(3000);
  const [commissionRate, setCommissionRate] = useState<number>(40);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [slotToDelete, setSlotToDelete] = useState<AvailabilitySlot | null>(null);
  
  // Price editing state
  const [priceDialogOpen, setPriceDialogOpen] = useState(false);
  const [slotToEditPrice, setSlotToEditPrice] = useState<AvailabilitySlot | null>(null);
  const [editingPrice, setEditingPrice] = useState<string>('');
  
  // Bulk price editing for day
  const [dayPriceDialogOpen, setDayPriceDialogOpen] = useState(false);
  const [dayPrice, setDayPrice] = useState<string>('');
  
  // Form for adding range
  const [rangeStart, setRangeStart] = useState(10);
  const [rangeEnd, setRangeEnd] = useState(20);
  const [rangePrice, setRangePrice] = useState<string>('');

  useEffect(() => {
    async function fetchPerformerData() {
      if (!user) return;

      const [profileRes, rate] = await Promise.all([
        supabase
          .from('performer_profiles')
          .select('id, base_price')
          .eq('user_id', user.id)
          .maybeSingle(),
        getCommissionRate()
      ]);

      if (profileRes.data) {
        setPerformerId(profileRes.data.id);
        setBasePrice(profileRes.data.base_price);
      }
      setCommissionRate(rate);
      setLoading(false);
    }

    if (!authLoading) {
      fetchPerformerData();
    }
  }, [user, authLoading]);

  const fetchSlots = async () => {
    if (!performerId) return;

    const startDate = format(selectedDate, 'yyyy-MM-01');
    const endDate = format(addDays(selectedDate, 60), 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('availability_slots')
      .select('*')
      .eq('performer_id', performerId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date')
      .order('start_time');

    if (error) {
      console.error('Error fetching slots:', error);
    } else {
      setSlots(data ?? []);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [performerId, selectedDate]);

  // Get slots for selected date
  const selectedDateSlots = slots
    .filter(slot => isSameDay(new Date(slot.date), selectedDate))
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  // Dates that have slots (for calendar highlighting)
  const datesWithSlots = slots.map(slot => new Date(slot.date));

  // Check if slot has a confirmed booking
  const isSlotBooked = (slot: AvailabilitySlot) => slot.status === 'booked';

  // Add range of 1-hour slots
  const handleAddRange = async () => {
    if (!performerId) return;
    if (rangeEnd <= rangeStart) {
      toast.error('Конец должен быть позже начала');
      return;
    }

    const customPrice = rangePrice ? parseInt(rangePrice) : null;

    const slotsToAdd = [];
    for (let hour = rangeStart; hour < rangeEnd; hour++) {
      const startTime = formatHour(hour);
      const endHour = hour + 1 === 24 ? 0 : hour + 1;
      const endTime = `${endHour.toString().padStart(2, '0')}:00`;
      
      slotsToAdd.push({
        performer_id: performerId,
        date: format(selectedDate, 'yyyy-MM-dd'),
        start_time: startTime,
        end_time: endTime,
        status: 'free' as SlotStatus,
        price: customPrice,
      });
    }

    const { error } = await supabase.from('availability_slots').insert(slotsToAdd);

    if (error) {
      if (error.code === '23505') {
        toast.info('Некоторые слоты уже существуют');
      } else {
        toast.error('Ошибка добавления слотов');
        console.error(error);
      }
    } else {
      toast.success(`Добавлено ${slotsToAdd.length} слотов`);
      setAddDialogOpen(false);
      setRangePrice('');
    }
    fetchSlots();
  };

  // Update single slot price
  const handleUpdateSlotPrice = async () => {
    if (!slotToEditPrice) return;

    const newPrice = editingPrice ? parseInt(editingPrice) : null;

    const { error } = await supabase
      .from('availability_slots')
      .update({ price: newPrice })
      .eq('id', slotToEditPrice.id);

    if (error) {
      toast.error('Ошибка обновления цены');
    } else {
      toast.success('Цена обновлена');
      setSlots(slots.map(s => s.id === slotToEditPrice.id ? { ...s, price: newPrice } : s));
      setPriceDialogOpen(false);
      setSlotToEditPrice(null);
      setEditingPrice('');
    }
  };

  // Update all free slots for day
  const handleUpdateDayPrice = async () => {
    if (!performerId) return;

    const newPrice = dayPrice ? parseInt(dayPrice) : null;
    const freeSlotIds = selectedDateSlots.filter(s => s.status === 'free').map(s => s.id);

    if (freeSlotIds.length === 0) {
      toast.info('Нет свободных слотов для обновления');
      return;
    }

    const { error } = await supabase
      .from('availability_slots')
      .update({ price: newPrice })
      .in('id', freeSlotIds);

    if (error) {
      toast.error('Ошибка обновления цен');
    } else {
      toast.success(`Цены обновлены для ${freeSlotIds.length} слотов`);
      setSlots(slots.map(s => freeSlotIds.includes(s.id) ? { ...s, price: newPrice } : s));
      setDayPriceDialogOpen(false);
      setDayPrice('');
    }
  };

  // Reset slot price to base
  const handleResetSlotPrice = async (slot: AvailabilitySlot) => {
    const { error } = await supabase
      .from('availability_slots')
      .update({ price: null })
      .eq('id', slot.id);

    if (error) {
      toast.error('Ошибка сброса цены');
    } else {
      toast.success('Цена сброшена до базовой');
      setSlots(slots.map(s => s.id === slot.id ? { ...s, price: null } : s));
    }
  };

  // Get display price for slot
  const getSlotPrice = (slot: AvailabilitySlot) => slot.price ?? basePrice;
  const getSlotCustomerPrice = (slot: AvailabilitySlot) => getCustomerPrice(getSlotPrice(slot), commissionRate);

  // Delete single slot
  const handleDeleteSlot = async (slot: AvailabilitySlot) => {
    if (isSlotBooked(slot)) {
      toast.error('Нельзя удалить забронированный слот. Сначала отмените бронь.');
      return;
    }

    const { error } = await supabase
      .from('availability_slots')
      .delete()
      .eq('id', slot.id);

    if (error) {
      toast.error('Ошибка удаления слота');
    } else {
      toast.success('Слот удалён');
      setSlots(slots.filter(s => s.id !== slot.id));
    }
    setSlotToDelete(null);
    setDeleteDialogOpen(false);
  };

  // Delete all free slots for the day
  const handleDeleteDay = async () => {
    if (!performerId) return;

    const bookedSlots = selectedDateSlots.filter(s => s.status === 'booked');
    if (bookedSlots.length > 0) {
      toast.error(`На этот день есть ${bookedSlots.length} бронь(и). Сначала отмените их.`);
      return;
    }

    const { error } = await supabase
      .from('availability_slots')
      .delete()
      .eq('performer_id', performerId)
      .eq('date', format(selectedDate, 'yyyy-MM-dd'));

    if (error) {
      toast.error('Ошибка удаления дня');
    } else {
      toast.success('Все слоты дня удалены');
      fetchSlots();
    }
  };

  // Mark slot as booked (performer manually books)
  const handleBookSlot = async (slot: AvailabilitySlot) => {
    if (slot.status !== 'free') return;

    const { error } = await supabase
      .from('availability_slots')
      .update({ status: 'booked' })
      .eq('id', slot.id);

    if (error) {
      toast.error('Ошибка бронирования');
    } else {
      toast.success('Слот отмечен как забронированный');
      setSlots(slots.map(s => s.id === slot.id ? { ...s, status: 'booked' as SlotStatus } : s));
    }
  };

  // Unbook slot (only if manually booked, not via booking system)
  const handleUnbookSlot = async (slot: AvailabilitySlot) => {
    const { error } = await supabase
      .from('availability_slots')
      .update({ status: 'free' })
      .eq('id', slot.id);

    if (error) {
      toast.error('Ошибка');
    } else {
      toast.success('Слот снова свободен');
      setSlots(slots.map(s => s.id === slot.id ? { ...s, status: 'free' as SlotStatus } : s));
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!performerId) {
    return <Navigate to="/become-performer" replace />;
  }

  const freeSlots = selectedDateSlots.filter(s => s.status === 'free');
  const bookedSlots = selectedDateSlots.filter(s => s.status === 'booked');

  return (
    <PerformerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Моё расписание</h1>
          <p className="text-muted-foreground mt-1">Управление доступными часами для бронирования</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarCheck className="h-5 w-5" />
                Календарь
              </CardTitle>
              <CardDescription>Выберите дату для просмотра слотов</CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                locale={ru}
                className="rounded-md border pointer-events-auto"
                modifiers={{
                  hasSlots: datesWithSlots,
                }}
                modifiersStyles={{
                  hasSlots: {
                    fontWeight: 'bold',
                    backgroundColor: 'hsl(var(--accent) / 0.2)',
                  },
                }}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              />
              
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-3 h-3 rounded bg-accent/20" />
                <span>Есть слоты</span>
              </div>
            </CardContent>
          </Card>

          {/* Slots panel */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="text-xl">
                  {format(selectedDate, 'd MMMM yyyy, EEEE', { locale: ru })}
                </CardTitle>
                <CardDescription className="mt-1">
                  {selectedDateSlots.length === 0 
                    ? 'Нет слотов' 
                    : `${freeSlots.length} свободных, ${bookedSlots.length} забронированных`
                  }
                </CardDescription>
              </div>
              <div className="flex gap-2 flex-wrap justify-end">
                <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Добавить слоты
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Добавить диапазон слотов</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <p className="text-sm text-muted-foreground">
                        {format(selectedDate, 'd MMMM yyyy', { locale: ru })}
                      </p>
                      <p className="text-sm">
                        Будут созданы слоты по 1 часу в указанном диапазоне.
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>С</Label>
                          <Select 
                            value={rangeStart.toString()} 
                            onValueChange={(v) => setRangeStart(parseInt(v))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {HOURS.slice(0, 23).map(hour => (
                                <SelectItem key={hour} value={hour.toString()}>
                                  {formatHour(hour)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>До</Label>
                          <Select 
                            value={rangeEnd.toString()} 
                            onValueChange={(v) => setRangeEnd(parseInt(v))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {HOURS.filter(h => h > rangeStart).map(hour => (
                                <SelectItem key={hour} value={hour.toString()}>
                                  {formatHour(hour)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Будет создано: {Math.max(0, rangeEnd - rangeStart)} слотов
                      </p>
                      
                      {/* Price for new slots */}
                      <div className="space-y-2 pt-2 border-t">
                        <Label>Цена за слот (₽)</Label>
                        <div className="flex gap-3 items-start">
                          <div className="flex-1">
                            <Input
                              type="number"
                              placeholder={`Базовая: ${basePrice}`}
                              value={rangePrice}
                              onChange={(e) => setRangePrice(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Оставьте пустым для базовой цены
                            </p>
                          </div>
                          <div className="p-2 rounded-lg bg-accent/10 border border-accent/30 min-w-[120px]">
                            <p className="text-xs text-muted-foreground">Клиент увидит:</p>
                            <p className="text-lg font-bold text-accent">
                              {formatPrice(getCustomerPrice(rangePrice ? parseInt(rangePrice) : basePrice, commissionRate))}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                        Отмена
                      </Button>
                      <Button onClick={handleAddRange}>
                        Добавить
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
                {freeSlots.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setDayPrice('');
                      setDayPriceDialogOpen(true);
                    }}
                  >
                    <Coins className="h-4 w-4 mr-1" />
                    Цены дня
                  </Button>
                )}
                
                {selectedDateSlots.length > 0 && (
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={handleDeleteDay}
                    disabled={bookedSlots.length > 0}
                    title={bookedSlots.length > 0 ? 'Есть забронированные слоты' : 'Удалить все слоты дня'}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Удалить день
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {selectedDateSlots.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Нет слотов на эту дату</p>
                  <p className="text-sm mt-1">Добавьте слоты для приёма заказов</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedDateSlots.map((slot) => {
                    const isBooked = isSlotBooked(slot);
                    
                    return (
                      <div
                        key={slot.id}
                        className={cn(
                          "flex items-center justify-between p-3 border rounded-lg transition-colors",
                          isBooked ? "bg-accent/10 border-accent/30" : "bg-card hover:bg-muted/50"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-lg font-mono font-medium">
                            {slot.start_time.slice(0, 5)} — {slot.end_time.slice(0, 5)}
                          </div>
                          {isBooked ? (
                            <Badge className="bg-accent/20 text-accent border-accent/30">
                              Забронировано
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              Свободно
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          {/* Price display */}
                          <div className="flex items-center gap-2 mr-2">
                            <span className="text-sm font-medium">
                              {formatPrice(getSlotPrice(slot))}
                            </span>
                            {slot.price !== null && slot.price !== basePrice && (
                              <Badge variant="outline" className="text-xs">
                                Особая цена
                              </Badge>
                            )}
                          </div>
                          
                          {isBooked ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnbookSlot(slot)}
                            >
                              Снять бронь
                            </Button>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSlotToEditPrice(slot);
                                  setEditingPrice(slot.price?.toString() || '');
                                  setPriceDialogOpen(true);
                                }}
                                title="Изменить цену"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleBookSlot(slot)}
                              >
                                Забронировать
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSlotToDelete(slot);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {bookedSlots.length > 0 && (
                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    Забронированные слоты нельзя удалить. Чтобы удалить день целиком, сначала снимите все брони.
                  </p>
                </div>
              )}
              
              {/* Price legend */}
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Базовая цена:</strong> {formatPrice(basePrice)} → <strong>Клиент видит:</strong> {formatPrice(getCustomerPrice(basePrice, commissionRate))}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete slot confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить слот?</DialogTitle>
          </DialogHeader>
          {slotToDelete && (
            <p className="text-muted-foreground">
              Вы уверены, что хотите удалить слот {slotToDelete.start_time.slice(0, 5)} — {slotToDelete.end_time.slice(0, 5)}?
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Отмена
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => slotToDelete && handleDeleteSlot(slotToDelete)}
            >
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit slot price dialog */}
      <Dialog open={priceDialogOpen} onOpenChange={setPriceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Изменить цену слота</DialogTitle>
          </DialogHeader>
          {slotToEditPrice && (
            <div className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Слот: {slotToEditPrice.start_time.slice(0, 5)} — {slotToEditPrice.end_time.slice(0, 5)}
              </p>
              <div className="space-y-2">
                <Label>Цена (₽)</Label>
                <div className="flex gap-3 items-start">
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder={`Базовая: ${basePrice}`}
                      value={editingPrice}
                      onChange={(e) => setEditingPrice(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Оставьте пустым для базовой цены
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-accent/10 border border-accent/30 min-w-[120px]">
                    <p className="text-xs text-muted-foreground">Клиент увидит:</p>
                    <p className="text-lg font-bold text-accent">
                      {formatPrice(getCustomerPrice(editingPrice ? parseInt(editingPrice) : basePrice, commissionRate))}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPriceDialogOpen(false)}>
              Отмена
            </Button>
            {slotToEditPrice?.price !== null && (
              <Button 
                variant="secondary"
                onClick={() => slotToEditPrice && handleResetSlotPrice(slotToEditPrice).then(() => setPriceDialogOpen(false))}
              >
                Сбросить
              </Button>
            )}
            <Button onClick={handleUpdateSlotPrice}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit day prices dialog */}
      <Dialog open={dayPriceDialogOpen} onOpenChange={setDayPriceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Установить цену для всех слотов дня</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              {format(selectedDate, 'd MMMM yyyy', { locale: ru })} — {freeSlots.length} свободных слотов
            </p>
            <div className="space-y-2">
              <Label>Цена за слот (₽)</Label>
              <div className="flex gap-3 items-start">
                <div className="flex-1">
                  <Input
                    type="number"
                    placeholder={`Базовая: ${basePrice}`}
                    value={dayPrice}
                    onChange={(e) => setDayPrice(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Оставьте пустым для базовой цены
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-accent/10 border border-accent/30 min-w-[120px]">
                  <p className="text-xs text-muted-foreground">Клиент увидит:</p>
                  <p className="text-lg font-bold text-accent">
                    {formatPrice(getCustomerPrice(dayPrice ? parseInt(dayPrice) : basePrice, commissionRate))}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDayPriceDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleUpdateDayPrice}>
              Применить ко всем
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PerformerLayout>
  );
}
