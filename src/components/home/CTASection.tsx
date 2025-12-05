import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Gift } from 'lucide-react';

export function CTASection() {
  return (
    <section className="py-20 bg-primary relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
      
      <div className="container relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/20 mb-6">
            <Gift className="h-8 w-8 text-accent" />
          </div>
          
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
            Подарите детям волшебство!
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
            Забронируйте Деда Мороза прямо сейчас и получите скидку 10% на первый заказ
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="xl" asChild>
              <Link to="/catalog">
                Найти Деда Мороза
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
            <Button 
              variant="outline" 
              size="xl" 
              className="border-white/30 text-white hover:bg-white/10 hover:text-white"
              asChild
            >
              <Link to="/for-performers">
                Стать исполнителем
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
