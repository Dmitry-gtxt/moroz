import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { PerformerLayout } from './PerformerDashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CancelBookingDialog } from '@/components/bookings/CancelBookingDialog';
import { ProposeAlternativeDialog } from '@/components/bookings/ProposeAlternativeDialog';
import { PerformerProposalsList } from '@/components/bookings/PerformerProposalsList';
import { notifyBookingConfirmed, notifyBookingRejected, notifyBookingCancelled, scheduleBookingReminders } from '@/lib/pushNotifications';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Loader2, Check, X, MapPin, Phone, User, Calendar, Lock, Mail, CreditCard, Clock, MessageSquare } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

// Use secure_bookings view type with new fields
type SecureBooking = Database['public']['Views']['secure_bookings']['Row'];
type Booking = SecureBooking & {
  payment_deadline?: string | null;
  proposal_message?: string | null;
};
type BookingStatus = Database['public']['Enums']['booking_status'];

const statusLabels: Record<BookingStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Ожидает', variant: 'outline' },
  confirmed: { label: 'Подтверждён', variant: 'default' },
  completed: { label: 'Завершён', variant: 'secondary' },
  cancelled: { label: 'Отменён', variant: 'destructive' },
  no_show: { label: 'Неявка', variant: 'destructive' },
  counter_proposed: { label: 'Предложено время', variant: 'secondary' },
  customer_accepted: { label: 'Клиент выбрал', variant: 'outline' },
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
  const [performerName, setPerformerName] = useState<string>('');
  const [basePrice, setBasePrice] = useState<number>(3000);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [cancelDialog, setCancelDialog] = useState<{ open: boolean; booking: Booking | null; action: 'reject' | 'cancel' }>({
    open: false,
    booking: null,
    action: 'cancel',
  });
  const [proposeDialog, setProposeDialog] = useState<{ open: boolean; booking: Booking | null }>({
    open: false,
    booking: null,
  });

  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      const { data: profile } = await supabase
        .from('performer_profiles')
        .select('id, display_name, base_price')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile) {
        setLoading(false);
        return;
      }

      setPerformerId(profile.id);
      setPerformerName(profile.display_name);
      setBasePrice(profile.base_price || 3000);

      const { data: bookingsData, error } = await supabase
        .from('secure_bookings')
        .select('*')
        .eq('performer_id', profile.id)
        .order('booking_date', { ascending: true });

      if (error) {
        console.error('Error fetching bookings:', error);
      } else {
        setBookings((bookingsData as Booking[]) ?? []);
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

      // Free up the slot if cancelled
      if (newStatus === 'cancelled' && booking?.slot_id) {
        await supabase
          .from('availability_slots')
          .update({ status: 'free' })
          .eq('id', booking.slot_id);
      }

      // Mark the slot as booked when confirming
      if (newStatus === 'confirmed' && booking?.slot_id) {
        await supabase
          .from('availability_slots')
          .update({ status: 'booked' })
          .eq('id', booking.slot_id);
      }

      // Send customer notification when booking is confirmed
      if (newStatus === 'confirmed' && booking?.customer_email) {
        // Send email notification
        supabase.functions.invoke('send-notification-email', {
          body: {
            type: 'booking_confirmed',
            customerEmail: booking.customer_email,
            customerName: booking.customer_name,
            performerName: performerName,
            bookingDate: format(new Date(booking.booking_date), 'd MMMM yyyy', { locale: ru }),
            bookingTime: booking.booking_time,
            address: booking.address,
            priceTotal: booking.price_total,
          },
        });

        // Send push notification to customer
        notifyBookingConfirmed(
          booking.customer_id,
          performerName,
          format(new Date(booking.booking_date), 'd MMMM', { locale: ru }),
          booking.booking_time
        );

        // Schedule booking reminders if payment is confirmed
        if (booking.payment_status === 'prepayment_paid' || booking.payment_status === 'fully_paid') {
          scheduleBookingReminders(
            booking.id,
            booking.booking_date,
            booking.booking_time,
            booking.customer_id,
            booking.performer_id
          );
        }
      }
    }
  };

  const rejectBooking = async (bookingId: string, reason: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    const { error } = await supabase
      .from('bookings')
      .update({ 
        status: 'cancelled',
        cancellation_reason: reason,
        cancelled_by: 'performer',
      })
      .eq('id', bookingId);

    if (error) {
      toast.error('Ошибка отклонения заявки');
      throw error;
    }

    // Note: slot was never marked as booked for pending requests, so no need to free it

    // Send email notification about rejection
    if (booking.customer_email) {
      supabase.functions.invoke('send-notification-email', {
        body: {
          type: 'booking_rejected',
          customerEmail: booking.customer_email,
          customerName: booking.customer_name,
          performerName: performerName,
          bookingDate: format(new Date(booking.booking_date), 'd MMMM yyyy', { locale: ru }),
          bookingTime: booking.booking_time,
          rejectionReason: reason,
        },
      });
    }

    // Send push notification to customer
    notifyBookingRejected(
      booking.customer_id,
      performerName,
      format(new Date(booking.booking_date), 'd MMMM', { locale: ru })
    );

    toast.success('Заявка отклонена');
    setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: 'cancelled', cancellation_reason: reason, cancelled_by: 'performer' } : b));
  };

  const cancelBooking = async (bookingId: string, reason: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    const { error } = await supabase
      .from('bookings')
      .update({ 
        status: 'cancelled',
        cancellation_reason: reason,
        cancelled_by: 'performer',
      })
      .eq('id', bookingId);

    if (error) {
      toast.error('Ошибка отмены заказа');
      throw error;
    }

    // Free up the slot only for confirmed bookings
    if (booking.slot_id && booking.status === 'confirmed') {
      await supabase
        .from('availability_slots')
        .update({ status: 'free' })
        .eq('id', booking.slot_id);
    }

    // Send email notification
    supabase.functions.invoke('send-notification-email', {
      body: {
        type: 'booking_cancelled',
        bookingId: booking.id,
        customerEmail: booking.customer_email,
        customerName: booking.customer_name || 'Клиент',
        performerName: performerName,
        bookingDate: format(new Date(booking.booking_date), 'd MMMM yyyy', { locale: ru }),
        bookingTime: booking.booking_time,
        cancellationReason: reason,
        cancelledBy: 'performer',
      },
    });

    // Send push notification to customer
    notifyBookingCancelled(
      booking.customer_id,
      performerName,
      format(new Date(booking.booking_date), 'd MMMM', { locale: ru }),
      'performer'
    );

    toast.success('Заказ отменён');
    setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: 'cancelled', cancellation_reason: reason, cancelled_by: 'performer' } : b));
  };

  // Final confirmation after customer accepted proposal
  const confirmFinalBooking = async (booking: Booking) => {
    if (!booking.id) return;
    
    // Set payment deadline to 2 hours from now
    const paymentDeadline = new Date();
    paymentDeadline.setHours(paymentDeadline.getHours() + 2);

    const { error } = await supabase
      .from('bookings')
      .update({ 
        status: 'confirmed',
        payment_deadline: paymentDeadline.toISOString(),
      })
      .eq('id', booking.id);

    if (error) {
      toast.error('Ошибка подтверждения');
      return;
    }

    // Mark the slot as booked if slot_id exists
    if (booking.slot_id) {
      await supabase
        .from('availability_slots')
        .update({ status: 'booked' })
        .eq('id', booking.slot_id);
    }

    // Send notification with payment deadline info
    if (booking.customer_email) {
      supabase.functions.invoke('send-notification-email', {
        body: {
          type: 'booking_confirmed_with_deadline',
          customerEmail: booking.customer_email,
          customerName: booking.customer_name,
          performerName: performerName,
          bookingDate: format(new Date(booking.booking_date!), 'd MMMM yyyy', { locale: ru }),
          bookingTime: booking.booking_time,
          address: booking.address,
          priceTotal: booking.price_total,
          prepaymentAmount: booking.prepayment_amount,
          paymentDeadline: format(paymentDeadline, 'HH:mm d MMMM', { locale: ru }),
        },
      });
    }

    // Send push notification
    notifyBookingConfirmed(
      booking.customer_id!,
      performerName,
      format(new Date(booking.booking_date!), 'd MMMM', { locale: ru }),
      booking.booking_time!
    );

    toast.success('Заказ подтверждён! Клиенту отправлено уведомление об оплате.');
    setBookings(bookings.map(b => b.id === booking.id ? { ...b, status: 'confirmed', payment_deadline: paymentDeadline.toISOString() } : b));
  };

  // TEST: Simulate payment received (temporary for testing)
  const simulatePayment = async (booking: Booking) => {
    if (!booking.id) return;
    
    const { error } = await supabase
      .from('bookings')
      .update({ payment_status: 'prepayment_paid' })
      .eq('id', booking.id);

    if (error) {
      toast.error('Ошибка симуляции оплаты');
      return;
    }

    // Schedule booking reminders
    scheduleBookingReminders(
      booking.id,
      booking.customer_id!,
      performerId!,
      booking.booking_date!,
      booking.booking_time!
    );

    // Send notification to customer about successful payment
    if (booking.customer_email) {
      supabase.functions.invoke('send-notification-email', {
        body: {
          type: 'payment_received',
          customerEmail: booking.customer_email,
          customerName: booking.customer_name,
          performerName: performerName,
          bookingDate: format(new Date(booking.booking_date!), 'd MMMM yyyy', { locale: ru }),
          bookingTime: booking.booking_time,
          prepaymentAmount: booking.prepayment_amount,
        },
      });
    }

    toast.success('💳 ТЕСТ: Оплата симулирована успешно');
    setBookings(bookings.map(b => b.id === booking.id ? { ...b, payment_status: 'prepayment_paid' } : b));
  };

  const refreshBookings = async () => {
    if (!performerId) return;
    const { data } = await supabase
      .from('secure_bookings')
      .select('*')
      .eq('performer_id', performerId)
      .order('booking_date', { ascending: true });
    if (data) {
      setBookings((data as Booking[]) ?? []);
    }
  };

  const filteredBookings = bookings.filter(b => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return b.status === 'pending' || b.status === 'customer_accepted';
    if (activeTab === 'proposed') return b.status === 'counter_proposed';
    if (activeTab === 'upcoming') return b.status === 'confirmed' && new Date(b.booking_date!) >= new Date();
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
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="pending">
              Новые ({bookings.filter(b => b.status === 'pending' || b.status === 'customer_accepted').length})
            </TabsTrigger>
            <TabsTrigger value="proposed">
              Предложения ({bookings.filter(b => b.status === 'counter_proposed').length})
            </TabsTrigger>
            <TabsTrigger value="upcoming">
              Предстоящие ({bookings.filter(b => b.status === 'confirmed' && new Date(b.booking_date!) >= new Date()).length})
            </TabsTrigger>
            <TabsTrigger value="past">
              История ({bookings.filter(b => b.status === 'completed' || b.status === 'cancelled' || b.status === 'no_show').length})
            </TabsTrigger>
            <TabsTrigger value="all">Все ({bookings.length})</TabsTrigger>
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
                        {/* Contact info hidden until prepayment */}
                        {booking.payment_status === 'prepayment_paid' || booking.payment_status === 'fully_paid' ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <User className="h-4 w-4" />
                                <span>{booking.customer_name}</span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Phone className="h-4 w-4" />
                                <span>{booking.customer_phone}</span>
                              </div>
                              {booking.customer_email && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Mail className="h-4 w-4" />
                                  <span>{booking.customer_email}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-muted-foreground md:col-span-2">
                                <MapPin className="h-4 w-4" />
                                <span>{booking.address}</span>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/messages?chat=${booking.id}&type=booking`}>
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Перейти в чат
                              </Link>
                            </Button>
                          </div>
                        ) : (
                          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 mb-2">
                              <Lock className="h-4 w-4" />
                              <span className="font-medium">Контактные данные скрыты</span>
                            </div>
                            <p className="text-sm text-amber-600 dark:text-amber-400">
                              Контактные данные клиента станут доступны после оплаты предоплаты.
                              {booking.status === 'pending' && ' Сначала подтвердите заказ.'}
                            </p>
                            <div className="flex items-center gap-2 text-muted-foreground mt-3">
                              <User className="h-4 w-4" />
                              <span>{booking.customer_name}</span>
                            </div>
                          </div>
                        )}

                        {/* Payment status indicator for performer */}
                        {booking.status === 'confirmed' && (
                          <div className={`p-3 rounded-lg text-sm flex items-center justify-between gap-2 ${
                            booking.payment_status === 'prepayment_paid' || booking.payment_status === 'fully_paid'
                              ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
                              : 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                          }`}>
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4" />
                              {booking.payment_status === 'prepayment_paid' || booking.payment_status === 'fully_paid' ? (
                                <span>Предоплата получена. Клиент заплатит вам наличкой после мероприятия.</span>
                              ) : (
                                <span>Ожидает оплаты предоплаты от клиента</span>
                              )}
                            </div>
                            {/* TEST BUTTON - REMOVE AFTER TESTING */}
                            {booking.payment_status !== 'prepayment_paid' && booking.payment_status !== 'fully_paid' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-black text-white hover:bg-gray-800 border-black text-xs"
                                onClick={() => simulatePayment(booking)}
                              >
                                (тест: оплачено)
                              </Button>
                            )}
                          </div>
                        )}

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

                        {booking.status === 'cancelled' && booking.cancellation_reason && (
                          <div className="p-3 bg-destructive/10 rounded-lg text-sm">
                            <p className="font-medium mb-1 text-destructive">
                              Причина отмены {booking.cancelled_by === 'customer' ? '(клиент)' : ''}:
                            </p>
                            <p className="text-muted-foreground">{booking.cancellation_reason}</p>
                          </div>
                        )}

                        {/* Show proposed slots for counter_proposed status */}
                        {booking.status === 'counter_proposed' && booking.id && (
                          <PerformerProposalsList 
                            bookingId={booking.id} 
                            basePrice={basePrice} 
                          />
                        )}

                        <div className="flex flex-col gap-3 pt-2 border-t">
                          <div>
                            <div className="text-lg font-bold">
                              {booking.price_total?.toLocaleString()} ₽
                            </div>
                            <p className="text-sm text-muted-foreground">
                              ({((booking.price_total || 0) - (booking.prepayment_amount || 0)).toLocaleString()} ₽ вам оплатит заказчик лично при встрече + комиссию сайта предоплатой {booking.prepayment_amount?.toLocaleString()} ₽)
                            </p>
                          </div>
                          
                          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg text-xs text-blue-700 dark:text-blue-300">
                            В случае изменения в вашем графике или форс-мажорных обстоятельств, которые помешают вам прийти к клиенту в обозначенное время, чтобы ваш рейтинг не был понижен — обязательно отмените заказ и позвоните нам: <a href="tel:+79953829736" className="font-medium underline">+7(995)382-97-36</a>
                          </div>
                          
                          <div className="flex items-center justify-end">
                            {booking.status === 'pending' && (
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCancelDialog({ open: true, booking, action: 'reject' })}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Отклонить
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => setProposeDialog({ open: true, booking })}
                                >
                                  <Clock className="h-4 w-4 mr-1" />
                                  Другое время
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => updateBookingStatus(booking.id!, 'confirmed')}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Подтвердить
                                </Button>
                              </div>
                            )}

                            {booking.status === 'counter_proposed' && (
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCancelDialog({ open: true, booking, action: 'reject' })}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Отклонить
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => setProposeDialog({ open: true, booking })}
                                >
                                  <Clock className="h-4 w-4 mr-1" />
                                  Изменить предложение
                                </Button>
                              </div>
                            )}

                            {booking.status === 'customer_accepted' && (
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCancelDialog({ open: true, booking, action: 'reject' })}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Отклонить
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => setProposeDialog({ open: true, booking })}
                                >
                                  <Clock className="h-4 w-4 mr-1" />
                                  Изменить предложение
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => confirmFinalBooking(booking)}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Подтвердить финально
                                </Button>
                              </div>
                            )}

                            {booking.status === 'confirmed' && (
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCancelDialog({ open: true, booking, action: 'cancel' })}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Отменить
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => updateBookingStatus(booking.id, 'completed')}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Завершить
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {cancelDialog.booking && (
          <CancelBookingDialog
            open={cancelDialog.open}
            onOpenChange={(open) => setCancelDialog({ ...cancelDialog, open })}
            onConfirm={(reason) => 
              cancelDialog.action === 'reject' 
                ? rejectBooking(cancelDialog.booking!.id!, reason)
                : cancelBooking(cancelDialog.booking!.id!, reason)
            }
            bookingDate={format(new Date(cancelDialog.booking.booking_date!), 'd MMMM yyyy', { locale: ru })}
            customerName={cancelDialog.booking.customer_name || 'Клиент'}
            role="performer"
            isRejection={cancelDialog.action === 'reject'}
          />
        )}

        {proposeDialog.booking && performerId && (
          <ProposeAlternativeDialog
            open={proposeDialog.open}
            onOpenChange={(open) => setProposeDialog({ ...proposeDialog, open })}
            bookingId={proposeDialog.booking.id!}
            performerId={performerId}
            performerName={performerName}
            customerName={proposeDialog.booking.customer_name || 'Клиент'}
            customerId={proposeDialog.booking.customer_id!}
            customerEmail={proposeDialog.booking.customer_email}
            originalDate={proposeDialog.booking.booking_date!}
            originalTime={proposeDialog.booking.booking_time!}
            basePrice={basePrice}
            onSuccess={refreshBookings}
          />
        )}
      </div>
    </PerformerLayout>
  );
}
