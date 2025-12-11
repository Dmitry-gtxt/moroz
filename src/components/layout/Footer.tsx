import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin } from 'lucide-react';
import santaHatLogo from '@/assets/santa-hat-logo.png';

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <img src={santaHatLogo} alt="Дед-Морозы.РФ" className="h-8 w-8" />
              <span className="font-display text-xl font-bold">
                Дед-Морозы<span className="text-accent">.РФ</span>
              </span>
            </Link>
            <p className="text-sm text-primary-foreground/70">
              Лучший сервис для заказа Деда Мороза и Снегурочки в Самаре и Самарской области. 
              Проверенные исполнители, честные отзывы.
            </p>
          </div>

          {/* For Clients */}
          <div className="space-y-4">
            <h4 className="font-display font-semibold">Родителям</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li>
                <Link to="/catalog" className="hover:text-accent transition-colors">
                  Каталог исполнителей
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-accent transition-colors">
                  Как заказать
                </Link>
              </li>
              <li>
                <Link to="/cabinet" className="hover:text-accent transition-colors">
                  Личный кабинет
                </Link>
              </li>
              <li>
                <Link to="/customer-rules" className="hover:text-accent transition-colors">
                  Правила для клиентов
                </Link>
              </li>
            </ul>
          </div>

          {/* For Performers */}
          <div className="space-y-4">
            <h4 className="font-display font-semibold">Исполнителям</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li>
                <Link to="/become-performer" className="hover:text-accent transition-colors">
                  Стать исполнителем
                </Link>
              </li>
              <li>
                <Link to="/performer" className="hover:text-accent transition-colors">
                  Личный кабинет
                </Link>
              </li>
              <li>
                <Link to="/performer-agreement" className="hover:text-accent transition-colors">
                  Договор с исполнителем
                </Link>
              </li>
              <li>
                <Link to="/performer-code" className="hover:text-accent transition-colors">
                  Кодекс поведения
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-display font-semibold">Контакты</h4>
            <ul className="space-y-3 text-sm text-primary-foreground/70">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-accent" />
                <a href="tel:+79953829736" className="hover:text-accent transition-colors">
                  +7 (995) 382-97-36
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-accent" />
                <a href="mailto:ded-morozy@gtxt.biz" className="hover:text-accent transition-colors">
                  ded-morozy@gtxt.biz
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-accent mt-0.5" />
                <span>г. Самара, Самарская область</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-primary-foreground/60">
          <p>© 2025-2026 Дед-Морозы.РФ • Сезон Года Змеи 🐍</p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link to="/terms" className="hover:text-accent transition-colors">
              Пользовательское соглашение
            </Link>
            <Link to="/privacy" className="hover:text-accent transition-colors">
              Конфиденциальность
            </Link>
            <Link to="/offer" className="hover:text-accent transition-colors">
              Оферта
            </Link>
            <Link to="/refund-policy" className="hover:text-accent transition-colors">
              Возврат
            </Link>
            <Link to="/cookies" className="hover:text-accent transition-colors">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
