import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SEOHead } from '@/components/seo/SEOHead';

export default function Cookies() {
  return (
    <>
      <SEOHead 
        title="Политика использования cookies | Дед-Морозы.РФ"
        description="Информация об использовании файлов cookies на сайте Дед-Морозы.РФ"
      />
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-12">
          <div className="container max-w-4xl">
            <h1 className="font-display text-3xl font-bold text-foreground mb-8">
              Политика использования cookies
            </h1>
            
            <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
              <p className="text-sm text-muted-foreground">
                Дата публикации: 1 декабря 2025 года
              </p>

              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
                  1. Что такое cookies?
                </h2>
                <p>
                  Cookies (куки) — это небольшие текстовые файлы, которые сохраняются на 
                  вашем устройстве при посещении сайта. Они помогают сайту запоминать 
                  информацию о вашем визите.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
                  2. Какие cookies мы используем
                </h2>
                
                <h3 className="font-semibold text-foreground mt-4 mb-2">
                  Необходимые cookies
                </h3>
                <p>
                  Обеспечивают работу основных функций сайта: авторизацию, корзину заказов, 
                  безопасность. Без них сайт не сможет работать корректно.
                </p>
                
                <h3 className="font-semibold text-foreground mt-4 mb-2">
                  Аналитические cookies
                </h3>
                <p>
                  Помогают нам понять, как посетители взаимодействуют с сайтом. 
                  Собирают анонимную статистику для улучшения сервиса.
                </p>
                
                <h3 className="font-semibold text-foreground mt-4 mb-2">
                  Функциональные cookies
                </h3>
                <p>
                  Запоминают ваши предпочтения: выбранный район, настройки отображения, 
                  историю просмотров.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
                  3. Срок хранения cookies
                </h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Сессионные cookies</strong> — удаляются после закрытия браузера</li>
                  <li><strong>Постоянные cookies</strong> — хранятся от 30 дней до 1 года</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
                  4. Управление cookies
                </h2>
                <p>
                  Вы можете управлять cookies через настройки браузера:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Блокировать все или определённые cookies</li>
                  <li>Удалять cookies после каждого сеанса</li>
                  <li>Получать уведомления при установке cookies</li>
                </ul>
                <p className="mt-4">
                  Обратите внимание: отключение cookies может ограничить функциональность сайта.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
                  5. Cookies третьих сторон
                </h2>
                <p>
                  Мы можем использовать сервисы третьих сторон, которые устанавливают 
                  собственные cookies:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Яндекс.Метрика — для веб-аналитики</li>
                  <li>Платёжные системы — для обработки платежей</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
                  6. Согласие на использование cookies
                </h2>
                <p>
                  Продолжая использовать наш сайт, вы соглашаетесь с использованием cookies 
                  в соответствии с данной политикой. При первом посещении сайта вам будет 
                  показано уведомление о cookies с возможностью принять или отклонить их.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
                  7. Изменения политики
                </h2>
                <p>
                  Мы можем обновлять данную политику. Актуальная версия всегда доступна 
                  на этой странице.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
                  8. Контакты
                </h2>
                <p>
                  По вопросам использования cookies обращайтесь:
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
