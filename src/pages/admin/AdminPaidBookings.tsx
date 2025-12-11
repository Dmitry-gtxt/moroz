import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Loader2, CreditCard } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Booking = Database['public']['Tables']['bookings']['Row'];
type PerformerProfile = Database['public']['Tables']['performer_profiles']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface PaidBooking extends Booking {
  performer?: PerformerProfile | null;
  customerProfile?: Profile | null;
  performerPhone?: string | null;
}

export default function AdminPaidBookings() {
  const [bookings, setBookings] = useState<PaidBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPaidBookings() {
      setLoading(true);
      
      // Fetch bookings with prepayment_paid or fully_paid status
      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select('*')
        .in('payment_status', ['prepayment_paid', 'fully_paid'])
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching paid bookings:', error);
        setLoading(false);
        return;
      }

      if (!bookingsData || bookingsData.length === 0) {
        setBookings([]);
        setLoading(false);
        return;
      }

      // Fetch performer profiles
      const performerIds = [...new Set(bookingsData.map(b => b.performer_id))];
      const { data: performers } = await supabase
        .from('performer_profiles')
        .select('*')
        .in('id', performerIds);

      // Fetch customer profiles
      const customerIds = [...new Set(bookingsData.map(b => b.customer_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', customerIds);

      // Enrich bookings
      const enrichedBookings: PaidBooking[] = bookingsData.map(booking => {
        const performer = performers?.find(p => p.id === booking.performer_id);
        const customerProfile = profiles?.find(p => p.user_id === booking.customer_id);
        return {
          ...booking,
          performer,
          customerProfile,
        };
      });

      setBookings(enrichedBookings);
      setLoading(false);
    }

    fetchPaidBookings();
  }, []);

  const isCancelledAfterPayment = (booking: PaidBooking) => booking.status === 'cancelled';

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Оплаченные заказы</h1>
          <p className="text-muted-foreground mt-1">Все бронирования с оплаченной предоплатой</p>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Оплаченные заказы ({bookings.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : bookings.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Нет оплаченных заказов</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дата оплаты</TableHead>
                    <TableHead>Дата мероприятия</TableHead>
                    <TableHead>Исполнитель</TableHead>
                    <TableHead>Заказчик</TableHead>
                    <TableHead>Адрес</TableHead>
                    <TableHead className="text-right">Предоплата</TableHead>
                    <TableHead className="text-right">Исполнителю</TableHead>
                    <TableHead>Статус</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow 
                      key={booking.id}
                      className={isCancelledAfterPayment(booking) ? 'bg-destructive/10' : ''}
                    >
                      <TableCell>
                        {format(new Date(booking.updated_at), 'd MMM yyyy', { locale: ru })}
                      </TableCell>
                      <TableCell>
                        {format(new Date(booking.booking_date), 'd MMM yyyy', { locale: ru })}
                        <span className="text-muted-foreground ml-1">{booking.booking_time}</span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{booking.performer?.display_name || '—'}</p>
                          <p className="text-sm text-muted-foreground">
                            {booking.customer_phone}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{booking.customer_name}</p>
                          <p className="text-sm text-muted-foreground">{booking.customer_phone}</p>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-48 truncate" title={booking.address}>
                        {booking.address}
                      </TableCell>
                      <TableCell className="text-right font-medium text-accent">
                        {booking.prepayment_amount.toLocaleString()} ₽
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {(booking.price_total - booking.prepayment_amount).toLocaleString()} ₽
                      </TableCell>
                      <TableCell>
                        {isCancelledAfterPayment(booking) ? (
                          <Badge variant="destructive">Отменён после оплаты</Badge>
                        ) : (
                          <Badge variant="default">Оплачен</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
