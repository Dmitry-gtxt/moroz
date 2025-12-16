import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Snowflake, Mail, Lock, User, Phone, ArrowLeft, Sparkles, Star, Eye, EyeOff } from 'lucide-react';
import { autoSubscribeToPush } from '@/lib/pushNotifications';
import { getReferralCode, clearReferralCode } from '@/lib/referral';

type AuthMode = 'login' | 'register' | 'forgot-password';

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/cabinet';
  const modeFromUrl = (searchParams.get('mode') as AuthMode) || 'login';
  
  const [mode, setModeState] = useState<AuthMode>(modeFromUrl);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Password validation
  const passwordRequirements = [
    { label: 'Минимум 6 символов', check: (p: string) => p.length >= 6 },
    { label: 'Хотя бы одна цифра', check: (p: string) => /\d/.test(p) },
    { label: 'Хотя бы одна буква', check: (p: string) => /[a-zA-Zа-яА-ЯёЁ]/.test(p) },
  ];

  useEffect(() => {
    setModeState(modeFromUrl);
  }, [modeFromUrl]);

  const setMode = (newMode: AuthMode) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('mode', newMode);
    setSearchParams(newParams, { replace: true });
  };

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate(redirectTo);
      }
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate(redirectTo);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, redirectTo]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (error) throw error;
        toast.success('Добро пожаловать!');
      } else if (mode === 'register') {
        if (!acceptTerms || !acceptPrivacy) {
          toast.error('Необходимо принять Пользовательское соглашение и Политику конфиденциальности');
          setLoading(false);
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}${redirectTo}`,
            data: {
              full_name: formData.fullName,
              phone: formData.phone,
            },
          },
        });
        if (error) throw error;
        
        // Send welcome email
        supabase.functions.invoke('send-notification-email', {
          body: {
            type: 'welcome_email',
            email: formData.email,
            fullName: formData.fullName,
          },
        }).catch(err => console.error('Failed to send welcome email:', err));
        
        // Track referral registration if applicable
        if (data.user?.id) {
          const refCode = getReferralCode();
          if (refCode) {
            // Find partner by referral code and create registration record
            (async () => {
              try {
                const { data: partner } = await supabase
                  .from('partners')
                  .select('id')
                  .eq('referral_code', refCode)
                  .eq('is_active', true)
                  .single();
                
                if (partner) {
                  await supabase
                    .from('referral_registrations')
                    .insert({
                      partner_id: partner.id,
                      user_id: data.user!.id,
                      user_type: 'customer',
                    });
                  clearReferralCode();
                }
              } catch (err) {
                console.log('Referral tracking skipped:', err);
              }
            })();
          }
          
          // Auto-subscribe to push notifications
          autoSubscribeToPush(data.user.id).then(success => {
            if (success) {
              toast.success('Push-уведомления включены! Вы будете получать уведомления о заказах и сообщениях.');
            }
          }).catch(err => 
            console.log('Auto push subscription skipped:', err)
          );
        }
        
        toast.success('Регистрация успешна! Добро пожаловать!');
      } else if (mode === 'forgot-password') {
        const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
          redirectTo: `${window.location.origin}/auth?mode=reset`,
        });
        if (error) throw error;
        toast.success('Письмо для сброса пароля отправлено на вашу почту');
        setMode('login');
      }
    } catch (error: any) {
      let message = 'Произошла ошибка';
      if (error.message.includes('Invalid login credentials')) {
        message = 'Неверный email или пароль';
      } else if (error.message.includes('User already registered')) {
        message = 'Пользователь с таким email уже зарегистрирован';
      } else if (error.message.includes('Password')) {
        message = 'Пароль должен быть не менее 6 символов';
      } else if (error.message.includes('Email not confirmed')) {
        message = 'Подтвердите email перед входом';
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-winter-950">
      <Header />
      <main className="flex-1 flex items-center justify-center py-12 px-4 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-magic-purple/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-magic-cyan/15 rounded-full blur-3xl" />
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute text-magic-gold/20 animate-twinkle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                fontSize: `${8 + Math.random() * 8}px`,
              }}
            >
              ✦
            </div>
          ))}
        </div>

        <div className="w-full max-w-md relative z-10">
          <div className="glass-card rounded-3xl shadow-2xl border border-magic-gold/20 p-8 animate-fade-in">
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-magic-gold/20 to-magic-purple/20 border border-magic-gold/30 mb-4 relative">
                <Snowflake className="h-10 w-10 text-magic-gold" />
                <Sparkles className="absolute -top-2 -right-2 h-5 w-5 text-magic-gold animate-sparkle" />
              </div>
              <h1 className="font-display text-2xl font-bold text-snow-100">
                {mode === 'login' && 'Вход в аккаунт'}
                {mode === 'register' && 'Регистрация'}
                {mode === 'forgot-password' && 'Восстановление пароля'}
              </h1>
              <p className="text-snow-400 mt-2">
                {mode === 'login' && 'Войдите, чтобы забронировать Деда Мороза'}
                {mode === 'register' && 'Создайте аккаунт для бронирования'}
                {mode === 'forgot-password' && 'Введите email для сброса пароля'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <>
                  <div>
                    <Label htmlFor="fullName" className="text-snow-200">Ваше имя</Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-snow-500" />
                      <Input
                        id="fullName"
                        name="fullName"
                        type="text"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        placeholder="Анна"
                        className="pl-10 bg-winter-900/50 border-snow-700/30 text-snow-100 placeholder:text-snow-600 focus:border-magic-gold/50"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-snow-200">Телефон</Label>
                    <div className="relative mt-1">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-snow-500" />
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+7 (846) 123-45-67"
                        className="pl-10 bg-winter-900/50 border-snow-700/30 text-snow-100 placeholder:text-snow-600 focus:border-magic-gold/50"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="email" className="text-snow-200">Email</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-snow-500" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="example@mail.com"
                    className="pl-10 bg-winter-900/50 border-snow-700/30 text-snow-100 placeholder:text-snow-600 focus:border-magic-gold/50"
                    required
                  />
                </div>
              </div>

              {mode !== 'forgot-password' && (
                <div>
                  <Label htmlFor="password" className="text-snow-200">Пароль</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-snow-500" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="••••••••"
                      className="pl-10 pr-10 bg-winter-900/50 border-snow-700/30 text-snow-100 placeholder:text-snow-600 focus:border-magic-gold/50"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-snow-500 hover:text-snow-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {mode === 'register' && (
                    <div className="mt-2 space-y-1">
                      {passwordRequirements.map((req, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                          <span className={`w-1.5 h-1.5 rounded-full transition-colors ${req.check(formData.password) ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className={`transition-colors ${req.check(formData.password) ? 'text-green-400' : 'text-snow-500'}`}>
                            {req.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {mode === 'login' && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setMode('forgot-password')}
                    className="text-sm text-magic-gold hover:underline"
                  >
                    Забыли пароль?
                  </button>
                </div>
              )}

              {mode === 'register' && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-start space-x-2">
                    <Checkbox 
                      id="acceptTerms" 
                      checked={acceptTerms} 
                      onCheckedChange={(checked) => setAcceptTerms(checked === true)}
                      className="border-snow-600 data-[state=checked]:bg-magic-gold data-[state=checked]:border-magic-gold"
                    />
                    <label htmlFor="acceptTerms" className="text-sm text-snow-400 leading-tight cursor-pointer">
                      Я принимаю{' '}
                      <Link to="/terms" target="_blank" className="text-magic-gold hover:underline">
                        Пользовательское соглашение
                      </Link>
                    </label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Checkbox 
                      id="acceptPrivacy" 
                      checked={acceptPrivacy} 
                      onCheckedChange={(checked) => setAcceptPrivacy(checked === true)}
                      className="border-snow-600 data-[state=checked]:bg-magic-gold data-[state=checked]:border-magic-gold"
                    />
                    <label htmlFor="acceptPrivacy" className="text-sm text-snow-400 leading-tight cursor-pointer">
                      Я согласен с{' '}
                      <Link to="/privacy" target="_blank" className="text-magic-gold hover:underline">
                        Политикой конфиденциальности
                      </Link>
                    </label>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-magic-gold via-amber-400 to-magic-gold text-winter-950 font-bold text-base shadow-lg shadow-magic-gold/30 hover:shadow-xl hover:shadow-magic-gold/40 transition-all duration-300 disabled:opacity-50"
              >
                {loading ? 'Загрузка...' : (
                  mode === 'login' ? 'Войти' : 
                  mode === 'register' ? 'Зарегистрироваться' : 
                  'Отправить ссылку'
                )}
              </button>
            </form>

            {mode === 'forgot-password' ? (
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-sm text-snow-400 hover:text-snow-200 flex items-center justify-center gap-1 mx-auto"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Вернуться к входу
                </button>
              </div>
            ) : (
              <div className="mt-6 text-center">
                <p className="text-sm text-snow-400">
                  {mode === 'login' ? 'Ещё нет аккаунта?' : 'Уже есть аккаунт?'}
                  <button
                    type="button"
                    onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                    className="ml-1 text-magic-gold hover:underline font-medium"
                  >
                    {mode === 'login' ? 'Зарегистрироваться' : 'Войти'}
                  </button>
                </p>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-snow-700/20 text-center">
              <Link to="/" className="text-sm text-snow-500 hover:text-snow-300 transition-colors inline-flex items-center gap-1">
                <ArrowLeft className="h-3 w-3" />
                Вернуться на главную
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Auth;
