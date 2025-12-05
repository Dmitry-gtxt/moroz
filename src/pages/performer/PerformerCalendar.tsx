import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { PerformerLayout } from './PerformerDashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { format, isSameDay, addDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Loader2, Plus, Trash2, Clock, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScheduleEditor } from '@/components/performer/ScheduleEditor';
import type { Database } from '@/integrations/supabase/types';

type AvailabilitySlot = Database['public']['Tables']['availability_slots']['Row'];
type SlotStatus = Database['public']['Enums']['slot_status'];

const timeSlots = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', 
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
];

const statusLabels: Record<SlotStatus, { label: string; color: string }> = {
  free: { label: 'Свободно', color: 'bg-green-100 text-green-700' },
  booked: { label: 'Забронировано', color: 'bg-accent/20 text-accent' },
  blocked: { label: 'Заблокировано', color: 'bg-muted text-muted-foreground' },
};

export default function PerformerCalendar() {
  const { user, loading: authLoading } = useAuth();
  const [performerId, setPerformerId] = useState<string | null>(null);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // New slot form
  const [newStartTime, setNewStartTime] = useState('10:00');
  const [newEndTime, setNewEndTime] = useState('12:00');

  useEffect(() => {
    async function fetchPerformerId() {
      if (!user) return;

      const { data } = await supabase
        .from('performer_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setPerformerId(data.id);
      }
      setLoading(false);
    }

    if (!authLoading) {
      fetchPerformerId();
    }
  }, [user, authLoading]);

  useEffect(() => {
    async function fetchSlots() {
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
    }

    fetchSlots();
  }, [performerId, selectedDate]);

  const selectedDateSlots = slots.filter(slot => 
    isSameDay(new Date(slot.date), selectedDate)
  );

  const datesWithSlots = slots.map(slot => new Date(slot.date));

  const handleAddSlot = async () => {
    if (!performerId) return;

    const { error } = await supabase.from('availability_slots').insert({
      performer_id: performerId,
      date: format(selectedDate, 'yyyy-MM-dd'),
      start_time: newStartTime,
      end_time: newEndTime,
      status: 'free',
    });

    if (error) {
      if (error.code === '23505') {
        toast.error('Этот слот уже существует');
      } else {
        toast.error('Ошибка добавления слота');
        console.error(error);
      }
    } else {
      toast.success('Слот добавлен');
      setDialogOpen(false);
      // Refresh slots
      const { data } = await supabase
        .from('availability_slots')
        .select('*')
        .eq('performer_id', performerId)
        .order('date')
        .order('start_time');
      if (data) setSlots(data);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    const { error } = await supabase
      .from('availability_slots')
      .delete()
      .eq('id', slotId);

    if (error) {
      toast.error('Ошибка удаления слота');
    } else {
      toast.success('Слот удалён');
      setSlots(slots.filter(s => s.id !== slotId));
    }
  };

  const handleToggleBlock = async (slot: AvailabilitySlot) => {
    if (slot.status === 'booked') {
      toast.error('Нельзя изменить забронированный слот');
      return;
    }

    const newStatus: SlotStatus = slot.status === 'free' ? 'blocked' : 'free';
    
    const { error } = await supabase
      .from('availability_slots')
      .update({ status: newStatus })
      .eq('id', slot.id);

    if (error) {
      toast.error('Ошибка обновления');
    } else {
      setSlots(slots.map(s => s.id === slot.id ? { ...s, status: newStatus } : s));
    }
  };

  const addQuickSlots = async () => {
    if (!performerId) return;

    const slotsToAdd = [];
    // Create 1-hour slots from 10:00 to 22:00 (12 slots)
    for (let hour = 10; hour < 22; hour++) {
      slotsToAdd.push({
        performer_id: performerId,
        date: format(selectedDate, 'yyyy-MM-dd'),
        start_time: `${hour.toString().padStart(2, '0')}:00`,
        end_time: `${(hour + 1).toString().padStart(2, '0')}:00`,
        status: 'free' as SlotStatus,
      });
    }

    const { error } = await supabase.from('availability_slots').insert(slotsToAdd);

    if (error) {
      toast.error('Некоторые слоты уже существуют');
    } else {
      toast.success(`Добавлено ${slotsToAdd.length} слотов по 1 часу`);
      // Refresh
      const { data } = await supabase
        .from('availability_slots')
        .select('*')
        .eq('performer_id', performerId)
        .order('date')
        .order('start_time');
      if (data) setSlots(data);
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

  const refreshSlots = async () => {
    if (!performerId) return;
    const { data } = await supabase
      .from('availability_slots')
      .select('*')
      .eq('performer_id', performerId)
      .order('date')
      .order('start_time');
    if (data) setSlots(data);
  };

  return (
    <PerformerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Календарь</h1>
          <p className="text-muted-foreground mt-1">Управление расписанием и доступностью</p>
        </div>

        <Tabs defaultValue="schedule" className="space-y-6">
          <TabsList>
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Настройка расписания
            </TabsTrigger>
            <TabsTrigger value="slots" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Детальный просмотр
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schedule">
            <ScheduleEditor performerId={performerId} onSlotsUpdate={refreshSlots} />
          </TabsContent>

          <TabsContent value="slots">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Calendar */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>Выберите дату</CardTitle>
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
                        textDecoration: 'underline',
                        textDecorationColor: 'hsl(var(--accent))',
                      },
                    }}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </CardContent>
              </Card>

              {/* Slots for selected date */}
              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>
                      {format(selectedDate, 'd MMMM yyyy', { locale: ru })}
                    </CardTitle>
                    <CardDescription>
                      {selectedDateSlots.length === 0 
                        ? 'Нет доступных слотов' 
                        : `${selectedDateSlots.length} слот(ов)`
                      }
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={addQuickSlots}>
                      Добавить день
                    </Button>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-1" />
                          Добавить слот
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Добавить слот</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <p className="text-sm text-muted-foreground">
                            {format(selectedDate, 'd MMMM yyyy', { locale: ru })}
                          </p>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Начало</Label>
                              <Select value={newStartTime} onValueChange={setNewStartTime}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {timeSlots.map(time => (
                                    <SelectItem key={time} value={time}>{time}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Конец</Label>
                              <Select value={newEndTime} onValueChange={setNewEndTime}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {timeSlots.map(time => (
                                    <SelectItem key={time} value={time}>{time}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <Button onClick={handleAddSlot} className="w-full">
                            Добавить
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
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
                    <div className="space-y-3">
                      {selectedDateSlots.map((slot) => {
                        const status = statusLabels[slot.status];
                        return (
                          <div
                            key={slot.id}
                            className="flex items-center justify-between p-4 border rounded-lg"
                          >
                            <div className="flex items-center gap-4">
                              <div className="text-lg font-medium">
                                {slot.start_time.slice(0, 5)} — {slot.end_time.slice(0, 5)}
                              </div>
                              <Badge className={status.color}>{status.label}</Badge>
                            </div>
                            <div className="flex gap-2">
                              {slot.status !== 'booked' && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleToggleBlock(slot)}
                                  >
                                    {slot.status === 'free' ? 'Заблокировать' : 'Разблокировать'}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteSlot(slot.id)}
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
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PerformerLayout>
  );
}
