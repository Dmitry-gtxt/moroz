import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

export function CTASection() {
  const [sparkles, setSparkles] = useState<{ left: string; top: string; delay: string }[]>([]);

  useEffect(() => {
    const items = Array.from({ length: 12 }, () => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 3}s`,
    }));
    setSparkles(items);
  }, []);

  return (
    <section className="py-24 relative overflow-hidden bg-gradient-magic">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        {/* Aurora effect */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-magic-cyan/20 rounded-full blur-[120px] animate-aurora" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-magic-purple/20 rounded-full blur-[100px] animate-aurora" style={{ animationDelay: '2s' }} />
        
        {/* Sparkles */}
        {sparkles.map((style, i) => (
          <div
            key={i}
            className="absolute text-gold animate-sparkle"
            style={{
              left: style.left,
              top: style.top,
              animationDelay: style.delay,
              fontSize: `${10 + Math.random() * 10}px`,
            }}
          >
            ✨
          </div>
        ))}
        
        {/* Floating decorations */}
        <div className="absolute top-10 left-10 text-6xl opacity-20 animate-float">🎅</div>
        <div className="absolute top-20 right-20 text-5xl opacity-20 animate-float" style={{ animationDelay: '0.5s' }}>⭐</div>
        <div className="absolute bottom-20 left-1/4 text-5xl opacity-20 animate-float" style={{ animationDelay: '1s' }}>🎄</div>
        <div className="absolute bottom-10 right-10 text-6xl opacity-20 animate-float" style={{ animationDelay: '1.5s' }}>❄️</div>
      </div>
      
      <div className="container relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Magical header */}
          <div className="inline-flex items-center justify-center gap-3 mb-8">
            <span className="text-6xl animate-float">🎅</span>
            <Sparkles className="h-8 w-8 text-gold animate-pulse" />
            <span className="text-5xl animate-float" style={{ animationDelay: '0.5s' }}>🌟</span>
          </div>
          
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Подарите детям
            <span className="block text-gradient-magic mt-2">настоящее волшебство!</span>
          </h2>
          
          <p className="text-xl text-white/80 mb-4 max-w-2xl mx-auto leading-relaxed">
            Забронируйте Деда Мороза прямо сейчас и получите скидку 10% на первый заказ
          </p>
          
          <p className="text-gold-light mb-10 flex items-center justify-center gap-2">
            <span className="text-2xl">✨</span>
            <span className="text-lg font-medium">Создаём волшебные воспоминания с 2020 года</span>
            <span className="text-2xl">✨</span>
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="xl" className="shadow-glow animate-pulse-glow text-lg" asChild>
              <Link to="/catalog">
                <span className="mr-2">🎅</span>
                Найти Деда Мороза
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
            <Button 
              variant="outline" 
              size="xl" 
              className="border-2 border-white/30 bg-white/10 text-white hover:bg-white/20 hover:border-white/50 active:bg-white/30 backdrop-blur-sm text-lg"
              asChild
            >
              <Link to="/become-performer">
                <span className="mr-2">⭐</span>
                Стать исполнителем
              </Link>
            </Button>
          </div>
          
          {/* Trust indicators */}
          <div className="mt-12 pt-8 border-t border-white/10">
            <div className="flex flex-wrap justify-center gap-8 text-white/60 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                Проверенные исполнители
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                Безопасная оплата
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                Гарантия качества
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
