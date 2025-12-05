import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileCheck, ShoppingCart, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalPerformers: 0,
    pendingModeration: 0,
    totalOrders: 0,
    pendingOrders: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      const [performers, pendingDocs, bookings, pendingBookings] = await Promise.all([
        supabase.from('performer_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('verification_documents').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('bookings').select('id', { count: 'exact', head: true }),
        supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);

      setStats({
        totalPerformers: performers.count ?? 0,
        pendingModeration: pendingDocs.count ?? 0,
        totalOrders: bookings.count ?? 0,
        pendingOrders: pendingBookings.count ?? 0,
      });
    }

    fetchStats();
  }, []);

  const statCards = [
    { title: 'Всего исполнителей', value: stats.totalPerformers, icon: Users, color: 'text-primary' },
    { title: 'На модерации', value: stats.pendingModeration, icon: FileCheck, color: 'text-accent' },
    { title: 'Всего заказов', value: stats.totalOrders, icon: ShoppingCart, color: 'text-winter-light' },
    { title: 'Ожидают подтверждения', value: stats.pendingOrders, icon: TrendingUp, color: 'text-santa' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Панель управления</h1>
          <p className="text-muted-foreground mt-1">Обзор статистики платформы</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => (
            <Card key={stat.title} className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
