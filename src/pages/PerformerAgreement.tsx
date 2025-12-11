import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SEOHead } from '@/components/seo/SEOHead';

export default function PerformerAgreement() {
  return (
    <>
      <SEOHead 
        title="Договор с исполнителем | Дед-Морозы.РФ"
        description="Договор оказания услуг между сервисом Дед-Морозы.РФ и исполнителями (артистами)"
      />
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-12">
          <div className="container max-w-4xl">
            <h1 className="font-display text-3xl font-bold text-foreground mb-8">
              Договор с исполнителем
            </h1>
            
            <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
              <p className="text-sm text-muted-foreground">
                Дата публикации: 1 декабря 2025 года
              </p>

              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
                  1. Предмет договора
                </h2>
                <p>
                  Настоящий договор регулирует отношения между сервисом «Дед-Морозы.РФ» 
                  (далее — Платформа) и физическим лицом, оказывающим услуги по проведению 
                  новогодних поздравлений (далее — Исполнитель).
                </p>
                <p>
                  Платформа предоставляет Исполнителю доступ к сервису для получения заказов 
                  на оказание услуг Дедов Морозов и Снегурочек.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
                  2. Условия сотрудничества
                </h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Исполнитель самостоятельно определяет график работы и цены</li>
                  <li>Платформа взимает комиссию с каждого выполненного заказа</li>
                  <li>Размер комиссии устанавливается индивидуально и указан в личном кабинете</li>
                  <li>Исполнитель работает как самозанятый или ИП</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
                  3. Обязанности Исполнителя
                </h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Своевременно являться на заказы в согласованное время</li>
                  <li>Обеспечивать качественное проведение программы</li>
                  <li>Поддерживать костюм и реквизит в надлежащем состоянии</li>
                  <li>Соблюдать Кодекс поведения исполнителя</li>
                  <li>Оперативно отвечать на сообщения клиентов и администрации</li>
                  <li>Уведомлять о невозможности выполнить заказ не менее чем за 24 часа</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
                  4. Обязанности Платформы
                </h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Обеспечивать работу сервиса и личного кабинета</li>
                  <li>Передавать контактные данные клиентов после оплаты предоплаты</li>
                  <li>Осуществлять техническую поддержку</li>
                  <li>Рассматривать спорные ситуации</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
                  5. Порядок оплаты
                </h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Клиент вносит предоплату через Платформу</li>
                  <li>Исполнитель получает остаток суммы от клиента после оказания услуги</li>
                  <li>Комиссия Платформы удерживается из суммы предоплаты</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
                  6. Верификация
                </h2>
                <p>
                  Для работы на Платформе Исполнитель обязан пройти верификацию:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Предоставить контактный номер телефона</li>
                  <li>Пройти телефонное собеседование с менеджером</li>
                  <li>Загрузить качественные фотографии в костюме</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
                  7. Ответственность
                </h2>
                <p>
                  Исполнитель несёт ответственность за:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Качество оказываемых услуг</li>
                  <li>Соблюдение договорённостей с клиентом</li>
                  <li>Сохранность имущества клиента</li>
                </ul>
                <p className="mt-4">
                  При систематических нарушениях Платформа вправе заблокировать аккаунт Исполнителя.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
                  8. Расторжение договора
                </h2>
                <p>
                  Любая сторона может расторгнуть договор, уведомив другую сторону за 7 дней. 
                  При наличии активных заказов расторжение возможно только после их выполнения 
                  или передачи другому исполнителю.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
                  9. Контакты
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
