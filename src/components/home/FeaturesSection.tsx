import { Shield, Star, CreditCard, Clock, Users, Video, Heart, Gift, Sparkles, Snowflake } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import { SwipeHint } from '@/components/ui/swipe-hint';

const parentFeatures = [
  {
    icon: Star,
    emoji: '⭐',
    title: 'Честные отзывы',
    description: 'Только реальные отзывы от клиентов после выполненных заказов',
  },
  {
    icon: Shield,
    emoji: '🛡️',
    title: 'Проверенные исполнители',
    description: 'Все анкеты проходят модерацию и верификацию',
  },
  {
    icon: CreditCard,
    emoji: '💳',
    title: 'Безопасная предоплата',
    description: 'Деньги хранятся на сервисе до выполнения заказа',
  },
  {
    icon: Video,
    emoji: '🎬',
    title: 'Видео-приветствия',
    description: 'Посмотрите видео от исполнителя перед бронированием',
  },
];

const performerFeatures = [
  {
    icon: Users,
    emoji: '👨‍👩‍👧‍👦',
    title: 'Больше клиентов',
    description: 'Получайте заказы со всей Самарской области',
  },
  {
    icon: Clock,
    emoji: '⏰',
    title: 'Гибкий график',
    description: 'Сами управляйте своим календарём и ценами',
  },
  {
    icon: Gift,
    emoji: '🎁',
    title: 'Полная загрузка',
    description: 'Заказы на все праздничные дни!',
  },
  {
    icon: Heart,
    emoji: '💖',
    title: 'Рейтинг и отзывы',
    description: 'Собирайте отзывы и повышайте рейтинг',
  },
];

type Feature = {
  icon: typeof Star;
  emoji: string;
  title: string;
  description: string;
};

const FeatureCard = ({ feature, variant }: { feature: Feature; variant: 'gold' | 'santa' }) => (
  <div 
    className={`group flex gap-4 p-5 rounded-2xl glass-card border ${
      variant === 'gold' 
        ? 'border-magic-gold/10 hover:border-magic-gold/30 hover:shadow-lg hover:shadow-magic-gold/10' 
        : 'border-santa-400/10 hover:border-santa-400/30 hover:shadow-lg hover:shadow-santa-400/10'
    } transition-all duration-300 h-full`}
  >
    <div className={`flex-shrink-0 w-14 h-14 rounded-2xl ${
      variant === 'gold' 
        ? 'bg-magic-gold/10 border border-magic-gold/20' 
        : 'bg-santa-500/10 border border-santa-400/20'
    } flex items-center justify-center text-2xl group-hover:scale-110 transition-transform`}>
      {feature.emoji}
    </div>
    <div>
      <h3 className="font-semibold text-snow-100 mb-1 text-lg">
        {feature.title}
      </h3>
      <p className="text-sm text-snow-400 leading-relaxed">
        {feature.description}
      </p>
    </div>
  </div>
);

export function FeaturesSection() {
  const [parentEmblaRef] = useEmblaCarousel({ align: 'start', containScroll: 'trimSnaps' });
  const [performerEmblaRef] = useEmblaCarousel({ align: 'start', containScroll: 'trimSnaps' });

  return (
    <section className="py-24 relative overflow-hidden bg-gradient-to-b from-winter-950 via-winter-900 to-winter-950">
      {/* Decorative background */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(10)].map((_, i) => (
          <Snowflake
            key={i}
            className="absolute text-magic-gold/5 animate-float-slow"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${30 + Math.random() * 40}px`,
              height: `${30 + Math.random() * 40}px`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-magic-purple/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-magic-cyan/10 rounded-full blur-3xl" />
      </div>
      
      <div className="container relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20">
          {/* For Parents */}
          <div className="animate-fade-in">
            <div className="mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-magic-gold/10 border border-magic-gold/20 text-magic-gold mb-4">
                <span className="text-lg">👨‍👩‍👧</span>
                <span className="text-sm font-medium">Для родителей</span>
              </div>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-snow-100">
                Почему выбирают <span className="text-gradient-gold">нас</span>
              </h2>
            </div>
            
            {/* Desktop grid */}
            <div className="hidden sm:grid grid-cols-2 gap-5">
              {parentFeatures.map((feature, index) => (
                <FeatureCard key={index} feature={feature} variant="gold" />
              ))}
            </div>
            
            {/* Mobile carousel */}
            <div className="sm:hidden relative">
              <div className="overflow-hidden" ref={parentEmblaRef}>
                <div className="flex gap-4">
                  {parentFeatures.map((feature, index) => (
                    <div key={index} className="flex-[0_0_85%] min-w-0">
                      <FeatureCard feature={feature} variant="gold" />
                    </div>
                  ))}
                </div>
              </div>
              <SwipeHint />
            </div>
          </div>

          {/* For Performers */}
          <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-santa-500/10 border border-santa-400/20 text-santa-400 mb-4">
                <span className="text-lg">🎅</span>
                <span className="text-sm font-medium">Для исполнителей</span>
              </div>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-snow-100">
                Зарабатывайте <span className="text-santa-400">с нами</span>
              </h2>
            </div>
            
            {/* Desktop grid */}
            <div className="hidden sm:grid grid-cols-2 gap-5">
              {performerFeatures.map((feature, index) => (
                <FeatureCard key={index} feature={feature} variant="santa" />
              ))}
            </div>
            
            {/* Mobile carousel */}
            <div className="sm:hidden relative">
              <div className="overflow-hidden" ref={performerEmblaRef}>
                <div className="flex gap-4">
                  {performerFeatures.map((feature, index) => (
                    <div key={index} className="flex-[0_0_85%] min-w-0">
                      <FeatureCard feature={feature} variant="santa" />
                    </div>
                  ))}
                </div>
              </div>
              <SwipeHint />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
