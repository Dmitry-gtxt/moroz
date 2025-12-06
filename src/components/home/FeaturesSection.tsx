import { Shield, Star, CreditCard, Clock, Users, Video } from 'lucide-react';

const parentFeatures = [
  {
    icon: Star,
    title: 'Честные отзывы',
    description: 'Только реальные отзывы от клиентов после выполненных заказов',
  },
  {
    icon: Shield,
    title: 'Проверенные исполнители',
    description: 'Все анкеты проходят модерацию и верификацию документов',
  },
  {
    icon: CreditCard,
    title: 'Безопасная предоплата',
    description: 'Деньги хранятся на сервисе до выполнения заказа',
  },
  {
    icon: Video,
    title: 'Видео-приветствия',
    description: 'Посмотрите видео от исполнителя перед бронированием',
  },
];

const performerFeatures = [
  {
    icon: Users,
    title: 'Больше клиентов',
    description: 'Получайте заказы от родителей со всего Бишкека',
  },
  {
    icon: Clock,
    title: 'Гибкий график',
    description: 'Сами управляйте своим календарём и ценами',
  },
  {
    icon: CreditCard,
    title: 'Полная загрузка слотов',
    description: 'Получайте заказы на все предновогодние и новогодние праздники!',
  },
  {
    icon: Star,
    title: 'Рейтинг и репутация',
    description: 'Собирайте отзывы и повышайте свой рейтинг',
  },
];

export function FeaturesSection() {
  return (
    <section className="py-20 bg-background">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* For Parents */}
          <div>
            <div className="mb-8">
              <span className="text-accent font-semibold text-sm uppercase tracking-wider">
                Родителям
              </span>
              <h2 className="font-display text-3xl font-bold text-foreground mt-2">
                Почему выбирают нас
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {parentFeatures.map((feature, index) => (
                <div 
                  key={index}
                  className="flex gap-4 p-4 rounded-xl hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* For Performers */}
          <div>
            <div className="mb-8">
              <span className="text-primary font-semibold text-sm uppercase tracking-wider">
                Исполнителям
              </span>
              <h2 className="font-display text-3xl font-bold text-foreground mt-2">
                Зарабатывайте с нами
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {performerFeatures.map((feature, index) => (
                <div 
                  key={index}
                  className="flex gap-4 p-4 rounded-xl hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
