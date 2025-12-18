import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, User, LogIn, LogOut, Briefcase, Sparkles, Snowflake } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { useUnreadSupportMessages } from '@/hooks/useUnreadSupportMessages';
import santaHatLogo from '@/assets/santa-hat-logo.png';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [isPerformer, setIsPerformer] = useState(false);
  const unreadMessagesCount = useUnreadMessages();
  const unreadSupportCount = useUnreadSupportMessages();
  
  const totalUnread = unreadMessagesCount + unreadSupportCount;

  useEffect(() => {
    async function checkPerformerRole() {
      if (!user) {
        setIsPerformer(false);
        return;
      }
      const { data } = await supabase
        .from('performer_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      setIsPerformer(!!data);
    }
    checkPerformerRole();
  }, [user]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-[hsl(220,80%,8%)] border-b border-[hsl(42,95%,55%,0.1)] shadow-lg shadow-[hsl(260,60%,45%,0.1)]">
      {/* Decorative top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(42,95%,55%,0.5)] to-transparent" />
      
      <div className="container flex h-18 items-center justify-between py-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="absolute -inset-2 bg-magic-gold/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
            <div className="relative p-1 rounded-full bg-gradient-to-br from-magic-gold/20 to-transparent">
              <img 
                src={santaHatLogo} 
                alt="Дед-Морозы.РФ" 
                className="h-10 w-10 transition-transform group-hover:scale-110 duration-300" 
              />
            </div>
            <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-magic-gold animate-sparkle" />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-xl font-bold text-snow-100 leading-tight">
              Дед-Морозы<span className="text-gradient-gold">.РФ</span>
            </span>
            <span className="text-[10px] text-snow-400/60 tracking-wider">ВОЛШЕБСТВО НА ДОМ</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {[
            { to: '/catalog', label: 'Каталог' },
            { to: '/how-it-works', label: 'Как это работает' },
            { to: '/become-performer', label: 'Исполнителям' },
          ].map((link) => (
            <Link 
              key={link.to}
              to={link.to} 
              className="relative px-4 py-2 text-sm font-medium text-snow-300 hover:text-snow-100 transition-colors group"
            >
              <span className="relative z-10">{link.label}</span>
              <div className="absolute inset-0 rounded-lg bg-magic-gold/0 group-hover:bg-magic-gold/10 transition-colors" />
              <div className="absolute bottom-1 left-4 right-4 h-px bg-gradient-to-r from-transparent via-magic-gold/0 group-hover:via-magic-gold/50 to-transparent transition-all" />
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          {!loading && (
            <>
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-winter-800/50 border border-magic-gold/20 text-snow-200 hover:border-magic-gold/40 hover:bg-winter-800 transition-all group">
                      <div className="relative">
                        <User className="h-4 w-4" />
                        {totalUnread > 0 ? (
                          <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1 animate-pulse">
                            {totalUnread > 99 ? '99+' : totalUnread}
                          </span>
                        ) : (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-magic-gold rounded-full animate-pulse" />
                        )}
                      </div>
                      <span className="text-sm font-medium">{user.user_metadata?.full_name || 'Аккаунт'}</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 bg-winter-900/95 backdrop-blur-xl border-magic-gold/20">
                    {isPerformer && (
                      <>
                        <DropdownMenuItem asChild className="hover:bg-magic-gold/10 focus:bg-magic-gold/10">
                          <Link to="/performer" className="flex items-center text-snow-200">
                            <Briefcase className="h-4 w-4 mr-2 text-magic-gold" />
                            Кабинет исполнителя
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-magic-gold/10" />
                      </>
                    )}
                    <DropdownMenuItem asChild className="hover:bg-magic-gold/10 focus:bg-magic-gold/10">
                      <Link to="/cabinet" className="text-snow-200">Личный кабинет</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="hover:bg-magic-gold/10 focus:bg-magic-gold/10">
                      <Link to="/cabinet/bookings" className="text-snow-200">Мои заказы</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="hover:bg-magic-gold/10 focus:bg-magic-gold/10">
                      <Link to="/cabinet/profile" className="text-snow-200">Профиль</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-magic-gold/10" />
                    <DropdownMenuItem 
                      onClick={handleSignOut} 
                      className="text-santa-400 hover:bg-santa-500/10 focus:bg-santa-500/10 hover:text-santa-300"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Выйти
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <button 
                    onClick={() => navigate('/auth?mode=login')}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-snow-300 hover:text-snow-100 border border-transparent hover:border-snow-700/50 transition-all"
                  >
                    <LogIn className="h-4 w-4" />
                    Войти
                  </button>
                  <button 
                    onClick={() => navigate('/auth?mode=register')}
                    className="relative group flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-magic-gold via-amber-400 to-magic-gold bg-[length:200%_100%] animate-shimmer" />
                    <div className="absolute inset-0 bg-gradient-to-r from-magic-gold/0 via-white/20 to-magic-gold/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="relative text-winter-950 flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Регистрация
                    </span>
                  </button>
                </>
              )}
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded-lg bg-winter-800/50 border border-magic-gold/20 hover:border-magic-gold/40 transition-colors relative"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? (
            <X className="h-6 w-6 text-snow-200" />
          ) : (
            <Menu className="h-6 w-6 text-snow-200" />
          )}
          {totalUnread > 0 && !isMenuOpen && (
            <span className="absolute -top-1 -right-1 min-w-4 h-4 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1 animate-pulse">
              {totalUnread > 99 ? '99+' : totalUnread}
            </span>
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-magic-gold/10 bg-winter-950/98 backdrop-blur-xl animate-fade-in">
          {/* Decorative snowflakes */}
          <div className="absolute top-4 right-4 text-magic-gold/10">
            <Snowflake className="w-12 h-12" />
          </div>
          
          <nav className="container py-6 flex flex-col gap-2 relative">
            {[
              { to: '/catalog', label: 'Каталог' },
              { to: '/how-it-works', label: 'Как это работает' },
              { to: '/become-performer', label: 'Исполнителям' },
            ].map((link) => (
              <Link 
                key={link.to}
                to={link.to} 
                className="px-4 py-3 rounded-xl text-snow-200 hover:bg-magic-gold/10 hover:text-snow-100 transition-colors border border-transparent hover:border-magic-gold/20"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            
            <div className="border-t border-magic-gold/10 my-3" />
            
            {user ? (
              <>
                {isPerformer && (
                  <Link 
                    to="/performer" 
                    className="px-4 py-3 rounded-xl bg-magic-gold/10 text-magic-gold font-medium border border-magic-gold/20"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Кабинет исполнителя
                    </div>
                  </Link>
                )}
                <Link 
                  to="/cabinet" 
                  className="px-4 py-3 rounded-xl text-snow-200 hover:bg-magic-gold/10 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Личный кабинет
                </Link>
                <Link 
                  to="/cabinet/bookings" 
                  className="px-4 py-3 rounded-xl text-snow-200 hover:bg-magic-gold/10 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Мои заказы
                </Link>
                <button
                  onClick={() => {
                    handleSignOut();
                    setIsMenuOpen(false);
                  }}
                  className="px-4 py-3 rounded-xl text-santa-400 hover:bg-santa-500/10 text-left transition-colors flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Выйти
                </button>
              </>
            ) : (
              <div className="flex gap-3 px-2 pt-2">
                <button 
                  onClick={() => { navigate('/auth?mode=login'); setIsMenuOpen(false); }}
                  className="flex-1 py-3 rounded-xl text-sm font-medium border border-snow-700/50 text-snow-200 hover:bg-snow-800/20 transition-all"
                >
                  Войти
                </button>
                <button 
                  onClick={() => { navigate('/auth?mode=register'); setIsMenuOpen(false); }}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-magic-gold to-amber-400 text-winter-950 hover:shadow-lg hover:shadow-magic-gold/20 transition-all"
                >
                  Регистрация
                </button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
