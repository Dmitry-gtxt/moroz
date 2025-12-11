import { Link, useLocation, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  User, 
  ShoppingCart, 
  LogOut,
  Home,
  Snowflake,
  Search,
  Star
} from 'lucide-react';

const navItems = [
  { to: '/cabinet', icon: LayoutDashboard, label: 'Обзор' },
  { to: '/cabinet/catalog', icon: Search, label: 'Каталог' },
  { to: '/cabinet/bookings', icon: ShoppingCart, label: 'Мои заказы' },
  { to: '/cabinet/profile', icon: User, label: 'Профиль' },
];

interface CustomerLayoutProps {
  children: React.ReactNode;
}

export function CustomerLayout({ children }: CustomerLayoutProps) {
  const { user, signOut, loading } = useAuth();
  const location = useLocation();
  const [hasPerformerProfile, setHasPerformerProfile] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkPerformerProfile() {
      if (!user) return;

      const { data } = await supabase
        .from('performer_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      setHasPerformerProfile(!!data);
    }

    if (user) {
      checkPerformerProfile();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth?redirect=/cabinet" replace />;
  }

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <Snowflake className="h-7 w-7 text-accent" />
            <span className="font-display font-bold text-lg text-foreground">
              Дед-Морозы<span className="text-accent">.РФ</span>
            </span>
          </Link>
          <p className="text-xs text-muted-foreground mt-1">Личный кабинет</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}

        </nav>

        <div className="p-4 border-t border-border space-y-2">
          {/* Performer cabinet button */}
          {hasPerformerProfile === false ? (
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 bg-gradient-to-r from-accent/20 to-primary/20 hover:from-accent/30 hover:to-primary/30 text-foreground border border-accent/30"
              asChild
            >
              <Link to="/become-performer">
                <Star className="h-5 w-5 text-accent" />
                Подать заявку
              </Link>
            </Button>
          ) : hasPerformerProfile === true ? (
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 bg-gradient-to-r from-accent/20 to-primary/20 hover:from-accent/30 hover:to-primary/30 text-foreground border border-accent/30"
              asChild
            >
              <Link to="/performer">
                <Snowflake className="h-5 w-5 text-accent" />
                Кабинет Деда Мороза
              </Link>
            </Button>
          ) : null}
          
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
            asChild
          >
            <Link to="/">
              <Home className="h-5 w-5" />
              На главную
            </Link>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
            onClick={signOut}
          >
            <LogOut className="h-5 w-5" />
            Выйти
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}