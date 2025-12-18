import { useState, useEffect } from 'react';
import { CustomerLayout } from '@/components/customer/CustomerLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { SEOHead } from '@/components/seo/SEOHead';
import { FloatingSaveButton } from '@/components/ui/floating-save-button';
import { PushNotificationToggle } from '@/components/notifications/PushNotificationToggle';
import { toast } from 'sonner';
import { User, Mail, Phone, Bell, Lock, Eye, EyeOff } from 'lucide-react';

export default function CustomerProfile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
  });

  // Password change state
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const passwordRequirements = [
    { label: 'Минимум 7 символов', check: (p: string) => p.length >= 7 },
  ];

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.user_metadata?.full_name || '',
        phone: user.user_metadata?.phone || '',
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: formData.fullName,
          phone: formData.phone,
        }
      });

      if (error) throw error;

      await supabase
        .from('profiles')
        .upsert({
          user_id: user!.id,
          full_name: formData.fullName,
          phone: formData.phone,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      toast.success('Профиль обновлён');
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при обновлении профиля');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!oldPassword || !newPassword) {
      toast.error('Заполните оба поля');
      return;
    }

    const allReqsMet = passwordRequirements.every(req => req.check(newPassword));
    if (!allReqsMet) {
      toast.error('Новый пароль не соответствует требованиям');
      return;
    }

    setPasswordLoading(true);

    try {
      // First verify old password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user!.email!,
        password: oldPassword,
      });

      if (signInError) {
        toast.error('Неверный текущий пароль');
        setPasswordLoading(false);
        return;
      }

      // Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      toast.success('Пароль успешно изменён');
      setOldPassword('');
      setNewPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при смене пароля');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <CustomerLayout>
      <SEOHead title="Мой профиль" />
      
      <div className="space-y-8 pb-20">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Мой профиль</h1>
          <p className="text-muted-foreground mt-1">Управление личными данными</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Личные данные
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="pl-10 bg-muted"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Email нельзя изменить
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="fullName">Имя</Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        placeholder="Ваше имя"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone">Телефон</Label>
                    <div className="relative mt-1">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+7 (846) 123-45-67"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Password Change Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Смена пароля
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="oldPassword">Текущий пароль</Label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="oldPassword"
                        type={showOldPassword ? 'text' : 'password'}
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="newPassword">Новый пароль</Label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {newPassword && (
                      <div className="mt-2 space-y-1">
                        {passwordRequirements.map((req, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs">
                            <span className={`w-1.5 h-1.5 rounded-full transition-colors ${req.check(newPassword) ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className={`transition-colors ${req.check(newPassword) ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                              {req.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handlePasswordChange}
                    disabled={passwordLoading || !oldPassword || !newPassword}
                    className="w-full"
                  >
                    {passwordLoading ? 'Сохранение...' : 'Изменить пароль'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Уведомления
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PushNotificationToggle />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Аккаунт</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">ID пользователя</p>
                  <p className="font-mono text-xs break-all">{user?.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Дата регистрации</p>
                  <p className="text-sm">
                    {user?.created_at 
                      ? new Date(user.created_at).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : '—'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <FloatingSaveButton onClick={handleSubmit} saving={loading} />
    </CustomerLayout>
  );
}
