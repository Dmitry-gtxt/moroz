import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SEOHead } from '@/components/seo/SEOHead';

export default function PerformerCode() {
  return (
    <>
      <SEOHead 
        title="Кодекс поведения исполнителя | Дед-Морозы.РФ"
        description="Правила и стандарты поведения для исполнителей сервиса Дед-Морозы.РФ"
      />
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-12">
          <div className="container max-w-4xl">
            <h1 className="font-display text-3xl font-bold text-foreground mb-8">
              Кодекс поведения исполнителя
            </h1>
            
            <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
              <p className="text-sm text-muted-foreground">
                Дата публикации: 1 декабря 2025 года
              </p>

              <p className="text-lg">
                Настоящий кодекс устанавливает стандарты поведения для всех исполнителей, 
                работающих через сервис «Дед-Морозы.РФ». Соблюдение этих правил обязательно 
                для всех артистов.
              </p>

              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
                  1. Профессионализм
                </h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Приходите на заказ вовремя или заранее</li>
                  <li>Костюм должен быть чистым, опрятным и полностью укомплектованным</li>
                  <li>Знайте сценарий и будьте готовы к импровизации</li>
                  <li>Говорите чётко, громко и с выражением</li>
                  <li>Поддерживайте образ на протяжении всего визита</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
                  2. Отношение к детям
                </h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Проявляйте доброту, терпение и внимание к каждому ребёнку</li>
                  <li>Учитывайте возраст и особенности детей</li>
                  <li>Не пугайте детей — создавайте атмосферу праздника</li>
                  <li>Хвалите детей за стихи и песни, даже если они сбиваются</li>
                  <li>Не критикуйте детей и не делайте замечаний</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
                  3. Общение с родителями
                </h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Будьте вежливы и доброжелательны</li>
                  <li>Уточняйте детали программы до начала визита</li>
                  <li>Следуйте пожеланиям родителей</li>
                  <li>Не обсуждайте с родителями других клиентов</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
                  4. Категорически запрещено
                </h2>
                <ul className="list-disc pl-6 space-y-2 text-destructive">
                  <li>Употреблять алкоголь до или во время визита</li>
                  <li>Курить в присутствии клиентов или в их помещении</li>
                  <li>Использовать нецензурную лексику</li>
                  <li>Снимать маску/бороду при детях без согласия родителей</li>
                  <li>Просить дополнительную оплату сверх согласованной</li>
                  <li>Брать личные контакты клиентов для работы вне платформы</li>
                  <li>Оставлять детей без присмотра</li>
                  <li>Делать фото/видео без разрешения</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
                  5. Внешний вид
                </h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Борода и парик должны быть аккуратно закреплены</li>
                  <li>Костюм без пятен, дыр и потёртостей</li>
                  <li>Обувь чистая и соответствующая образу</li>
                  <li>Макияж (для Снегурочки) умеренный и праздничный</li>
                  <li>Реквизит (мешок, посох) в хорошем состоянии</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
                  6. Пунктуальность
                </h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Планируйте маршрут заранее с учётом пробок</li>
                  <li>Приезжайте за 10-15 минут до назначенного времени</li>
                  <li>При задержке — немедленно предупредите клиента</li>
                  <li>Опоздание более чем на 30 минут — серьёзное нарушение</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
                  7. Конфиденциальность
                </h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Не разглашайте личные данные клиентов</li>
                  <li>Не обсуждайте заказы в социальных сетях без разрешения</li>
                  <li>Не передавайте информацию о клиентах третьим лицам</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
                  8. Санкции за нарушения
                </h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Первое нарушение:</strong> предупреждение</li>
                  <li><strong>Повторное нарушение:</strong> временная блокировка аккаунта</li>
                  <li><strong>Грубое нарушение:</strong> немедленная блокировка без возможности восстановления</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
                  9. Обратная связь
                </h2>
                <p>
                  Мы ценим обратную связь от наших исполнителей. Если у вас есть предложения 
                  по улучшению работы сервиса, пишите нам:
                </p>
                <ul className="list-none space-y-1">
                  <li>Email: ded-morozy@gtxt.biz</li>
                </ul>
              </section>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
