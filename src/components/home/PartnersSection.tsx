import { useRef, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
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
    const timer = setTimeout(checkScroll, 100);
    window.addEventListener('resize', checkScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkScroll);
    };
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = isMobile ? 180 : 250;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className="py-8 md:py-12 bg-background border-t border-border/30">
      <div className="container px-0 md:px-4">
        <h2 className="text-center text-lg md:text-xl font-medium text-muted-foreground mb-6 px-4">
          Наши партнёры
        </h2>
        
        <div className="relative">
          {/* Left arrow */}
          {needsScroll && canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-10 bg-background/90 backdrop-blur-sm rounded-full p-2 shadow-md border border-border/50 hover:bg-muted transition-colors"
              aria-label="Предыдущий"
            >
              <ChevronLeft className="w-5 h-5 text-foreground/70" />
            </button>
          )}

          {/* Scrollable container */}
          <div
            ref={scrollRef}
            onScroll={checkScroll}
            className={`flex items-center gap-8 md:gap-12 overflow-x-auto scroll-smooth px-6 md:px-12 ${!needsScroll ? 'justify-center' : ''}`}
            style={{ 
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {partners.map((partner, index) => (
              <a
                key={index}
                href={partner.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 flex items-center justify-center h-24 md:h-32 lg:h-36 opacity-80 hover:opacity-100 transition-opacity"
              >
                <img
                  src={partner.src}
                  alt={partner.alt}
                  className="h-full w-auto object-contain"
                  onLoad={checkScroll}
                />
              </a>
            ))}
          </div>

          {/* Right arrow */}
          {needsScroll && canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-10 bg-background/90 backdrop-blur-sm rounded-full p-2 shadow-md border border-border/50 hover:bg-muted transition-colors"
              aria-label="Следующий"
            >
              <ChevronRight className="w-5 h-5 text-foreground/70" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
