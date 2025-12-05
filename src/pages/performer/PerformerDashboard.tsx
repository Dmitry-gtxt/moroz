import { useEffect, useState } from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  User, 
  Calendar, 
  ShoppingCart, 
  LogOut,
  Home
} from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type PerformerProfile = Database['public']['Tables']['performer_profiles']['Row'];

const navItems = [
  { to: '/performer', icon: LayoutDashboard, label: 'Обзор' },
  { to: '/performer/profile', icon: User, label: 'Профиль' },
  { to: '/performer/calendar', icon: Calendar, label: 'Календарь' },
  { to: '/performer/bookings', icon: ShoppingCart, label: 'Заказы' },
];

interface PerformerLayoutProps {
  children: React.ReactNode;
}

export function PerformerLayout({ children }: PerformerLayoutProps) {
  const { user, signOut } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🎅</span>
            <span className="font-display font-bold text-lg text-foreground">
              DedMoroz<span className="text-accent">.kg</span>
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

export default function PerformerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<PerformerProfile | null>(null);
  const [stats, setStats] = useState({ pendingBookings: 0, confirmedBookings: 0, totalEarnings: 0 });
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      // Check if user has performer profile
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

      // Fetch stats
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
    return <Navigate to={{ pathname: '/auth', search: 'redirect=/performer' }} replace />;
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
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Добро пожаловать, {profile?.display_name}!
            </h1>
            <div className="flex items-center gap-3 mt-2">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <p className="text-sm text-muted-foreground">Новые заказы</p>
            <p className="text-3xl font-bold text-foreground mt-1">{stats.pendingBookings}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <p className="text-sm text-muted-foreground">Подтверждённые</p>
            <p className="text-3xl font-bold text-foreground mt-1">{stats.confirmedBookings}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <p className="text-sm text-muted-foreground">Заработано</p>
            <p className="text-3xl font-bold text-foreground mt-1">{stats.totalEarnings.toLocaleString()} сом</p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            to="/performer/calendar"
            className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors"
          >
            <Calendar className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-display font-semibold text-lg text-foreground">Календарь</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Управляйте своим расписанием и доступностью
            </p>
          </Link>
          <Link
            to="/performer/profile"
            className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors"
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
