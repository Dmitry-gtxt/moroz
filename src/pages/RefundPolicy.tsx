import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SEOHead } from '@/components/seo/SEOHead';

export default function RefundPolicy() {
  return (
    <>
      <SEOHead 
        title="Правила возврата | Дед-Морозы.РФ"
        description="Правила отмены заказа и возврата денежных средств за услуги Дедов Морозов и Снегурочек"
      />
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-12">
          <div className="container max-w-4xl">
            <h1 className="font-display text-3xl font-bold text-foreground mb-8">
              Правила возврата
            </h1>
            
            <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
              <p className="text-sm text-muted-foreground">
                Дата публикации: 1 декабря 2025 года
              </p>

              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
                  1. Общие положения
                </h2>
                <p>
                  Настоящие правила определяют условия отмены заказа и возврата денежных 
                  средств при бронировании услуг через сервис «Дед-Морозы.РФ».
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
                  2. Отмена заказа Заказчиком
                </h2>
                <h3 className="font-semibold text-foreground mt-4 mb-2">
                  Более чем за 48 часов до визита:
                </h3>
                <p>
                  Возврат 100% предоплаты в течение 5-7 рабочих дней.
                </p>
                
                <h3 className="font-semibold text-foreground mt-4 mb-2">
                  От 24 до 48 часов до визита:
                </h3>
                <p>
                  Возврат 50% предоплаты. Остальные 50% удерживаются в качестве 
                  компенсации артисту.
                </p>
                
                <h3 className="font-semibold text-foreground mt-4 mb-2">
                  Менее чем за 24 часа до визита:
                </h3>
                <p>
                  Предоплата не возвращается. Денежные средства направляются артисту 
                  в качестве компенсации.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
                  3. Отмена заказа Исполнителем
                </h2>
                <p>
                  В случае отмены заказа по инициативе артиста или сервиса:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Предоплата возвращается в полном объёме (100%)</li>
                  <li>Заказчику предлагается альтернативный артист (при наличии)</li>
                  <li>Возврат осуществляется в течение 3-5 рабочих дней</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
                  4. Форс-мажорные обстоятельства
                </h2>
                <p>
                  При наступлении форс-мажорных обстоятельств (стихийные бедствия, 
                  эпидемии, ограничительные меры властей):
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Заказ может быть перенесён на другую дату по согласованию сторон</li>
                  <li>При невозможности переноса — возврат 100% предоплаты</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
                  5. Порядок возврата
                </h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Для отмены заказа свяжитесь с нами по телефону или email</li>
                  <li>Укажите номер заказа и причину отмены</li>
                  <li>Возврат осуществляется на карту, с которой была произведена оплата</li>
                  <li>Срок возврата: от 3 до 7 рабочих дней в зависимости от банка</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
                  6. Претензии по качеству услуг
                </h2>
                <p>
                  В случае ненадлежащего оказания услуг Заказчик вправе:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Направить претензию в течение 3 дней после визита</li>
                  <li>Приложить доказательства (фото, видео, переписка)</li>
                  <li>Получить частичный или полный возврат по решению администрации</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
                  7. Контакты для возврата
                </h2>
                <ul className="list-none space-y-1">
                  <li>Email: ded-morozy@gtxt.biz</li>
                  <li>Телефон: +7 (995) 382-97-36</li>
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
