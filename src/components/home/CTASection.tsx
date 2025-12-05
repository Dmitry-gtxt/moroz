import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export function CTASection() {
  return (
    <section className="py-20 bg-primary relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
      
      {/* Floating Santa and Horse decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 text-5xl opacity-20 animate-float">🎅</div>
        <div className="absolute top-20 right-20 text-4xl opacity-15 animate-float" style={{ animationDelay: '0.5s' }}>🐴</div>
        <div className="absolute bottom-10 left-1/4 text-5xl opacity-20 animate-float" style={{ animationDelay: '1s' }}>🎅</div>
        <div className="absolute bottom-20 right-10 text-4xl opacity-15 animate-float" style={{ animationDelay: '1.5s' }}>🐎</div>
      </div>
      
      <div className="container relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center gap-3 mb-6">
            <span className="text-5xl">🎅</span>
            <span className="text-4xl">🐴</span>
          </div>
          
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
            Подарите детям волшебство!
          </h2>
          <p className="text-lg text-white/80 mb-3 max-w-xl mx-auto">
            Забронируйте Деда Мороза прямо сейчас и получите скидку 10% на первый заказ
          </p>
          <p className="text-sm text-accent mb-8">
            🐴 Встречаем Год Лошади 2026 вместе!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="xl" asChild>
              <Link to="/catalog">
                🎅 Найти Деда Мороза
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
            <Button 
              variant="outline" 
              size="xl" 
              className="border-2 border-white/40 bg-white/10 text-white hover:bg-white/20 hover:border-white/60 active:bg-white/30"
              asChild
            >
              <Link to="/become-performer">
                Стать исполнителем
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}