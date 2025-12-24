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
  { href: "https://foodmonitoring.ru", src: partnerFoodmonitoring, alt: "Мониторинг питания" },
];

export function PartnersSection() {
  return (
    <section className="py-12 md:py-16 bg-snow-50">
      <div className="container">
        <h2 className="text-center text-lg md:text-xl font-medium text-winter-600 mb-8 md:mb-10">
          Нам доверяют
        </h2>
        
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 lg:gap-16">
          {partners.map((partner, index) => (
            <a
              key={index}
              href={partner.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-center h-12 md:h-14 opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300"
            >
              <img
                src={partner.src}
                alt={partner.alt}
                className="h-full w-auto object-contain"
              />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
