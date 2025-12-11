import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Sparkles, Users, Calendar, Wallet, CheckCircle, ArrowRight, Calculator, HelpCircle } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const Students = () => {
  const [ordersPerDay, setOrdersPerDay] = useState(3);
  const [workDays, setWorkDays] = useState(15);
  const [avgPrice, setAvgPrice] = useState(5000);

  const totalOrders = ordersPerDay * workDays;
  const totalEarnings = totalOrders * avgPrice;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead 
        title="Подработка для студентов — Дед-Морозы.РФ"
        description="Стань Дедом Морозом или Снегурочкой и заработай до 200 000 рублей за новогодний период. Гибкий график, творческая работа."
      />
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-magic-purple/10 to-transparent" />
          <div className="container relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-magic-gold/10 border border-magic-gold/20 mb-6">
                <Sparkles className="w-4 h-4 text-magic-gold" />
                <span className="text-sm text-magic-gold font-medium">Для студентов</span>
              </div>
              <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-6">
                Подработка на Новый год: стань <span className="text-gradient-gold">Дедом Морозом</span> или <span className="text-gradient-magic">Снегурочкой</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Заработай до <span className="text-magic-gold font-bold">200 000 рублей</span> за праздничный период!
              </p>
              <Button asChild size="lg" className="gap-2">
                <Link to="/performer-registration">
                  Подать заявку
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <div className="container pb-16 max-w-4xl">
          {/* Intro */}
          <section className="mb-12">
            <div className="bg-card rounded-xl p-8 border border-border">
              <p className="text-lg text-muted-foreground leading-relaxed">
                Новогодние праздники – лучшее время, чтобы совместить творчество, праздничное настроение 
                и достойный заработок. Мы приглашаем студентов принять участие в проекте поздравлений 
                семей и детей в роли Деда Мороза и Снегурочки.
              </p>
              <p className="text-lg text-foreground font-medium mt-4">
                Если ты энергичный, артистичный, любишь детей и хочешь заработать за праздничный период 
                до 200 000 рублей – присоединяйся!
              </p>
            </div>
          </section>

          {/* Калькулятор заработка */}
          <section className="mb-12">
            <h2 className="font-display text-2xl font-semibold text-foreground mb-6 flex items-center gap-3">
              <Calculator className="w-6 h-6 text-magic-gold" />
              Калькулятор заработка
            </h2>
            <div className="bg-gradient-to-br from-magic-purple/10 to-magic-cyan/10 rounded-xl p-8 border border-magic-gold/20">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                <div>
                  <label className="block text-sm text-muted-foreground mb-3">
                    Заказов в день: <span className="text-magic-gold font-bold">{ordersPerDay}</span>
                  </label>
                  <Slider
                    value={[ordersPerDay]}
                    onValueChange={(v) => setOrdersPerDay(v[0])}
                    min={1}
                    max={6}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>1</span>
                    <span>6</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-3">
                    Рабочих дней: <span className="text-magic-gold font-bold">{workDays}</span>
                  </label>
                  <Slider
                    value={[workDays]}
                    onValueChange={(v) => setWorkDays(v[0])}
                    min={5}
                    max={30}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>5</span>
                    <span>30</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-3">
                    Средняя цена заказа: <span className="text-magic-gold font-bold">{avgPrice.toLocaleString()} ₽</span>
                  </label>
                  <Slider
                    value={[avgPrice]}
                    onValueChange={(v) => setAvgPrice(v[0])}
                    min={3000}
                    max={10000}
                    step={500}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>3 000 ₽</span>
                    <span>10 000 ₽</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-card/50 rounded-lg p-6 text-center">
                <p className="text-muted-foreground mb-2">
                  Всего заказов: <span className="font-semibold text-foreground">{totalOrders}</span>
                </p>
                <p className="text-3xl font-bold text-gradient-gold">
                  {totalEarnings.toLocaleString()} ₽
                </p>
                <p className="text-sm text-muted-foreground mt-1">потенциальный заработок</p>
              </div>
            </div>
          </section>

          {/* Кого мы ищем */}
          <section className="mb-12">
            <h2 className="font-display text-2xl font-semibold text-foreground mb-6 flex items-center gap-3">
              <Users className="w-6 h-6 text-magic-gold" />
              Кого мы ищем?
            </h2>
            <div className="bg-card rounded-xl p-8 border border-border">
              <p className="text-muted-foreground mb-6">
                Студентов и молодых людей, которые готовы примерить на себя образ Деда Мороза 
                или Снегурочки на новогодние праздники.
              </p>
              <p className="text-foreground font-medium mb-4">Работа подходит тем, кто:</p>
              <ul className="space-y-3">
                {[
                  'умеет общаться с детьми и создавать атмосферу праздника',
                  'обладает минимальными театральными или актёрскими навыками',
                  'готов заранее подготовить короткий сценарий поздравления для детей разных возрастов (3–5, 6–9, 10–12 лет)',
                  'имеет собственный костюм Деда Мороза или Снегурочки (костюм – обязательное условие)',
                  'способен чётко соблюдать время визитов и корректно вести себя в семьях'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-muted-foreground">
                    <CheckCircle className="w-5 h-5 text-magic-cyan mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Как проходит работа */}
          <section className="mb-12">
            <h2 className="font-display text-2xl font-semibold text-foreground mb-6 flex items-center gap-3">
              <Calendar className="w-6 h-6 text-magic-gold" />
              Как проходит работа?
            </h2>
            <div className="space-y-4">
              {[
                {
                  step: 1,
                  title: 'Регистрация на нашем сайте',
                  description: 'Желающие подработать заполняют анкету, прикрепляют фото в рабочем костюме и указывают информацию о себе:',
                  list: ['возраст', 'опыт выступлений', 'наличие костюма', 'желаемый график', 'районы, где готовы работать']
                },
                {
                  step: 2,
                  title: 'Верификация по телефону',
                  description: 'Обязательный короткий звонок от менеджера:',
                  list: ['подтверждаем личность', 'уточняем информацию о костюме', 'проверяем готовность исполнять роль']
                },
                {
                  step: 3,
                  title: 'Получение заказов',
                  description: 'После верификации вы получаете доступ к заказам на поздравления. Вы сами выбираете удобные даты и время выхода.'
                },
                {
                  step: 4,
                  title: 'Оплата',
                  description: 'Вы получаете оплату за каждое поздравление. В декабре студенты активно закрывают по 20–40 заказов, что позволяет заработать до 200 000 рублей за праздничный период.'
                }
              ].map((item) => (
                <div key={item.step} className="bg-card rounded-xl p-6 border border-border">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-magic-gold/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-magic-gold font-bold">{item.step}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                      <p className="text-muted-foreground">{item.description}</p>
                      {item.list && (
                        <ul className="mt-3 space-y-1">
                          {item.list.map((li, i) => (
                            <li key={i} className="text-muted-foreground flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-magic-cyan" />
                              {li}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Почему это отличная возможность */}
          <section className="mb-12">
            <h2 className="font-display text-2xl font-semibold text-foreground mb-6 flex items-center gap-3">
              <Wallet className="w-6 h-6 text-magic-gold" />
              Почему это отличная возможность?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                'Высокая оплата за короткие поздравления (15–30 минут каждое)',
                'Гибкий график — выбираешь сам',
                'Творческая работа и яркие эмоции',
                'Возможность получить опыт общения с детьми и сценического выступления',
                'Всё безопасно: каждая заявка проходит проверку, есть поддержка сервиса'
              ].map((item, i) => (
                <div key={i} className="bg-card rounded-xl p-5 border border-border flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-magic-gold mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section className="mb-12">
            <h2 className="font-display text-2xl font-semibold text-foreground mb-6 flex items-center gap-3">
              <HelpCircle className="w-6 h-6 text-magic-gold" />
              Частые вопросы
            </h2>
            <Accordion type="single" collapsible className="space-y-3">
              {[
                {
                  q: 'Нужен ли опыт работы?',
                  a: 'Нет, опыт не обязателен. Главное — желание дарить радость детям, артистичность и ответственность. Мы поможем с подготовкой сценария и дадим рекомендации по проведению поздравлений.'
                },
                {
                  q: 'Где взять костюм?',
                  a: 'Костюм — обязательное условие. Его можно купить (от 3 000 ₽), взять в аренду или сшить на заказ. Костюм должен выглядеть качественно и празднично.'
                },
                {
                  q: 'Как быстро я начну получать заказы?',
                  a: 'После успешной верификации по телефону ваш профиль появится в каталоге. В декабре спрос очень высокий, заказы начнут поступать в течение 1–3 дней.'
                },
                {
                  q: 'Можно ли работать в паре (Дед Мороз + Снегурочка)?',
                  a: 'Да! Вы можете зарегистрироваться как дуэт. Поздравления в паре стоят дороже, и многие семьи предпочитают именно такой формат.'
                },
                {
                  q: 'Как происходит оплата?',
                  a: 'Клиент вносит предоплату через наш сервис (это комиссия платформы). Остальную сумму вы получаете наличными от клиента сразу после поздравления.'
                },
                {
                  q: 'Могу ли я выбирать районы для работы?',
                  a: 'Да, при регистрации вы указываете районы, где готовы работать. Заказы будут приходить только из выбранных вами локаций.'
                },
                {
                  q: 'Что делать, если я заболел и не могу выйти на заказ?',
                  a: 'Свяжитесь с поддержкой как можно раньше. Мы поможем найти замену и перенести заказ. Главное — предупредить заранее.'
                },
                {
                  q: 'Безопасно ли это?',
                  a: 'Да. Все заявки от клиентов проходят проверку. У вас всегда есть связь с поддержкой сервиса. Мы заботимся о безопасности наших исполнителей.'
                }
              ].map((item, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="bg-card rounded-xl border border-border px-6">
                  <AccordionTrigger className="text-left text-foreground hover:no-underline">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          {/* CTA */}
          <section>
            <div className="bg-gradient-to-r from-magic-purple/20 to-magic-cyan/20 rounded-xl p-8 border border-magic-gold/20 text-center">
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                Как подать заявку?
              </h2>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                Зарегистрируйся на сайте, добавь свои данные, фото в костюме – и пройди короткую валидацию по телефону.
                После подтверждения ты сразу получишь доступ к заказам.
              </p>
              <Button asChild size="lg" className="gap-2">
                <Link to="/performer-registration">
                  Начать регистрацию
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Students;
