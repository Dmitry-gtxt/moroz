import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Sparkles, Users, Calendar, Wallet, CheckCircle, ArrowRight } from 'lucide-react';

const Students = () => {
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
                  title: 'Верификация по видеосвязи',
                  description: 'Обязательный короткий онлайн-звонок:',
                  list: ['подтверждаем личность', 'оцениваем внешний вид костюма', 'проверяем речь, артистичность и готовность исполнять роль']
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

          {/* CTA */}
          <section>
            <div className="bg-gradient-to-r from-magic-purple/20 to-magic-cyan/20 rounded-xl p-8 border border-magic-gold/20 text-center">
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                Как подать заявку?
              </h2>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                Зарегистрируйся на сайте, добавь свои данные, фото в костюме – и пройди короткую видео-валидацию.
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
