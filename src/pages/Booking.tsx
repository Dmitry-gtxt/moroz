import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { sendBookingNotification } from '@/lib/notifications';
import { toast } from 'sonner';
import { 
  Calendar, Clock, MapPin, Users, 
  CheckCircle, ArrowLeft, LogIn, Loader2
} from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';
import { bookingStep1Schema, bookingStep2Schema } from '@/lib/validations/booking';
import { getCustomerPrice, getPrepaymentAmount, getPerformerPayment, getCommissionRate } from '@/lib/pricing';
import { ZodError } from 'zod';

type PerformerProfile = Database['public']['Tables']['performer_profiles']['Row'];
type District = Database['public']['Tables']['districts']['Row'];
type AvailabilitySlot = Database['public']['Tables']['availability_slots']['Row'];

const eventTypeLabels: Record<string, string> = {
  home: 'На дом',
  kindergarten: 'Детский сад',
  school: 'Школа',
  office: 'Офис',
  corporate: 'Корпоратив',
};

const Booking = () => {
  const { performerId } = useParams<{ performerId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const slotId = searchParams.get('slot');

  const [performer, setPerformer] = useState<PerformerProfile | null>(null);
  const [districts, setDistricts] = useState<District[]>([]);
  const [slot, setSlot] = useState<AvailabilitySlot | null>(null);
  const [pendingBookingsCount, setPendingBookingsCount] = useState(0);
  const [commissionRate, setCommissionRate] = useState(40);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    address: '',
    district: '',
    eventType: 'home',
    childrenCount: '',
    childrenAges: '',
    comment: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchData() {
      if (!performerId) return;

      const [performerRes, districtsRes, rate] = await Promise.all([
        supabase.from('performer_profiles').select('*').eq('id', performerId).maybeSingle(),
        supabase.from('districts').select('*'),
        getCommissionRate(),
      ]);

      if (performerRes.data) setPerformer(performerRes.data);
      if (districtsRes.data) setDistricts(districtsRes.data);
      setCommissionRate(rate);

      // Fetch slot if provided
      if (slotId) {
        const { data: slotData } = await supabase
          .from('availability_slots')
          .select('*')
          .eq('id', slotId)
          .maybeSingle();
        if (slotData) {
          setSlot(slotData);
          
          // Check for pending bookings on this slot
          const { count } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('slot_id', slotId)
            .eq('status', 'pending');
          
          setPendingBookingsCount(count || 0);
        }
      }

      setLoading(false);
    }

    fetchData();
  }, [performerId, slotId]);

  // Pre-fill form with user data when logged in
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        customerName: user.user_metadata?.full_name || '',
        customerPhone: user.user_metadata?.phone || '',
        customerEmail: user.email || '',
      }));
    }
  }, [user]);

  if (loading || authLoading) {
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

  if (!performer) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Исполнитель не найден</h1>
            <Button asChild>
              <Link to="/catalog">Вернуться в каталог</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const slotDate = slot?.date || new Date().toISOString().split('T')[0];
  const slotTime = slot ? `${slot.start_time.slice(0, 5)}-${slot.end_time.slice(0, 5)}` : '10:00-12:00';

  // Pricing: performer sets base_price, customer sees +X% markup (configurable)
  const performerPrice = performer.price_from ?? performer.base_price;
  const customerPrice = getCustomerPrice(performerPrice, commissionRate); // What customer sees
  const prepaymentAmount = getPrepaymentAmount(performerPrice, commissionRate); // Platform commission
  const performerPayment = getPerformerPayment(performerPrice); // Paid in cash to performer
  const photoUrl = performer.photo_urls?.[0] || '/placeholder.svg';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setFieldErrors({});
    
    if (step === 1) {
      try {
        bookingStep1Schema.parse({
          address: formData.address,
          district: formData.district,
          eventType: formData.eventType,
          childrenCount: formData.childrenCount,
          childrenAges: formData.childrenAges || undefined,
          comment: formData.comment || undefined,
        });
        setStep(2);
      } catch (error) {
        if (error instanceof ZodError) {
          const errors: Record<string, string> = {};
          error.errors.forEach((err) => {
            if (err.path[0]) {
              errors[err.path[0] as string] = err.message;
            }
          });
          setFieldErrors(errors);
          toast.error('Пожалуйста, исправьте ошибки в форме');
        }
      }
      return;
    } else if (step === 2) {
      try {
        bookingStep2Schema.parse({
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          customerEmail: formData.customerEmail || undefined,
        });
        setStep(3);
      } catch (error) {
        if (error instanceof ZodError) {
          const errors: Record<string, string> = {};
          error.errors.forEach((err) => {
            if (err.path[0]) {
              errors[err.path[0] as string] = err.message;
            }
          });
          setFieldErrors(errors);
          toast.error('Пожалуйста, исправьте ошибки в форме');
        }
      }
      return;
    } else if (step === 3) {
      if (!user) {
        toast.error('Необходимо войти в аккаунт');
        return;
      }

      setSubmitting(true);
      try {
        // Create booking - payment will be made AFTER performer confirms
        const { data: booking, error } = await supabase.from('bookings').insert({
          customer_id: user.id,
          performer_id: performer.id,
          slot_id: slot?.id || null,
          booking_date: slotDate,
          booking_time: slotTime,
          event_type: formData.eventType as Database['public']['Enums']['event_format'],
          address: formData.address,
          district_slug: formData.district,
          children_info: `${formData.childrenCount} детей${formData.childrenAges ? `, возраст: ${formData.childrenAges}` : ''}`,
          comment: formData.comment || null,
          customer_name: formData.customerName,
          customer_phone: formData.customerPhone,
          customer_email: formData.customerEmail || null,
          price_total: customerPrice, // Total customer sees (with markup)
          prepayment_amount: prepaymentAmount, // 40% of performer price
          status: 'pending', // Awaiting performer confirmation
          payment_status: 'not_paid', // Payment made after confirmation
        }).select().single();

        if (error) throw error;

        // NOTE: We do NOT mark the slot as booked yet!
        // The slot will be marked as booked only when the performer CONFIRMS the booking.
        // This allows other customers to see that the slot has pending requests.

        // Send email notification (non-blocking)
        sendBookingNotification({
          bookingId: booking.id,
          performerId: performer.id,
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          bookingDate: slotDate,
          bookingTime: slotTime,
          address: formData.address,
          eventType: formData.eventType,
          priceTotal: customerPrice,
        });

        toast.success('Бронирование успешно создано!');
        setStep(4);
      } catch (error: any) {
        console.error('Booking error:', error);
        toast.error(error.message || 'Ошибка при создании бронирования');
      } finally {
        setSubmitting(false);
      }
    }
  };

  // Show login prompt if not authenticated
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <div className="max-w-md w-full bg-card rounded-2xl p-8 border border-border text-center animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-secondary flex items-center justify-center">
              <LogIn className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="font-display text-2xl font-bold mb-2">Войдите в аккаунт</h2>
            <p className="text-muted-foreground mb-6">
              Для бронирования необходимо войти в аккаунт или зарегистрироваться
            </p>
            <div className="space-y-3">
              <Button variant="gold" size="lg" className="w-full" asChild>
                <Link to={`/auth?redirect=${encodeURIComponent(`/booking/${performerId}?slot=${slotId}`)}`}>
                  Войти или зарегистрироваться
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link to={`/performer/${performerId}`}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Вернуться к исполнителю
                </Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead 
        title={`Бронирование — ${performer.display_name}`}
        description={`Забронируйте ${performer.display_name} на новогоднее поздравление в Бишкеке.`}
      />
      <Header />
      <main className="flex-1">
        {/* Progress bar */}
        <div className="bg-secondary/50 border-b border-border">
          <div className="container py-4">
            <div className="flex items-center justify-between max-w-2xl mx-auto">
              {[
                { num: 1, label: 'Детали' },
                { num: 2, label: 'Контакты' },
                { num: 3, label: 'Оплата' },
                { num: 4, label: 'Готово' },
              ].map((s, i) => (
                <div key={s.num} className="flex items-center">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                    ${step >= s.num ? 'bg-accent text-white' : 'bg-muted text-muted-foreground'}
                  `}>
                    {step > s.num ? <CheckCircle className="h-4 w-4" /> : s.num}
                  </div>
                  <span className={`ml-2 text-sm hidden sm:inline ${step >= s.num ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {s.label}
                  </span>
                  {i < 3 && (
                    <div className={`w-8 sm:w-16 h-0.5 mx-2 ${step > s.num ? 'bg-accent' : 'bg-muted'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="container py-8">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form */}
              <div className="lg:col-span-2">
                {step === 1 && (
                  <div className="bg-card rounded-2xl p-6 border border-border animate-fade-in">
                    <h2 className="font-display text-xl font-semibold mb-4">Детали мероприятия</h2>
                    
                    {pendingBookingsCount > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                        <p className="text-amber-800 text-sm font-medium flex items-start gap-2">
                          <span className="text-amber-600">⚠️</span>
                          <span>
                            <strong>Внимание.</strong> У данного исполнителя есть другие заявки на это время. 
                            Есть высокая вероятность отказа в бронировании. 
                            Рекомендуем рассмотреть и другие слоты времени.
                          </span>
                        </p>
                      </div>
                    )}
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="eventType">Тип мероприятия *</Label>
                        <select
                          id="eventType"
                          name="eventType"
                          value={formData.eventType}
                          onChange={handleInputChange}
                          className="w-full h-10 px-3 mt-1 rounded-lg border border-input bg-background text-sm"
                        >
                          {Object.entries(eventTypeLabels).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <Label htmlFor="district">Район *</Label>
                        <select
                          id="district"
                          name="district"
                          value={formData.district}
                          onChange={handleInputChange}
                          className={`w-full h-10 px-3 mt-1 rounded-lg border bg-background text-sm ${fieldErrors.district ? 'border-destructive' : 'border-input'}`}
                        >
                          <option value="">Выберите район</option>
                          {districts.map((d) => (
                            <option key={d.id} value={d.slug}>{d.name}</option>
                          ))}
                        </select>
                        {fieldErrors.district && <p className="text-destructive text-sm mt-1">{fieldErrors.district}</p>}
                      </div>

                      <div>
                        <Label htmlFor="address">Адрес (улица, дом, квартира) *</Label>
                        <Input
                          id="address"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          placeholder="ул. Чуй, 123, кв. 45"
                          className={`mt-1 ${fieldErrors.address ? 'border-destructive' : ''}`}
                        />
                        {fieldErrors.address && <p className="text-destructive text-sm mt-1">{fieldErrors.address}</p>}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="childrenCount">Количество детей *</Label>
                          <Input
                            id="childrenCount"
                            name="childrenCount"
                            type="number"
                            min="1"
                            value={formData.childrenCount}
                            onChange={handleInputChange}
                            placeholder="2"
                            className={`mt-1 ${fieldErrors.childrenCount ? 'border-destructive' : ''}`}
                          />
                          {fieldErrors.childrenCount && <p className="text-destructive text-sm mt-1">{fieldErrors.childrenCount}</p>}
                        </div>
                        <div>
                          <Label htmlFor="childrenAges">Возраст детей</Label>
                          <Input
                            id="childrenAges"
                            name="childrenAges"
                            value={formData.childrenAges}
                            onChange={handleInputChange}
                            placeholder="5 и 8 лет"
                            className={`mt-1 ${fieldErrors.childrenAges ? 'border-destructive' : ''}`}
                          />
                          {fieldErrors.childrenAges && <p className="text-destructive text-sm mt-1">{fieldErrors.childrenAges}</p>}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="comment">Пожелания (опционально)</Label>
                        <Textarea
                          id="comment"
                          name="comment"
                          value={formData.comment}
                          onChange={handleInputChange}
                          placeholder="Любые пожелания: имена детей, любимые персонажи, песни..."
                          className={`mt-1 ${fieldErrors.comment ? 'border-destructive' : ''}`}
                          rows={3}
                        />
                        {fieldErrors.comment && <p className="text-destructive text-sm mt-1">{fieldErrors.comment}</p>}
                      </div>
                    </div>

                    <div className="flex gap-4 mt-6">
                      <Button variant="outline" asChild>
                        <Link to={`/performer/${performerId}`}>
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          Назад
                        </Link>
                      </Button>
                      <Button variant="gold" className="flex-1" onClick={handleSubmit}>
                        Продолжить
                      </Button>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="bg-card rounded-2xl p-6 border border-border animate-fade-in">
                    <h2 className="font-display text-xl font-semibold mb-6">Контактные данные</h2>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="customerName">Ваше имя *</Label>
                        <Input
                          id="customerName"
                          name="customerName"
                          value={formData.customerName}
                          onChange={handleInputChange}
                          placeholder="Айгуль"
                          className={`mt-1 ${fieldErrors.customerName ? 'border-destructive' : ''}`}
                        />
                        {fieldErrors.customerName && <p className="text-destructive text-sm mt-1">{fieldErrors.customerName}</p>}
                      </div>

                      <div>
                        <Label htmlFor="customerPhone">Телефон *</Label>
                        <Input
                          id="customerPhone"
                          name="customerPhone"
                          type="tel"
                          value={formData.customerPhone}
                          onChange={handleInputChange}
                          placeholder="+996 555 123 456"
                          className={`mt-1 ${fieldErrors.customerPhone ? 'border-destructive' : ''}`}
                        />
                        {fieldErrors.customerPhone && <p className="text-destructive text-sm mt-1">{fieldErrors.customerPhone}</p>}
                      </div>

                      <div>
                        <Label htmlFor="customerEmail">Email (опционально)</Label>
                        <Input
                          id="customerEmail"
                          name="customerEmail"
                          type="email"
                          value={formData.customerEmail}
                          onChange={handleInputChange}
                          placeholder="example@mail.com"
                          className={`mt-1 ${fieldErrors.customerEmail ? 'border-destructive' : ''}`}
                        />
                        {fieldErrors.customerEmail && <p className="text-destructive text-sm mt-1">{fieldErrors.customerEmail}</p>}
                      </div>
                    </div>

                    <div className="flex gap-4 mt-6">
                      <Button variant="outline" onClick={() => setStep(1)}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Назад
                      </Button>
                      <Button variant="gold" className="flex-1" onClick={handleSubmit}>
                        Я даю согласие на обработку моих персональных данных
                      </Button>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="bg-card rounded-2xl p-6 border border-border animate-fade-in">
                    <h2 className="font-display text-xl font-semibold mb-6">Подтверждение заказа</h2>
                    
                    <div className="bg-secondary/50 rounded-xl p-4 mb-6">
                      <div className="flex items-center gap-3 mb-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="font-semibold">Как это работает</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        После создания заказа исполнитель получит уведомление и подтвердит его.
                        Оплата предоплаты потребуется только после подтверждения исполнителем.
                      </p>
                    </div>

                    <div className="space-y-4 mb-6">
                      <div className="flex justify-between py-3 border-b border-border">
                        <span className="text-muted-foreground">Стоимость визита</span>
                        <span className="font-semibold">{customerPrice.toLocaleString()} сом</span>
                      </div>
                      <div className="flex justify-between py-3 border-b border-border">
                        <span className="text-muted-foreground">Предоплата (после подтверждения)</span>
                        <span className="font-bold text-lg text-accent">{prepaymentAmount.toLocaleString()} сом</span>
                      </div>
                      <div className="flex justify-between py-3">
                        <span className="text-muted-foreground">Оплата исполнителю наличкой</span>
                        <span>{performerPayment.toLocaleString()} сом</span>
                      </div>
                    </div>

                    <div className="bg-muted/30 rounded-xl p-4 mb-6">
                      <p className="text-sm text-muted-foreground text-center">
                        Сейчас оплата не требуется. Вы сможете оплатить предоплату после того, 
                        как исполнитель подтвердит ваш заказ.
                      </p>
                    </div>

                    <div className="flex gap-4">
                      <Button variant="outline" onClick={() => setStep(2)} disabled={submitting}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Назад
                      </Button>
                      <Button variant="hero" className="flex-1" onClick={handleSubmit} disabled={submitting}>
                        {submitting ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        {submitting ? 'Обработка...' : 'Отправить заявку'}
                      </Button>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="bg-card rounded-2xl p-8 border border-border animate-fade-in text-center">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="h-10 w-10 text-green-500" />
                    </div>
                    <h2 className="font-display text-2xl font-bold mb-2">Заявка отправлена!</h2>
                    <p className="text-muted-foreground mb-6">
                      Исполнитель получил вашу заявку и скоро подтвердит её. 
                      После подтверждения вы сможете оплатить предоплату.
                    </p>
                    
                    <div className="bg-secondary/50 rounded-xl p-4 mb-6 text-left">
                      <h3 className="font-semibold mb-3">Детали заказа</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Исполнитель:</span>
                          <span>{performer.display_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Дата:</span>
                          <span>{slotDate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Время:</span>
                          <span>{slotTime}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Стоимость:</span>
                          <span className="font-semibold">{customerPrice.toLocaleString()} сом</span>
                        </div>
                        <div className="flex justify-between text-accent">
                          <span>Предоплата (после подтверждения):</span>
                          <span className="font-bold">{prepaymentAmount.toLocaleString()} сом</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <Button variant="outline" className="flex-1" asChild>
                        <Link to="/catalog">
                          В каталог
                        </Link>
                      </Button>
                      <Button variant="gold" className="flex-1" asChild>
                        <Link to="/cabinet/bookings">
                          Мои заказы
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Order Summary Sidebar */}
              <div className="lg:col-span-1">
                <div className="sticky top-24 bg-card rounded-2xl p-6 border border-border">
                  <h3 className="font-semibold mb-4">Ваш заказ</h3>
                  
                  <div className="flex gap-4 mb-4 pb-4 border-b border-border">
                    <img
                      src={photoUrl}
                      alt={performer.display_name}
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                    <div>
                      <p className="font-semibold text-sm">{performer.display_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(performer.performer_types as string[]).map(t => t === 'ded_moroz' ? 'Дед Мороз' : t === 'snegurochka' ? 'Снегурочка' : t === 'santa' ? 'Санта' : 'Дуэт').join(', ')}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{slotDate}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{slotTime}</span>
                    </div>
                    {formData.district && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{districts.find(d => d.slug === formData.district)?.name}</span>
                      </div>
                    )}
                    {formData.childrenCount && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{formData.childrenCount} детей</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex justify-between mb-2">
                      <span className="text-muted-foreground">Итого:</span>
                      <span className="font-bold">{customerPrice.toLocaleString()} сом</span>
                    </div>
                    <div className="flex justify-between text-accent">
                      <span>Предоплата:</span>
                      <span className="font-bold">{prepaymentAmount.toLocaleString()} сом</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground text-sm mt-2">
                      <span>Наличкой исполнителю:</span>
                      <span>{performerPayment.toLocaleString()} сом</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Booking;
