import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { SEOHead } from '@/components/seo/SEOHead';
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
  CheckCircle,
  Star,
  Clock,
  MessageSquare,
  BarChart3,
  Bell,
  Shield,
  Sparkles,
  ArrowRight,
  Gift,
  TrendingUp,
  Award,
} from 'lucide-react';

const benefits = [
  {
    icon: Users,
    title: 'Готовый поток клиентов',
    description: 'Мы приводим заказчиков — вам остаётся только дарить праздник. Никаких холодных звонков и поиска клиентов.',
  },
  {
    icon: Calendar,
    title: 'Гибкий график',
    description: 'Сами выбираете дни и часы работы. Ставите слоты в календаре — получаете заказы только на удобное время.',
  },
  {
    icon: Wallet,
    title: 'Быстрые выплаты',
    description: 'Деньги поступают на карту в течение 3 дней после выполнения заказа. Без задержек и скрытых комиссий.',
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
    description: 'Модератор проверит анкету в течение 24 часов. После одобрения — доступ к заказам.',
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
    description: 'После завершения заказа деньги автоматически поступают на вашу карту.',
  },
];

const platformFeatures = [
  { icon: Calendar, title: 'Удобный календарь', description: 'Управляйте расписанием в пару кликов' },
  { icon: MessageSquare, title: 'Чат с клиентами', description: 'Уточняйте детали прямо в приложении' },
  { icon: Star, title: 'Рейтинг и отзывы', description: 'Набирайте звёзды — получайте больше заказов' },
  { icon: BarChart3, title: 'Статистика заработка', description: 'Отслеживайте доходы и аналитику' },
  { icon: Bell, title: 'Push-уведомления', description: 'Мгновенно узнавайте о новых заявках' },
  { icon: Shield, title: 'Безопасные сделки', description: 'Предоплата от клиентов гарантирует оплату' },
];

const faqItems = [
  {
    question: 'Какая комиссия платформы?',
    answer: 'Комиссия составляет 15% от стоимости заказа. Это значительно ниже, чем у большинства агентств, и включает привлечение клиентов, обработку платежей и поддержку.',
  },
  {
    question: 'Нужен ли свой костюм?',
    answer: 'Да, для работы необходим качественный костюм. Если у вас его нет — мы подскажем проверенных поставщиков с хорошими ценами.',
  },
  {
    question: 'Как быстро начнут приходить заказы?',
    answer: 'Первые заявки обычно поступают в течение 1-3 дней после верификации, особенно в сезон (декабрь). Чем лучше заполнен профиль и выше рейтинг — тем больше заказов.',
  },
  {
    question: 'Можно ли работать в нескольких районах?',
    answer: 'Да, вы сами выбираете районы выезда. Можно указать хоть все районы города — система покажет вас клиентам в каждом из них.',
  },
  {
    question: 'Что если клиент отменит заказ?',
    answer: 'При отмене менее чем за 24 часа — вы получаете 50% от стоимости заказа как компенсацию. Мы защищаем интересы исполнителей.',
  },
  {
    question: 'Как происходит оплата?',
    answer: 'Клиент вносит предоплату при бронировании. После выполнения заказа деньги поступают на вашу карту в течение 3 рабочих дней.',
  },
];

const stats = [
  { value: '500+', label: 'Исполнителей' },
  { value: '10 000+', label: 'Выполненных заказов' },
  { value: '4.9', label: 'Средний рейтинг' },
  { value: '3 дня', label: 'Срок выплаты' },
];

export default function PerformerLanding() {
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
                <span className="text-sm text-magic-gold font-medium">Набор исполнителей на сезон 2024/2025</span>
              </div>

              <h1 className="font-display text-4xl md:text-6xl font-bold text-primary-foreground mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                Стань Дедом Морозом —<br />
                <span className="text-magic-gold">зарабатывай на праздниках</span>
              </h1>

              <p className="text-xl md:text-2xl text-primary-foreground/80 mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                Готовый поток клиентов. Гибкий график. До{' '}
                <span className="text-magic-gold font-bold">200 000 ₽</span> за сезон.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <Button asChild size="lg" className="gap-2 text-lg px-8 py-6 shadow-glow">
                  <Link to="/become-performer">
                    <Gift className="w-5 h-5" />
                    Начать зарабатывать
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="gap-2 text-lg px-8 py-6 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
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
        <section className="py-16 md:py-24 bg-background">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                Почему исполнители выбирают нас
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Мы создали платформу, которая делает работу Дедом Морозом простой, выгодной и приятной
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, i) => (
                <div
                  key={i}
                  className="bg-card rounded-xl p-6 border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300 group"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <benefit.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>
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
                <div className="bg-card rounded-xl p-6 border border-border text-center">
                  <div className="text-4xl font-bold text-foreground mb-2">3 000 – 7 000 ₽</div>
                  <div className="text-muted-foreground">за один выезд</div>
                </div>
                <div className="bg-card rounded-xl p-6 border border-border text-center">
                  <div className="text-4xl font-bold text-foreground mb-2">3-5 заказов</div>
                  <div className="text-muted-foreground">в день (пик сезона)</div>
                </div>
                <div className="bg-primary rounded-xl p-6 text-center">
                  <div className="text-4xl font-bold text-primary-foreground mb-2">до 200 000 ₽</div>
                  <div className="text-primary-foreground/80">за декабрь</div>
                </div>
              </div>

              <div className="bg-card rounded-xl p-6 border border-border">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-magic-gold/20 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-magic-gold" />
                  </div>
                  <div>
                    <h4 className="font-heading font-semibold text-foreground mb-1">Прозрачная комиссия — всего 15%</h4>
                    <p className="text-muted-foreground text-sm">
                      Никаких скрытых сборов. Вы видите полную стоимость заказа и свой заработок до принятия заявки.
                      Сравните с агентствами, которые забирают 30-50%.
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
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                Как начать работать
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
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
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                Всё для удобной работы
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Личный кабинет с полным набором инструментов
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {platformFeatures.map((feature, i) => (
                <div
                  key={i}
                  className="bg-card rounded-xl p-4 border border-border text-center hover:border-primary/30 hover:shadow-md transition-all"
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
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Нам доверяют
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-card rounded-xl p-6 border border-border">
                  <div className="flex items-center gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-5 h-5 fill-magic-gold text-magic-gold" />
                    ))}
                  </div>
                  <p className="text-foreground mb-4">
                    "Работаю второй сезон. Заказов много, платят вовремя, поддержка всегда на связи. 
                    В декабре заработал 180 000 ₽ — это лучший результат за все годы."
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Award className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">Алексей</div>
                      <div className="text-sm text-muted-foreground">Дед Мороз, 5 лет опыта</div>
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-xl p-6 border border-border">
                  <div className="flex items-center gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-5 h-5 fill-magic-gold text-magic-gold" />
                    ))}
                  </div>
                  <p className="text-foreground mb-4">
                    "Удобное приложение, понятный интерфейс. Вижу все заказы, могу выбирать удобные районы. 
                    Главное — стабильный поток клиентов без моих усилий."
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Award className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">Михаил</div>
                      <div className="text-sm text-muted-foreground">Дед Мороз, 3 года опыта</div>
                    </div>
                  </div>
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
                <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Частые вопросы
                </h2>
              </div>

              <Accordion type="single" collapsible className="space-y-4">
                {faqItems.map((item, i) => (
                  <AccordionItem
                    key={i}
                    value={`item-${i}`}
                    className="bg-card rounded-xl border border-border px-6 data-[state=open]:border-primary/30"
                  >
                    <AccordionTrigger className="text-left font-heading font-medium text-foreground hover:no-underline py-4">
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
              <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
                Готовы дарить праздник и зарабатывать?
              </h2>
              <p className="text-xl text-primary-foreground/80 mb-8">
                Регистрация занимает 5 минут. Первые заказы — уже завтра.
              </p>
              <Button asChild size="lg" className="gap-2 text-lg px-10 py-6 shadow-glow">
                <Link to="/become-performer">
                  <Gift className="w-5 h-5" />
                  Подать заявку
                </Link>
              </Button>
              <p className="text-primary-foreground/60 text-sm mt-6">
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
