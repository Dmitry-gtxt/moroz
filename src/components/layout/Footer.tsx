import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Sparkles, Snowflake, Star, Heart } from 'lucide-react';
import santaHatLogo from '@/assets/santa-hat-logo.png';

export function Footer() {
  return (
    <footer className="relative bg-gradient-to-b from-winter-950 to-winter-900 text-snow-200 overflow-hidden">
      {/* Decorative elements - hidden on mobile */}
      <div className="absolute inset-0 pointer-events-none hidden md:block">
        {[...Array(15)].map((_, i) => (
          <Snowflake
            key={i}
            className="absolute text-magic-gold/5 animate-float-slow"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${20 + Math.random() * 30}px`,
              height: `${20 + Math.random() * 30}px`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-magic-purple/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-magic-cyan/5 rounded-full blur-3xl" />
      </div>
      
      {/* Top decorative border */}
      <div className="h-px bg-gradient-to-r from-transparent via-magic-gold/30 to-transparent" />
      
      <div className="container relative z-10 pt-6 md:pt-16 pb-4 md:pb-5">
        {/* Mobile: Compact layout */}
        <div className="md:hidden space-y-4">
          {/* Brand - compact */}
          <div className="flex items-center justify-center gap-2">
            <img src={santaHatLogo} alt="Дед-Морозы.РФ" className="h-8 w-8" />
            <span className="font-display text-lg font-bold text-snow-100">
              Дед-Морозы<span className="text-gradient-gold">.РФ</span>
            </span>
          </div>
          
          {/* Contact - horizontal */}
          <div className="flex justify-center gap-4 text-xs">
            <a href="tel:+79953829736" className="flex items-center gap-1.5 text-snow-400">
              <Phone className="h-3.5 w-3.5 text-magic-gold" />
              +7 (995) 382-97-36
            </a>
            <a href="mailto:ded-morozy@gtxt.biz" className="flex items-center gap-1.5 text-snow-400">
              <Mail className="h-3.5 w-3.5 text-magic-gold" />
              ded-morozy@gtxt.biz
            </a>
          </div>
          
          {/* Quick links - grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-center">
            <Link to="/catalog" className="text-snow-400 py-1">Каталог</Link>
            <Link to="/become-performer" className="text-snow-400 py-1">Стать исполнителем</Link>
            <Link to="/how-it-works" className="text-snow-400 py-1">Как заказать</Link>
            <Link to="/performer-code" className="text-snow-400 py-1">Кодекс исполнителя</Link>
          </div>
        </div>

        {/* Desktop: Full layout */}
        <div className="hidden md:grid grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-5">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute -inset-2 bg-magic-gold/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                <img src={santaHatLogo} alt="Дед-Морозы.РФ" className="h-12 w-12 relative" />
              </div>
              <div>
                <span className="font-display text-2xl font-bold text-snow-100 block">
                  Дед-Морозы<span className="text-gradient-gold">.РФ</span>
                </span>
                <span className="text-xs text-snow-400/60 tracking-wider">ВОЛШЕБСТВО НА ДОМ</span>
              </div>
            </Link>
            <p className="text-sm text-snow-400 leading-relaxed">
              Лучший сервис для заказа Деда Мороза и Снегурочки в Самаре и Самарской области. 
              Проверенные исполнители, честные отзывы.
            </p>
            <div className="flex items-center gap-2 text-sm text-snow-400">
              <div className="flex -space-x-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-magic-gold fill-magic-gold" />
                ))}
              </div>
              <span>Рейтинг 4.9 / 5</span>
            </div>
          </div>

          {/* For Clients */}
          <div className="space-y-5">
            <h4 className="font-display font-semibold text-snow-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-magic-gold" />
              Родителям
            </h4>
            <ul className="space-y-2 text-sm">
              {[
                { to: '/catalog', label: 'Каталог исполнителей' },
                { to: '/how-it-works', label: 'Как заказать' },
                { to: '/cabinet', label: 'Личный кабинет' },
                { to: '/customer-rules', label: 'Правила для заказчиков' },
              ].map((link) => (
                <li key={link.to}>
                  <Link 
                    to={link.to} 
                    className="text-snow-400 hover:text-magic-gold transition-colors inline-flex items-center gap-1 group py-2 min-h-[44px]"
                  >
                    <span className="w-0 group-hover:w-2 h-px bg-magic-gold transition-all" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Performers */}
          <div className="space-y-5">
            <h4 className="font-display font-semibold text-snow-100 flex items-center gap-2">
              <Star className="w-4 h-4 text-magic-gold" />
              Исполнителям
            </h4>
            <ul className="space-y-2 text-sm">
              {[
                { to: '/become-performer', label: 'Стать исполнителем' },
                { to: '/performer', label: 'Личный кабинет' },
                { to: '/performer-code', label: 'Кодекс исполнителя' },
                { to: '/performer-agreement', label: 'Договор оказания услуг' },
              ].map((link) => (
                <li key={link.to}>
                  <Link 
                    to={link.to} 
                    className="text-snow-400 hover:text-magic-gold transition-colors inline-flex items-center gap-1 group py-2 min-h-[44px]"
                  >
                    <span className="w-0 group-hover:w-2 h-px bg-magic-gold transition-all" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-5">
            <h4 className="font-display font-semibold text-snow-100 flex items-center gap-2">
              <Heart className="w-4 h-4 text-santa-400" />
              Контакты
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a 
                  href="tel:+79953829736" 
                  className="flex items-center gap-3 text-snow-400 hover:text-magic-gold transition-colors group py-2 min-h-[44px]"
                >
                  <div className="p-2 rounded-lg bg-magic-gold/10 border border-magic-gold/20 group-hover:border-magic-gold/40 transition-colors">
                    <Phone className="h-4 w-4 text-magic-gold" />
                  </div>
                  +7 (995) 382-97-36
                </a>
              </li>
              <li>
                <a 
                  href="mailto:ded-morozy@gtxt.biz" 
                  className="flex items-center gap-3 text-snow-400 hover:text-magic-gold transition-colors group py-2 min-h-[44px]"
                >
                  <div className="p-2 rounded-lg bg-magic-gold/10 border border-magic-gold/20 group-hover:border-magic-gold/40 transition-colors">
                    <Mail className="h-4 w-4 text-magic-gold" />
                  </div>
                  ded-morozy@gtxt.biz
                </a>
              </li>
              <li className="flex items-start gap-3 text-snow-400 py-2">
                <div className="p-2 rounded-lg bg-magic-gold/10 border border-magic-gold/20">
                  <MapPin className="h-4 w-4 text-magic-gold" />
                </div>
                <span>г. Ярцево,<br/>Смоленская область</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal links & Copyright */}
        <div className="border-t border-magic-gold/10 mt-4 md:mt-12 pt-2">
          <div className="flex flex-wrap justify-center gap-x-3 md:gap-x-4 gap-y-0 text-[10px] md:text-sm text-snow-500 mb-2">
            {[
              { to: '/terms', label: 'Соглашение' },
              { to: '/privacy', label: 'Конфиденциальность' },
              { to: '/offer', label: 'Оферта' },
              { to: '/refund-policy', label: 'Возврат' },
              { to: '/cookies', label: 'Cookie' },
              { to: '/students', label: 'Студентам' },
              { to: '/bank-info', label: 'Для банка' },
            ].map((link) => (
              <Link 
                key={link.to}
                to={link.to} 
                className="hover:text-magic-gold transition-colors py-1 md:py-2 md:min-h-[44px] inline-flex items-center"
              >
                {link.label}
              </Link>
            ))}
          </div>
          
          {/* Copyright & Requisites */}
          <p className="text-[10px] md:text-xs text-snow-500 text-center flex flex-wrap items-center justify-center gap-x-1 md:gap-x-2">
            <span>© 2025 <span className="text-gradient-gold font-semibold">Дед-Морозы.РФ</span></span>
            <span className="hidden md:inline text-snow-600">•</span>
            <span className="hidden md:inline text-snow-600">ИП Шевчук Д.С. • ИНН: 771394875700 • ОГРН: 323673300005598</span>
            <span className="md:hidden text-snow-600">• ИП Шевчук Д.С.</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
