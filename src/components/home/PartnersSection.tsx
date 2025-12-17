import partnerKolibri from '@/assets/partner-kolibri.png';
import partnerPovuzam from '@/assets/partner-povuzam.png';
import partnerUmius from '@/assets/partner-umius.png';
import partnerUchidron from '@/assets/partner-uchidron.png';

export function PartnersSection() {
  return (
    <section className="py-12 md:py-16 bg-snow-100">
      <div className="container">
        <h2 className="text-center text-xl md:text-2xl font-display font-semibold text-winter-900 mb-8">
          Наши партнёры
        </h2>
        <div className="flex items-center justify-center gap-12 flex-wrap">
          <img 
            src={partnerKolibri} 
            alt="Kolibri Expert" 
            className="h-[80px] opacity-80 hover:opacity-100 transition-opacity" 
          />
          <img 
            src={partnerPovuzam} 
            alt="Повузам" 
            className="h-[80px] opacity-80 hover:opacity-100 transition-opacity" 
          />
          <img 
            src={partnerUmius} 
            alt="УМИУС" 
            className="h-[80px] opacity-80 hover:opacity-100 transition-opacity" 
          />
          <img 
            src={partnerUchidron} 
            alt="УчиДрон" 
            className="h-[80px] opacity-80 hover:opacity-100 transition-opacity" 
          />
        </div>
      </div>
    </section>
  );
}
