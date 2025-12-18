import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CustomerLayout } from '@/components/customer/CustomerLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SEOHead } from '@/components/seo/SEOHead';
import { 
  ShoppingCart, 
  Star, 
  Clock, 
  CheckCircle,
  Search
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale/ru';

interface Stats {
  totalBookings: number;
  activeBookings: number;
  completedBookings: number;
  reviewsLeft: number;
}

interface RecentBooking {
  id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  performer_name: string;
}

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalBookings: 0,
    activeBookings: 0,
    completedBookings: 0,
    reviewsLeft: 0,
  });
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      try {
        // Fetch bookings stats
        const { data: bookings, error: bookingsError } = await supabase
          .from('bookings')
          .select('id, status, booking_date, booking_time, performer_id')
          .eq('customer_id', user.id)
          .order('booking_date', { ascending: false });

        if (bookingsError) throw bookingsError;

        const total = bookings?.length || 0;
        const active = bookings?.filter(b => ['pending', 'confirmed'].includes(b.status)).length || 0;
        const completed = bookings?.filter(b => b.status === 'completed').length || 0;

        // Fetch reviews count
        const { count: reviewsCount } = await supabase
          .from('reviews')
          .select('id', { count: 'exact', head: true })
          .eq('customer_id', user.id);

        setStats({
          totalBookings: total,
          activeBookings: active,
          completedBookings: completed,
          reviewsLeft: reviewsCount || 0,
        });

        // Get recent bookings with performer names
        if (bookings && bookings.length > 0) {
          const performerIds = [...new Set(bookings.slice(0, 3).map(b => b.performer_id))];
          const { data: performers } = await supabase
            .from('performer_profiles')
            .select('id, display_name')
            .in('id', performerIds);

          const recent = bookings.slice(0, 3).map(b => ({
            id: b.id,
            booking_date: b.booking_date,
            booking_time: b.booking_time,
            status: b.status,
            performer_name: performers?.find(p => p.id === b.performer_id)?.display_name || 'Исполнитель',
          }));

          setRecentBookings(recent);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  const statusLabels: Record<string, string> = {
    pending: 'Ожидает',
    confirmed: 'Подтверждён',
    cancelled: 'Отменён',
    completed: 'Завершён',
    no_show: 'Неявка',
  };

  return (
    <CustomerLayout>
      <SEOHead title="Личный кабинет" />
      
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Добро пожаловать, {user?.user_metadata?.full_name || 'Гость'}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Управляйте заказами и профилем
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <ShoppingCart className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalBookings}</p>
                  <p className="text-sm text-muted-foreground">Всего заказов</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.activeBookings}</p>
                  <p className="text-sm text-muted-foreground">Активных</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.completedBookings}</p>
                  <p className="text-sm text-muted-foreground">Завершённых</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                  <Star className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.reviewsLeft}</p>
                  <p className="text-sm text-muted-foreground">Отзывов</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            to="/catalog"
            className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors"
          >
            <Search className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-display font-semibold text-lg text-foreground">Найти исполнителя</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Выберите Деда Мороза или Снегурочку для праздника
            </p>
          </Link>
          <Link
            to="/cabinet/bookings"
            className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors"
          >
            <ShoppingCart className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-display font-semibold text-lg text-foreground">Мои заказы</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Просмотр и управление бронированиями
            </p>
          </Link>
        </div>

        {/* Recent Bookings */}
        {recentBookings.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-semibold text-lg">Последние заказы</h2>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/cabinet/bookings">Все заказы →</Link>
                </Button>
              </div>
              <div className="space-y-3">
                {recentBookings.map((booking) => (
                  <div 
                    key={booking.id} 
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{booking.performer_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(parseISO(booking.booking_date), 'd MMMM yyyy', { locale: ru })} в {booking.booking_time}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      booking.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {statusLabels[booking.status] || booking.status}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {stats.totalBookings === 0 && !loading && (
          <Card>
            <CardContent className="py-12 text-center">
              <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">У вас пока нет заказов</h3>
              <p className="text-muted-foreground mb-4">
                Закажите Деда Мороза для незабываемого праздника!
              </p>
              <Button variant="gold" asChild>
                <Link to="/catalog">Выбрать исполнителя</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </CustomerLayout>
  );
}