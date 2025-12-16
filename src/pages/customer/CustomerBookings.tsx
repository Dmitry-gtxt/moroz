import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CustomerLayout } from '@/components/customer/CustomerLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import { CancelBookingDialog } from '@/components/bookings/CancelBookingDialog';
import { ProposalsList } from '@/components/bookings/ProposalsList';
import { SEOHead } from '@/components/seo/SEOHead';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { notifyBookingCancelled, notifyPaymentReceived, notifyAdminBookingCancelled } from '@/lib/pushNotifications';
import { toast } from 'sonner';
import { 
  Calendar, Clock, MapPin, Star, Loader2, Phone, HeadphonesIcon,
  Package, User, X, CheckCircle, CreditCard, Lock, Timer, AlertCircle, MessageSquare
} from 'lucide-react';
import { getCustomerPrice, getPrepaymentAmount, getPerformerPayment } from '@/lib/pricing';
import { scheduleBookingReminders } from '@/lib/pushNotifications';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Database } from '@/integrations/supabase/types';

type Booking = Database['public']['Tables']['bookings']['Row'];
type BookingStatus = Database['public']['Enums']['booking_status'];
type PerformerProfile = Database['public']['Tables']['performer_profiles']['Row'];

interface BookingWithPerformer extends Booking {
  performer?: PerformerProfile | null;
  performerPhone?: string | null;
  hasReview?: boolean;
}

const statusLabels: Record<BookingStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Ожидает подтверждения', variant: 'secondary' },
  confirmed: { label: 'Подтверждён', variant: 'default' },
  cancelled: { label: 'Отменён', variant: 'destructive' },
  completed: { label: 'Завершён', variant: 'outline' },
  no_show: { label: 'Неявка', variant: 'destructive' },
  counter_proposed: { label: 'Предложено другое время', variant: 'secondary' },
  customer_accepted: { label: 'Ожидает финального подтверждения', variant: 'outline' },
};

const eventTypeLabels: Record<string, string> = {
  home: 'На дом',
  kindergarten: 'Детский сад',
  school: 'Школа',
  office: 'Офис',
  corporate: 'Корпоратив',
  outdoor: 'На улице',
};

// Helper component for payment deadline countdown
function PaymentDeadlineBlock({ deadline, prepaymentAmount, onTestPayment }: { deadline: string; prepaymentAmount: number; onTestPayment?: () => void }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const deadlineDate = parseISO(deadline);
      const diffMinutes = differenceInMinutes(deadlineDate, now);

      if (diffMinutes <= 0) {
        setIsExpired(true);
        setTimeLeft('Время истекло');
      } else {
        const hours = Math.floor(diffMinutes / 60);
        const minutes = diffMinutes % 60;
        setTimeLeft(`${hours}ч ${minutes}мин`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [deadline]);

  if (isExpired) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-red-800 dark:text-red-200">
              Время на оплату истекло
            </p>
            <p className="text-red-600 dark:text-red-400">
              Бронирование может быть отменено исполнителем
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-medium text-amber-800 dark:text-amber-200 flex items-center gap-2">
            <Timer className="h-4 w-4" />
            Оплатите в течение {timeLeft}
          </p>
          <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
            Предоплата {prepaymentAmount.toLocaleString()} ₽ — иначе бронирование будет отменено
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="gold" size="sm">
            <CreditCard className="h-4 w-4 mr-2" />
            Оплатить
          </Button>
          {/* TEST BUTTON - REMOVE AFTER TESTING */}
          {onTestPayment && (
            <Button
              size="sm"
              variant="outline"
              className="bg-black text-white hover:bg-gray-800 border-black text-xs"
              onClick={onTestPayment}
            >
              (тест: оплачено)
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CustomerBookings() {
  const { user } = useAuth();
  
  const [bookings, setBookings] = useState<BookingWithPerformer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [reviewModal, setReviewModal] = useState<{
    open: boolean;
    booking: BookingWithPerformer | null;
  }>({ open: false, booking: null });
  const [cancelDialog, setCancelDialog] = useState<{
    open: boolean;
    booking: BookingWithPerformer | null;
  }>({ open: false, booking: null });
  const [userProfile, setUserProfile] = useState<{ full_name: string } | null>(null);

  const fetchBookings = async () => {
    if (!user) return;

    try {
      // Fetch bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('customer_id', user.id)
        .order('booking_date', { ascending: false });

      if (bookingsError) throw bookingsError;

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

      // Fetch performer phone numbers from profiles table
      const performerUserIds = performers?.filter(p => p.user_id).map(p => p.user_id) || [];
      const { data: performerProfiles } = performerUserIds.length > 0 
        ? await supabase
            .from('profiles')
            .select('user_id, phone')
            .in('user_id', performerUserIds)
        : { data: [] };

      // Create a map of user_id to phone
      const phoneMap = new Map<string, string | null>();
      performerProfiles?.forEach(p => {
        if (p.user_id) phoneMap.set(p.user_id, p.phone);
      });

      // Fetch existing reviews for these bookings
      const bookingIds = bookingsData.map(b => b.id);
      const { data: reviews } = await supabase
        .from('reviews')
        .select('booking_id')
        .in('booking_id', bookingIds)
        .eq('customer_id', user.id);

      const reviewedBookingIds = new Set(reviews?.map(r => r.booking_id) || []);

      // Combine data
      const enrichedBookings: BookingWithPerformer[] = bookingsData.map(booking => {
        const performer = performers?.find(p => p.id === booking.performer_id) || null;
        return {
          ...booking,
          performer,
          performerPhone: performer?.user_id ? phoneMap.get(performer.user_id) || null : null,
          hasReview: reviewedBookingIds.has(booking.id),
        };
      });

      setBookings(enrichedBookings);
    } catch (error: any) {
      toast.error('Ошибка загрузки заказов');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchBookings();
      // Get user profile for email notifications
      supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setUserProfile(data);
        });
    }
  }, [user]);

  const cancelBooking = async (bookingId: string, reason: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    const { error } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancellation_reason: reason,
        cancelled_by: 'customer',
      })
      .eq('id', bookingId);

    if (error) {
      toast.error('Ошибка отмены заказа');
      throw error;
    }

    // Free up the slot
    if (booking.slot_id) {
      await supabase
        .from('availability_slots')
        .update({ status: 'free' })
        .eq('id', booking.slot_id);
    }

    // Get performer's user_id for push notification
    if (booking.performer?.user_id) {
      notifyBookingCancelled(
        booking.performer.user_id,
        userProfile?.full_name || 'Клиент',
        format(new Date(booking.booking_date), 'd MMMM', { locale: ru }),
        'customer'
      );
    }

    // Notify admin about cancellation
    notifyAdminBookingCancelled(
      userProfile?.full_name || 'Клиент',
      booking.performer?.display_name || 'Исполнитель',
      format(new Date(booking.booking_date), 'd MMMM', { locale: ru }),
      'customer',
      reason
    );

    // Send email notification to performer
    supabase.functions.invoke('send-notification-email', {
      body: {
        type: 'booking_cancelled',
        bookingId: booking.id,
        customerName: userProfile?.full_name || 'Клиент',
        performerName: booking.performer?.display_name || 'Исполнитель',
        bookingDate: format(new Date(booking.booking_date), 'd MMMM yyyy', { locale: ru }),
        bookingTime: booking.booking_time,
        cancellationReason: reason,
        cancelledBy: 'customer'
      }
    });

    toast.success('Заказ отменён');
    fetchBookings();
  };

  // TEST: Simulate payment received (temporary for testing)
  const simulatePayment = async (booking: BookingWithPerformer) => {
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
    if (booking.performer) {
      scheduleBookingReminders(
        booking.id,
        booking.booking_date,
        booking.booking_time,
        booking.customer_id,
        booking.performer.id
      );
    }

    // Send push notification to performer about successful payment
    if (booking.performer?.user_id) {
      notifyPaymentReceived(
        booking.performer.user_id,
        booking.customer_name,
        format(parseISO(booking.booking_date), 'd MMMM', { locale: ru }),
        booking.prepayment_amount
      );
    }

    // Send email notification to performer about successful payment
    if (booking.performer) {
      supabase.functions.invoke('send-notification-email', {
        body: {
          type: 'payment_received',
          performerId: booking.performer.id,
          customerName: booking.customer_name,
          performerName: booking.performer.display_name,
          bookingDate: format(parseISO(booking.booking_date), 'd MMMM yyyy', { locale: ru }),
          bookingTime: booking.booking_time,
          amount: booking.prepayment_amount,
          paymentStatus: 'prepayment_paid'
        }
      });
    }

    toast.success('Тест: оплата симулирована');
    fetchBookings();
  };

  const filteredBookings = bookings.filter(booking => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return ['pending', 'confirmed', 'counter_proposed', 'customer_accepted'].includes(booking.status);
    if (activeTab === 'completed') return booking.status === 'completed';
    if (activeTab === 'cancelled') return ['cancelled', 'no_show'].includes(booking.status);
    return true;
  });

  if (loading) {
    return (
      <CustomerLayout>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <SEOHead title="Мои заказы" />
      
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl font-bold mb-2">Мои заказы</h1>
          <p className="text-muted-foreground">
            История ваших бронирований
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">Все ({bookings.length})</TabsTrigger>
            <TabsTrigger value="active">
              Активные ({bookings.filter(b => ['pending', 'confirmed'].includes(b.status)).length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Завершённые ({bookings.filter(b => b.status === 'completed').length})
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              Отменённые ({bookings.filter(b => ['cancelled', 'no_show'].includes(b.status)).length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {filteredBookings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    {activeTab === 'all' 
                      ? 'У вас пока нет заказов'
                      : 'Нет заказов в этой категории'}
                  </p>
                  <Button variant="gold" asChild>
                    <Link to="/catalog">Найти исполнителя</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredBookings.map((booking) => (
                <Card key={booking.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        {booking.performer && (
                          <Link to={`/performer/${booking.performer.id}`}>
                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-secondary">
                              <img
                                src={booking.performer.photo_urls?.[0] || '/placeholder.svg'}
                                alt={booking.performer.display_name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </Link>
                        )}
                        <div>
                          <CardTitle className="text-lg">
                            {booking.performer ? (
                              <Link 
                                to={`/performer/${booking.performer.id}`}
                                className="hover:text-accent transition-colors"
                              >
                                {booking.performer.display_name}
                              </Link>
                            ) : (
                              'Исполнитель'
                            )}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {eventTypeLabels[booking.event_type] || booking.event_type}
                          </p>
                        </div>
                      </div>
                      <Badge variant={statusLabels[booking.status].variant}>
                        {statusLabels[booking.status].label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {format(parseISO(booking.booking_date), 'd MMMM yyyy', { locale: ru })}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {booking.booking_time}
                      </div>
                      {/* Address hidden until prepayment */}
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {booking.payment_status === 'prepayment_paid' || booking.payment_status === 'fully_paid' ? (
                          <span>{booking.address}</span>
                        ) : (
                          <span className="flex items-center gap-1 text-amber-600">
                            <Lock className="h-3 w-3" />
                            Доступно после оплаты
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Counter proposal section */}
                    {booking.status === 'counter_proposed' && booking.performer && (
                      <ProposalsList
                        bookingId={booking.id}
                        performerName={booking.performer.display_name}
                        performerUserId={booking.performer.user_id}
                        originalPrice={booking.price_total}
                        customerName={userProfile?.full_name || 'Клиент'}
                        onAccepted={fetchBookings}
                        onRejected={fetchBookings}
                      />
                    )}

                    {/* Payment deadline warning for customer_accepted */}
                    {booking.status === 'customer_accepted' && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="flex items-start gap-2">
                          <Timer className="h-4 w-4 text-blue-600 mt-0.5" />
                          <div className="text-sm">
                            <p className="font-medium text-blue-800 dark:text-blue-200">
                              Ожидает финального подтверждения от исполнителя
                            </p>
                            <p className="text-blue-600 dark:text-blue-400">
                              После подтверждения у вас будет 2 часа на оплату предоплаты, иначе бронирование может быть отменено
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Confirmed with payment deadline */}
                    {booking.status === 'confirmed' && booking.payment_status === 'not_paid' && booking.payment_deadline && (
                      <PaymentDeadlineBlock 
                        deadline={booking.payment_deadline} 
                        prepaymentAmount={booking.prepayment_amount}
                        onTestPayment={() => simulatePayment(booking)}
                      />
                    )}

                    {/* Regular payment reminder for confirmed without deadline */}
                    {booking.status === 'confirmed' && booking.payment_status === 'not_paid' && !booking.payment_deadline && (
                      <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="font-medium text-amber-800 dark:text-amber-200">
                              Ожидает оплаты предоплаты
                            </p>
                            <p className="text-sm text-amber-600 dark:text-amber-400">
                              Оплатите {booking.prepayment_amount.toLocaleString()} ₽ для подтверждения
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="gold" size="sm">
                              <CreditCard className="h-4 w-4 mr-2" />
                              Оплатить
                            </Button>
                            {/* TEST BUTTON - REMOVE AFTER TESTING */}
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-black text-white hover:bg-gray-800 border-black text-xs"
                              onClick={() => simulatePayment(booking)}
                            >
                              (тест: оплачено)
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {(booking.payment_status === 'prepayment_paid' || booking.payment_status === 'fully_paid') && (
                      <div className="space-y-3">
                        <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                          <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              Предоплата внесена: {booking.prepayment_amount.toLocaleString()} ₽
                            </span>
                          </div>
                          <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                            Оплатите исполнителю наличкой после мероприятия: {(booking.price_total - booking.prepayment_amount).toLocaleString()} ₽
                          </p>
                          {booking.performerPhone && (
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-green-200 dark:border-green-800">
                              <Phone className="h-4 w-4 text-green-600 dark:text-green-400" />
                              <a 
                                href={`tel:${booking.performerPhone}`}
                                className="text-sm font-medium text-green-700 dark:text-green-300 hover:underline"
                              >
                                {booking.performerPhone}
                              </a>
                              <span className="text-xs text-green-600 dark:text-green-400">— телефон исполнителя</span>
                            </div>
                          )}
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/messages?chat=${booking.id}&type=booking`}>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Написать исполнителю
                          </Link>
                        </Button>
                      </div>
                    )}

                    {booking.status === 'cancelled' && booking.cancellation_reason && (
                      <div className="p-3 bg-destructive/10 rounded-lg text-sm">
                        <p className="font-medium mb-1 text-destructive">
                          Причина отмены {booking.cancelled_by === 'performer' ? '(исполнитель)' : ''}:
                        </p>
                        <p className="text-muted-foreground">{booking.cancellation_reason}</p>
                      </div>
                    )}

                      <div className="flex items-center justify-between pt-4 border-t border-border">
                      {/* Hide price when counter_proposed - proposals have their own prices */}
                      {booking.status !== 'counter_proposed' && (
                        <div>
                          <div className="text-lg font-semibold">
                            {booking.price_total.toLocaleString()} ₽
                          </div>
                          <div className="text-xs text-muted-foreground">
                            (Предоплата онлайн {booking.prepayment_amount.toLocaleString()} ₽ + Исполнителю на руки {(booking.price_total - booking.prepayment_amount).toLocaleString()} ₽)
                          </div>
                        </div>
                      )}
                      {booking.status === 'counter_proposed' && <div />}
                      
                      <div className="flex gap-2">
                        {/* Cancel button for pending/confirmed */}
                        {['pending', 'confirmed'].includes(booking.status) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCancelDialog({ open: true, booking })}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Отменить
                          </Button>
                        )}
                        
                        {booking.status === 'completed' && !booking.hasReview && (
                          <Button
                            variant="gold"
                            size="sm"
                            onClick={() => setReviewModal({ open: true, booking })}
                          >
                            <Star className="h-4 w-4 mr-2" />
                            Оставить отзыв
                          </Button>
                        )}
                        {booking.status === 'completed' && booking.hasReview && (
                          <Badge variant="outline" className="text-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Отзыв оставлен
                          </Badge>
                        )}
                        {booking.performer && (
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/performer/${booking.performer.id}`}>
                              <User className="h-4 w-4 mr-2" />
                              Профиль
                            </Link>
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" asChild>
                          <Link to="/messages?type=support">
                            <HeadphonesIcon className="h-4 w-4 mr-2" />
                            В поддержку
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {reviewModal.booking && reviewModal.booking.performer && user && (
        <ReviewForm
          open={reviewModal.open}
          onOpenChange={(open) => setReviewModal({ ...reviewModal, open })}
          bookingId={reviewModal.booking.id}
          performerId={reviewModal.booking.performer_id}
          performerName={reviewModal.booking.performer.display_name}
          customerId={user.id}
          customerName={reviewModal.booking.customer_name}
          onReviewSubmitted={fetchBookings}
        />
      )}

      {cancelDialog.booking && (
        <CancelBookingDialog
          open={cancelDialog.open}
          onOpenChange={(open) => setCancelDialog({ ...cancelDialog, open })}
          onConfirm={(reason) => cancelBooking(cancelDialog.booking!.id, reason)}
          bookingDate={format(parseISO(cancelDialog.booking.booking_date), 'd MMMM yyyy', { locale: ru })}
          performerName={cancelDialog.booking.performer?.display_name}
          role="customer"
        />
      )}
    </CustomerLayout>
  );
}
