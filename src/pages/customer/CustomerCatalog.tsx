import { CustomerLayout } from '@/components/customer/CustomerLayout';
import { SEOHead } from '@/components/seo/SEOHead';
import { CatalogContent } from '@/components/catalog/CatalogContent';

export default function CustomerCatalog() {
  return (
    <CustomerLayout>
      <SEOHead 
        title="Каталог исполнителей"
        description="Выберите проверенного Деда Мороза или Снегурочку в Самаре и области"
      />
      <CatalogContent showHeader={true} />
    </CustomerLayout>
  );
}
