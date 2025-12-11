import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SEOHead } from '@/components/seo/SEOHead';

const BankInfo = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead 
        title="Информация для Банка — Дед-Морозы.РФ"
        description="Информация о процедурах оформления, оплаты и возврата услуг на платформе Дед-Морозы.РФ"
      />
      <Header />
      <main className="flex-1">
        <div className="container py-12 max-w-4xl">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-8">
            Информация для Банка
          </h1>

          <div className="prose prose-lg max-w-none space-y-10">
            {/* Процедура оформления */}
            <section>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                Процедура оформления товара, услуги или платежа
              </h2>
              <div className="bg-card rounded-xl p-6 border border-border space-y-4 text-muted-foreground">
                <p>
                  Платформа Дед-Морозы.РФ предоставляет услуги по организации новогодних поздравлений 
                  от профессиональных исполнителей (Дед Мороз, Снегурочка) на территории Самары и Самарской области.
                </p>
                <p><strong className="text-foreground">Процедура оформления заказа:</strong></p>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Клиент выбирает исполнителя из каталога на сайте</li>
                  <li>Клиент выбирает удобную дату и время из доступных слотов исполнителя</li>
                  <li>Клиент заполняет форму бронирования: адрес, контактные данные, информация о детях</li>
                  <li>Клиент принимает условия публичной оферты, политики возврата и правил поведения</li>
                  <li>Заявка отправляется исполнителю на подтверждение</li>
                  <li>После подтверждения исполнителем клиент получает уведомление с реквизитами для оплаты предоплаты</li>
                  <li>Клиент оплачивает предоплату онлайн</li>
                  <li>Бронирование подтверждено, исполнитель прибывает в назначенное время</li>
                </ol>
              </div>
            </section>

            {/* Порядок предоставления */}
            <section>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                Порядок предоставления товара, услуги или платежа
              </h2>
              <div className="bg-card rounded-xl p-6 border border-border space-y-4 text-muted-foreground">
                <p><strong className="text-foreground">Услуга предоставляется следующим образом:</strong></p>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Исполнитель прибывает по указанному адресу в согласованную дату и время</li>
                  <li>Исполнитель проводит новогоднюю программу продолжительностью от 20 до 60 минут (в зависимости от выбранного пакета)</li>
                  <li>Программа включает: поздравление, вручение подарков, игры, фотосессию</li>
                  <li>По завершении программы клиент оплачивает оставшуюся часть стоимости наличными исполнителю</li>
                </ol>
                <p className="mt-4">
                  <strong className="text-foreground">Сроки предоставления услуги:</strong> услуга предоставляется 
                  в дату и время, выбранные клиентом при бронировании и подтверждённые исполнителем. 
                  Основной период оказания услуг: с 15 декабря по 15 января.
                </p>
                <p>
                  <strong className="text-foreground">Территория обслуживания:</strong> г. Самара, г. Тольятти, 
                  г. Сызрань, г. Новокуйбышевск и другие населённые пункты Самарской области.
                </p>
              </div>
            </section>

            {/* Способы оплаты */}
            <section>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                Способы оплаты
              </h2>
              <div className="bg-card rounded-xl p-6 border border-border space-y-4 text-muted-foreground">
                <p><strong className="text-foreground">Оплата услуг производится в два этапа:</strong></p>
                <div className="space-y-4">
                  <div>
                    <p className="font-semibold text-foreground">1. Предоплата (после подтверждения бронирования исполнителем):</p>
                    <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                      <li>Банковская карта (Visa, MasterCard, МИР) через защищённый платёжный шлюз</li>
                      <li>Система быстрых платежей (СБП)</li>
                      <li>Перевод по реквизитам</li>
                    </ul>
                    <p className="mt-2 text-sm">
                      Размер предоплаты составляет процент от полной стоимости услуги, указанный при бронировании.
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">2. Оставшаяся часть оплаты (после оказания услуги):</p>
                    <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                      <li>Наличные денежные средства исполнителю</li>
                      <li>Перевод на карту исполнителя (по договорённости)</li>
                    </ul>
                  </div>
                </div>
                <p className="mt-4 text-sm">
                  Все онлайн-платежи защищены протоколом SSL и обрабатываются сертифицированными платёжными системами.
                </p>
              </div>
            </section>

            {/* Процедура возврата */}
            <section>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                Процедура возврата, обмена товара, отмены платежа, отказа от товара
              </h2>
              <div className="bg-card rounded-xl p-6 border border-border space-y-4 text-muted-foreground">
                <p><strong className="text-foreground">Отмена бронирования клиентом:</strong></p>
                <ul className="list-disc list-inside space-y-2">
                  <li>При отмене более чем за 72 часа до визита — возврат предоплаты в полном объёме</li>
                  <li>При отмене от 24 до 72 часов до визита — возврат 50% предоплаты</li>
                  <li>При отмене менее чем за 24 часа до визита — предоплата не возвращается</li>
                </ul>
                
                <p className="mt-4"><strong className="text-foreground">Отмена бронирования исполнителем:</strong></p>
                <ul className="list-disc list-inside space-y-2">
                  <li>При отмене исполнителем — возврат предоплаты в полном объёме</li>
                  <li>Клиенту предлагается альтернативный исполнитель или перенос на другую дату</li>
                </ul>

                <p className="mt-4"><strong className="text-foreground">Порядок возврата денежных средств:</strong></p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Заявка на возврат подаётся через личный кабинет или по телефону поддержки</li>
                  <li>Срок рассмотрения заявки — до 3 рабочих дней</li>
                  <li>Возврат осуществляется на карту, с которой была произведена оплата</li>
                  <li>Срок зачисления средств — от 3 до 10 рабочих дней (зависит от банка клиента)</li>
                </ul>

                <p className="mt-4"><strong className="text-foreground">Претензии к качеству услуги:</strong></p>
                <p>
                  В случае неудовлетворительного качества оказанной услуги клиент может обратиться 
                  в службу поддержки в течение 24 часов после визита. Каждое обращение рассматривается 
                  индивидуально, возможна частичная компенсация или полный возврат средств.
                </p>
              </div>
            </section>

            {/* Контактная информация */}
            <section>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                Контактная информация интернет-магазина
              </h2>
              <div className="bg-card rounded-xl p-6 border border-border space-y-4 text-muted-foreground">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="font-semibold text-foreground mb-2">Наименование:</p>
                    <p>ИП Шевчук Д.С.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-2">Адрес:</p>
                    <p>г. Самара, Самарская область, Россия</p>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-2">Телефон:</p>
                    <p>
                      <a href="tel:+79953829736" className="text-accent hover:underline">
                        +7 (995) 382-97-36
                      </a>
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-2">Электронная почта:</p>
                    <p>
                      <a href="mailto:ded-morozy@gtxt.biz" className="text-accent hover:underline">
                        ded-morozy@gtxt.biz
                      </a>
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-2">Сайт:</p>
                    <p>
                      <a href="https://дед-морозы.рф" className="text-accent hover:underline">
                        Дед-Морозы.РФ
                      </a>
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-2">Режим работы:</p>
                    <p>Ежедневно с 9:00 до 21:00 (МСК)</p>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-border">
                  <p className="text-sm">
                    Служба поддержки работает круглосуточно в период с 20 декабря по 10 января.
                    Среднее время ответа на обращение — 30 минут.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BankInfo;
