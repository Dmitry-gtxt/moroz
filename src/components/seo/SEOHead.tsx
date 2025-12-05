import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
}

const defaultMeta = {
  title: 'ДедМороз.kg — Заказать Деда Мороза в Бишкеке',
  description: 'Закажите проверенного Деда Мороза или Снегурочку на дом в Бишкеке. Более 100 исполнителей, честные отзывы, безопасная оплата. Подарите детям волшебство!',
  keywords: 'дед мороз бишкек, заказать деда мороза, снегурочка на дом, новогоднее поздравление, дед мороз на дом кыргызстан',
  image: '/og-image.jpg',
  url: 'https://dedmoroz.kg',
};

export function SEOHead({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
}: SEOHeadProps) {
  const meta = {
    title: title ? `${title} | ДедМороз.kg` : defaultMeta.title,
    description: description || defaultMeta.description,
    keywords: keywords || defaultMeta.keywords,
    image: image || defaultMeta.image,
    url: url || defaultMeta.url,
  };

  useEffect(() => {
    // Update document title
    document.title = meta.title;

    // Helper to update or create meta tags
    const setMetaTag = (name: string, content: string, property?: boolean) => {
      const attr = property ? 'property' : 'name';
      let element = document.querySelector(`meta[${attr}="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Standard meta tags
    setMetaTag('description', meta.description);
    setMetaTag('keywords', meta.keywords);

    // Open Graph tags
    setMetaTag('og:title', meta.title, true);
    setMetaTag('og:description', meta.description, true);
    setMetaTag('og:image', meta.image, true);
    setMetaTag('og:url', meta.url, true);
    setMetaTag('og:type', type, true);
    setMetaTag('og:locale', 'ru_RU', true);
    setMetaTag('og:site_name', 'ДедМороз.kg', true);

    // Twitter Card tags
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', meta.title);
    setMetaTag('twitter:description', meta.description);
    setMetaTag('twitter:image', meta.image);
  }, [meta.title, meta.description, meta.keywords, meta.image, meta.url, type]);

  return null;
}
