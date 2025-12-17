import partnerLogo from '@/assets/partner-logo.png';

export function PartnersSection() {
  return (
    <section className="py-12 md:py-16 bg-winter-900/50">
      <div className="container">
        <h2 className="text-center text-xl md:text-2xl font-display font-semibold text-snow-100 mb-8">
          Наши партнёры
        </h2>
        <div className="flex items-center justify-center gap-8 flex-wrap">
          <img 
            src={partnerLogo} 
            alt="Партнёр" 
            className="h-[50px] opacity-70 hover:opacity-100 transition-opacity" 
          />
        </div>
      </div>
    </section>
  );
}
