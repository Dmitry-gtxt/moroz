import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Clock, Save, Calendar, Coffee, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type AvailabilitySlot = Database['public']['Tables']['availability_slots']['Row'];

interface ScheduleEditorProps {
  performerId: string;
  onSlotsUpdate?: () => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i); // 0:00 - 23:00
const DAYS_OF_WEEK = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const DAYS_FULL = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

interface DaySchedule {
  isWorkDay: boolean;
  startHour: number;
  endHour: number;
}

interface WeekSchedule {
  [key: number]: DaySchedule; // 0-6 for days
}

const DEFAULT_SCHEDULE: DaySchedule = {
  isWorkDay: true,
  startHour: 10,
  endHour: 20,
};

export function ScheduleEditor({ performerId, onSlotsUpdate }: ScheduleEditorProps) {
  const [weekSchedule, setWeekSchedule] = useState<WeekSchedule>(() => {
    const schedule: WeekSchedule = {};
    for (let i = 0; i < 7; i++) {
      schedule[i] = { ...DEFAULT_SCHEDULE };
    }
    // Default weekends as day off
    schedule[5] = { ...DEFAULT_SCHEDULE, isWorkDay: false };
    schedule[6] = { ...DEFAULT_SCHEDULE, isWorkDay: false };
    return schedule;
  });
  
  const [existingSlots, setExistingSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(() => {
    const today = new Date();
    return startOfWeek(today, { weekStartsOn: 1 });
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchExistingSlots();
  }, [performerId, selectedWeekStart]);

  const fetchExistingSlots = async () => {
    const endDate = addDays(selectedWeekStart, 30);
    const { data } = await supabase
      .from('availability_slots')
      .select('*')
      .eq('performer_id', performerId)
      .gte('date', format(selectedWeekStart, 'yyyy-MM-dd'))
      .lte('date', format(endDate, 'yyyy-MM-dd'))
      .order('date')
      .order('start_time');
    
    if (data) setExistingSlots(data);
  };

  const updateDaySchedule = (dayIndex: number, updates: Partial<DaySchedule>) => {
    setWeekSchedule(prev => ({
      ...prev,
      [dayIndex]: { ...prev[dayIndex], ...updates }
    }));
  };

  const applyToAllDays = () => {
    const template = weekSchedule[0];
    setWeekSchedule(prev => {
      const newSchedule: WeekSchedule = {};
      for (let i = 0; i < 7; i++) {
        newSchedule[i] = { ...template };
      }
      return newSchedule;
    });
    toast.success('Расписание применено ко всем дням');
  };

  const generateSlotsForWeek = async (weeksAhead: number = 1) => {
    setSaving(true);
    const slotsToCreate: Array<{
      performer_id: string;
      date: string;
      start_time: string;
      end_time: string;
      status: 'free';
    }> = [];

    for (let week = 0; week < weeksAhead; week++) {
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const daySchedule = weekSchedule[dayIndex];
        if (!daySchedule.isWorkDay) continue;

        const date = addDays(selectedWeekStart, week * 7 + dayIndex);
        if (date < new Date()) continue; // Skip past dates

        // Create hourly slots
        for (let hour = daySchedule.startHour; hour < daySchedule.endHour; hour++) {
          slotsToCreate.push({
            performer_id: performerId,
            date: format(date, 'yyyy-MM-dd'),
            start_time: `${hour.toString().padStart(2, '0')}:00`,
            end_time: `${(hour + 1).toString().padStart(2, '0')}:00`,
            status: 'free',
          });
        }
      }
    }

    if (slotsToCreate.length === 0) {
      toast.error('Нет слотов для создания');
      setSaving(false);
      return;
    }

    // Upsert to avoid duplicates
    const { error } = await supabase
      .from('availability_slots')
      .upsert(slotsToCreate, { onConflict: 'performer_id,date,start_time', ignoreDuplicates: true });

    if (error) {
      console.error('Error creating slots:', error);
      toast.error('Ошибка создания слотов');
    } else {
      toast.success(`Создано ${slotsToCreate.length} слотов`);
      fetchExistingSlots();
      onSlotsUpdate?.();
    }
    
    setSaving(false);
  };

  const markDayOff = async (date: Date) => {
    // Delete all free slots for this day
    const { error } = await supabase
      .from('availability_slots')
      .delete()
      .eq('performer_id', performerId)
      .eq('date', format(date, 'yyyy-MM-dd'))
      .eq('status', 'free');

    if (error) {
      toast.error('Ошибка');
    } else {
      toast.success('День отмечен как выходной');
      fetchExistingSlots();
      onSlotsUpdate?.();
    }
  };

  const getSlotCountForDate = (date: Date): { free: number; booked: number; blocked: number } => {
    const daySlots = existingSlots.filter(slot => isSameDay(new Date(slot.date), date));
    return {
      free: daySlots.filter(s => s.status === 'free').length,
      booked: daySlots.filter(s => s.status === 'booked').length,
      blocked: daySlots.filter(s => s.status === 'blocked').length,
    };
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="template">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="template">Шаблон расписания</TabsTrigger>
          <TabsTrigger value="week">Просмотр недели</TabsTrigger>
        </TabsList>

        <TabsContent value="template" className="space-y-6 mt-6">
          {/* Default schedule template */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Настройка рабочих часов
              </CardTitle>
              <CardDescription>
                Установите рабочие часы для каждого дня недели
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Quick apply button */}
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={applyToAllDays}>
                  Применить понедельник ко всем дням
                </Button>
              </div>

              {/* Day-by-day settings */}
              <div className="space-y-4">
                {DAYS_FULL.map((dayName, index) => {
                  const schedule = weekSchedule[index];
                  return (
                    <div
                      key={index}
                      className={cn(
                        "flex flex-wrap items-center gap-4 p-4 rounded-lg border transition-colors",
                        schedule.isWorkDay ? "bg-card" : "bg-muted/50"
                      )}
                    >
                      <div className="w-32">
                        <span className="font-medium">{dayName}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch
                          checked={schedule.isWorkDay}
                          onCheckedChange={(checked) =>
                            updateDaySchedule(index, { isWorkDay: checked })
                          }
                        />
                        <Label className="text-sm">
                          {schedule.isWorkDay ? 'Рабочий' : 'Выходной'}
                        </Label>
                      </div>

                      {schedule.isWorkDay && (
                        <div className="flex items-center gap-2 flex-1 flex-wrap">
                          <div className="flex items-center gap-2">
                            <Sun className="h-4 w-4 text-amber-500" />
                            <select
                              value={schedule.startHour}
                              onChange={(e) =>
                                updateDaySchedule(index, { startHour: parseInt(e.target.value) })
                              }
                              className="h-9 px-2 rounded border border-input bg-background text-sm"
                            >
                              {HOURS.map((hour) => (
                                <option key={hour} value={hour}>
                                  {hour.toString().padStart(2, '0')}:00
                                </option>
                              ))}
                            </select>
                          </div>
                          <span className="text-muted-foreground">—</span>
                          <div className="flex items-center gap-2">
                            <Moon className="h-4 w-4 text-indigo-500" />
                            <select
                              value={schedule.endHour}
                              onChange={(e) =>
                                updateDaySchedule(index, { endHour: parseInt(e.target.value) })
                              }
                              className="h-9 px-2 rounded border border-input bg-background text-sm"
                            >
                              {HOURS.map((hour) => (
                                <option key={hour} value={hour}>
                                  {hour.toString().padStart(2, '0')}:00
                                </option>
                              ))}
                            </select>
                          </div>
                          <Badge variant="secondary" className="ml-2">
                            {schedule.endHour - schedule.startHour} ч
                          </Badge>
                        </div>
                      )}

                      {!schedule.isWorkDay && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Coffee className="h-4 w-4" />
                          <span className="text-sm">День отдыха</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Generate slots buttons */}
              <div className="flex flex-wrap gap-3 pt-4 border-t">
                <Button onClick={() => generateSlotsForWeek(1)} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  Создать на 1 неделю
                </Button>
                <Button variant="outline" onClick={() => generateSlotsForWeek(2)} disabled={saving}>
                  Создать на 2 недели
                </Button>
                <Button variant="outline" onClick={() => generateSlotsForWeek(4)} disabled={saving}>
                  Создать на месяц
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="week" className="mt-6">
          {/* Week view */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Визуализация недели
              </CardTitle>
              <CardDescription>
                Начиная с {format(selectedWeekStart, 'd MMMM', { locale: ru })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Week navigation */}
              <div className="flex justify-between items-center mb-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedWeekStart(addDays(selectedWeekStart, -7))}
                >
                  ← Пред. неделя
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
                >
                  Текущая неделя
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedWeekStart(addDays(selectedWeekStart, 7))}
                >
                  След. неделя →
                </Button>
              </div>

              {/* Week grid */}
              <div className="grid grid-cols-7 gap-2">
                {DAYS_OF_WEEK.map((day, index) => {
                  const date = addDays(selectedWeekStart, index);
                  const slots = getSlotCountForDate(date);
                  const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
                  const isToday = isSameDay(date, new Date());
                  const hasSlots = slots.free + slots.booked + slots.blocked > 0;

                  return (
                    <div
                      key={index}
                      className={cn(
                        "p-3 rounded-lg border text-center transition-colors",
                        isPast && "opacity-50",
                        isToday && "ring-2 ring-primary",
                        hasSlots ? "bg-card" : "bg-muted/30"
                      )}
                    >
                      <div className="text-xs text-muted-foreground">{day}</div>
                      <div className="font-bold text-lg">{format(date, 'd')}</div>
                      <div className="text-xs text-muted-foreground mb-2">
                        {format(date, 'MMM', { locale: ru })}
                      </div>

                      {hasSlots ? (
                        <div className="space-y-1">
                          {slots.free > 0 && (
                            <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                              {slots.free} св
                            </Badge>
                          )}
                          {slots.booked > 0 && (
                            <Badge variant="secondary" className="bg-accent/20 text-accent text-xs">
                              {slots.booked} бр
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Нет
                        </Badge>
                      )}

                      {!isPast && hasSlots && slots.booked === 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full mt-2 text-xs h-7"
                          onClick={() => markDayOff(date)}
                        >
                          Выходной
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex justify-center gap-6 mt-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-green-500" />
                  <span>Свободно</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-accent" />
                  <span>Забронировано</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-muted" />
                  <span>Нет слотов</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
