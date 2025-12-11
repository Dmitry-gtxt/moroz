import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  Search, Calendar, CreditCard, Star, CheckCircle, 
  Shield, Clock, MessageCircle, Gift, Users, Sparkles, Snowflake
} from 'lucide-react';
import { getCommissionRate, getPrepaymentPercentage } from '@/lib/pricing';

import howItWorks1 from '@/assets/how-it-works-1.jpg';
import howItWorks2 from '@/assets/how-it-works-2.jpg';
import howItWorks3 from '@/assets/how-it-works-3.jpg';
import howItWorks4 from '@/assets/how-it-works-4.jpg';

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
  const [prepaymentPercent, setPrepaymentPercent] = useState(29); // Default fallback

  useEffect(() => {
    async function loadCommissionRate() {
      const rate = await getCommissionRate();
      setPrepaymentPercent(getPrepaymentPercentage(rate));
    }
    loadCommissionRate();
  }, []);

  const steps = [
    {
      icon: Search,
      title: 'Выберите исполнителя',
      description: 'Просмотрите каталог проверенных Дедов Морозов и Снегурочек. Используйте фильтры по району, цене и типу мероприятия.',
      tips: ['Смотрите видео-приветствия', 'Читайте отзывы клиентов', 'Сравнивайте цены и программы'],
      image: howItWorks1,
    },
    {
      icon: Calendar,
      title: 'Забронируйте дату',
      description: 'Выберите удобную дату и время в календаре исполнителя. Заполните форму с деталями мероприятия.',
      tips: ['Укажите количество детей', 'Напишите особые пожелания', 'Выберите формат визита'],
      image: howItWorks2,
    },
    {
      icon: CreditCard,
      title: 'Внесите предоплату',
      description: `Внесите ${prepaymentPercent}% предоплаты для подтверждения брони. Остаток оплатите исполнителю после визита.`,
      tips: ['Безопасная онлайн-оплата', 'Деньги хранятся на сервисе', 'Возврат при отмене исполнителем'],
      image: howItWorks3,
    },
    {
      icon: Star,
      title: 'Наслаждайтесь праздником',
      description: 'Встречайте Деда Мороза! После визита оставьте отзыв и помогите другим родителям с выбором.',
      tips: ['Подготовьте подарки заранее', 'Снимайте видео на память', 'Поделитесь впечатлениями'],
      image: howItWorks4,
    },
  ];
  return (
    <div className="min-h-screen flex flex-col bg-winter-950">
      <SEOHead 
        title="Как это работает"
        description="Узнайте как заказать Деда Мороза в Самаре за 4 простых шага. Выбор исполнителя, бронирование, оплата и праздник!"
        keywords="как заказать деда мороза самара, инструкция, бронирование деда мороза"
      />
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative py-20 md:py-28 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-winter-900 via-winter-950 to-winter-950" />
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-10 left-1/4 w-96 h-96 bg-magic-purple/20 rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-magic-cyan/15 rounded-full blur-3xl" />
            {[...Array(10)].map((_, i) => (
              <Snowflake
                key={i}
                className="absolute text-magic-gold/10 animate-float-slow"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  width: `${20 + Math.random() * 30}px`,
                  height: `${20 + Math.random() * 30}px`,
                  animationDelay: `${Math.random() * 5}s`,
                }}
              />
            ))}
          </div>
          
          <div className="container relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-magic-gold/10 border border-magic-gold/20 mb-6">
              <Sparkles className="w-4 h-4 text-magic-gold animate-pulse" />
              <span className="text-sm font-medium text-magic-gold">Простой процесс</span>
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-bold text-snow-100 mb-6">
              Как заказать <span className="text-gradient-gold">Деда Мороза?</span>
            </h1>
            <p className="text-lg md:text-xl text-snow-400 max-w-2xl mx-auto">
              Всего 4 простых шага от выбора до волшебного праздника для ваших детей
            </p>
          </div>
        </section>

        {/* Steps */}
        <section className="py-16 md:py-24 relative">
          <div className="container">
            <div className="space-y-20">
              {steps.map((step, index) => (
                <div 
                  key={index}
                  className={`flex flex-col ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-8 md:gap-16 items-center`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 rounded-2xl bg-magic-gold/10 border border-magic-gold/20 flex items-center justify-center">
                        <step.icon className="h-8 w-8 text-magic-gold" />
                      </div>
                      <span className="text-7xl font-display font-bold text-gradient-gold opacity-30">
                        {index + 1}
                      </span>
                    </div>
                    <h2 className="font-display text-2xl md:text-3xl font-bold text-snow-100 mb-4">
                      {step.title}
                    </h2>
                    <p className="text-snow-400 text-lg mb-6 leading-relaxed">
                      {step.description}
                    </p>
                    <ul className="space-y-3">
                      {step.tips.map((tip, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm text-snow-300">
                          <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                            <CheckCircle className="h-3 w-3 text-green-400" />
                          </div>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex-1 w-full">
                    <div className="rounded-3xl overflow-hidden shadow-xl border border-magic-gold/10">
                      <img 
                        src={step.image} 
                        alt={step.title}
                        className="w-full h-auto aspect-[4/3] object-cover"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-winter-900/50 to-winter-950" />
          <div className="container relative z-10">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-center text-snow-100 mb-12">
              Почему выбирают <span className="text-gradient-gold">нас?</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="glass-card rounded-2xl p-6 border border-magic-gold/10 hover:border-magic-gold/30 transition-colors">
                  <div className="w-14 h-14 rounded-xl bg-magic-gold/10 border border-magic-gold/20 flex items-center justify-center mb-4">
                    <benefit.icon className="h-7 w-7 text-magic-gold" />
                  </div>
                  <h3 className="font-semibold text-lg text-snow-100 mb-2">{benefit.title}</h3>
                  <p className="text-snow-400 text-sm">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 md:py-24">
          <div className="container max-w-3xl">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-center text-snow-100 mb-12">
              Частые <span className="text-gradient-gold">вопросы</span>
            </h2>
            <div className="space-y-4">
              {faq.map((item, index) => (
                <div key={index} className="glass-card rounded-xl p-6 border border-snow-700/20 hover:border-magic-gold/20 transition-colors">
                  <h3 className="font-semibold text-snow-100 mb-2">{item.question}</h3>
                  <p className="text-snow-400 text-sm">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-winter-900 to-winter-950" />
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-magic-purple/20 rounded-full blur-3xl" />
          </div>
          
          <div className="container relative z-10 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-magic-gold/10 border border-magic-gold/20 mb-6">
              <Users className="h-10 w-10 text-magic-gold" />
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-snow-100 mb-4">
              Готовы создать <span className="text-gradient-gold">волшебство?</span>
            </h2>
            <p className="text-snow-400 mb-8 max-w-xl mx-auto text-lg">
              Выберите исполнителя и подарите детям незабываемый праздник!
            </p>
            <Link 
              to="/catalog"
              className="inline-flex items-center gap-2 h-14 px-10 rounded-xl bg-gradient-to-r from-magic-gold via-amber-400 to-magic-gold text-winter-950 font-bold text-lg shadow-lg shadow-magic-gold/30 hover:shadow-xl hover:shadow-magic-gold/40 transition-all duration-300"
            >
              <Sparkles className="h-5 w-5" />
              Выбрать Деда Мороза
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
