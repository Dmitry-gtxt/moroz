import { useRef, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import partnerKolibri from '@/assets/partner-kolibri.png';
import partnerPovuzam from '@/assets/partner-povuzam.png';
import partnerUmius from '@/assets/partner-umius.png';
import partnerUchidron from '@/assets/partner-uchidron.png';
import partnerFoodmonitoring from '@/assets/partner-foodmonitoring.png';

const partners = [
  { href: "https://kolibri.expert", src: partnerKolibri, alt: "Kolibri Expert" },
  { href: "http://povuzam.ru", src: partnerPovuzam, alt: "Повузам" },
  { href: "https://umius.ru", src: partnerUmius, alt: "УМИУС" },
  { href: "https://xn--d1acgejj.xn--p1ai", src: partnerUchidron, alt: "УчиДрон" },
  { href: "https://foodmonitoring.ru", src: partnerFoodmonitoring, alt: "Мониторинг школьного питания" },
];

export function PartnersSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [needsScroll, setNeedsScroll] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
      setNeedsScroll(scrollWidth > clientWidth);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className="py-12 md:py-16 bg-snow-100">
      <div className="container">
        <h2 className="text-center text-xl md:text-2xl font-display font-semibold text-winter-900 mb-8">
          Наши партнёры
        </h2>
        
        <div className="relative">
          {/* Left arrow */}
          {needsScroll && canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 rounded-full p-2 shadow-md hover:bg-white transition-colors"
              aria-label="Предыдущий"
            >
              <ChevronLeft className="w-5 h-5 text-winter-700" />
            </button>
          )}

          {/* Partners container */}
          <div
            ref={scrollRef}
            onScroll={checkScroll}
            className="flex items-center gap-8 md:gap-12 overflow-x-auto scrollbar-hide px-8 md:px-0 md:justify-center scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {partners.map((partner, index) => (
              <a
                key={index}
                href={partner.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0"
              >
                <img
                  src={partner.src}
                  alt={partner.alt}
                  className="h-[60px] md:h-[80px] opacity-80 hover:opacity-100 transition-opacity"
                />
              </a>
            ))}
          </div>

          {/* Right arrow */}
          {needsScroll && canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 rounded-full p-2 shadow-md hover:bg-white transition-colors"
              aria-label="Следующий"
            >
              <ChevronRight className="w-5 h-5 text-winter-700" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
