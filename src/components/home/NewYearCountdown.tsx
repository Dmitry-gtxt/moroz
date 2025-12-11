import { useState, useEffect } from 'react';
import { Sparkles, Star } from 'lucide-react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function NewYearCountdown() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const newYear = new Date(now.getFullYear() + 1, 0, 1);
      
      if (now >= newYear) {
        newYear.setFullYear(newYear.getFullYear() + 1);
      }
      
      const difference = newYear.getTime() - now.getTime();
      
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / (1000 * 60)) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    
    return () => clearInterval(timer);
  }, []);

  const timeBlocks = [
    { value: timeLeft.days, label: 'дн' },
    { value: timeLeft.hours, label: 'ч' },
    { value: timeLeft.minutes, label: 'мин' },
    { value: timeLeft.seconds, label: 'сек' },
  ];

  return (
    <section className="relative py-8 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-winter-900/50 via-magic-purple/20 to-winter-900/50" />
      
      {/* Animated stars */}
      {[...Array(10)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-magic-gold rounded-full animate-twinkle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
          }}
        />
      ))}
      
      <div className="container relative z-10">
        <div className="max-w-md mx-auto">
          {/* Compact card */}
          <div className="relative glass-card rounded-2xl p-4 md:p-6 border border-magic-gold/20">
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-magic-gold/20 to-magic-cyan/20 rounded-2xl blur-lg opacity-50" />
            
            <div className="relative">
              {/* Header */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-magic-gold animate-pulse" />
                <h2 className="text-lg md:text-xl font-display font-bold text-gradient-gold">
                  До Нового Года
                </h2>
                <Sparkles className="w-4 h-4 text-magic-gold animate-pulse" />
              </div>
              
              {/* Countdown - 2x2 grid */}
              <div className="grid grid-cols-4 gap-2 md:gap-3">
                {timeBlocks.map((block, index) => (
                  <div key={index} className="text-center">
                    <div className="text-2xl md:text-3xl font-display font-bold text-gradient-magic tabular-nums">
                      {block.value.toString().padStart(2, '0')}
                    </div>
                    <div className="text-[10px] md:text-xs text-snow-300/70 uppercase tracking-wider">
                      {block.label}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* CTA text */}
              <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-magic-gold/20">
                <Star className="w-3 h-3 text-magic-gold" />
                <span className="text-xs text-snow-300/70">Успейте заказать Деда Мороза!</span>
                <Star className="w-3 h-3 text-magic-gold" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
