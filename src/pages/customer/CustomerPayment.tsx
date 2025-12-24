import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CustomerLayout } from '@/components/customer/CustomerLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SEOHead } from '@/components/seo/SEOHead';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Calendar, Clock, MapPin, Loader2, CreditCard, 
  Phone, MessageSquare, Headphones, User, Send
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale/ru';
import type { Database } from '@/integrations/supabase/types';

type Booking = Database['public']['Tables']['bookings']['Row'];
type PerformerProfile = Database['public']['Tables']['performer_profiles']['Row'];

interface BookingWithPerformer extends Booking {
  performer?: PerformerProfile | null;
}

const SUPPORT_PHONE = '+79953829736';
const SUPPORT_TELEGRAM = 'https://t.me/gtxt_biz';

export default function CustomerPayment() {
  const { user } = useAuth();
  const [booking, setBooking] = useState<BookingWithPerformer | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    async function fetchPendingPayment() {
      if (!user) return;

      try {
        // Find booking that needs payment (confirmed + not_paid)
        const { data: bookingData, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('customer_id', user.id)
          .eq('status', 'confirmed')
          .eq('payment_status', 'not_paid')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        if (bookingData) {
          // Fetch performer
          const { data: performer } = await supabase
            .from('performer_profiles')
            .select('*')
            .eq('id', bookingData.performer_id)
            .single();

          setBooking({ ...bookingData, performer });
        }
      } catch (error: any) {
        console.error('Error fetching payment booking:', error);
        toast.error('Ошибка загрузки данных');
      } finally {
        setLoading(false);
      }
    }

    fetchPendingPayment();
  }, [user]);

  const handlePayment = async () => {
    if (!booking) return;

    setPaymentLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('vtb-create-payment', {
        body: {
          bookingId: booking.id,
          amount: booking.prepayment_amount * 100, // Convert to kopecks
          description: `Предоплата за бронирование #${booking.id.slice(0, 8)}`,
          customerEmail: booking.customer_email,
          customerPhone: booking.customer_phone,
        },
      });

      if (error) throw error;

      if (data?.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        throw new Error('Не получена ссылка на оплату');
      }
    } catch (error: any) {
      console.error('Payment error:', error);

      // Surface the real backend response body (super helpful for 401/403/500)
      if (error?.name === 'FunctionsHttpError' && error?.context) {
        const res = error.context as Response;
        const status = res?.status;
        const raw = await res.text().catch(() => '');
        toast.error(`Ошибка оплаты (${status}): ${raw || error.message}`);
      } else {
        toast.error(error.message || 'Ошибка при создании платежа');
      }
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <CustomerLayout>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </CustomerLayout>
    );
  }

  if (!booking) {
    return (
      <CustomerLayout>
        <SEOHead title="Оплата бронирования" />
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="py-12 text-center">
              <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Нет бронирований к оплате</h2>
              <p className="text-muted-foreground mb-6">
                У вас нет подтверждённых бронирований, ожидающих оплаты
              </p>
              <Button variant="gold" asChild>
                <Link to="/cabinet/bookings">Мои заказы</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <SEOHead title="Оплата бронирования" />
      
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold mb-2">Оплата бронирования</h1>
          <p className="text-muted-foreground">
            Внесите предоплату для подтверждения заказа
          </p>
        </div>

        {/* Booking Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              {booking.performer && (
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                  <img
                    src={booking.performer.photo_urls?.[0] || '/placeholder.svg'}
                    alt={booking.performer.display_name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div>
                <span>{booking.performer?.display_name || 'Исполнитель'}</span>
                <p className="text-sm font-normal text-muted-foreground">
                  Заказ #{booking.id.slice(0, 8)}
                </p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {format(parseISO(booking.booking_date), 'd MMMM yyyy', { locale: ru })}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                {booking.booking_time}
              </div>
            </div>

            <div className="border-t border-border pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Общая стоимость:</span>
                <span>{booking.price_total.toLocaleString()} ₽</span>
              </div>
              <div className="flex justify-between text-lg font-semibold">
                <span>К оплате (предоплата):</span>
                <span className="text-accent">{booking.prepayment_amount.toLocaleString()} ₽</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Исполнителю наличкой:</span>
                <span>{(booking.price_total - booking.prepayment_amount).toLocaleString()} ₽</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Button */}
        <Button 
          variant="gold" 
          size="lg" 
          className="w-full text-lg py-6"
          onClick={handlePayment}
          disabled={paymentLoading}
        >
          {paymentLoading ? (
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          ) : (
            <CreditCard className="h-5 w-5 mr-2" />
          )}
          Оплатить {booking.prepayment_amount.toLocaleString()} ₽
        </Button>

        {/* Support Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Нужна помощь?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground mb-4">
              Если у вас возникли вопросы по оплате или бронированию, свяжитесь с нами:
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button variant="outline" className="justify-start" asChild>
                <Link to="/messages?type=support">
                  <Headphones className="h-4 w-4 mr-2" />
                  Написать в поддержку
                </Link>
              </Button>
              
              <Button variant="outline" className="justify-start" asChild>
                <a href={SUPPORT_TELEGRAM} target="_blank" rel="noopener noreferrer">
                  <Send className="h-4 w-4 mr-2" />
                  Написать в Телеграм
                </a>
              </Button>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg mt-4">
              <Phone className="h-5 w-5 text-accent" />
              <div>
                <p className="text-sm text-muted-foreground">Телефон поддержки:</p>
                <a 
                  href={`tel:${SUPPORT_PHONE}`}
                  className="font-semibold hover:text-accent transition-colors"
                >
                  {SUPPORT_PHONE}
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back to bookings */}
        <div className="text-center">
          <Button variant="ghost" asChild>
            <Link to="/cabinet/bookings">
              ← Вернуться к заказам
            </Link>
          </Button>
        </div>
      </div>
    </CustomerLayout>
  );
}
