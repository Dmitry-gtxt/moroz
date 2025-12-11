import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SEOHead } from '@/components/seo/SEOHead';

export default function CustomerRules() {
  return (
    <>
      <SEOHead 
        title="Правила для клиентов | Дед-Морозы.РФ"
        description="Правила поведения клиентов при заказе услуг Деда Мороза и Снегурочки"
      />
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-12">
          <div className="container max-w-4xl">
            <h1 className="font-display text-3xl font-bold text-foreground mb-8">
              Правила для клиентов
            </h1>
            
            <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
              <p className="text-sm text-muted-foreground">
                Дата публикации: 1 декабря 2025 года
              </p>

              <p className="text-lg">
                Для того чтобы праздник прошёл идеально, просим вас соблюдать несколько 
                простых правил при заказе Деда Мороза и Снегурочки.
              </p>

              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
                  1. До визита
                </h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Укажите точный адрес, включая подъезд, этаж, код домофона</li>
                  <li>Сообщите имена и возраст детей</li>
                  <li>Расскажите о предпочтениях детей, их увлечениях</li>
                  <li>Подготовьте стихи или песни, которые дети будут рассказывать</li>
                  <li>Заранее спрячьте подарки в доступном для артиста месте</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
                  2. Подготовка помещения
                </h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Освободите пространство для проведения программы</li>
                  <li>Уберите домашних животных, если они могут помешать</li>
                  <li>Подготовьте место, где артист может оставить верхнюю одежду</li>
                  <li>Создайте праздничную атмосферу: ёлка, украшения, музыка</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
                  3. Во время визита
                </h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Не оставляйте маленьких детей наедине с артистом</li>
                  <li>Помогайте артисту, если дети стесняются или капризничают</li>
                  <li>Не просите артиста снять бороду или маску при детях</li>
                  <li>Соблюдайте оговорённое время визита</li>
                  <li>Фото и видеосъёмка — с разрешения артиста</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
                  4. Оплата
                </h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Предоплата вносится онлайн при бронировании</li>
                  <li>Оставшуюся сумму передайте артисту после программы</li>
                  <li>Подготовьте точную сумму без сдачи</li>
                  <li>Чаевые приветствуются, но не обязательны</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
                  5. Что нельзя делать
                </h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Предлагать артисту алкоголь</li>
                  <li>Требовать услуги, не включённые в заказ</li>
                  <li>Оскорблять или унижать артиста</li>
                  <li>Задерживать артиста сверх оплаченного времени без согласования</li>
                  <li>Просить личные контакты для заказа вне платформы</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
                  6. Отмена и перенос
                </h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Отмена за 48+ часов — полный возврат предоплаты</li>
                  <li>Отмена за 24-48 часов — возврат 50% предоплаты</li>
                  <li>Отмена менее чем за 24 часа — предоплата не возвращается</li>
                  <li>Для переноса свяжитесь с нами как можно раньше</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
                  7. Обратная связь
                </h2>
                <p>
                  После визита мы будем признательны за ваш отзыв. Это помогает другим 
                  родителям выбрать артиста и мотивирует исполнителей работать лучше.
                </p>
                <p>
                  Если что-то пошло не так — напишите нам, мы разберёмся в ситуации.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
                  8. Контакты
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
