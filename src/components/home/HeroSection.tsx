import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, Search, Sparkles } from 'lucide-react';
import { districts } from '@/data/mockData';

export function HeroSection() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (selectedDate) params.set('date', selectedDate);
    if (selectedTime) params.set('time', selectedTime);
    if (selectedDistrict) params.set('district', selectedDistrict);
    navigate(`/catalog?${params.toString()}`);
  };

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-hero">
      {/* Animated snowflakes background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute text-white/10 animate-snowfall"
            style={{
              left: `${Math.random() * 100}%`,
              animationDuration: `${10 + Math.random() * 20}s`,
              animationDelay: `${Math.random() * 10}s`,
              fontSize: `${10 + Math.random() * 20}px`,
            }}
          >
            ❄
          </div>
        ))}
      </div>

      {/* Decorative gradient orbs */}
      <div className="absolute top-20 right-20 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-20 w-64 h-64 bg-frost/10 rounded-full blur-3xl" />

      <div className="container relative z-10 py-20">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm animate-fade-in">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="text-sm text-white/90">Сезон 2024-2025 открыт!</span>
          </div>

          {/* Main heading */}
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Дед Мороз на дом
            <br />
            <span className="text-accent">в Бишкеке</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-white/80 max-w-xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Быстрый поиск проверенных Дедов Морозов и Снегурочек. 
            Честные отзывы, безопасная предоплата.
          </p>

          {/* Search Form */}
          <div 
            className="mt-8 p-4 md:p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 animate-fade-in-up"
            style={{ animationDelay: '0.3s' }}
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Date */}
              <div className="relative">
                <label className="block text-xs text-white/60 mb-1 text-left">Дата</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-accent/50"
                  />
                </div>
              </div>

              {/* Time */}
              <div className="relative">
                <label className="block text-xs text-white/60 mb-1 text-left">Время</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                  <select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-accent/50"
                  >
                    <option value="" className="text-foreground">Любое время</option>
                    <option value="morning" className="text-foreground">Утро (10:00-12:00)</option>
                    <option value="afternoon" className="text-foreground">День (14:00-16:00)</option>
                    <option value="evening" className="text-foreground">Вечер (18:00-20:00)</option>
                  </select>
                </div>
              </div>

              {/* District */}
              <div className="relative">
                <label className="block text-xs text-white/60 mb-1 text-left">Район</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-accent/50"
                  >
                    <option value="" className="text-foreground">Все районы</option>
                    {districts.map((d) => (
                      <option key={d.id} value={d.slug} className="text-foreground">
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Search Button */}
              <div className="flex items-end">
                <Button 
                  variant="hero" 
                  size="lg" 
                  className="w-full"
                  onClick={handleSearch}
                >
                  <Search className="h-5 w-5" />
                  Найти
                </Button>
              </div>
            </div>
          </div>

          {/* Trust badges */}
          <div 
            className="flex flex-wrap justify-center gap-6 text-sm text-white/60 animate-fade-in-up"
            style={{ animationDelay: '0.4s' }}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span>100+ исполнителей</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent" />
              <span>500+ отзывов</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <span>Безопасная оплата</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
