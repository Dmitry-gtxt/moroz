import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SEOHead } from '@/components/seo/SEOHead';

export default function Offer() {
  return (
    <>
      <SEOHead 
        title="Публичная оферта | Дед-Морозы.РФ"
        description="Публичная оферта на оказание услуг по бронированию Дедов Морозов и Снегурочек"
      />
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-12">
          <div className="container max-w-4xl">
            <h1 className="font-display text-3xl font-bold text-foreground mb-8">
              Публичная оферта
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
                  Настоящий документ является официальным предложением (публичной офертой) 
                  сервиса «Дед-Морозы.РФ» заключить договор на оказание услуг по организации 
                  и бронированию новогодних поздравлений.
                </p>
                <p>
                  Акцептом (принятием) оферты является оформление заказа и внесение предоплаты 
                  через сайт dedmoroz63.рф.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
                  2. Предмет договора
                </h2>
                <p>
                  Исполнитель обязуется оказать Заказчику услуги по организации новогоднего 
                  поздравления с участием артиста (Деда Мороза, Снегурочки или дуэта) в 
                  согласованное время и по указанному адресу.
                </p>
                <p>
                  Заказчик обязуется оплатить услуги в порядке и сроки, установленные настоящей офертой.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
                  3. Стоимость услуг и порядок оплаты
                </h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Стоимость услуг указывается на сайте при оформлении заказа</li>
                  <li>Предоплата составляет 30% от стоимости заказа</li>
                  <li>Оставшаяся сумма оплачивается артисту наличными после оказания услуги</li>
                  <li>Предоплата вносится онлайн через платёжную систему сайта</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
                  4. Права и обязанности сторон
                </h2>
                <h3 className="font-semibold text-foreground mt-4 mb-2">Исполнитель обязуется:</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Обеспечить явку артиста в согласованное время и место</li>
                  <li>Обеспечить качественное проведение программы</li>
                  <li>Информировать Заказчика об изменениях</li>
                </ul>
                
                <h3 className="font-semibold text-foreground mt-4 mb-2">Заказчик обязуется:</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Предоставить достоверную контактную информацию</li>
                  <li>Обеспечить доступ артиста к месту проведения</li>
                  <li>Своевременно оплатить услуги</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
                  5. Условия отмены и возврата
                </h2>
                <p>
                  Условия отмены заказа и возврата денежных средств регулируются отдельным 
                  документом «Правила возврата», размещённым на сайте.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
                  6. Ответственность сторон
                </h2>
                <p>
                  Стороны несут ответственность за неисполнение или ненадлежащее исполнение 
                  обязательств по настоящему договору в соответствии с действующим 
                  законодательством Российской Федерации.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
                  7. Срок действия оферты
                </h2>
                <p>
                  Настоящая оферта вступает в силу с момента её размещения на сайте и 
                  действует до момента её отзыва.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
                  8. Контактная информация
                </h2>
                <p>
                  По вопросам, связанным с исполнением договора, обращайтесь:
                </p>
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
