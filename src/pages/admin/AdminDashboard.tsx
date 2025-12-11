import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Users, FileCheck, ShoppingCart, TrendingUp, Settings, Loader2, Save, HelpCircle, Mail, Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { clearCommissionCache } from '@/lib/pricing';

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
  const [testingEmail, setTestingEmail] = useState(false);
  const [testingPush, setTestingPush] = useState(false);
  const [testEmail, setTestEmail] = useState('admin@gtxt.biz');

  useEffect(() => {
    async function fetchData() {
      const [performers, pendingDocs, bookings, pendingBookings, commissionSetting, testEmailSetting] = await Promise.all([
        supabase.from('performer_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('verification_documents').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('bookings').select('id', { count: 'exact', head: true }),
        supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('platform_settings').select('*').eq('key', 'commission_rate').maybeSingle(),
        supabase.from('platform_settings').select('*').eq('key', 'test_email').maybeSingle(),
      ]);

      setStats({
        totalPerformers: performers.count ?? 0,
        pendingModeration: pendingDocs.count ?? 0,
        totalOrders: bookings.count ?? 0,
        pendingOrders: pendingBookings.count ?? 0,
      });

      if (commissionSetting.data) {
        setCommissionRate(commissionSetting.data.value);
      }
      if (testEmailSetting.data) {
        setTestEmail(testEmailSetting.data.value);
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

    if (testEmail && !testEmail.includes('@')) {
      toast.error('Введите корректный email для тестирования');
      return;
    }

    setSavingSettings(true);
    
    // Save both settings
    const [commissionResult, emailResult] = await Promise.all([
      supabase
        .from('platform_settings')
        .upsert({ 
          key: 'commission_rate', 
          value: commissionRate,
          description: 'Процент наценки платформы на цену исполнителя'
        }, { onConflict: 'key' }),
      supabase
        .from('platform_settings')
        .upsert({ 
          key: 'test_email', 
          value: testEmail,
          description: 'Email для тестирования уведомлений'
        }, { onConflict: 'key' })
    ]);

    if (commissionResult.error || emailResult.error) {
      toast.error('Ошибка сохранения настроек');
      console.error(commissionResult.error || emailResult.error);
    } else {
      clearCommissionCache();
      toast.success('Настройки сохранены');
    }
    
    setSavingSettings(false);
  };

  const handleTestEmail = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      toast.error('Введите корректный email');
      return;
    }
    
    setTestingEmail(true);
    try {
      const { error } = await supabase.functions.invoke('send-notification-email', {
        body: {
          type: 'test',
          email: testEmail,
          data: {
            testMessage: 'Это тестовое уведомление для проверки работы email-рассылки.'
          }
        }
      });

      if (error) throw error;
      toast.success(`Тестовое письмо отправлено на ${testEmail}`);
    } catch (error: any) {
      console.error('Email test error:', error);
      toast.error('Ошибка отправки тестового письма: ' + (error.message || 'Неизвестная ошибка'));
    } finally {
      setTestingEmail(false);
    }
  };

  const handleTestPush = async () => {
    setTestingPush(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Необходимо авторизоваться');
        setTestingPush(false);
        return;
      }

      const { error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          userId: user.id,
          title: 'Тестовое уведомление',
          body: 'Push-уведомления работают корректно!',
          url: '/admin'
        }
      });

      if (error) throw error;
      toast.success('Тестовое push-уведомление отправлено');
    } catch (error: any) {
      console.error('Push test error:', error);
      toast.error('Ошибка отправки push-уведомления: ' + (error.message || 'Неизвестная ошибка'));
    } finally {
      setTestingPush(false);
    }
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
              <div className="space-y-6">
                <div className="max-w-md space-y-2">
                  <Label htmlFor="commissionRate">
                    Процент комиссии платформы (%)
                  </Label>
                  <div className="flex gap-4 items-center flex-wrap">
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
                        {commissionRate || '0'}%
                      </span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="font-medium mb-1">Комиссия = Предоплата</p>
                            <p className="text-sm">Клиент вносит {commissionRate}% от цены как предоплату (это и есть комиссия платформы)</p>
                            <p className="text-sm mt-1">Исполнитель получает остаток наличными</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    При цене 5000 ₽ и комиссии {commissionRate}%:
                    клиент платит 5000 ₽, предоплата (комиссия) {Math.round(5000 * (parseInt(commissionRate || '0', 10) / 100))} ₽,
                    исполнитель получает на руки {Math.round(5000 * (1 - parseInt(commissionRate || '0', 10) / 100))} ₽.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button onClick={handleSaveSettings} disabled={savingSettings}>
                    {savingSettings ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Сохранить настройки
                  </Button>
                </div>

                {/* Test Notifications */}
                <div className="pt-4 border-t border-border space-y-4">
                  <Label>Тестирование уведомлений</Label>
                  <div className="flex flex-wrap gap-3 items-end">
                    <div className="space-y-1">
                      <Label htmlFor="testEmail" className="text-xs text-muted-foreground">Email для тестирования</Label>
                      <Input
                        id="testEmail"
                        type="email"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        placeholder="admin@example.com"
                        className="w-64"
                      />
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={handleTestEmail} 
                      disabled={testingEmail}
                    >
                      {testingEmail ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Mail className="h-4 w-4 mr-2" />
                      )}
                      Тест email
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleTestPush} 
                      disabled={testingPush}
                    >
                      {testingPush ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Bell className="h-4 w-4 mr-2" />
                      )}
                      Тест push
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
