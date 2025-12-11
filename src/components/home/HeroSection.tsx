import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, Search, Sparkles, Star } from 'lucide-react';
import { districtGroups } from '@/data/mockData';
import heroImage from '@/assets/magical-winter-hero.jpg';

// Snowflake component
const Snowflake = ({ style }: { style: React.CSSProperties }) => (
  <div className="absolute text-white pointer-events-none animate-snowfall" style={style}>
    ❄
  </div>
);

// Star component
const TwinklingStar = ({ style }: { style: React.CSSProperties }) => (
  <div className="absolute text-gold-light pointer-events-none animate-twinkle" style={style}>
    ✦
  </div>
);

export function HeroSection() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [snowflakes, setSnowflakes] = useState<React.CSSProperties[]>([]);
  const [stars, setStars] = useState<React.CSSProperties[]>([]);

  useEffect(() => {
    // Generate snowflakes
    const flakes = Array.from({ length: 40 }, () => ({
      left: `${Math.random() * 100}%`,
      animationDuration: `${8 + Math.random() * 15}s`,
      animationDelay: `${Math.random() * 8}s`,
      fontSize: `${8 + Math.random() * 16}px`,
      opacity: 0.3 + Math.random() * 0.5,
    }));
    setSnowflakes(flakes);

    // Generate twinkling stars
    const starElements = Array.from({ length: 25 }, () => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 60}%`,
      animationDelay: `${Math.random() * 3}s`,
      fontSize: `${6 + Math.random() * 10}px`,
    }));
    setStars(starElements);
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (selectedDate) params.set('date', selectedDate);
    if (selectedTime) params.set('time', selectedTime);
    if (selectedDistrict) params.set('district', selectedDistrict);
    navigate(`/catalog?${params.toString()}`);
  };

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background Image with overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-winter-dark/70 via-winter-dark/50 to-winter-dark/80" />
      
      {/* Aurora effect overlay */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-magic-cyan/30 rounded-full blur-[100px] animate-aurora" />
        <div className="absolute top-20 right-1/4 w-80 h-80 bg-magic-purple/20 rounded-full blur-[80px] animate-aurora" style={{ animationDelay: '2s' }} />
      </div>

      {/* Animated snowflakes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {snowflakes.map((style, i) => (
          <Snowflake key={i} style={style} />
        ))}
      </div>

      {/* Twinkling stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {stars.map((style, i) => (
          <TwinklingStar key={i} style={style} />
        ))}
      </div>

      {/* Magical sparkles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={`sparkle-${i}`}
            className="absolute text-gold animate-sparkle"
            style={{
              left: `${10 + i * 12}%`,
              top: `${15 + Math.random() * 50}%`,
              animationDelay: `${i * 0.4}s`,
              fontSize: `${12 + Math.random() * 8}px`,
            }}
          >
            ✨
          </div>
        ))}
      </div>

      {/* Decorative golden orbs */}
      <div className="absolute top-32 right-16 w-64 h-64 bg-gold/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-32 left-16 w-48 h-48 bg-gold-light/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />

      <div className="container relative z-10 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Magical badge */}
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full glass border-gold/30 animate-fade-in">
            <Sparkles className="h-5 w-5 text-gold animate-pulse" />
            <span className="text-base text-white/90 font-medium tracking-wide">Волшебство уже близко!</span>
            <Star className="h-5 w-5 text-gold animate-pulse" style={{ animationDelay: '0.5s' }} />
          </div>

          {/* Main heading with magical styling */}
          <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold text-white leading-tight">
              Закажите
              <span className="block text-gradient-magic mt-2">Деда Мороза</span>
            </h1>
            <p className="font-heading text-xl md:text-2xl text-gold-light tracking-wider uppercase">
              в Самаре и области
            </p>
          </div>

          {/* Magical subtitle */}
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Подарите детям настоящее новогоднее чудо! ✨<br />
            Проверенные исполнители, волшебные программы, незабываемые эмоции
          </p>

          {/* Search Form with glass effect */}
          <div 
            className="mt-10 p-6 md:p-8 rounded-3xl glass border-white/20 shadow-magic animate-fade-in-up"
            style={{ animationDelay: '0.3s' }}
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
              {/* Date */}
              <div className="relative">
                <label className="block text-sm text-gold-light mb-2 text-left font-medium">📅 Дата визита</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gold/70" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 transition-all"
                  />
                </div>
              </div>

              {/* Time */}
              <div className="relative">
                <label className="block text-sm text-gold-light mb-2 text-left font-medium">🕐 Время</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gold/70" />
                  <select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/10 border border-white/20 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 transition-all"
                  >
                    <option value="" className="text-foreground">Любое время</option>
                    {Array.from({ length: 24 }, (_, i) => i + 1).map((hour) => {
                      const displayHour = hour === 24 ? '24:00' : `${hour.toString().padStart(2, '0')}:00`;
                      return (
                        <option key={hour} value={displayHour} className="text-foreground">
                          {displayHour}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* District */}
              <div className="relative">
                <label className="block text-sm text-gold-light mb-2 text-left font-medium">📍 Район</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gold/70" />
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/10 border border-white/20 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 transition-all"
                  >
                    <option value="" className="text-foreground">Все районы</option>
                    <optgroup label="Самара" className="text-foreground">
                      {districtGroups.samara.districts.map((d) => (
                        <option key={d.id} value={d.slug} className="text-foreground">
                          {d.name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Тольятти" className="text-foreground">
                      {districtGroups.tolyatti.districts.map((d) => (
                        <option key={d.id} value={d.slug} className="text-foreground">
                          {d.name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Другие города" className="text-foreground">
                      {districtGroups.cities.districts.map((d) => (
                        <option key={d.id} value={d.slug} className="text-foreground">
                          {d.name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Районы области" className="text-foreground">
                      {districtGroups.oblastRayons.districts.map((d) => (
                        <option key={d.id} value={d.slug} className="text-foreground">
                          {d.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* Search Button */}
              <div className="flex items-end">
                <button 
                  onClick={handleSearch}
                  className="w-full h-[58px] px-6 rounded-xl bg-gradient-to-r from-magic-gold via-amber-400 to-magic-gold text-winter-950 font-bold text-xl shadow-lg shadow-magic-gold/30 hover:shadow-xl hover:shadow-magic-gold/40 transition-all duration-300 flex items-center justify-center gap-2 hover:scale-105"
                >
                  ✨ Вжухх!
                </button>
              </div>
            </div>
          </div>

          {/* Trust badges with magical styling */}
          <div 
            className="flex flex-wrap justify-center gap-8 text-sm animate-fade-in-up"
            style={{ animationDelay: '0.5s' }}
          >
            {[
              { icon: '🎅', text: '100+ исполнителей' },
              { icon: '⭐', text: '500+ отзывов' },
              { icon: '🔒', text: 'Безопасная оплата' },
              { icon: '✨', text: 'Волшебные программы' },
            ].map((badge, i) => (
              <div 
                key={i}
                className="flex items-center gap-2 px-4 py-2 rounded-full glass border-white/10 hover:border-gold/30 transition-colors"
              >
                <span className="text-xl">{badge.icon}</span>
                <span className="text-white/80">{badge.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom gradient fade - matches next section */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[hsl(220,70%,8%)] to-transparent" />
    </section>
  );
}
