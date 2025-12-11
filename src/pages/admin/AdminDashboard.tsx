import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Users, FileCheck, ShoppingCart, TrendingUp, Settings, Loader2, Save, HelpCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { clearCommissionCache, getPrepaymentPercentage } from '@/lib/pricing';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalPerformers: 0,
    pendingModeration: 0,
    totalOrders: 0,
    pendingOrders: 0,
  });
  
  const [commissionRate, setCommissionRate] = useState('40');
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const [performers, pendingDocs, bookings, pendingBookings, settings] = await Promise.all([
        supabase.from('performer_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('verification_documents').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('bookings').select('id', { count: 'exact', head: true }),
        supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('platform_settings').select('*').eq('key', 'commission_rate').maybeSingle(),
      ]);

      setStats({
        totalPerformers: performers.count ?? 0,
        pendingModeration: pendingDocs.count ?? 0,
        totalOrders: bookings.count ?? 0,
        pendingOrders: pendingBookings.count ?? 0,
      });

      if (settings.data) {
        setCommissionRate(settings.data.value);
      }
      setLoadingSettings(false);
    }

    fetchData();
  }, []);

  const handleSaveSettings = async () => {
    const rate = parseInt(commissionRate, 10);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast.error('Введите корректный процент (0-100)');
      return;
    }

    setSavingSettings(true);
    
    // Use upsert to create or update the setting
    const { error } = await supabase
      .from('platform_settings')
      .upsert({ 
        key: 'commission_rate', 
        value: commissionRate,
        description: 'Процент наценки платформы на цену исполнителя'
      }, { 
        onConflict: 'key' 
      });

    if (error) {
      toast.error('Ошибка сохранения настроек');
      console.error(error);
    } else {
      clearCommissionCache();
      toast.success('Настройки сохранены. Новый процент будет применён ко всем новым бронированиям.');
    }
    
    setSavingSettings(false);
  };

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

        {/* General Settings */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Генеральные настройки
            </CardTitle>
            <CardDescription>
              Настройки платформы, влияющие на все заказы
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingSettings ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Загрузка настроек...
              </div>
            ) : (
              <div className="space-y-4">
                <div className="max-w-md space-y-2">
                  <Label htmlFor="commissionRate">
                    Процент наценки на цену исполнителя (%)
                  </Label>
                  <div className="flex gap-4 items-center">
                    <div className="flex gap-2 items-center">
                      <Input
                        id="commissionRate"
                        type="number"
                        min="0"
                        max="100"
                        value={commissionRate}
                        onChange={(e) => setCommissionRate(e.target.value)}
                        className="max-w-24"
                      />
                      <span className="text-muted-foreground">%</span>
                    </div>
                    <div className="px-4 py-2 bg-secondary rounded-lg flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Размер предоплаты: </span>
                      <span className="font-semibold text-foreground">
                        {getPrepaymentPercentage(parseInt(commissionRate || '0', 10))}%
                      </span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="font-medium mb-1">Формула расчёта:</p>
                            <p className="text-sm">x / (x + 100)</p>
                            <p className="text-sm mt-1">где x — процент наценки</p>
                            <p className="text-sm mt-2 text-muted-foreground">
                              Например: {commissionRate}% / ({commissionRate}% + 100) = {getPrepaymentPercentage(parseInt(commissionRate || '0', 10))}%
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Этот процент добавляется к цене исполнителя и становится предоплатой (комиссией платформы).
                    Например, при {commissionRate}% и цене исполнителя 5000 ₽, клиент увидит{' '}
                    {Math.round(5000 * (1 + parseInt(commissionRate || '0', 10) / 100))} ₽,
                    а предоплата составит {Math.round(5000 * (parseInt(commissionRate || '0', 10) / 100))} ₽.
                  </p>
                </div>

                <Button onClick={handleSaveSettings} disabled={savingSettings}>
                  {savingSettings ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Сохранить настройки
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
