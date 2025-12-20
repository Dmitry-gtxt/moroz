import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { SEOHead } from '@/components/seo/SEOHead';
import { HorizontalScroll } from '@/components/ui/horizontal-scroll';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Users,
  Calendar,
  Wallet,
  HeadphonesIcon,
  Star,
  MessageSquare,
  BarChart3,
  Bell,
  Shield,
  Sparkles,
  ArrowRight,
  Gift,
  TrendingUp,
  Award,
  Smartphone,
} from 'lucide-react';
import { getCommissionRate } from '@/lib/pricing';

const benefits = [
  {
    icon: Users,
    title: 'Готовый поток клиентов',
    description: 'Мы приводим заказчиков — вам остаётся только дарить праздник. Никаких расходов на рекламу.',
  },
  {
    icon: Calendar,
    title: 'Гибкий график',
    description: 'Сами выбираете дни и часы работы. Ставите слоты в календаре — получаете заказы только на удобное время.',
  },
  {
    icon: Wallet,
    title: 'Гибкие цены по времени',
    description: 'Днём — дешевле, вечером — дороже, а 31 декабря в ночь — за премиум. Вы сами устанавливаете цены на каждый слот.',
  },
  {
    icon: HeadphonesIcon,
    title: 'Поддержка 24/7',
    description: 'Личный менеджер на связи. Поможем с любым вопросом — от костюма до сложного клиента.',
  },
];

const howItWorks = [
  {
    step: 1,
    title: 'Регистрация',
    description: 'Заполните анкету за 5 минут: фото, опыт, районы работы. Загрузите документы для верификации.',
  },
  {
    step: 2,
    title: 'Верификация',
    description: 'Модератор проверит анкету в течение 1 часа. После одобрения — доступ к заказам.',
  },
  {
    step: 3,
    title: 'Настройка расписания',
    description: 'Укажите в календаре свободные слоты и цену. Система сама предложит вас подходящим клиентам.',
  },
  {
    step: 4,
    title: 'Получение заявок',
    description: 'Клиенты бронируют ваши слоты. Вы видите все детали: адрес, количество детей, пожелания.',
  },
  {
    step: 5,
    title: 'Выступление',
    description: 'Приезжаете по адресу и дарите волшебство! Все контакты и детали — в приложении.',
  },
  {
    step: 6,
    title: 'Оплата',
    description: 'Клиент оплачивает вам напрямую — наличными или переводом на карту до или после выступления.',
  },
];

const platformFeatures = [
  { icon: Calendar, title: 'Удобный календарь', description: 'Управляйте расписанием в пару кликов' },
  { icon: MessageSquare, title: 'Чат с клиентами', description: 'Уточняйте детали прямо в приложении' },
  { icon: Star, title: 'Рейтинг и отзывы', description: 'Набирайте звёзды — получайте больше заказов' },
  { icon: BarChart3, title: 'Статистика заработка', description: 'Отслеживайте доходы и аналитику' },
  { icon: Bell, title: 'Push и SMS уведомления', description: 'Мгновенно узнавайте о новых заявках' },
];

const faqItems = [
  {
    id: 'commission',
    question: 'Какая комиссия платформы?',
    answer: '', // Will be filled dynamically
  },
  {
    id: 'costume',
    question: 'Нужен ли свой костюм?',
    answer: 'Да, для работы необходим качественный костюм. Если у вас его нет — мы подскажем проверенных поставщиков с хорошими ценами.',
  },
  {
    id: 'orders',
    question: 'Как быстро начнут приходить заказы?',
    answer: 'Первые заявки обычно поступают в течение 1-3 дней после верификации, особенно в сезон (декабрь). Чем лучше заполнен профиль и выше рейтинг — тем больше заказов.',
  },
  {
    id: 'districts',
    question: 'Можно ли работать в нескольких районах?',
    answer: 'Да, вы сами выбираете районы выезда. Можно указать хоть все районы города — система покажет вас клиентам в каждом из них.',
  },
  {
    id: 'cancellation',
    question: 'Что если клиент отменит заказ?',
    answer: 'Мы заботимся о том, чтобы заказы состоялись: обзваниваем клиентов накануне и в день визита для подтверждения. Это снижает процент отмен до минимума.',
  },
  {
    id: 'payment',
    question: 'Как происходит оплата?',
    answer: 'Клиент платит вам напрямую — наличными или переводом на карту до или после выступления. Вы получаете деньги сразу, без задержек.',
  },
];

const stats = [
  { value: '50+', label: 'Исполнителей' },
  { value: '500+', label: 'Выполненных заказов' },
  { value: '4.9', label: 'Средний рейтинг' },
  { value: '8-10', label: 'Заказов в день (пик)' },
];

interface TestimonialCardProps {
  text: string;
  name: string;
  role: string;
  variant: 'primary' | 'gold';
}

function TestimonialCard({ text, name, role, variant }: TestimonialCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const gradientClass = variant === 'primary' 
    ? 'from-card via-card to-primary/5 hover:border-primary/30' 
    : 'from-card via-card to-magic-gold/5 hover:border-magic-gold/30';
  
  const glowClass = variant === 'primary' 
    ? 'bg-magic-gold/10' 
    : 'bg-primary/10';

  return (
    <div className={`bg-gradient-to-br ${gradientClass} rounded-xl p-6 border border-border transition-colors shadow-lg relative overflow-hidden flex flex-col`}>
      <div className={`absolute -top-10 -right-10 w-32 h-32 ${glowClass} rounded-full blur-2xl`} />
      <div className="relative flex flex-col flex-1">
        <div className="flex items-center gap-1 mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star key={star} className="w-5 h-5 fill-magic-gold text-magic-gold drop-shadow-sm" />
          ))}
        </div>
        <div className="mb-4">
          <p className={`text-foreground italic text-sm sm:text-base ${!isExpanded ? 'line-clamp-3' : ''}`}>
            "{text}"
          </p>
          {!isExpanded && text.length > 100 && (
            <button 
              onClick={() => setIsExpanded(true)}
              className="text-primary hover:text-primary/80 text-sm font-medium mt-2 hover:underline min-h-[44px] inline-flex items-center"
            >
              Подробнее
            </button>
          )}
          {isExpanded && (
            <button 
              onClick={() => setIsExpanded(false)}
              className="text-primary hover:text-primary/80 text-sm font-medium mt-2 hover:underline min-h-[44px] inline-flex items-center"
            >
              Свернуть
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 mt-auto pt-2">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center shadow-md">
            <Award className="w-6 h-6 text-primary" />
          </div>
          <div>
            <div className="font-semibold text-foreground">{name}</div>
            <div className="text-sm text-muted-foreground">{role}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PerformerLanding() {
  const [commissionRate, setCommissionRate] = useState<number>(20);

  useEffect(() => {
    getCommissionRate().then(setCommissionRate);
  }, []);

  // Dynamic FAQ with commission rate
  const dynamicFaqItems = faqItems.map(item => {
    if (item.id === 'commission') {
      return {
        ...item,
        answer: `Комиссия составляет ${commissionRate}% и её оплачивает заказчик. Вы видите цену с комиссией и устанавливаете сумму, которая устроит именно вас «на руки».`,
      };
    }
    return item;
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title="Стань Дедом Морозом — Зарабатывай на праздниках | Дед-Морозы.РФ"
        description="Присоединяйся к команде исполнителей и зарабатывай до 200 000 ₽ за новогодний сезон. Готовый поток клиентов, гибкий график, быстрые выплаты."
        keywords="работа дедом морозом, заработок на новый год, стать дедом морозом, вакансия дед мороз"
      />
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-hero py-16 md:py-24 overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-2 h-2 bg-magic-gold rounded-full animate-twinkle" style={{ animationDelay: '0s' }} />
            <div className="absolute top-40 right-20 w-3 h-3 bg-magic-gold rounded-full animate-twinkle" style={{ animationDelay: '0.5s' }} />
            <div className="absolute bottom-20 left-1/4 w-2 h-2 bg-frost rounded-full animate-twinkle" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-magic-cyan rounded-full animate-twinkle" style={{ animationDelay: '1.5s' }} />
          </div>

          <div className="container relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-magic-gold/10 border border-magic-gold/30 mb-6 animate-fade-in">
                <Sparkles className="w-4 h-4 text-magic-gold" />
                <span className="text-sm text-magic-gold font-medium">Набор исполнителей на сезон 2025/2026</span>
              </div>

              <h1 className="font-display text-3xl sm:text-4xl md:text-6xl font-bold text-primary-foreground mb-6 animate-fade-in px-2" style={{ animationDelay: '0.1s' }}>
                Стань Дедом Морозом —<br />
                <span className="text-magic-gold">зарабатывай на праздниках</span>
              </h1>

              <p className="text-lg sm:text-xl md:text-2xl text-primary-foreground/80 mb-8 animate-fade-in px-2" style={{ animationDelay: '0.2s' }}>
                Готовый поток клиентов. Гибкий график. До{' '}
                <span className="text-magic-gold font-bold">200 000 ₽</span> за сезон.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center animate-fade-in px-4" style={{ animationDelay: '0.3s' }}>
                <Button asChild size="lg" className="gap-2 text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 shadow-glow min-h-[48px]">
                  <Link to="/become-performer">
                    <Gift className="w-5 h-5" />
                    Начать зарабатывать
                  </Link>
                </Button>
                <Button asChild variant="secondary" size="lg" className="gap-2 text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 bg-white/10 text-white border border-white/20 hover:bg-white/20 min-h-[48px]">
                  <a href="#how-it-works">
                    Как это работает
                    <ArrowRight className="w-5 h-5" />
                  </a>
                </Button>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap justify-center gap-6 mt-12 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                {stats.map((stat, i) => (
                  <div key={i} className="text-center">
                    <div className="text-2xl md:text-3xl font-bold text-magic-gold">{stat.value}</div>
                    <div className="text-sm text-primary-foreground/60">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 md:py-24 bg-background relative overflow-hidden">
          {/* Background decorations */}
          <div className="absolute top-20 left-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-0 w-96 h-96 bg-magic-gold/5 rounded-full blur-3xl" />
          
          <div className="container relative">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-sm text-primary font-medium">Надёжный сервис</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4 px-2">
                Почему исполнители выбирают нас
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
                Мы создали платформу, которая делает работу Дедом Морозом простой, выгодной и приятной
              </p>
            </div>

            <HorizontalScroll>
              {benefits.map((benefit, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-72 md:w-auto md:flex-1 md:min-w-[240px] md:max-w-[280px] snap-start bg-gradient-to-b from-card to-card/50 rounded-xl p-6 border border-border hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                    <benefit.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </HorizontalScroll>
          </div>
        </section>

        {/* Earnings Section */}
        <section className="py-16 md:py-24 bg-muted/50">
          <div className="container">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Сколько можно заработать
                </h2>
                <p className="text-lg text-muted-foreground">
                  Реальные цифры от наших исполнителей
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 rounded-xl p-6 border border-emerald-500/20 text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl" />
                  <div className="relative">
                    <div className="flex items-baseline justify-center gap-1 mb-1">
                      <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">от</span>
                      <span className="text-4xl font-bold text-foreground">3 000 ₽</span>
                    </div>
                    <div className="text-muted-foreground">за один выезд</div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-xl p-6 border border-blue-500/20 text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full blur-2xl" />
                  <div className="relative">
                    <div className="text-4xl font-bold text-foreground mb-2">8-10 заказов</div>
                    <div className="text-muted-foreground">в день (пик сезона)</div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-primary to-primary/80 rounded-xl p-6 text-center relative overflow-hidden shadow-lg">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                  <div className="relative">
                    <div className="text-4xl font-bold text-primary-foreground mb-2">до 200 000 ₽</div>
                    <div className="text-primary-foreground/80">за декабрь</div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-magic-gold/10 via-magic-gold/5 to-transparent rounded-xl p-6 border border-magic-gold/20 relative overflow-hidden">
                <div className="absolute -right-10 -top-10 w-32 h-32 bg-magic-gold/10 rounded-full blur-3xl" />
                <div className="flex items-start gap-4 relative">
                  <div className="w-12 h-12 rounded-full bg-magic-gold/20 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <TrendingUp className="w-6 h-6 text-magic-gold" />
                  </div>
                  <div>
                    <h4 className="font-heading font-semibold text-lg text-foreground mb-2">Комиссию сервиса оплачивает заказчик</h4>
                    <p className="text-muted-foreground">
                      Вы видите цену с комиссией платформы и устанавливаете цену, которая устроит именно вас «на руки».
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-16 md:py-24 bg-background scroll-mt-20">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4 px-2">
                Как начать работать
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
                От регистрации до первого заказа — простой путь в 6 шагов
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {howItWorks.map((item, i) => (
                  <div
                    key={i}
                    className="bg-card rounded-xl p-6 border border-border relative overflow-hidden group hover:border-primary/30 transition-colors"
                  >
                    <div className="absolute top-4 right-4 text-6xl font-bold text-muted/20 group-hover:text-primary/10 transition-colors">
                      {item.step}
                    </div>
                    <div className="relative z-10">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm mb-4">
                        {item.step}
                      </div>
                      <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
                        {item.title}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Platform Features */}
        <section className="py-16 md:py-24 bg-muted/50">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4 px-2">
                Всё для удобной работы
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
                Личный кабинет с полным набором инструментов
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <HorizontalScroll>
                {platformFeatures.map((feature, i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 w-40 md:w-auto md:flex-1 md:min-w-[140px] md:max-w-[180px] snap-start bg-card rounded-xl p-4 border border-border text-center hover:border-primary/30 hover:shadow-md transition-all"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <feature.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h4 className="font-heading font-medium text-sm text-foreground mb-1">
                      {feature.title}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </HorizontalScroll>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="py-16 md:py-24 bg-background relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYtMi42ODYgNi02cy0yLjY4Ni02LTYtNi02IDIuNjg2LTYgNiAyLjY4NiA2IDYgNnoiIHN0cm9rZT0icmdiYSgxMDAsMTAwLDEwMCwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9nPjwvc3ZnPg==')] opacity-50" />
          <div className="container relative">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-magic-gold/10 border border-magic-gold/20 mb-4">
                  <Star className="w-4 h-4 text-magic-gold fill-magic-gold" />
                  <span className="text-sm text-magic-gold font-medium">Проверенный сервис</span>
                </div>
                <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Нам доверяют
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TestimonialCard
                  text="Работаю второй сезон. Заказов много, поддержка всегда на связи. В декабре заработал 180 000 ₽ — это лучший результат за все годы."
                  name="Алексей"
                  role="Дед Мороз, 5 лет опыта"
                  variant="primary"
                />

                <TestimonialCard
                  text="Удобное приложение, понятный интерфейс. Вижу все заказы, могу выбирать удобные районы. Главное — стабильный поток клиентов без моих усилий."
                  name="Михаил"
                  role="Дед Мороз, 3 года опыта"
                  variant="gold"
                />
              </div>

              {/* Trust indicators */}
              <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card/50 rounded-lg p-4 text-center border border-border">
                  <div className="text-2xl font-bold text-primary mb-1">50+</div>
                  <div className="text-xs text-muted-foreground">Исполнителей в сети</div>
                </div>
                <div className="bg-card/50 rounded-lg p-4 text-center border border-border">
                  <div className="text-2xl font-bold text-primary mb-1">24/7</div>
                  <div className="text-xs text-muted-foreground">Поддержка</div>
                </div>
                <div className="bg-card/50 rounded-lg p-4 text-center border border-border">
                  <div className="text-2xl font-bold text-primary mb-1">500+</div>
                  <div className="text-xs text-muted-foreground">Выполненных заказов</div>
                </div>
                <div className="bg-card/50 rounded-lg p-4 text-center border border-border">
                  <div className="text-2xl font-bold text-magic-gold mb-1">4.9★</div>
                  <div className="text-xs text-muted-foreground">Средний рейтинг</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 md:py-24 bg-muted/50">
          <div className="container">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Частые вопросы
                </h2>
              </div>

              <Accordion type="single" collapsible className="space-y-4">
                {dynamicFaqItems.map((item, i) => (
                  <AccordionItem
                    key={i}
                    value={`item-${i}`}
                    className="bg-card rounded-xl border border-border px-6 data-[state=open]:border-primary/30"
                  >
                    <AccordionTrigger className="text-left font-heading font-medium text-foreground hover:no-underline py-4 min-h-[48px] text-sm sm:text-base">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-4">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 md:py-24 bg-gradient-hero">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-primary-foreground mb-4 px-2">
                Готовы дарить праздник и зарабатывать?
              </h2>
              <p className="text-lg sm:text-xl text-primary-foreground/80 mb-8 px-2">
                Регистрация занимает 5 минут. Первые заказы — уже завтра.
              </p>
              <Button asChild size="lg" className="gap-2 text-base sm:text-lg px-6 sm:px-10 py-4 sm:py-6 shadow-glow min-h-[48px]">
                <Link to="/become-performer">
                  <Gift className="w-5 h-5" />
                  <span className="hidden sm:inline">Подать заявку на Дедушку Мороза</span>
                  <span className="sm:hidden">Подать заявку</span>
                </Link>
              </Button>
              <p className="text-primary-foreground/60 text-xs sm:text-sm mt-6 px-2">
                Бесплатная регистрация • Без обязательств • Начните зарабатывать сегодня
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
