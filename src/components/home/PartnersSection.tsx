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
  return (
    <section className="py-8 md:py-12 bg-background border-t border-border/50">
      <div className="container">
        <h2 className="text-center text-lg md:text-xl font-medium text-muted-foreground mb-6 md:mb-8">
          Наши партнёры
        </h2>
        
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 lg:gap-14">
          {partners.map((partner, index) => (
            <a
              key={index}
              href={partner.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center h-16 md:h-20 opacity-70 hover:opacity-100 transition-opacity"
            >
              <img
                src={partner.src}
                alt={partner.alt}
                className="h-full w-auto max-w-[120px] md:max-w-[150px] object-contain"
              />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
