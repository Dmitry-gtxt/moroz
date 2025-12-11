import { useEffect, useState } from 'react';
import { Search, Calendar, PartyPopper, Sparkles } from 'lucide-react';
import { getCommissionRate, getPrepaymentPercentage } from '@/lib/pricing';

export function HowItWorks() {
  const [prepaymentPercent, setPrepaymentPercent] = useState(29);

  useEffect(() => {
    async function loadCommissionRate() {
      const rate = await getCommissionRate();
      setPrepaymentPercent(getPrepaymentPercentage(rate));
    }
    loadCommissionRate();
  }, []);

  const steps = [
    {
      icon: Search,
      emoji: '🔍',
      title: 'Выберите волшебника',
      description: 'Просмотрите каталог проверенных Дедов Морозов и Снегурочек. Посмотрите видео-приветствия и отзывы.',
    },
    {
      icon: Calendar,
      emoji: '📅',
      title: 'Забронируйте визит',
      description: `Выберите удобную дату и время из календаря исполнителя. Внесите ${prepaymentPercent}% предоплаты онлайн.`,
    },
    {
      icon: PartyPopper,
      emoji: '🎉',
      title: 'Встречайте чудо!',
      description: 'Дед Мороз приедет к вам домой и подарит детям незабываемые эмоции и веру в волшебство!',
    },
  ];
  return (
    <section className="py-24 bg-gradient-frost relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 text-6xl opacity-10 animate-float">❄️</div>
      <div className="absolute bottom-20 right-10 text-6xl opacity-10 animate-float" style={{ animationDelay: '1s' }}>⭐</div>
      <div className="absolute top-1/2 left-1/4 text-4xl opacity-10 animate-float" style={{ animationDelay: '2s' }}>✨</div>
      
      <div className="container">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 text-gold-dark mb-6">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Всего 3 простых шага</span>
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Как заказать <span className="text-gradient-gold">волшебство</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto">
            От выбора исполнителя до незабываемого праздника
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <div 
              key={index}
              className="relative group animate-fade-in"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-1/2 w-full h-0.5 bg-gradient-to-r from-gold/50 to-gold/20" />
              )}
              
              <div className="relative bg-card rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 text-center border border-border hover:border-gold/30 group-hover:-translate-y-2">
                {/* Step number badge */}
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-gradient-gold text-white font-bold flex items-center justify-center text-lg shadow-glow">
                  {index + 1}
                </div>
                
                {/* Emoji icon */}
                <div className="text-6xl mb-6 mt-4 group-hover:scale-110 transition-transform duration-300">
                  {step.emoji}
                </div>
                
                <h3 className="font-display text-2xl font-bold mb-4 text-foreground">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
