import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, Snowflake, User, LogIn, LogOut, Briefcase } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
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
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [isPerformer, setIsPerformer] = useState(false);

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

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="relative">
            <Snowflake className="h-8 w-8 text-accent transition-transform group-hover:rotate-45 duration-300" />
            <div className="absolute inset-0 bg-accent/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="font-display text-xl font-bold text-foreground">
            ДедМороз<span className="text-accent">.kg</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link 
            to="/catalog" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Каталог
          </Link>
          <Link 
            to="/how-it-works" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Как это работает
          </Link>
          <Link 
            to="/become-performer" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Исполнителям
          </Link>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          {!loading && (
            <>
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <User className="h-4 w-4" />
                      {user.user_metadata?.full_name || 'Аккаунт'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {isPerformer && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to="/performer">
                            <Briefcase className="h-4 w-4 mr-2" />
                            Кабинет исполнителя
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard">Мои заказы</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile">Профиль</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                      <LogOut className="h-4 w-4 mr-2" />
                      Выйти
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/auth">
                      <LogIn className="h-4 w-4 mr-1" />
                      Войти
                    </Link>
                  </Button>
                  <Button variant="gold" size="sm" asChild>
                    <Link to="/auth">
                      Регистрация
                    </Link>
                  </Button>
                </>
              )}
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-accent/10 transition-colors"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border bg-background animate-fade-in">
          <nav className="container py-4 flex flex-col gap-2">
            <Link 
              to="/catalog" 
              className="px-4 py-2 rounded-lg hover:bg-secondary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Каталог
            </Link>
            <Link 
              to="/how-it-works" 
              className="px-4 py-2 rounded-lg hover:bg-secondary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Как это работает
            </Link>
            <Link 
              to="/become-performer" 
              className="px-4 py-2 rounded-lg hover:bg-secondary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Исполнителям
            </Link>
            <div className="border-t border-border my-2" />
            {user ? (
              <>
                {isPerformer && (
                  <Link 
                    to="/performer" 
                    className="px-4 py-2 rounded-lg hover:bg-secondary transition-colors font-medium text-primary"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Кабинет исполнителя
                  </Link>
                )}
                <Link 
                  to="/dashboard" 
                  className="px-4 py-2 rounded-lg hover:bg-secondary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Мои заказы
                </Link>
                <button
                  onClick={() => {
                    handleSignOut();
                    setIsMenuOpen(false);
                  }}
                  className="px-4 py-2 rounded-lg hover:bg-destructive/10 text-destructive text-left transition-colors"
                >
                  Выйти
                </button>
              </>
            ) : (
              <div className="flex gap-2 px-4">
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <Link to="/auth" onClick={() => setIsMenuOpen(false)}>Войти</Link>
                </Button>
                <Button variant="gold" size="sm" className="flex-1" asChild>
                  <Link to="/auth" onClick={() => setIsMenuOpen(false)}>Регистрация</Link>
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
