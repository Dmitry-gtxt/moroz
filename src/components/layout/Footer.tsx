import { Link } from 'react-router-dom';
import { Snowflake, Phone, Mail, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <Snowflake className="h-8 w-8 text-accent" />
              <span className="font-display text-xl font-bold">
                ДедМороз<span className="text-accent">.kg</span>
              </span>
            </Link>
            <p className="text-sm text-primary-foreground/70">
              Лучший сервис для заказа Деда Мороза и Снегурочки в Бишкеке. 
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
                <Link to="/faq" className="hover:text-accent transition-colors">
                  Частые вопросы
                </Link>
              </li>
            </ul>
          </div>

          {/* For Performers */}
          <div className="space-y-4">
            <h4 className="font-display font-semibold">Исполнителям</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li>
                <Link to="/for-performers" className="hover:text-accent transition-colors">
                  Стать Дедом Морозом
                </Link>
              </li>
              <li>
                <Link to="/performer/register" className="hover:text-accent transition-colors">
                  Регистрация
                </Link>
              </li>
              <li>
                <Link to="/performer/terms" className="hover:text-accent transition-colors">
                  Условия работы
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
                <a href="tel:+996555123456" className="hover:text-accent transition-colors">
                  +996 555 123 456
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-accent" />
                <a href="mailto:info@dedmoroz.kg" className="hover:text-accent transition-colors">
                  info@dedmoroz.kg
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-accent mt-0.5" />
                <span>г. Бишкек, Кыргызстан</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-primary-foreground/60">
          <p>© 2024 ДедМороз.kg. Все права защищены.</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-accent transition-colors">
              Политика конфиденциальности
            </Link>
            <Link to="/terms" className="hover:text-accent transition-colors">
              Оферта
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
