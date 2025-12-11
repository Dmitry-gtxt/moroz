import { useState, useEffect } from 'react';
import { Sparkles, Gift, Star } from 'lucide-react';

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
      
      // If we're already past New Year, target next year
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
    { value: timeLeft.days, label: 'дней' },
    { value: timeLeft.hours, label: 'часов' },
    { value: timeLeft.minutes, label: 'минут' },
    { value: timeLeft.seconds, label: 'секунд' },
  ];

  return (
    <section className="relative py-16 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-winter-900/50 via-magic-purple/20 to-winter-900/50" />
      
      {/* Animated stars */}
      {[...Array(20)].map((_, i) => (
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
      
      {/* Decorative elements */}
      <div className="absolute top-10 left-10 text-magic-gold/20 animate-float">
        <Gift className="w-16 h-16" />
      </div>
      <div className="absolute bottom-10 right-10 text-magic-gold/20 animate-float" style={{ animationDelay: '1s' }}>
        <Star className="w-12 h-12" />
      </div>
      
      <div className="container relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-magic-gold/10 border border-magic-gold/30 mb-4">
            <Sparkles className="w-4 h-4 text-magic-gold animate-pulse" />
            <span className="text-sm font-medium text-magic-gold">Волшебство близко!</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-gradient-gold mb-2">
            До Нового Года осталось
          </h2>
          <p className="text-snow-300/70">Успейте заказать Деда Мороза!</p>
        </div>
        
        {/* Countdown blocks */}
        <div className="flex justify-center gap-3 md:gap-6 flex-wrap">
          {timeBlocks.map((block, index) => (
            <div key={index} className="relative group">
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-magic-gold/30 to-magic-cyan/30 rounded-2xl blur-lg opacity-50 group-hover:opacity-100 transition-opacity" />
              
              {/* Card */}
              <div className="relative glass-card rounded-2xl p-4 md:p-6 min-w-[80px] md:min-w-[120px] text-center border border-magic-gold/20">
                {/* Sparkle decoration */}
                <div className="absolute -top-2 -right-2 text-magic-gold animate-sparkle">
                  <Sparkles className="w-4 h-4" />
                </div>
                
                {/* Number */}
                <div className="text-4xl md:text-6xl font-display font-bold text-gradient-magic mb-1 tabular-nums">
                  {block.value.toString().padStart(2, '0')}
                </div>
                
                {/* Label */}
                <div className="text-xs md:text-sm text-snow-300/70 uppercase tracking-wider">
                  {block.label}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Decorative line */}
        <div className="flex items-center justify-center gap-4 mt-10">
          <div className="h-px w-20 bg-gradient-to-r from-transparent to-magic-gold/50" />
          <Star className="w-4 h-4 text-magic-gold animate-pulse" />
          <div className="h-px w-20 bg-gradient-to-l from-transparent to-magic-gold/50" />
        </div>
      </div>
    </section>
  );
}
