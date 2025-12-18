import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Snowflake, Mail, Lock, User, Phone, ArrowLeft, Sparkles, Star, Eye, EyeOff, MessageSquare } from 'lucide-react';
import { autoSubscribeToPush } from '@/lib/pushNotifications';
import { getReferralCode, clearReferralCode } from '@/lib/referral';

type AuthMode = 'login' | 'register' | 'forgot-password';
type RegisterStep = 'form' | 'sms-verification';

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

  // SMS verification state
  const [registerStep, setRegisterStep] = useState<RegisterStep>('form');
  const [smsCode, setSmsCode] = useState('');
  const [authId, setAuthId] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Password validation for login
  const passwordRequirements = [
    { label: 'Минимум 6 символов', check: (p: string) => p.length >= 6 },
    { label: 'Хотя бы одна цифра', check: (p: string) => /\d/.test(p) },
    { label: 'Хотя бы одна буква', check: (p: string) => /[a-zA-Zа-яА-ЯёЁ]/.test(p) },
  ];

  useEffect(() => {
    setModeState(modeFromUrl);
    // Reset registration step when mode changes
    if (modeFromUrl !== 'register') {
      setRegisterStep('form');
      setSmsCode('');
      setAuthId(null);
    }
  }, [modeFromUrl]);

  // Timer effect
  useEffect(() => {
    if (resendTimer > 0) {
      timerRef.current = setTimeout(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [resendTimer]);

  const setMode = (newMode: AuthMode) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('mode', newMode);
    setSearchParams(newParams, { replace: true });
    // Reset registration step when changing mode
    setRegisterStep('form');
    setSmsCode('');
    setAuthId(null);
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

  // Format phone for API (remove all non-digits)
  const formatPhoneForApi = (phone: string): string => {
    const digits = phone.replace(/\D/g, '');
    // Ensure it starts with 7 for Russian numbers
    if (digits.startsWith('8') && digits.length === 11) {
      return '7' + digits.slice(1);
    }
    if (digits.startsWith('+')) {
      return digits.slice(1);
    }
    return digits;
  };

  // Send 2FA code for registration
  const sendRegistrationSms = async () => {
    const formattedPhone = formatPhoneForApi(formData.phone);
    
    if (formattedPhone.length < 10) {
      toast.error('Введите корректный номер телефона');
      return false;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-2fa-code', {
        body: {
          phone: formattedPhone,
          template_id: 78, // Registration template
        },
      });

      if (error) throw error;
      
      if (data?.auth_id) {
        setAuthId(data.auth_id);
        setResendTimer(120);
        return true;
      } else if (data?.error) {
        throw new Error(data.error);
      }
      
      return false;
    } catch (error: any) {
      console.error('SMS send error:', error);
      toast.error(error.message || 'Ошибка отправки SMS');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Verify 2FA code
  const verifySmsCode = async (): Promise<boolean> => {
    if (!authId || !smsCode) {
      toast.error('Введите код из SMS');
      return false;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-2fa-code', {
        body: {
          auth_id: authId,
          access_code: smsCode,
        },
      });

      if (error) throw error;
      
      if (data?.verified) {
        return true;
      } else if (data?.error) {
        toast.error(data.error);
        return false;
      }
      
      toast.error('Неверный код');
      return false;
    } catch (error: any) {
      console.error('Verify error:', error);
      toast.error(error.message || 'Ошибка проверки кода');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Complete registration with verified SMS code as password
  const completeRegistration = async () => {
    const verified = await verifySmsCode();
    if (!verified) return;

    setLoading(true);
    try {
      // Use the SMS code as password
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: smsCode, // Use SMS code as password
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
            toast.success('Push-уведомления включены!');
          }
        }).catch(err => 
          console.log('Auto push subscription skipped:', err)
        );
      }
      
      toast.success('Регистрация успешна! Добро пожаловать!');
    } catch (error: any) {
      let message = 'Произошла ошибка';
      if (error.message.includes('User already registered')) {
        message = 'Пользователь с таким email уже зарегистрирован';
      } else if (error.message.includes('Password')) {
        message = 'Ошибка создания пароля';
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
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
        if (registerStep === 'form') {
          // Validate form first
          if (!acceptTerms || !acceptPrivacy) {
            toast.error('Необходимо принять Пользовательское соглашение и Политику конфиденциальности');
            setLoading(false);
            return;
          }
          if (!formData.phone) {
            toast.error('Введите номер телефона для получения SMS с паролем');
            setLoading(false);
            return;
          }
          
          // Send SMS
          const sent = await sendRegistrationSms();
          if (sent) {
            setRegisterStep('sms-verification');
            toast.success('SMS с паролем отправлено на ваш телефон');
          }
        } else {
          // Verify SMS and complete registration
          await completeRegistration();
        }
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

  const handleResendSms = async () => {
    if (resendTimer > 0) return;
    const sent = await sendRegistrationSms();
    if (sent) {
      toast.success('SMS отправлено повторно');
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
                {mode === 'register' && registerStep === 'form' && 'Регистрация'}
                {mode === 'register' && registerStep === 'sms-verification' && 'Подтверждение'}
                {mode === 'forgot-password' && 'Восстановление пароля'}
              </h1>
              <p className="text-snow-400 mt-2">
                {mode === 'login' && 'Войдите, чтобы забронировать Деда Мороза'}
                {mode === 'register' && registerStep === 'form' && 'Создайте аккаунт для бронирования'}
                {mode === 'register' && registerStep === 'sms-verification' && `Введите код из SMS, отправленного на ${formData.phone}`}
                {mode === 'forgot-password' && 'Введите email для сброса пароля'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && registerStep === 'form' && (
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
                    <Label htmlFor="phone" className="text-snow-200">Телефон <span className="text-magic-gold">*</span></Label>
                    <div className="relative mt-1">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-snow-500" />
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+7 (995) 382-97-36"
                        className="pl-10 bg-winter-900/50 border-snow-700/30 text-snow-100 placeholder:text-snow-600 focus:border-magic-gold/50"
                        required
                      />
                    </div>
                  </div>
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

                  {/* Password info message */}
                  <div className="bg-magic-purple/10 border border-magic-purple/30 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <MessageSquare className="h-5 w-5 text-magic-purple mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-snow-300">
                        Пароль придёт в SMS на указанный телефон. Его потом можно изменить в настройках профиля.
                      </p>
                    </div>
                  </div>
                </>
              )}

              {mode === 'register' && registerStep === 'sms-verification' && (
                <>
                  <div>
                    <Label htmlFor="smsCode" className="text-snow-200">Введите пароль из SMS</Label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-snow-500" />
                      <Input
                        id="smsCode"
                        type="text"
                        value={smsCode}
                        onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        className="pl-10 bg-winter-900/50 border-snow-700/30 text-snow-100 placeholder:text-snow-600 focus:border-magic-gold/50 text-center text-2xl tracking-widest font-mono"
                        maxLength={6}
                        autoFocus
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleResendSms}
                    disabled={resendTimer > 0 || loading}
                    className={`w-full text-sm py-2 rounded-lg transition-colors ${
                      resendTimer > 0 
                        ? 'text-snow-500 bg-winter-900/30 cursor-not-allowed' 
                        : 'text-magic-gold hover:bg-magic-gold/10'
                    }`}
                  >
                    {resendTimer > 0 
                      ? `Повторно отправить SMS (${resendTimer} сек)` 
                      : 'Повторно отправить мне SMS'
                    }
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRegisterStep('form');
                      setSmsCode('');
                      setAuthId(null);
                    }}
                    className="w-full text-sm text-snow-400 hover:text-snow-200 flex items-center justify-center gap-1"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Изменить данные
                  </button>
                </>
              )}

              {mode === 'login' && (
                <>
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
                  </div>

                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setMode('forgot-password')}
                      className="text-sm text-magic-gold hover:underline"
                    >
                      Забыли пароль?
                    </button>
                  </div>
                </>
              )}

              {mode === 'forgot-password' && (
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
              )}

              {mode === 'register' && registerStep === 'form' && (
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
                  mode === 'register' && registerStep === 'form' ? 'Получить пароль в SMS' :
                  mode === 'register' && registerStep === 'sms-verification' ? 'Подтвердить и войти' :
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
              <p className="text-xs text-snow-500">
                Хотите стать Дедом Морозом?{' '}
                <Link to="/performer-registration" className="text-magic-gold hover:underline">
                  Подать заявку
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Auth;
