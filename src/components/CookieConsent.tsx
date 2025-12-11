import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const COOKIE_CONSENT_KEY = 'cookie-consent-accepted';

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Small delay to avoid flash on page load
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'declined');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] animate-in slide-in-from-bottom-4 duration-500">
      <div className="container max-w-4xl">
        <div className="bg-card border border-border rounded-2xl shadow-xl p-4 md:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1 pr-8 sm:pr-0">
              <p className="text-sm text-muted-foreground">
                Мы используем файлы cookie для обеспечения работы сайта и улучшения вашего опыта. 
                Продолжая использовать сайт, вы соглашаетесь с{' '}
                <Link to="/cookies" className="text-accent hover:underline">
                  Политикой использования cookie
                </Link>{' '}
                и{' '}
                <Link to="/privacy" className="text-accent hover:underline">
                  Политикой конфиденциальности
                </Link>.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <Button variant="outline" size="sm" onClick={handleDecline} className="flex-1 sm:flex-none min-h-[44px]">
                Отклонить
              </Button>
              <Button variant="gold" size="sm" onClick={handleAccept} className="flex-1 sm:flex-none min-h-[44px]">
                Принять
              </Button>
            </div>
          </div>
          <button
            onClick={handleDecline}
            className="absolute top-3 right-3 p-2 text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center sm:hidden"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
