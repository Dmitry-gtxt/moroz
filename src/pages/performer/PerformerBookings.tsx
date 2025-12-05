import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { PerformerLayout } from './PerformerDashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Loader2, Check, X, MapPin, Phone, User, Calendar } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Booking = Database['public']['Tables']['bookings']['Row'];
type BookingStatus = Database['public']['Enums']['booking_status'];

const statusLabels: Record<BookingStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Ожидает', variant: 'outline' },
  confirmed: { label: 'Подтверждён', variant: 'default' },
  completed: { label: 'Завершён', variant: 'secondary' },
  cancelled: { label: 'Отменён', variant: 'destructive' },
  no_show: { label: 'Неявка', variant: 'destructive' },
};

const eventTypeLabels: Record<string, string> = {
  home: 'На дому',
  kindergarten: 'Детский сад',
  school: 'Школа',
  office: 'Офис',
  corporate: 'Корпоратив',
  outdoor: 'Улица / Парк',
};

export default function PerformerBookings() {
  const { user, loading: authLoading } = useAuth();
  const [performerId, setPerformerId] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      const { data: profile } = await supabase
        .from('performer_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile) {
        setLoading(false);
        return;
      }

      setPerformerId(profile.id);

      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('performer_id', profile.id)
        .order('booking_date', { ascending: true });

      if (error) {
        console.error('Error fetching bookings:', error);
      } else {
        setBookings(bookingsData ?? []);
      }

      setLoading(false);
    }

    if (!authLoading) {
      fetchData();
    }
  }, [user, authLoading]);

  const updateBookingStatus = async (bookingId: string, newStatus: BookingStatus) => {
    const booking = bookings.find(b => b.id === bookingId);
    
    const { error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', bookingId);

    if (error) {
      toast.error('Ошибка обновления статуса');
    } else {
      toast.success('Статус обновлён');
      setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));

      // Send customer notification when booking is confirmed
      if (newStatus === 'confirmed' && booking?.customer_email) {
        const { data: performer } = await supabase
          .from('performer_profiles')
          .select('display_name')
          .eq('id', performerId)
          .maybeSingle();

        supabase.functions.invoke('send-notification-email', {
          body: {
            type: 'booking_confirmed',
            customerEmail: booking.customer_email,
            customerName: booking.customer_name,
            performerName: performer?.display_name || 'Исполнитель',
            bookingDate: format(new Date(booking.booking_date), 'd MMMM yyyy', { locale: ru }),
            bookingTime: booking.booking_time,
            address: booking.address,
            priceTotal: booking.price_total,
          },
        });
      }
    }
  };

  const filteredBookings = bookings.filter(b => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return b.status === 'pending';
    if (activeTab === 'upcoming') return b.status === 'confirmed' && new Date(b.booking_date) >= new Date();
    if (activeTab === 'past') return b.status === 'completed' || b.status === 'cancelled' || b.status === 'no_show';
    return true;
  });

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

  return (
    <PerformerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Мои заказы</h1>
          <p className="text-muted-foreground mt-1">Управление бронированиями</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pending">
              Новые ({bookings.filter(b => b.status === 'pending').length})
            </TabsTrigger>
            <TabsTrigger value="upcoming">Предстоящие</TabsTrigger>
            <TabsTrigger value="past">История</TabsTrigger>
            <TabsTrigger value="all">Все</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {filteredBookings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Нет заказов в этой категории</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredBookings.map((booking) => {
                  const status = statusLabels[booking.status];
                  return (
                    <Card key={booking.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">
                              {format(new Date(booking.booking_date), 'd MMMM yyyy', { locale: ru })}
                              {' • '}
                              {booking.booking_time}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              {eventTypeLabels[booking.event_type] ?? booking.event_type}
                            </p>
                          </div>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span>{booking.customer_name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <span>{booking.customer_phone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground md:col-span-2">
                            <MapPin className="h-4 w-4" />
                            <span>{booking.address}</span>
                          </div>
                        </div>

                        {booking.children_info && (
                          <div className="p-3 bg-muted rounded-lg text-sm">
                            <p className="font-medium mb-1">Информация о детях:</p>
                            <p className="text-muted-foreground">{booking.children_info}</p>
                          </div>
                        )}

                        {booking.comment && (
                          <div className="p-3 bg-muted rounded-lg text-sm">
                            <p className="font-medium mb-1">Комментарий:</p>
                            <p className="text-muted-foreground">{booking.comment}</p>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="text-lg font-bold">
                            {booking.price_total.toLocaleString()} сом
                          </div>
                          
                          {booking.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Отклонить
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Подтвердить
                              </Button>
                            </div>
                          )}

                          {booking.status === 'confirmed' && (
                            <Button
                              size="sm"
                              onClick={() => updateBookingStatus(booking.id, 'completed')}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Завершить
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PerformerLayout>
  );
}
