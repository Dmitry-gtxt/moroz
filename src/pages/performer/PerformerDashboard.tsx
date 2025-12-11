import { useEffect, useState } from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  User, 
  Calendar, 
  ShoppingCart, 
  LogOut,
  Home,
  UserCircle,
  Menu,
  Snowflake,
  MessageCircle
} from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type PerformerProfile = Database['public']['Tables']['performer_profiles']['Row'];

const navItems = [
  { to: '/performer', icon: LayoutDashboard, label: 'Обзор' },
  { to: '/performer/profile', icon: User, label: 'Профиль' },
  { to: '/performer/calendar', icon: Calendar, label: 'Календарь' },
  { to: '/performer/bookings', icon: ShoppingCart, label: 'Заказы' },
  { to: '/messages', icon: MessageCircle, label: 'Сообщения' },
];

interface PerformerLayoutProps {
  children: React.ReactNode;
}

export function PerformerLayout({ children }: PerformerLayoutProps) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-border">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">🎅</span>
          <span className="font-display font-bold text-lg text-foreground">
            Дед-Морозы<span className="text-accent">.РФ</span>
          </span>
        </Link>
        <p className="text-xs text-muted-foreground mt-1">Кабинет исполнителя</p>
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
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 bg-gradient-to-r from-accent/20 to-primary/20 hover:from-accent/30 hover:to-primary/30 text-foreground border border-accent/30"
          asChild
        >
          <Link to="/cabinet">
            <UserCircle className="h-5 w-5 text-accent" />
            Личный кабинет
          </Link>
        </Button>
        
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
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-card border-r border-border flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border">
        <div className="flex items-center justify-between p-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl">🎅</span>
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

      {/* Main content */}
      <main className="flex-1 overflow-auto md:mt-0 mt-16">
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function PerformerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<PerformerProfile | null>(null);
  const [stats, setStats] = useState({ pendingBookings: 0, confirmedBookings: 0, totalEarnings: 0 });
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      const { data: profileData, error } = await supabase
        .from('performer_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        setHasProfile(false);
        setLoading(false);
        return;
      }

      if (!profileData) {
        setHasProfile(false);
        setLoading(false);
        return;
      }

      setProfile(profileData);
      setHasProfile(true);

      const [pendingRes, confirmedRes, completedRes] = await Promise.all([
        supabase.from('bookings').select('id', { count: 'exact', head: true })
          .eq('performer_id', profileData.id).eq('status', 'pending'),
        supabase.from('bookings').select('id', { count: 'exact', head: true })
          .eq('performer_id', profileData.id).eq('status', 'confirmed'),
        supabase.from('bookings').select('price_total')
          .eq('performer_id', profileData.id).eq('status', 'completed'),
      ]);

      const totalEarnings = (completedRes.data || []).reduce((sum, b) => sum + (b.price_total || 0), 0);

      setStats({
        pendingBookings: pendingRes.count ?? 0,
        confirmedBookings: confirmedRes.count ?? 0,
        totalEarnings,
      });

      setLoading(false);
    }

    if (!authLoading) {
      fetchData();
    }
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth?redirect=/performer" replace />;
  }

  if (hasProfile === false) {
    return <Navigate to="/become-performer" replace />;
  }

  const verificationBadge = {
    unverified: { label: 'Не верифицирован', color: 'bg-muted text-muted-foreground' },
    pending: { label: 'На проверке', color: 'bg-accent/20 text-accent' },
    verified: { label: 'Верифицирован', color: 'bg-green-100 text-green-700' },
    rejected: { label: 'Отклонён', color: 'bg-destructive/20 text-destructive' },
  }[profile?.verification_status ?? 'unverified'];

  return (
    <PerformerLayout>
      <div className="space-y-8">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
              Добро пожаловать, {profile?.display_name}!
            </h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${verificationBadge.color}`}>
                {verificationBadge.label}
              </span>
              {!profile?.is_active && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-muted text-muted-foreground">
                  Профиль неактивен
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          <div className="bg-card border border-border rounded-xl p-4 md:p-6">
            <p className="text-sm text-muted-foreground">Новые заказы</p>
            <p className="text-2xl md:text-3xl font-bold text-foreground mt-1">{stats.pendingBookings}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 md:p-6">
            <p className="text-sm text-muted-foreground">Подтверждённые</p>
            <p className="text-2xl md:text-3xl font-bold text-foreground mt-1">{stats.confirmedBookings}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 md:p-6">
            <p className="text-sm text-muted-foreground">Заработано</p>
            <p className="text-2xl md:text-3xl font-bold text-foreground mt-1">{stats.totalEarnings.toLocaleString()} ₽</p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <Link
            to="/performer/calendar"
            className="bg-card border border-border rounded-xl p-4 md:p-6 hover:border-primary/50 transition-colors"
          >
            <Calendar className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-display font-semibold text-lg text-foreground">Календарь</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Управляйте своим расписанием и доступностью
            </p>
          </Link>
          <Link
            to="/performer/profile"
            className="bg-card border border-border rounded-xl p-4 md:p-6 hover:border-primary/50 transition-colors"
          >
            <User className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-display font-semibold text-lg text-foreground">Профиль</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Редактируйте информацию о себе и услугах
            </p>
          </Link>
        </div>
      </div>
    </PerformerLayout>
  );
}