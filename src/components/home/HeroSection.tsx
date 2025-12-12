import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, Search, Sparkles, Star, CalendarIcon } from 'lucide-react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [snowflakes, setSnowflakes] = useState<React.CSSProperties[]>([]);
  const [stars, setStars] = useState<React.CSSProperties[]>([]);
  const [calendarOpen, setCalendarOpen] = useState(false);

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
    if (selectedDate) params.set('date', format(selectedDate, 'yyyy-MM-dd'));
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

      <div className="container relative z-10 py-10 md:py-20">
        <div className="max-w-4xl mx-auto text-center space-y-6 md:space-y-8">
          {/* Magical badge */}
          <div 
            className="hidden md:inline-flex items-center gap-3 px-6 py-3 rounded-full animate-fade-in"
            style={{
              background: 'rgba(15, 25, 50, 0.6)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(234, 179, 8, 0.3)'
            }}
          >
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
          <p className="hidden md:block text-lg md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Подарите детям настоящее новогоднее чудо! ✨<br />
            Проверенные исполнители, волшебные программы, незабываемые эмоции
          </p>

          {/* Search Form with glass effect */}
          <div 
            className="mt-10 p-6 md:p-8 rounded-3xl shadow-2xl animate-fade-in-up"
            style={{ 
              animationDelay: '0.3s',
              background: 'rgba(15, 25, 50, 0.7)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 0 60px rgba(139, 92, 246, 0.2), 0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
              {/* Date */}
              <div className="relative">
                <label className="block text-sm text-gold-light mb-2 text-left font-medium">📅 Дата визита</label>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <button
                      className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/10 border border-white/20 text-white text-left focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 transition-all relative min-h-[56px]"
                    >
                      <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gold/70" />
                      {selectedDate ? (
                        format(selectedDate, 'd MMMM', { locale: ru })
                      ) : (
                        <span className="text-white/50">Выберите дату</span>
                      )}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-winter-900 border-magic-gold/20" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        setSelectedDate(date);
                        setCalendarOpen(false);
                      }}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
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
                    <option value="" className="bg-slate-800 text-white">Любое время</option>
                    {Array.from({ length: 24 }, (_, i) => i + 1).map((hour) => {
                      const displayHour = hour === 24 ? '24:00' : `${hour.toString().padStart(2, '0')}:00`;
                      return (
                        <option key={hour} value={displayHour} className="bg-slate-800 text-white">
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
                    <option value="" className="bg-slate-800 text-white">Все районы</option>
                    <optgroup label="Самара" className="bg-slate-800 text-white">
                      {districtGroups.samara.districts.map((d) => (
                        <option key={d.id} value={d.slug} className="bg-slate-800 text-white">
                          {d.name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Тольятти" className="bg-slate-800 text-white">
                      {districtGroups.tolyatti.districts.map((d) => (
                        <option key={d.id} value={d.slug} className="bg-slate-800 text-white">
                          {d.name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Другие города" className="bg-slate-800 text-white">
                      {districtGroups.cities.districts.map((d) => (
                        <option key={d.id} value={d.slug} className="bg-slate-800 text-white">
                          {d.name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Районы области" className="bg-slate-800 text-white">
                      {districtGroups.oblastRayons.districts.map((d) => (
                        <option key={d.id} value={d.slug} className="bg-slate-800 text-white">
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
                  className="w-full h-[52px] md:h-[58px] px-4 md:px-6 rounded-xl bg-gradient-to-r from-magic-gold via-amber-400 to-magic-gold text-winter-950 font-bold text-lg md:text-xl shadow-lg shadow-magic-gold/30 hover:shadow-xl hover:shadow-magic-gold/40 transition-all duration-300 flex items-center justify-center gap-2 hover:scale-105 min-h-[44px]"
                >
                  ✨ Вжухх!
                </button>
              </div>
            </div>
          </div>

          {/* Trust badges with magical styling */}
          <div 
            className="flex md:flex-wrap md:justify-center gap-3 md:gap-8 text-xs md:text-sm animate-fade-in-up overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:overflow-visible"
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
                className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 rounded-full transition-all duration-300 hover:scale-105 flex-shrink-0"
                style={{
                  background: 'rgba(15, 25, 50, 0.5)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <span className="text-base md:text-xl">{badge.icon}</span>
                <span className="text-white/80 whitespace-nowrap">{badge.text}</span>
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
