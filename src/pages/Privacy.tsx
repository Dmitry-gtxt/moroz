import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SEOHead } from '@/components/seo/SEOHead';

export default function Privacy() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead 
        title="Политика конфиденциальности"
        description="Политика конфиденциальности сервиса ДедМороз.kg. Узнайте как мы защищаем ваши персональные данные."
      />
      <Header />
      <main className="flex-1 py-12">
        <div className="container max-w-3xl">
          <h1 className="font-display text-3xl font-bold mb-8">
            Политика конфиденциальности
          </h1>
          
          <div className="prose prose-slate max-w-none space-y-6 text-muted-foreground">
            <p className="text-sm">
              Дата вступления в силу: 1 декабря 2024 года
            </p>

            <section>
              <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">1. Общие положения</h2>
              <p>
                Настоящая Политика конфиденциальности определяет порядок обработки и защиты персональных данных 
                пользователей платформы «ДедМороз.kg» (далее — «Платформа»), действующей на территории 
                Кыргызской Республики.
              </p>
              <p>
                Используя Платформу, вы соглашаетесь с условиями настоящей Политики и даёте согласие на 
                обработку ваших персональных данных в соответствии с Законом КР «О персональных данных».
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">2. Собираемые данные</h2>
              <p>Мы собираем следующие категории персональных данных:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Данные для регистрации:</strong> имя, адрес электронной почты, номер телефона</li>
                <li><strong>Данные для бронирования:</strong> адрес проведения мероприятия, информация о детях (количество, возраст)</li>
                <li><strong>Данные исполнителей:</strong> ФИО, фотографии, описание услуг, документы для верификации</li>
                <li><strong>Технические данные:</strong> IP-адрес, тип браузера, данные об устройстве</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">3. Цели обработки данных</h2>
              <p>Ваши персональные данные обрабатываются для:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Регистрации и идентификации на Платформе</li>
                <li>Обработки и выполнения бронирований</li>
                <li>Связи между клиентами и исполнителями</li>
                <li>Отправки уведомлений о статусе заказов</li>
                <li>Улучшения качества услуг</li>
                <li>Соблюдения требований законодательства КР</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">4. Передача данных третьим лицам</h2>
              <p>
                Мы не продаём и не передаём ваши персональные данные третьим лицам, за исключением:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Исполнителям — в объёме, необходимом для выполнения заказа (имя, телефон, адрес)</li>
                <li>Платёжным системам — для обработки оплаты</li>
                <li>Государственным органам — по законному запросу</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">5. Защита данных</h2>
              <p>
                Мы применяем технические и организационные меры для защиты ваших данных:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Шифрование данных при передаче (SSL/TLS)</li>
                <li>Ограничение доступа к данным</li>
                <li>Регулярное резервное копирование</li>
                <li>Защита от несанкционированного доступа</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">6. Ваши права</h2>
              <p>В соответствии с законодательством КР вы имеете право:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Получить информацию об обработке ваших данных</li>
                <li>Требовать исправления неточных данных</li>
                <li>Требовать удаления ваших данных</li>
                <li>Отозвать согласие на обработку данных</li>
              </ul>
              <p>
                Для реализации своих прав свяжитесь с нами: <strong>privacy@dedmoroz.kg</strong>
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">7. Хранение данных</h2>
              <p>
                Персональные данные хранятся в течение срока действия вашего аккаунта и 3 лет после его 
                удаления для соблюдения требований законодательства и разрешения возможных споров.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">8. Изменения политики</h2>
              <p>
                Мы оставляем за собой право вносить изменения в настоящую Политику. Актуальная версия 
                всегда доступна на данной странице. При существенных изменениях мы уведомим вас по email.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">9. Контакты</h2>
              <p>
                По вопросам обработки персональных данных:
              </p>
              <ul className="list-none space-y-1">
                <li>Email: privacy@dedmoroz.kg</li>
                <li>Телефон: +996 (XXX) XXX-XXX</li>
                <li>Адрес: г. Бишкек, Кыргызская Республика</li>
              </ul>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
