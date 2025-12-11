import { Link, useLocation, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  User, 
  ShoppingCart, 
  LogOut,
  Home,
  Snowflake,
  Search,
  Star,
  Menu,
  MessageCircle
} from 'lucide-react';

const navItems = [
  { to: '/cabinet', icon: LayoutDashboard, label: 'Обзор' },
  { to: '/cabinet/catalog', icon: Search, label: 'Каталог' },
  { to: '/cabinet/bookings', icon: ShoppingCart, label: 'Мои заказы' },
  { to: '/messages', icon: MessageCircle, label: 'Сообщения', showBadge: true },
  { to: '/cabinet/profile', icon: User, label: 'Профиль' },
];

interface CustomerLayoutProps {
  children: React.ReactNode;
}

export function CustomerLayout({ children }: CustomerLayoutProps) {
  const { user, signOut, loading } = useAuth();
  const location = useLocation();
  const unreadCount = useUnreadMessages();
  const [hasPerformerProfile, setHasPerformerProfile] = useState<boolean | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

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

  const SidebarContent = () => (
    <>
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
          const showBadge = item.showBadge && unreadCount > 0;
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
              <span className="font-medium flex-1">{item.label}</span>
              {showBadge && (
                <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-xs">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border space-y-2">
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
    </>
  );

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Desktop Sidebar - Fixed */}
      <aside className="hidden md:flex w-64 bg-card border-r border-border flex-col fixed top-0 left-0 h-screen z-40">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border">
        <div className="flex items-center justify-between p-4">
          <Link to="/" className="flex items-center gap-2">
            <Snowflake className="h-6 w-6 text-accent" />
            <span className="font-display font-bold text-foreground">
              Дед-Морозы<span className="text-accent">.РФ</span>
            </span>
          </Link>
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 flex flex-col">
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Main content - with left margin for fixed sidebar */}
      <main className="flex-1 md:ml-64 overflow-auto md:mt-0 mt-16">
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}