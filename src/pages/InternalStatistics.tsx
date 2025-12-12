import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, UserCheck, Calendar, CreditCard, TrendingUp, 
  XCircle, Clock, CheckCircle, AlertCircle, Percent,
  UserPlus, ShoppingCart, BarChart3
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';

const COLORS = ['#eab308', '#8b5cf6', '#06b6d4', '#ef4444', '#22c55e', '#f97316'];

export default function InternalStatistics() {
  // Fetch all statistics data
  const { data: stats, isLoading } = useQuery({
    queryKey: ['internal-statistics'],
    queryFn: async () => {
      // Fetch performers
      const { data: performers } = await supabase
        .from('performer_profiles')
        .select('*');

      // Fetch bookings
      const { data: bookings } = await supabase
        .from('bookings')
        .select('*');

      // Fetch profiles (customers)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*');

      // Fetch user roles
      const { data: roles } = await supabase
        .from('user_roles')
        .select('*');

      // Fetch reviews
      const { data: reviews } = await supabase
        .from('public_reviews')
        .select('*');

      // Fetch referral data
      const { data: referralVisits } = await supabase
        .from('referral_visits')
        .select('*');

      const { data: referralRegistrations } = await supabase
        .from('referral_registrations')
        .select('*');

      const { data: referralBookings } = await supabase
        .from('referral_bookings')
        .select('*');

      return {
        performers: performers || [],
        bookings: bookings || [],
        profiles: profiles || [],
        roles: roles || [],
        reviews: reviews || [],
        referralVisits: referralVisits || [],
        referralRegistrations: referralRegistrations || [],
        referralBookings: referralBookings || []
      };
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-winter-950 flex items-center justify-center">
        <div className="text-white text-xl">Загрузка статистики...</div>
      </div>
    );
  }

  const { performers, bookings, profiles, roles, reviews, referralVisits, referralRegistrations, referralBookings } = stats || {};

  // Calculate statistics
  const totalCustomers = roles?.filter(r => r.role === 'customer').length || 0;
  const totalPerformers = performers?.length || 0;
  const activePerformers = performers?.filter(p => p.is_active).length || 0;
  const verifiedPerformers = performers?.filter(p => p.verification_status === 'verified').length || 0;
  const pendingPerformers = performers?.filter(p => p.verification_status === 'pending').length || 0;

  const totalBookings = bookings?.length || 0;
  const pendingBookings = bookings?.filter(b => b.status === 'pending').length || 0;
  const confirmedBookings = bookings?.filter(b => b.status === 'confirmed').length || 0;
  const completedBookings = bookings?.filter(b => b.status === 'completed').length || 0;
  const cancelledBookings = bookings?.filter(b => b.status === 'cancelled').length || 0;

  const paidBookings = bookings?.filter(b => b.payment_status === 'prepayment_paid' || b.payment_status === 'fully_paid').length || 0;
  const totalRevenue = bookings?.reduce((sum, b) => {
    if (b.payment_status === 'prepayment_paid' || b.payment_status === 'fully_paid') {
      return sum + (b.prepayment_amount || 0);
    }
    return sum;
  }, 0) || 0;

  const cancellationRate = totalBookings > 0 ? ((cancelledBookings / totalBookings) * 100).toFixed(1) : 0;
  const conversionRate = totalBookings > 0 ? ((paidBookings / totalBookings) * 100).toFixed(1) : 0;

  // Prepare chart data - bookings by date (last 30 days)
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(new Date(), 29 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayBookings = bookings?.filter(b => b.created_at?.startsWith(dateStr)).length || 0;
    const dayRegistrations = profiles?.filter(p => p.created_at?.startsWith(dateStr)).length || 0;
    return {
      date: format(date, 'd MMM', { locale: ru }),
      bookings: dayBookings,
      registrations: dayRegistrations
    };
  });

  // Booking status distribution
  const bookingStatusData = [
    { name: 'Ожидают', value: pendingBookings, color: '#f97316' },
    { name: 'Подтверждены', value: confirmedBookings, color: '#06b6d4' },
    { name: 'Завершены', value: completedBookings, color: '#22c55e' },
    { name: 'Отменены', value: cancelledBookings, color: '#ef4444' }
  ].filter(item => item.value > 0);

  // Payment status distribution
  const paymentStatusData = [
    { name: 'Не оплачено', value: bookings?.filter(b => b.payment_status === 'not_paid').length || 0 },
    { name: 'Предоплата', value: bookings?.filter(b => b.payment_status === 'prepayment_paid').length || 0 },
    { name: 'Полная оплата', value: bookings?.filter(b => b.payment_status === 'fully_paid').length || 0 },
    { name: 'Возврат', value: bookings?.filter(b => b.payment_status === 'refunded').length || 0 }
  ].filter(item => item.value > 0);

  // Performer verification status
  const performerStatusData = [
    { name: 'Верифицированы', value: verifiedPerformers, color: '#22c55e' },
    { name: 'На проверке', value: pendingPerformers, color: '#f97316' },
    { name: 'Не верифицированы', value: performers?.filter(p => p.verification_status === 'unverified').length || 0, color: '#6b7280' },
    { name: 'Отклонены', value: performers?.filter(p => p.verification_status === 'rejected').length || 0, color: '#ef4444' }
  ].filter(item => item.value > 0);

  // Bookings by district
  const districtStats = bookings?.reduce((acc, b) => {
    acc[b.district_slug] = (acc[b.district_slug] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const topDistricts = Object.entries(districtStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([district, count]) => ({ district, count }));

  // Referral statistics
  const totalVisits = referralVisits?.length || 0;
  const totalReferralRegs = referralRegistrations?.length || 0;
  const totalReferralBookings = referralBookings?.length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-winter-950 via-winter-900 to-winter-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-2">
            📊 Внутренняя статистика платформы
          </h1>
          <p className="text-white/60">
            Обновлено: {format(new Date(), 'd MMMM yyyy, HH:mm', { locale: ru })}
          </p>
        </div>

        {/* Main metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Всего пользователей"
            value={totalCustomers + totalPerformers}
            icon={<Users className="h-5 w-5" />}
            subtitle={`${totalCustomers} клиентов, ${totalPerformers} исп.`}
          />
          <StatCard
            title="Всего заказов"
            value={totalBookings}
            icon={<ShoppingCart className="h-5 w-5" />}
            subtitle={`${paidBookings} оплачено`}
          />
          <StatCard
            title="Выручка (предоплаты)"
            value={`${totalRevenue.toLocaleString()} ₽`}
            icon={<CreditCard className="h-5 w-5" />}
            subtitle="Сумма предоплат"
          />
          <StatCard
            title="Конверсия в оплату"
            value={`${conversionRate}%`}
            icon={<Percent className="h-5 w-5" />}
            subtitle={`Отмены: ${cancellationRate}%`}
          />
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="bg-winter-800/50 border border-white/10">
            <TabsTrigger value="users" className="data-[state=active]:bg-gold/20">Пользователи</TabsTrigger>
            <TabsTrigger value="bookings" className="data-[state=active]:bg-gold/20">Заказы</TabsTrigger>
            <TabsTrigger value="performers" className="data-[state=active]:bg-gold/20">Исполнители</TabsTrigger>
            <TabsTrigger value="referrals" className="data-[state=active]:bg-gold/20">Рефералы</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard title="Клиенты" value={totalCustomers} icon={<Users className="h-5 w-5" />} />
              <StatCard title="Исполнители" value={totalPerformers} icon={<UserCheck className="h-5 w-5" />} />
              <StatCard title="Активные исп." value={activePerformers} icon={<CheckCircle className="h-5 w-5" />} />
              <StatCard title="Отзывы" value={reviews?.length || 0} icon={<BarChart3 className="h-5 w-5" />} />
            </div>

            <Card className="bg-winter-800/50 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Регистрации за 30 дней</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={last30Days}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="registrations" 
                      stroke="#eab308" 
                      strokeWidth={2}
                      name="Регистрации"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <StatCard title="Ожидают" value={pendingBookings} icon={<Clock className="h-5 w-5" />} color="orange" />
              <StatCard title="Подтверждены" value={confirmedBookings} icon={<CheckCircle className="h-5 w-5" />} color="cyan" />
              <StatCard title="Завершены" value={completedBookings} icon={<CheckCircle className="h-5 w-5" />} color="green" />
              <StatCard title="Отменены" value={cancelledBookings} icon={<XCircle className="h-5 w-5" />} color="red" />
              <StatCard title="% отмен" value={`${cancellationRate}%`} icon={<AlertCircle className="h-5 w-5" />} />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Card className="bg-winter-800/50 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Заказы за 30 дней</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={last30Days}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} />
                      <YAxis stroke="#9ca3af" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Bar dataKey="bookings" fill="#8b5cf6" name="Заказы" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-winter-800/50 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Статусы заказов</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={bookingStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {bookingStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-winter-800/50 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Топ-10 районов по заказам</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topDistricts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis type="number" stroke="#9ca3af" />
                    <YAxis dataKey="district" type="category" stroke="#9ca3af" fontSize={12} width={150} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="count" fill="#06b6d4" name="Заказов" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performers Tab */}
          <TabsContent value="performers" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard title="Всего" value={totalPerformers} icon={<Users className="h-5 w-5" />} />
              <StatCard title="Активные" value={activePerformers} icon={<CheckCircle className="h-5 w-5" />} color="green" />
              <StatCard title="Верифицированы" value={verifiedPerformers} icon={<UserCheck className="h-5 w-5" />} color="green" />
              <StatCard title="На проверке" value={pendingPerformers} icon={<Clock className="h-5 w-5" />} color="orange" />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Card className="bg-winter-800/50 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Статусы верификации</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={performerStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                        labelLine={false}
                      >
                        {performerStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-winter-800/50 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Статусы оплаты заказов</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={paymentStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                        labelLine={false}
                      >
                        {paymentStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Performer rating distribution */}
            <Card className="bg-winter-800/50 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Средний рейтинг исполнителей</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {[5, 4, 3, 2, 1].map(rating => {
                    const count = performers?.filter(p => 
                      Math.floor(p.rating_average || 0) === rating
                    ).length || 0;
                    return (
                      <div key={rating} className="text-center p-3 bg-winter-900/50 rounded-lg">
                        <div className="text-2xl text-gold">{'⭐'.repeat(rating)}</div>
                        <div className="text-white text-xl font-bold">{count}</div>
                        <div className="text-white/60 text-sm">исп.</div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Referrals Tab */}
          <TabsContent value="referrals" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard title="Визиты" value={totalVisits} icon={<TrendingUp className="h-5 w-5" />} />
              <StatCard title="Регистрации" value={totalReferralRegs} icon={<UserPlus className="h-5 w-5" />} />
              <StatCard title="Заказы" value={totalReferralBookings} icon={<ShoppingCart className="h-5 w-5" />} />
              <StatCard 
                title="Конверсия визит→рег" 
                value={totalVisits > 0 ? `${((totalReferralRegs / totalVisits) * 100).toFixed(1)}%` : '0%'} 
                icon={<Percent className="h-5 w-5" />} 
              />
            </div>

            <Card className="bg-winter-800/50 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Воронка партнёрской программы</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <FunnelStep 
                    label="Визиты по реф. ссылкам" 
                    value={totalVisits} 
                    percentage={100} 
                    color="bg-blue-500" 
                  />
                  <FunnelStep 
                    label="Регистрации" 
                    value={totalReferralRegs} 
                    percentage={totalVisits > 0 ? (totalReferralRegs / totalVisits) * 100 : 0} 
                    color="bg-purple-500" 
                  />
                  <FunnelStep 
                    label="Оплаченные заказы" 
                    value={totalReferralBookings} 
                    percentage={totalReferralRegs > 0 ? (totalReferralBookings / totalReferralRegs) * 100 : 0} 
                    color="bg-green-500" 
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="text-center text-white/40 text-sm pt-8">
          Данная страница доступна только по прямой ссылке
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ 
  title, 
  value, 
  icon, 
  subtitle, 
  color = 'default' 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  subtitle?: string;
  color?: 'default' | 'green' | 'red' | 'orange' | 'cyan';
}) {
  const colorClasses = {
    default: 'text-gold',
    green: 'text-green-400',
    red: 'text-red-400',
    orange: 'text-orange-400',
    cyan: 'text-cyan-400'
  };

  return (
    <Card className="bg-winter-800/50 border-white/10">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-white/60 mb-1">
          {icon}
          <span className="text-xs">{title}</span>
        </div>
        <div className={`text-2xl font-bold ${colorClasses[color]}`}>
          {value}
        </div>
        {subtitle && (
          <div className="text-xs text-white/40 mt-1">{subtitle}</div>
        )}
      </CardContent>
    </Card>
  );
}

// Funnel Step Component
function FunnelStep({ 
  label, 
  value, 
  percentage, 
  color 
}: { 
  label: string; 
  value: number; 
  percentage: number; 
  color: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-white text-sm">
        <span>{label}</span>
        <span className="font-bold">{value} ({percentage.toFixed(1)}%)</span>
      </div>
      <div className="h-8 bg-winter-900 rounded-lg overflow-hidden">
        <div 
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${Math.max(percentage, 2)}%` }}
        />
      </div>
    </div>
  );
}
