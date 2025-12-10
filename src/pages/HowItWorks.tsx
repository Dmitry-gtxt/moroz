import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  Search, Calendar, CreditCard, Star, CheckCircle, 
  Shield, Clock, MessageCircle, Gift, Users
} from 'lucide-react';

const steps = [
  {
    icon: Search,
    title: 'Выберите исполнителя',
    description: 'Просмотрите каталог проверенных Дедов Морозов и Снегурочек. Используйте фильтры по району, цене и типу мероприятия.',
    tips: ['Смотрите видео-приветствия', 'Читайте отзывы клиентов', 'Сравнивайте цены и программы'],
  },
  {
    icon: Calendar,
    title: 'Забронируйте дату',
    description: 'Выберите удобную дату и время в календаре исполнителя. Заполните форму с деталями мероприятия.',
    tips: ['Укажите количество детей', 'Напишите особые пожелания', 'Выберите формат визита'],
  },
  {
    icon: CreditCard,
    title: 'Внесите предоплату',
    description: 'Внесите 30% предоплаты для подтверждения брони. Остаток оплатите исполнителю после визита.',
    tips: ['Безопасная онлайн-оплата', 'Деньги хранятся на сервисе', 'Возврат при отмене исполнителем'],
  },
  {
    icon: Star,
    title: 'Наслаждайтесь праздником',
    description: 'Встречайте Деда Мороза! После визита оставьте отзыв и помогите другим родителям с выбором.',
    tips: ['Подготовьте подарки заранее', 'Снимайте видео на память', 'Поделитесь впечатлениями'],
  },
];

const benefits = [
  {
    icon: Shield,
    title: 'Проверенные исполнители',
    description: 'Все артисты проходят верификацию документов и проверку качества программы.',
  },
  {
    icon: Clock,
    title: 'Экономия времени',
    description: 'Не нужно искать по объявлениям — все лучшие исполнители в одном месте.',
  },
  {
    icon: MessageCircle,
    title: 'Связь с исполнителем',
    description: 'Обсудите детали напрямую через чат на платформе.',
  },
  {
    icon: Gift,
    title: 'Гарантия праздника',
    description: 'Если исполнитель не придёт — вернём предоплату и найдём замену.',
  },
];

const faq = [
  {
    question: 'Как отменить бронирование?',
    answer: 'Отмена возможна за 24 часа до визита с полным возвратом предоплаты. При отмене менее чем за 24 часа возврат 50%.',
  },
  {
    question: 'Что входит в программу визита?',
    answer: 'Стандартная программа: приветствие, игры, загадки, хоровод, вручение подарков. Длительность 20-30 минут. Детали уточняйте у исполнителя.',
  },
  {
    question: 'Можно ли заказать программу на улице?',
    answer: 'Да, многие исполнители работают на улице. Используйте фильтр "На улице" в каталоге.',
  },
  {
    question: 'Как подготовить ребёнка к визиту?',
    answer: 'Расскажите о Дедушке Морозе заранее. Подготовьте стишок или песню. Положите подарки в мешок заранее.',
  },
  {
    question: 'Что делать если исполнитель опаздывает?',
    answer: 'Свяжитесь с исполнителем через чат. Если он не выходит на связь — напишите в поддержку, мы поможем.',
  },
];

export default function HowItWorks() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead 
        title="Как это работает"
        description="Узнайте как заказать Деда Мороза в Самаре за 4 простых шага. Выбор исполнителя, бронирование, оплата и праздник!"
        keywords="как заказать деда мороза самара, инструкция, бронирование деда мороза"
      />
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-hero text-white py-16 md:py-24">
          <div className="container text-center">
            <h1 className="font-display text-3xl md:text-5xl font-bold mb-6">
              Как заказать Деда Мороза?
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
              Всего 4 простых шага от выбора до волшебного праздника для ваших детей
            </p>
          </div>
        </section>

        {/* Steps */}
        <section className="py-16 md:py-24">
          <div className="container">
            <div className="space-y-16">
              {steps.map((step, index) => (
                <div 
                  key={index}
                  className={`flex flex-col ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-8 md:gap-16 items-center`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center">
                        <step.icon className="h-7 w-7 text-accent" />
                      </div>
                      <span className="text-6xl font-display font-bold text-muted/20">
                        {index + 1}
                      </span>
                    </div>
                    <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">
                      {step.title}
                    </h2>
                    <p className="text-muted-foreground text-lg mb-6">
                      {step.description}
                    </p>
                    <ul className="space-y-2">
                      {step.tips.map((tip, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex-1 w-full">
                    <div className="bg-gradient-frost rounded-3xl p-8 md:p-12 aspect-video flex items-center justify-center">
                      <step.icon className="h-24 w-24 text-accent/30" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 bg-secondary/50">
          <div className="container">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-12">
              Почему выбирают нас?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="bg-card rounded-2xl p-6 border border-border">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                    <benefit.icon className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground text-sm">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 md:py-24">
          <div className="container max-w-3xl">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-12">
              Частые вопросы
            </h2>
            <div className="space-y-4">
              {faq.map((item, index) => (
                <div key={index} className="bg-card rounded-xl p-6 border border-border">
                  <h3 className="font-semibold mb-2">{item.question}</h3>
                  <p className="text-muted-foreground text-sm">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-gradient-hero text-white">
          <div className="container text-center">
            <Users className="h-16 w-16 mx-auto mb-6 text-accent" />
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">
              Готовы создать волшебство?
            </h2>
            <p className="text-white/80 mb-8 max-w-xl mx-auto">
              Выберите исполнителя и подарите детям незабываемый праздник!
            </p>
            <Button variant="gold" size="lg" asChild>
              <Link to="/catalog">Выбрать Деда Мороза</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
