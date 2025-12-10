import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SEOHead } from '@/components/seo/SEOHead';
import { CatalogContent } from '@/components/catalog/CatalogContent';

const Catalog = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead 
        title="Каталог Дедов Морозов"
        description="Выберите проверенного Деда Мороза или Снегурочку в Самаре и области. Фильтры по району, цене и рейтингу. Отзывы реальных клиентов."
        keywords="каталог дед мороз самара, снегурочка самара, заказать деда мороза, новогодние персонажи"
      />
      <Header />
      <main className="flex-1">
        {/* Page Header */}
        <div className="bg-primary py-12">
          <div className="container">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-white mb-2">
              Каталог исполнителей
            </h1>
            <p className="text-white/70">
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
