import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SEOHead } from '@/components/seo/SEOHead';
import { CatalogContent } from '@/components/catalog/CatalogContent';
import { Sparkles, Snowflake } from 'lucide-react';

const Catalog = () => {
  return (
    <div className="min-h-screen flex flex-col bg-winter-950">
      <SEOHead 
        title="Каталог Дедов Морозов"
        description="Выберите проверенного Деда Мороза или Снегурочку в Самаре и области. Фильтры по району, цене и рейтингу. Отзывы реальных клиентов."
        keywords="каталог дед мороз самара, снегурочка самара, заказать деда мороза, новогодние персонажи"
      />
      <Header />
      <main className="flex-1">
        {/* Page Header */}
        <div className="relative py-16 overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-b from-winter-900 to-winter-950" />
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-80 h-80 bg-magic-purple/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-magic-cyan/15 rounded-full blur-3xl" />
            {[...Array(8)].map((_, i) => (
              <Snowflake
                key={i}
                className="absolute text-magic-gold/10 animate-float-slow"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  width: `${20 + Math.random() * 30}px`,
                  height: `${20 + Math.random() * 30}px`,
                  animationDelay: `${Math.random() * 5}s`,
                }}
              />
            ))}
          </div>
          
          <div className="container relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-magic-gold/10 border border-magic-gold/20 mb-6">
              <Sparkles className="w-4 h-4 text-magic-gold" />
              <span className="text-sm font-medium text-magic-gold">Проверенные исполнители</span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-snow-100 mb-4">
              Каталог <span className="text-gradient-gold">волшебников</span>
            </h1>
            <p className="text-snow-400 text-lg max-w-2xl mx-auto">
              Найдите идеального Деда Мороза для вашего праздника
            </p>
          </div>
        </div>

        <div className="container py-8">
          <CatalogContent showHeader={false} />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Catalog;
