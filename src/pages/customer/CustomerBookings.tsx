import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Calendar, Clock, MapPin, Star, Loader2, 
  Package, User, MessageCircle, CheckCircle
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Database } from '@/integrations/supabase/types';

type Booking = Database['public']['Tables']['bookings']['Row'];
type BookingStatus = Database['public']['Enums']['booking_status'];
type PerformerProfile = Database['public']['Tables']['performer_profiles']['Row'];

interface BookingWithPerformer extends Booking {
  performer?: PerformerProfile | null;
  hasReview?: boolean;
}

const statusLabels: Record<BookingStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Ожидает подтверждения', variant: 'secondary' },
  confirmed: { label: 'Подтверждён', variant: 'default' },
  cancelled: { label: 'Отменён', variant: 'destructive' },
  completed: { label: 'Завершён', variant: 'outline' },
  no_show: { label: 'Неявка', variant: 'destructive' },
};

const eventTypeLabels: Record<string, string> = {
  home: 'На дом',
  kindergarten: 'Детский сад',
  school: 'Школа',
  office: 'Офис',
  corporate: 'Корпоратив',
  outdoor: 'На улице',
};

export default function CustomerBookings() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [bookings, setBookings] = useState<BookingWithPerformer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [reviewModal, setReviewModal] = useState<{
    open: boolean;
    booking: BookingWithPerformer | null;
  }>({ open: false, booking: null });

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

      // Fetch existing reviews for these bookings
      const bookingIds = bookingsData.map(b => b.id);
      const { data: reviews } = await supabase
        .from('reviews')
        .select('booking_id')
        .in('booking_id', bookingIds)
        .eq('customer_id', user.id);

      const reviewedBookingIds = new Set(reviews?.map(r => r.booking_id) || []);

      // Combine data
      const enrichedBookings: BookingWithPerformer[] = bookingsData.map(booking => ({
        ...booking,
        performer: performers?.find(p => p.id === booking.performer_id) || null,
        hasReview: reviewedBookingIds.has(booking.id),
      }));

      setBookings(enrichedBookings);
    } catch (error: any) {
      toast.error('Ошибка загрузки заказов');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?redirect=/my-bookings');
      return;
    }
    if (user) {
      fetchBookings();
    }
  }, [user, authLoading, navigate]);

  const filteredBookings = bookings.filter(booking => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return ['pending', 'confirmed'].includes(booking.status);
    if (activeTab === 'completed') return booking.status === 'completed';
    if (activeTab === 'cancelled') return ['cancelled', 'no_show'].includes(booking.status);
    return true;
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container py-8">
          <div className="mb-8">
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
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {booking.address}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <div className="text-lg font-semibold">
                          {booking.price_total.toLocaleString()} сом
                        </div>
                        
                        <div className="flex gap-2">
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
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />

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
    </div>
  );
}
