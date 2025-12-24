import { useRef, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import partnerKolibri from '@/assets/partner-kolibri.png';
import partnerPovuzam from '@/assets/partner-povuzam.png';
import partnerUmius from '@/assets/partner-umius.png';
import partnerUchidron from '@/assets/partner-uchidron.png';
import partnerFoodmonitoring from '@/assets/partner-foodmonitoring.png';

const partners = [
  { href: "https://foodmonitoring.ru", src: partnerFoodmonitoring, alt: "Мониторинг школьного питания" },
  { href: "http://povuzam.ru", src: partnerPovuzam, alt: "Повузам" },
  { href: "https://umius.ru", src: partnerUmius, alt: "УМИУС" },
  { href: "https://xn--d1acgejj.xn--p1ai", src: partnerUchidron, alt: "УчиДрон" },
  { href: "https://kolibri.expert", src: partnerKolibri, alt: "Kolibri Expert" },
];

export function PartnersSection() {
  const isMobile = useIsMobile();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [needsScroll, setNeedsScroll] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
      setNeedsScroll(scrollWidth > clientWidth + 10);
    }
  };

  useEffect(() => {
    // Small delay to ensure images are loaded
    const timer = setTimeout(checkScroll, 100);
    window.addEventListener('resize', checkScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkScroll);
    };
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = isMobile ? 150 : 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const logoHeight = isMobile ? 'h-[45px]' : 'h-[65px]';
  const gap = isMobile ? 'gap-6' : 'gap-10';
  const padding = isMobile ? 'px-4' : 'px-8';

  return (
    <section className="py-10 md:py-14 bg-snow-100">
      <div className={isMobile ? 'px-0' : 'container'}>
        <h2 className="text-center text-xl md:text-2xl font-display font-semibold text-winter-900 mb-6 md:mb-8">
          Наши партнёры
        </h2>
        
        <div className="relative">
          {/* Left arrow - show only when can scroll */}
          {needsScroll && canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className={`absolute left-1 md:left-2 top-1/2 -translate-y-1/2 z-10 bg-snow-100 rounded-full p-1.5 md:p-2 shadow-lg border border-snow-200 hover:bg-white transition-colors`}
              aria-label="Предыдущий"
            >
              <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 text-winter-700" />
            </button>
          )}

          {/* Scrollable container */}
          <div
            ref={scrollRef}
            onScroll={checkScroll}
            className={`flex items-center ${gap} overflow-x-auto scroll-smooth ${padding} ${!needsScroll ? 'justify-center' : ''}`}
            style={{ 
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {partners.map((partner, index) => (
              <div
                key={index}
                className="flex-shrink-0"
              >
                <img
                  src={partner.src}
                  alt={partner.alt}
                  className={`${logoHeight} w-auto object-contain opacity-80`}
                  onLoad={checkScroll}
                />
              </div>
            ))}
          </div>

          {/* Right arrow - show only when can scroll */}
          {needsScroll && canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className={`absolute right-1 md:right-2 top-1/2 -translate-y-1/2 z-10 bg-snow-100 rounded-full p-1.5 md:p-2 shadow-lg border border-snow-200 hover:bg-white transition-colors`}
              aria-label="Следующий"
            >
              <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-winter-700" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
