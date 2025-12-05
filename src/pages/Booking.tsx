import { useState } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { mockPerformers, districts } from '@/data/mockData';
import { toast } from 'sonner';
import { 
  Calendar, Clock, MapPin, Users, CreditCard, 
  CheckCircle, ArrowLeft, ShieldCheck 
} from 'lucide-react';

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
  const slotId = searchParams.get('slot');

  const performer = mockPerformers.find((p) => p.id === performerId);

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

  // Parse slot info (mock data)
  const slotDate = slotId?.split('-').slice(1, 4).join('-') || '2024-12-25';
  const slotTime = slotId?.includes('morning') ? '10:00-12:00' : 
                   slotId?.includes('afternoon') ? '14:00-16:00' : '18:00-20:00';

  const prepaymentAmount = Math.round(performer.basePrice * 0.3);
  const totalAmount = performer.basePrice;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (step === 1) {
      // Validate step 1
      if (!formData.address || !formData.district || !formData.childrenCount) {
        toast.error('Пожалуйста, заполните все обязательные поля');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      // Validate step 2
      if (!formData.customerName || !formData.customerPhone) {
        toast.error('Пожалуйста, заполните контактные данные');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      // Mock payment
      toast.success('Бронирование успешно создано!');
      setStep(4);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
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
                    <h2 className="font-display text-xl font-semibold mb-6">Детали мероприятия</h2>
                    
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
                          className="w-full h-10 px-3 mt-1 rounded-lg border border-input bg-background text-sm"
                        >
                          <option value="">Выберите район</option>
                          {districts.map((d) => (
                            <option key={d.id} value={d.slug}>{d.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <Label htmlFor="address">Адрес (улица, дом, квартира) *</Label>
                        <Input
                          id="address"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          placeholder="ул. Чуй, 123, кв. 45"
                          className="mt-1"
                        />
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
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="childrenAges">Возраст детей</Label>
                          <Input
                            id="childrenAges"
                            name="childrenAges"
                            value={formData.childrenAges}
                            onChange={handleInputChange}
                            placeholder="5 и 8 лет"
                            className="mt-1"
                          />
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
                          className="mt-1"
                          rows={3}
                        />
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
                          className="mt-1"
                        />
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
                          className="mt-1"
                        />
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
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="flex gap-4 mt-6">
                      <Button variant="outline" onClick={() => setStep(1)}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Назад
                      </Button>
                      <Button variant="gold" className="flex-1" onClick={handleSubmit}>
                        Продолжить к оплате
                      </Button>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="bg-card rounded-2xl p-6 border border-border animate-fade-in">
                    <h2 className="font-display text-xl font-semibold mb-6">Оплата предоплаты</h2>
                    
                    <div className="bg-secondary/50 rounded-xl p-4 mb-6">
                      <div className="flex items-center gap-3 mb-3">
                        <ShieldCheck className="h-5 w-5 text-green-500" />
                        <span className="font-semibold">Безопасная оплата</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Ваши деньги хранятся на сервисе до выполнения заказа. 
                        Если исполнитель не придёт — мы вернём предоплату.
                      </p>
                    </div>

                    <div className="space-y-4 mb-6">
                      <div className="flex justify-between py-3 border-b border-border">
                        <span className="text-muted-foreground">Стоимость визита</span>
                        <span className="font-semibold">{totalAmount.toLocaleString()} сом</span>
                      </div>
                      <div className="flex justify-between py-3 border-b border-border">
                        <span className="text-muted-foreground">Предоплата (30%)</span>
                        <span className="font-bold text-lg text-accent">{prepaymentAmount.toLocaleString()} сом</span>
                      </div>
                      <div className="flex justify-between py-3">
                        <span className="text-muted-foreground">Оплата исполнителю при встрече</span>
                        <span>{(totalAmount - prepaymentAmount).toLocaleString()} сом</span>
                      </div>
                    </div>

                    {/* Mock payment form */}
                    <div className="bg-muted/50 rounded-xl p-6 mb-6 text-center">
                      <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground mb-4">
                        Здесь будет форма оплаты
                      </p>
                      <p className="text-xs text-muted-foreground">
                        (Для демо-версии нажмите «Оплатить» для симуляции успешной оплаты)
                      </p>
                    </div>

                    <div className="flex gap-4">
                      <Button variant="outline" onClick={() => setStep(2)}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Назад
                      </Button>
                      <Button variant="hero" className="flex-1" onClick={handleSubmit}>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Оплатить {prepaymentAmount.toLocaleString()} сом
                      </Button>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="bg-card rounded-2xl p-8 border border-border animate-fade-in text-center">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="h-10 w-10 text-green-500" />
                    </div>
                    <h2 className="font-display text-2xl font-bold mb-2">Заказ успешно создан!</h2>
                    <p className="text-muted-foreground mb-6">
                      Исполнитель получил ваш заказ и скоро подтвердит его. 
                      Мы отправим вам уведомление.
                    </p>
                    
                    <div className="bg-secondary/50 rounded-xl p-4 mb-6 text-left">
                      <h3 className="font-semibold mb-3">Детали заказа</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Исполнитель:</span>
                          <span>{performer.displayName}</span>
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
                          <span className="text-muted-foreground">Адрес:</span>
                          <span>{formData.address}</span>
                        </div>
                        <div className="flex justify-between font-semibold">
                          <span>Предоплата внесена:</span>
                          <span className="text-accent">{prepaymentAmount.toLocaleString()} сом</span>
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
                        <Link to="/">
                          На главную
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
                      src={performer.photoUrls[0]}
                      alt={performer.displayName}
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                    <div>
                      <p className="font-semibold text-sm">{performer.displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        {performer.type.map(t => t === 'ded_moroz' ? 'Дед Мороз' : t === 'snegurochka' ? 'Снегурочка' : t === 'santa' ? 'Санта' : 'Дуэт').join(', ')}
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
                      <span className="font-bold">{totalAmount.toLocaleString()} сом</span>
                    </div>
                    <div className="flex justify-between text-accent">
                      <span>Предоплата:</span>
                      <span className="font-bold">{prepaymentAmount.toLocaleString()} сом</span>
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
