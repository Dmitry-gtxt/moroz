import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Eye } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { notifyPaymentReceived } from '@/lib/pushNotifications';
import type { Database } from '@/integrations/supabase/types';

type Booking = Database['public']['Tables']['bookings']['Row'];
type PerformerProfile = Database['public']['Tables']['performer_profiles']['Row'];

interface BookingWithPerformer extends Booking {
  performer_profiles: Pick<PerformerProfile, 'display_name' | 'user_id'> | null;
  performer_phone?: string | null;
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Ожидает', variant: 'outline' },
  confirmed: { label: 'Подтверждён', variant: 'default' },
  completed: { label: 'Завершён', variant: 'secondary' },
  cancelled: { label: 'Отменён', variant: 'destructive' },
};

const paymentLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  not_paid: { label: 'Не оплачен', variant: 'outline' },
  prepayment_paid: { label: 'Предоплата', variant: 'secondary' },
  fully_paid: { label: 'Оплачен', variant: 'default' },
  refunded: { label: 'Возврат', variant: 'destructive' },
};

const eventTypeLabels: Record<string, string> = {
  home: 'На дому',
  kindergarten: 'Детский сад',
  school: 'Школа',
  corporate: 'Корпоратив',
  street: 'Улица',
};

export default function AdminOrders() {
  const [bookings, setBookings] = useState<BookingWithPerformer[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  async function fetchBookings() {
    setLoading(true);
    let query = supabase
      .from('bookings')
      .select('*, performer_profiles(display_name, user_id)')
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter as Database['public']['Enums']['booking_status']);
    }

    const { data, error } = await query;

    if (error) {
      toast.error('Ошибка загрузки заказов');
      console.error(error);
      setLoading(false);
      return;
    }

    // Fetch performer phones from profiles
    const performerUserIds = data
      ?.map(b => b.performer_profiles?.user_id)
      .filter((id): id is string => !!id) || [];
    
    const uniqueUserIds = [...new Set(performerUserIds)];
    const { data: performerProfiles } = uniqueUserIds.length > 0
      ? await supabase.from('profiles').select('user_id, phone').in('user_id', uniqueUserIds)
      : { data: [] };

    const phoneMap = new Map<string, string | null>();
    performerProfiles?.forEach(p => phoneMap.set(p.user_id, p.phone));

    const enriched = data?.map(b => ({
      ...b,
      performer_phone: b.performer_profiles?.user_id ? phoneMap.get(b.performer_profiles.user_id) : null,
    })) || [];

    setBookings(enriched as BookingWithPerformer[]);
    setLoading(false);
  }

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  async function updateBookingStatus(id: string, newStatus: Database['public']['Enums']['booking_status']) {
    const { error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      toast.error('Ошибка обновления статуса');
    } else {
      toast.success('Статус заказа обновлён');
      fetchBookings();
    }
  }

  async function updatePaymentStatus(id: string, newStatus: Database['public']['Enums']['payment_status']) {
    // Find booking to get details for notification
    const booking = bookings.find(b => b.id === id);
    
    const { error } = await supabase
      .from('bookings')
      .update({ payment_status: newStatus })
      .eq('id', id);

    if (error) {
      toast.error('Ошибка обновления статуса оплаты');
    } else {
      toast.success('Статус оплаты обновлён');
      
      // Send notifications when payment is received
      if (booking && (newStatus === 'prepayment_paid' || newStatus === 'fully_paid')) {
        // Get performer's user_id and email for notification
        const { data: performer } = await supabase
          .from('performer_profiles')
          .select('user_id')
          .eq('id', booking.performer_id)
          .single();

        // Get performer's email from auth
        let performerEmail = '';
        if (performer?.user_id) {
          const { data: userData } = await supabase.auth.admin.getUserById(performer.user_id);
          performerEmail = userData?.user?.email || '';
          
          // Send push notification
          notifyPaymentReceived(
            performer.user_id,
            booking.customer_name,
            format(new Date(booking.booking_date), 'd MMMM', { locale: ru }),
            newStatus === 'prepayment_paid' ? booking.prepayment_amount : booking.price_total
          );
        }

        // Send email notification
        if (performerEmail || booking.performer_profiles?.display_name) {
          supabase.functions.invoke('send-notification-email', {
            body: {
              type: 'payment_received',
              performerEmail,
              performerName: booking.performer_profiles?.display_name || 'Исполнитель',
              customerName: booking.customer_name,
              bookingDate: format(new Date(booking.booking_date), 'd MMMM yyyy', { locale: ru }),
              bookingTime: booking.booking_time,
              amount: newStatus === 'prepayment_paid' ? booking.prepayment_amount : booking.price_total,
              paymentStatus: newStatus
            }
          });
        }
      }
      
      fetchBookings();
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Заказы</h1>
            <p className="text-muted-foreground mt-1">Управление бронированиями</p>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Фильтр по статусу" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все заказы</SelectItem>
              <SelectItem value="pending">Ожидающие</SelectItem>
              <SelectItem value="confirmed">Подтверждённые</SelectItem>
              <SelectItem value="completed">Завершённые</SelectItem>
              <SelectItem value="cancelled">Отменённые</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Все заказы ({bookings.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : bookings.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Нет заказов</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дата</TableHead>
                    <TableHead>Клиент</TableHead>
                    <TableHead>Исполнитель</TableHead>
                    <TableHead>Тип</TableHead>
                    <TableHead>Сумма</TableHead>
                    <TableHead>Оплата</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => {
                    const status = statusLabels[booking.status] ?? statusLabels.pending;
                    const payment = paymentLabels[booking.payment_status] ?? paymentLabels.not_paid;
                    return (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <div className="font-medium">
                            {format(new Date(booking.booking_date), 'd MMM yyyy', { locale: ru })}
                          </div>
                          <div className="text-sm text-muted-foreground">{booking.booking_time}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{booking.customer_name}</div>
                          <div className="text-sm text-muted-foreground">{booking.customer_phone}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{booking.performer_profiles?.display_name ?? 'Неизвестно'}</div>
                          {booking.performer_phone && (
                            <div className="text-sm text-muted-foreground">{booking.performer_phone}</div>
                          )}
                        </TableCell>
                        <TableCell>{eventTypeLabels[booking.event_type] ?? booking.event_type}</TableCell>
                        <TableCell className="font-medium">{booking.price_total} ₽</TableCell>
                        <TableCell>
                          <Select
                            value={booking.payment_status}
                            onValueChange={(value) => updatePaymentStatus(booking.id, value as Database['public']['Enums']['payment_status'])}
                          >
                            <SelectTrigger className="w-32">
                              <Badge variant={payment.variant}>{payment.label}</Badge>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="not_paid">Не оплачен</SelectItem>
                              <SelectItem value="prepayment_paid">Предоплата</SelectItem>
                              <SelectItem value="fully_paid">Оплачен</SelectItem>
                              <SelectItem value="refunded">Возврат</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={booking.status}
                            onValueChange={(value) => updateBookingStatus(booking.id, value as Database['public']['Enums']['booking_status'])}
                          >
                            <SelectTrigger className="w-32">
                              <Badge variant={status.variant}>{status.label}</Badge>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Ожидает</SelectItem>
                              <SelectItem value="confirmed">Подтверждён</SelectItem>
                              <SelectItem value="completed">Завершён</SelectItem>
                              <SelectItem value="cancelled">Отменён</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
