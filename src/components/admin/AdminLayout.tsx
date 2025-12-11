import { ReactNode } from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { Users, FileCheck, ShoppingCart, LayoutDashboard, LogOut, Star, History, CreditCard, Shield } from 'lucide-react';
import { useAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Обзор' },
  { to: '/admin/performers', icon: Users, label: 'Исполнители' },
  { to: '/admin/verification', icon: FileCheck, label: 'Верификация' },
  { to: '/admin/reviews', icon: Star, label: 'Отзывы' },
  { to: '/admin/orders', icon: ShoppingCart, label: 'Заказы' },
  { to: '/admin/history', icon: History, label: 'История заказов' },
  { to: '/admin/paid', icon: CreditCard, label: 'Оплаченные' },
  { to: '/admin/audit', icon: Shield, label: 'Аудит-лог' },
];

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { isAdmin, loading } = useAdmin();
  const { signOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Sidebar - Fixed */}
      <aside className="w-64 bg-card border-r border-border flex-col fixed top-0 left-0 h-screen z-40 hidden md:flex">
        <div className="p-6 border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🎅</span>
            <span className="font-display font-bold text-lg text-foreground">
              Дед-Морозы<span className="text-accent">.РФ</span>
            </span>
          </Link>
          <p className="text-xs text-muted-foreground mt-1">Админ-панель</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
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

        <div className="p-4 border-t border-border">
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

      {/* Main content - with left margin for fixed sidebar */}
      <main className="flex-1 md:ml-64 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}