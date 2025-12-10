import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SEOHead } from '@/components/seo/SEOHead';

export default function Terms() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead 
        title="Пользовательское соглашение"
        description="Пользовательское соглашение сервиса ДедМороз.kg. Условия использования платформы для клиентов и исполнителей."
      />
      <Header />
      <main className="flex-1 py-12">
        <div className="container max-w-3xl">
          <h1 className="font-display text-3xl font-bold mb-8">
            Пользовательское соглашение
          </h1>
          
          <div className="prose prose-slate max-w-none space-y-6 text-muted-foreground">
            <p className="text-sm">
              Дата вступления в силу: 1 декабря 2024 года
            </p>

            <section>
              <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">1. Общие положения</h2>
              <p>
                Настоящее Пользовательское соглашение (далее — «Соглашение») регулирует отношения между 
                администрацией платформы «ДедМороз63.рф» (далее — «Платформа») и пользователями Платформы.
              </p>
              <p>
                Платформа является информационным посредником между заказчиками услуг (клиентами) и 
                исполнителями новогодних поздравлений на территории Самарской области.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">2. Условия использования</h2>
              <p>Используя Платформу, вы подтверждаете, что:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Вам исполнилось 18 лет или вы действуете с согласия законных представителей</li>
                <li>Вы предоставляете достоверную информацию при регистрации</li>
                <li>Вы согласны с настоящим Соглашением и Политикой конфиденциальности</li>
                <li>Вы не будете использовать Платформу в противоправных целях</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">3. Услуги Платформы</h2>
              <p>Платформа предоставляет:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Каталог проверенных исполнителей новогодних поздравлений</li>
                <li>Систему бронирования и управления заказами</li>
                <li>Безопасную обработку предоплаты</li>
                <li>Систему отзывов и рейтингов</li>
                <li>Поддержку пользователей</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">4. Права и обязанности клиентов</h2>
              <h3 className="text-lg font-medium text-foreground mt-4 mb-2">Клиент имеет право:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Просматривать каталог и бронировать исполнителей</li>
                <li>Отменять бронирование в установленные сроки</li>
                <li>Оставлять отзывы о выполненных заказах</li>
                <li>Обращаться в службу поддержки</li>
              </ul>
              <h3 className="text-lg font-medium text-foreground mt-4 mb-2">Клиент обязан:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Предоставлять корректные контактные данные и адрес</li>
                <li>Своевременно вносить предоплату</li>
                <li>Обеспечить условия для проведения мероприятия</li>
                <li>Оплатить остаток стоимости исполнителю после визита</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">5. Права и обязанности исполнителей</h2>
              <h3 className="text-lg font-medium text-foreground mt-4 mb-2">Исполнитель имеет право:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Размещать информацию о своих услугах</li>
                <li>Устанавливать цены и расписание</li>
                <li>Принимать или отклонять заявки на бронирование</li>
                <li>Получать оплату за выполненные заказы</li>
              </ul>
              <h3 className="text-lg font-medium text-foreground mt-4 mb-2">Исполнитель обязан:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Предоставлять достоверную информацию о себе и услугах</li>
                <li>Пройти верификацию документов</li>
                <li>Своевременно прибывать на мероприятия</li>
                <li>Качественно оказывать услуги</li>
                <li>Уплачивать комиссию Платформы (15% от стоимости заказа)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">6. Оплата и возвраты</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Предоплата:</strong> 30% от стоимости заказа вносится через Платформу</li>
                <li><strong>Остаток:</strong> 70% оплачивается исполнителю наличными после визита</li>
                <li><strong>Отмена за 24+ часа:</strong> возврат 100% предоплаты</li>
                <li><strong>Отмена менее 24 часов:</strong> возврат 50% предоплаты</li>
                <li><strong>Неявка исполнителя:</strong> возврат 100% предоплаты</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">7. Ответственность</h2>
              <p>
                Платформа является информационным посредником и не несёт ответственности за:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Качество услуг, оказываемых исполнителями</li>
                <li>Действия или бездействие пользователей</li>
                <li>Убытки, возникшие по вине пользователей</li>
              </ul>
              <p>
                Все споры между клиентами и исполнителями разрешаются ими самостоятельно. 
                Платформа может выступать посредником при разрешении споров.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">8. Интеллектуальная собственность</h2>
              <p>
                Все материалы Платформы (дизайн, логотипы, тексты, код) являются собственностью 
                администрации Платформы и защищены законодательством КР об интеллектуальной собственности.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">9. Изменение условий</h2>
              <p>
                Администрация оставляет за собой право изменять условия настоящего Соглашения. 
                Продолжение использования Платформы после изменений означает принятие новых условий.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">10. Применимое право</h2>
              <p>
                Настоящее Соглашение регулируется законодательством Российской Федерации. 
                Все споры подлежат рассмотрению в судах г. Самары.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">11. Контакты</h2>
              <ul className="list-none space-y-1">
                <li>Email: support@dedmoroz63.ru</li>
                <li>Телефон: +7 (846) 200-00-00</li>
                <li>Адрес: г. Самара, Самарская область</li>
              </ul>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
