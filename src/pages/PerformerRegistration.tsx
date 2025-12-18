import { useState, useEffect, useRef } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Upload, X, Check, Loader2, Phone, CheckCircle, XCircle } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';
import { getReferralCode, clearReferralCode } from '@/lib/referral';
import { cleanVerificationPhone } from '@/lib/utils';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

type PerformerType = Database['public']['Enums']['performer_type'];
type EventFormat = Database['public']['Enums']['event_format'];

const performerTypes: { value: PerformerType; label: string }[] = [
  { value: 'ded_moroz', label: 'Дед Мороз' },
  { value: 'snegurochka', label: 'Снегурочка' },
  { value: 'santa', label: 'Санта Клаус' },
  { value: 'duo', label: 'Дуэт (Дед Мороз + Снегурочка)' },
];

const eventFormats: { value: EventFormat; label: string }[] = [
  { value: 'home', label: 'На дому' },
  { value: 'kindergarten', label: 'Детский сад' },
  { value: 'school', label: 'Школа' },
  { value: 'office', label: 'Офис' },
  { value: 'corporate', label: 'Корпоратив' },
  { value: 'outdoor', label: 'Улица / Парк' },
];

interface District {
  id: string;
  slug: string;
  name: string;
}

export default function PerformerRegistration() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [districts, setDistricts] = useState<District[]>([]);
  const [districtsLoading, setDistrictsLoading] = useState(true);
  
  // Form data
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<PerformerType[]>([]);
  const [selectedFormats, setSelectedFormats] = useState<EventFormat[]>([]);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [basePrice, setBasePrice] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [costumeStyle, setCostumeStyle] = useState('');
  const [verificationPhone, setVerificationPhone] = useState('');
  const [programDuration, setProgramDuration] = useState('30');
  const [programDescription, setProgramDescription] = useState('');
  const [commissionRate, setCommissionRate] = useState<number | null>(null);
  
  // Phone verification states
  const [registeredPhone, setRegisteredPhone] = useState('');
  const [phoneConfirmed, setPhoneConfirmed] = useState<boolean | null>(null);
  const [showPhoneChange, setShowPhoneChange] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [authId, setAuthId] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [smsLoading, setSmsLoading] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [phoneChangeSuccess, setPhoneChangeSuccess] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Consent checkboxes
  const [acceptAgreement, setAcceptAgreement] = useState(false);
  const [acceptCode, setAcceptCode] = useState(false);
  const [acceptImageUsage, setAcceptImageUsage] = useState(false);
  
  // Files
  const [photos, setPhotos] = useState<File[]>([]);
  const [photosPreviews, setPhotosPreviews] = useState<string[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

  // Check if user already has a performer profile
  useEffect(() => {
    async function checkExistingProfile() {
      if (!user) {
        setCheckingExisting(false);
        return;
      }

      const { data: existingProfile } = await supabase
        .from('performer_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingProfile) {
        // User already has a profile, redirect to performer dashboard
        navigate('/performer', { replace: true });
        return;
      }

      setCheckingExisting(false);
    }

    if (!authLoading) {
      checkExistingProfile();
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    async function fetchDistricts() {
      setDistrictsLoading(true);
      try {
        const { data, error } = await supabase.from('districts').select('*').order('name');
        if (error) {
          console.error('Error fetching districts:', error);
        }
        if (data) {
          setDistricts(data);
        }
      } catch (err) {
        console.error('Failed to fetch districts:', err);
      } finally {
        setDistrictsLoading(false);
      }
    }
    fetchDistricts();
  }, []);

  // Fetch commission rate for price display
  useEffect(() => {
    async function fetchCommissionRate() {
      try {
        const { data } = await supabase
          .from('public_platform_settings')
          .select('value')
          .eq('key', 'commission_rate')
          .maybeSingle();
        if (data?.value) {
          setCommissionRate(parseInt(data.value, 10));
        }
      } catch (err) {
        console.error('Failed to fetch commission rate:', err);
      }
    }
    fetchCommissionRate();
  }, []);

  // Fetch registered phone from profile
  useEffect(() => {
    async function fetchRegisteredPhone() {
      if (!user) return;
      try {
        const { data } = await supabase
          .from('profiles')
          .select('phone')
          .eq('user_id', user.id)
          .maybeSingle();
        if (data?.phone) {
          setRegisteredPhone(data.phone);
          setVerificationPhone(data.phone);
        }
      } catch (err) {
        console.error('Failed to fetch registered phone:', err);
      }
    }
    fetchRegisteredPhone();
  }, [user]);

  // Timer cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Resend timer effect
  useEffect(() => {
    if (resendTimer > 0) {
      timerRef.current = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [resendTimer]);

  const formatPhoneForApi = (phone: string): string => {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('8') && digits.length === 11) {
      return '+7' + digits.slice(1);
    }
    if (!digits.startsWith('7') && digits.length === 10) {
      return '+7' + digits;
    }
    return '+' + digits;
  };

  const send2FaCode = async (phone: string) => {
    setSmsLoading(true);
    try {
      const formattedPhone = formatPhoneForApi(phone);
      const { data, error } = await supabase.functions.invoke('send-2fa-code', {
        body: { 
          phone: formattedPhone,
          template_id: 78,
          code_digits: 6,
          code_lifetime: 120,
          code_max_tries: 3,
          check_unique: true, // Проверка уникальности номера при подаче заявки
        },
      });
      
      if (error) throw error;
      if (data.error) {
        // Специальная обработка ошибки "номер уже зарегистрирован"
        if (data?.code === 'PHONE_EXISTS') {
          toast.error('Этот номер телефона уже зарегистрирован в системе. Используйте другой номер.');
          return false;
        }
        throw new Error(data.error);
      }
      
      setAuthId(data.auth_id);
      setResendTimer(120);
      toast.success('Код отправлен на ' + formattedPhone);
      return true;
    } catch (err: any) {
      console.error('2FA send error:', err);
      toast.error(err.message || 'Ошибка отправки SMS');
      return false;
    } finally {
      setSmsLoading(false);
    }
  };

  const verifySmsCode = async (code: string) => {
    setVerifyingCode(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-2fa-code', {
        body: { auth_id: authId, access_code: code },
      });
      
      if (error) throw error;
      if (!data.verified) throw new Error('Неверный код');
      
      return true;
    } catch (err: any) {
      console.error('Verification error:', err);
      toast.error(err.message || 'Ошибка проверки кода');
      return false;
    } finally {
      setVerifyingCode(false);
    }
  };

  const handlePhoneConfirm = (confirmed: boolean) => {
    setPhoneConfirmed(confirmed);
    if (confirmed) {
      setVerificationPhone(registeredPhone);
    } else {
      setShowPhoneChange(true);
    }
  };

  const handleSendCodeForNewPhone = async () => {
    if (!newPhone.trim()) {
      toast.error('Введите новый номер телефона');
      return;
    }
    await send2FaCode(newPhone);
  };

  const handleVerifyNewPhone = async () => {
    if (smsCode.length !== 6) {
      toast.error('Введите 6-значный код');
      return;
    }
    
    const verified = await verifySmsCode(smsCode);
    if (!verified) return;
    
    // Update password to the SMS code with S prefix
    const passwordWithPrefix = 'S' + smsCode;
    
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordWithPrefix,
      });
      
      if (updateError) throw updateError;
      
      // Update phone in profile
      const formattedPhone = formatPhoneForApi(newPhone);
      await supabase
        .from('profiles')
        .update({ phone: formattedPhone })
        .eq('user_id', user!.id);
      
      setVerificationPhone(formattedPhone);
      setPhoneChangeSuccess(true);
      setNewPassword(passwordWithPrefix);
      setPhoneConfirmed(true);
      toast.success('Номер телефона изменён и подтверждён!');
    } catch (err: any) {
      console.error('Password update error:', err);
      toast.error('Ошибка обновления: ' + (err.message || 'Попробуйте снова'));
    }
  };

  // Redirect to auth if not logged in (after all hooks)
  if (!authLoading && !user) {
    return <Navigate to="/auth?redirect=/become-performer" replace />;
  }

  // Show loading while checking existing profile
  if (checkingExisting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > 15) {
      toast.error('Максимум 15 фотографий');
      return;
    }
    
    const newPhotos = [...photos, ...files];
    setPhotos(newPhotos);
    
    // Create previews
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPhotosPreviews([...photosPreviews, ...newPreviews]);
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(photosPreviews[index]);
    setPhotos(photos.filter((_, i) => i !== index));
    setPhotosPreviews(photosPreviews.filter((_, i) => i !== index));
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 50 * 1024 * 1024) {
      toast.error('Видео должно быть не более 50 МБ');
      return;
    }
    
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    
    setVideo(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const removeVideo = () => {
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    setVideo(null);
    setVideoPreview(null);
  };

  const toggleType = (type: PerformerType) => {
    setSelectedTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleFormat = (format: EventFormat) => {
    setSelectedFormats(prev => 
      prev.includes(format) ? prev.filter(f => f !== format) : [...prev, format]
    );
  };

  const toggleDistrict = (slug: string) => {
    setSelectedDistricts(prev => 
      prev.includes(slug) ? prev.filter(d => d !== slug) : [...prev, slug]
    );
  };

  // Group districts by slug prefix
  const groupedDistricts = {
    samara: districts.filter(d => d.slug.startsWith('samara-')),
    tolyatti: districts.filter(d => d.slug.startsWith('tolyatti-')),
    cities: districts.filter(d => !d.slug.startsWith('samara-') && !d.slug.startsWith('tolyatti-') && !d.slug.startsWith('rayon-')),
    oblastRayons: districts.filter(d => d.slug.startsWith('rayon-')),
  };

  const validateStep = (currentStep: number): boolean => {
    if (currentStep === 1) {
      if (!displayName.trim()) {
        toast.error('Укажите имя/псевдоним');
        return false;
      }
      if (selectedTypes.length === 0) {
        toast.error('Выберите хотя бы один тип исполнителя');
        return false;
      }
      return true;
    }
    if (currentStep === 2) {
      if (selectedFormats.length === 0) {
        toast.error('Выберите хотя бы один формат мероприятия');
        return false;
      }
      if (selectedDistricts.length === 0) {
        toast.error('Выберите хотя бы один район');
        return false;
      }
      if (!basePrice) {
        toast.error('Укажите минимальную цену');
        return false;
      }
      return true;
    }
    if (currentStep === 3) {
      if (photos.length === 0) {
        toast.error('Загрузите хотя бы одну фотографию');
        return false;
      }
      return true;
    }
    if (currentStep === 4) {
      if (phoneConfirmed !== true && !phoneChangeSuccess) {
        toast.error('Подтвердите номер телефона');
        return false;
      }
      if (!acceptAgreement || !acceptCode || !acceptImageUsage) {
        toast.error('Необходимо принять все условия');
        return false;
      }
      return true;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const prevStep = () => setStep(step - 1);

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Необходимо авторизоваться');
      return;
    }
    
    if (!validateStep(4)) {
      return;
    }
    
    setLoading(true);
    try {
      // 1. Upload photos
      const photoUrls: string[] = [];
      for (const photo of photos) {
        const fileName = `${user.id}/${Date.now()}-${photo.name}`;
        const { error: uploadError } = await supabase.storage
          .from('performer-photos')
          .upload(fileName, photo);
        
        if (uploadError) {
          console.error('Photo upload error:', uploadError);
          throw new Error(`Ошибка загрузки фото: ${uploadError.message}`);
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('performer-photos')
          .getPublicUrl(fileName);
        
        photoUrls.push(publicUrl);
      }

      // 2. Upload video if present
      let videoUrl: string | null = null;
      if (video) {
        const videoFileName = `${user.id}/${Date.now()}-${video.name}`;
        const { error: videoUploadError } = await supabase.storage
          .from('performer-videos')
          .upload(videoFileName, video);
        
        if (videoUploadError) {
          console.error('Video upload error:', videoUploadError);
          throw new Error(`Ошибка загрузки видео: ${videoUploadError.message}`);
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('performer-videos')
          .getPublicUrl(videoFileName);
        
        videoUrl = publicUrl;
      }

      // 3. Create performer profile with verification phone in description
      // Clean all text fields before saving and add verification phone
      const cleanedDescription = cleanVerificationPhone(description);
      const descriptionWithPhone = cleanedDescription 
        ? `${cleanedDescription}\n\n[Телефон для верификации: ${verificationPhone}]`
        : `[Телефон для верификации: ${verificationPhone}]`;

      const { data: profile, error: profileError } = await supabase
        .from('performer_profiles')
        .insert({
          user_id: user.id,
          display_name: cleanVerificationPhone(displayName),
          description: descriptionWithPhone,
          performer_types: selectedTypes,
          formats: selectedFormats,
          district_slugs: selectedDistricts,
          base_price: parseInt(basePrice),
          experience_years: experienceYears ? parseInt(experienceYears) : 0,
          costume_style: cleanVerificationPhone(costumeStyle) || null,
          photo_urls: photoUrls,
          video_greeting_url: videoUrl,
          program_duration: programDuration ? parseInt(programDuration) : 30,
          program_description: cleanVerificationPhone(programDescription) || null,
          is_active: false,
          verification_status: 'pending',
        })
        .select()
        .single();

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw new Error(`Ошибка создания профиля: ${profileError.message}`);
      }

      // 4. Add performer role
      const { error: roleError } = await supabase.from('user_roles').insert({
        user_id: user.id,
        role: 'performer',
      });

      if (roleError) {
        console.error('Role assignment error:', roleError);
        // Don't throw here, profile is created
      }

      // 5. Send notification to admin about new verification request
      supabase.functions.invoke('send-notification-email', {
        body: {
          type: 'verification_submitted_admin',
          performerId: profile.id,
          performerName: displayName,
        },
      }).catch(err => console.error('Failed to send admin notification:', err));

      // 6. Track referral registration if applicable
      const refCode = getReferralCode();
      if (refCode) {
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
                user_id: user.id,
                user_type: 'performer',
              });
            clearReferralCode();
          }
        } catch (err) {
          console.log('Referral tracking skipped:', err);
        }
      }

      toast.success('Анкета отправлена! Наш менеджер свяжется с вами для верификации в течение 24 часов.');
      navigate('/performer');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Ошибка при регистрации. Попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-frost">
      <Header />
      <main className="flex-1 container py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-display font-bold text-foreground">
              Стать исполнителем
            </h1>
            <p className="text-muted-foreground mt-2">
              Заполните анкету, чтобы начать принимать заказы
            </p>
          </div>

          {/* Progress */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                  s < step ? 'bg-accent text-accent-foreground' :
                  s === step ? 'bg-primary text-primary-foreground' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {s < step ? <Check className="h-5 w-5" /> : s}
                </div>
                {s < 4 && (
                  <div className={`w-12 h-1 mx-1 ${s < step ? 'bg-accent' : 'bg-muted'}`} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Основная информация</CardTitle>
                <CardDescription>Расскажите о себе</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Имя / Псевдоним *</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Дед Мороз Алексей"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">О себе</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Опыт работы, особенности программы..."
                    rows={4}
                  />
                </div>

                <div className="space-y-3">
                  <Label>Тип исполнителя *</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {performerTypes.map((type) => (
                      <div
                        key={type.value}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedTypes.includes(type.value)
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => toggleType(type.value)}
                      >
                        <div className="flex items-center gap-2">
                          <Checkbox checked={selectedTypes.includes(type.value)} />
                          <span className="font-medium">{type.label}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience">Опыт работы (лет)</Label>
                  <Input
                    id="experience"
                    type="number"
                    min="0"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    placeholder="5"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="costume">Описание костюма</Label>
                  <Input
                    id="costume"
                    value={costumeStyle}
                    onChange={(e) => setCostumeStyle(e.target.value)}
                    placeholder="Традиционный красный, борода натуральная..."
                  />
                </div>

                <Button onClick={nextStep} className="w-full">
                  Далее
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Services & Pricing */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Услуги и цены</CardTitle>
                <CardDescription>Укажите форматы работы и стоимость</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Форматы мероприятий *</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {eventFormats.map((format) => (
                      <div
                        key={format.value}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedFormats.includes(format.value)
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => toggleFormat(format.value)}
                      >
                        <div className="flex items-center gap-2">
                          <Checkbox checked={selectedFormats.includes(format.value)} />
                          <span className="font-medium">{format.label}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Районы работы *</Label>
                  {districtsLoading ? (
                    <div className="flex items-center justify-center p-4 border rounded-lg">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      <span className="ml-2 text-sm text-muted-foreground">Загрузка районов...</span>
                    </div>
                  ) : districts.length === 0 ? (
                    <div className="p-4 border rounded-lg text-center text-muted-foreground">
                      Районы не найдены
                    </div>
                  ) : (
                    <div className="space-y-4 p-4 border rounded-lg max-h-[400px] overflow-y-auto">
                      {/* Самара */}
                      {groupedDistricts.samara.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-sm text-foreground mb-2 sticky top-0 bg-background py-1">
                            Самара
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            {groupedDistricts.samara.map((district) => (
                              <div
                                key={district.id}
                                className={`p-2 rounded-lg cursor-pointer transition-colors text-sm ${
                                  selectedDistricts.includes(district.slug)
                                    ? 'bg-primary/10 text-primary border border-primary'
                                    : 'hover:bg-muted border border-transparent'
                                }`}
                                onClick={() => toggleDistrict(district.slug)}
                              >
                                <div className="flex items-center gap-2">
                                  <Checkbox checked={selectedDistricts.includes(district.slug)} />
                                  <span>{district.name.replace('Самара — ', '')}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Тольятти */}
                      {groupedDistricts.tolyatti.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-sm text-foreground mb-2 sticky top-0 bg-background py-1">
                            Тольятти
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            {groupedDistricts.tolyatti.map((district) => (
                              <div
                                key={district.id}
                                className={`p-2 rounded-lg cursor-pointer transition-colors text-sm ${
                                  selectedDistricts.includes(district.slug)
                                    ? 'bg-primary/10 text-primary border border-primary'
                                    : 'hover:bg-muted border border-transparent'
                                }`}
                                onClick={() => toggleDistrict(district.slug)}
                              >
                                <div className="flex items-center gap-2">
                                  <Checkbox checked={selectedDistricts.includes(district.slug)} />
                                  <span>{district.name.replace('Тольятти — ', '')}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Другие города */}
                      {groupedDistricts.cities.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-sm text-foreground mb-2 sticky top-0 bg-background py-1">
                            Другие города
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            {groupedDistricts.cities.map((district) => (
                              <div
                                key={district.id}
                                className={`p-2 rounded-lg cursor-pointer transition-colors text-sm ${
                                  selectedDistricts.includes(district.slug)
                                    ? 'bg-primary/10 text-primary border border-primary'
                                    : 'hover:bg-muted border border-transparent'
                                }`}
                                onClick={() => toggleDistrict(district.slug)}
                              >
                                <div className="flex items-center gap-2">
                                  <Checkbox checked={selectedDistricts.includes(district.slug)} />
                                  <span>{district.name}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Районы области */}
                      {groupedDistricts.oblastRayons.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-sm text-foreground mb-2 sticky top-0 bg-background py-1">
                            Районы области
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            {groupedDistricts.oblastRayons.map((district) => (
                              <div
                                key={district.id}
                                className={`p-2 rounded-lg cursor-pointer transition-colors text-sm ${
                                  selectedDistricts.includes(district.slug)
                                    ? 'bg-primary/10 text-primary border border-primary'
                                    : 'hover:bg-muted border border-transparent'
                                }`}
                                onClick={() => toggleDistrict(district.slug)}
                              >
                                <div className="flex items-center gap-2">
                                  <Checkbox checked={selectedDistricts.includes(district.slug)} />
                                  <span>{district.name}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {selectedDistricts.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Выбрано: {selectedDistricts.length} район(ов)
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                <Label htmlFor="basePrice">Цена для клиента (₽) *</Label>
                  <div className="flex gap-4 items-start">
                    <div className="flex-1">
                      <Input
                        id="basePrice"
                        type="number"
                        min="0"
                        value={basePrice}
                        onChange={(e) => setBasePrice(e.target.value)}
                        placeholder="5000"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Сумма, которую заплатит клиент
                      </p>
                    </div>
                    <div className="flex-1 p-3 rounded-lg bg-green-50 border border-green-200">
                      <p className="text-xs text-muted-foreground mb-1">Комиссия: {commissionRate}%</p>
                      <p className="text-sm text-muted-foreground">
                        {basePrice ? Math.round(parseInt(basePrice) * commissionRate / 100).toLocaleString() : '0'} ₽
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">На руки:</p>
                      <p className="text-xl font-bold text-green-700">
                        {basePrice ? Math.round(parseInt(basePrice) * (1 - commissionRate / 100)).toLocaleString() : '0'} ₽
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 p-3 bg-muted/50 rounded-lg">
                    Комиссия сервиса {commissionRate}% — оплачивается клиентом в формате бронирования, после подтверждения вами заявки. Остальную сумму клиент оплачивает вам перед или после мероприятия — это ваше фактическое вознаграждение.
                  </p>
                </div>

                {/* Программа */}
                <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                  <h4 className="font-semibold flex items-center gap-2">
                    🎭 Программа выступления
                  </h4>
                  <div className="space-y-2">
                    <Label htmlFor="programDuration">Длительность</Label>
                    <select
                      id="programDuration"
                      value={programDuration}
                      onChange={(e) => setProgramDuration(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="20">20 минут</option>
                      <option value="25">25 минут</option>
                      <option value="30">30 минут</option>
                      <option value="35">35 минут</option>
                      <option value="40">40 минут</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="programDescription">Описание программы</Label>
                    <Textarea
                      id="programDescription"
                      value={programDescription}
                      onChange={(e) => setProgramDescription(e.target.value)}
                      placeholder="Опишите что входит в вашу программу: игры, конкурсы, стихи, вручение подарков... Количество текста в этом блоке прямо влияет на конверсию!"
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">
                      Подробное описание поможет родителям сделать выбор
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" onClick={prevStep} className="flex-1">
                    Назад
                  </Button>
                  <Button onClick={nextStep} className="flex-1">
                    Далее
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Photos */}
          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Фотографии</CardTitle>
                <CardDescription>
                  Загрузите фото в костюме (до 15 шт.)
                  <br />
                  <span className="text-amber-600 font-medium">💡 Рекомендация: первое фото желательно сделать квадратным — оно будет использоваться как главное в каталоге</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  {photosPreviews.map((preview, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                      <img
                        src={preview}
                        alt={`Фото ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => removePhoto(index)}
                        className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  
                  {photos.length < 15 && (
                    <label className="aspect-square border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">Добавить</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Video upload */}
                <div className="space-y-3">
                  <Label>Видео-приветствие (до 50 МБ)</Label>
                  <p className="text-sm text-muted-foreground">
                    Запишите короткое приветствие для родителей
                  </p>
                  
                  {videoPreview ? (
                    <div className="relative max-w-md">
                      <video 
                        src={videoPreview} 
                        controls 
                        className="w-full rounded-lg border"
                      />
                      <button
                        onClick={removeVideo}
                        className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">Загрузить видео</span>
                      <span className="text-xs text-muted-foreground mt-1">MP4, MOV до 50 МБ</span>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleVideoUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" onClick={prevStep} className="flex-1">
                    Назад
                  </Button>
                  <Button onClick={nextStep} className="flex-1">
                    Далее
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Phone Verification */}
          {step === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>Верификация</CardTitle>
                <CardDescription>
                  Подтвердите номер телефона для связи с заказчиками
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-accent/10 border border-accent/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-accent mt-0.5" />
                    <div>
                      <h4 className="font-medium text-foreground">Верификация по телефону</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        После отправки анкеты наш менеджер свяжется с вами по указанному номеру 
                        для подтверждения личности в течение 24 часов.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Phone Confirmation Section */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="space-y-2">
                    <Label className="text-base font-medium">Ваш номер телефона при регистрации:</Label>
                    <p className="text-xl font-bold text-foreground">{registeredPhone || 'Не указан'}</p>
                    <p className="text-sm text-muted-foreground">
                      Этот номер будет доступен заказчику после внесения предоплаты на сайте.
                    </p>
                  </div>

                  {phoneConfirmed === null && !phoneChangeSuccess && (
                    <div className="space-y-3">
                      <p className="text-sm font-medium">Актуален ли этот номер телефона?</p>
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() => handlePhoneConfirm(true)}
                          className="flex-1 gap-2"
                        >
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Да, актуален
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handlePhoneConfirm(false)}
                          className="flex-1 gap-2"
                        >
                          <XCircle className="h-4 w-4 text-red-500" />
                          Нет, изменить
                        </Button>
                      </div>
                    </div>
                  )}

                  {phoneConfirmed === true && !phoneChangeSuccess && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-sm text-green-700">Номер телефона подтверждён</span>
                    </div>
                  )}

                  {showPhoneChange && !phoneChangeSuccess && (
                    <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                      <div className="space-y-2">
                        <Label htmlFor="newPhone">Новый номер телефона</Label>
                        <Input
                          id="newPhone"
                          type="tel"
                          value={newPhone}
                          onChange={(e) => setNewPhone(e.target.value)}
                          placeholder="+7 (XXX) XXX-XX-XX"
                          disabled={!!authId}
                        />
                      </div>

                      {!authId ? (
                        <Button
                          onClick={handleSendCodeForNewPhone}
                          disabled={smsLoading || !newPhone.trim()}
                          className="w-full"
                        >
                          {smsLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Отправка...
                            </>
                          ) : (
                            'Отправить код подтверждения'
                          )}
                        </Button>
                      ) : (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Введите код из СМС</Label>
                            <InputOTP 
                              maxLength={6} 
                              value={smsCode}
                              onChange={setSmsCode}
                            >
                              <InputOTPGroup>
                                <InputOTPSlot index={0} />
                                <InputOTPSlot index={1} />
                                <InputOTPSlot index={2} />
                                <InputOTPSlot index={3} />
                                <InputOTPSlot index={4} />
                                <InputOTPSlot index={5} />
                              </InputOTPGroup>
                            </InputOTP>
                          </div>

                          <Button
                            onClick={handleVerifyNewPhone}
                            disabled={verifyingCode || smsCode.length !== 6}
                            className="w-full"
                          >
                            {verifyingCode ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Проверка...
                              </>
                            ) : (
                              'Подтвердить'
                            )}
                          </Button>

                          {resendTimer > 0 ? (
                            <p className="text-sm text-center text-muted-foreground">
                              Повторная отправка через {resendTimer} сек.
                            </p>
                          ) : (
                            <Button
                              variant="link"
                              onClick={() => send2FaCode(newPhone)}
                              disabled={smsLoading}
                              className="w-full"
                            >
                              Отправить код повторно
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {phoneChangeSuccess && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="font-medium text-green-700">Номер телефона изменён и подтверждён!</span>
                      </div>
                      <p className="text-sm text-green-700">Ваш пароль изменён на:</p>
                      <p className="text-3xl font-bold text-green-800 text-center py-2 bg-white rounded-lg border border-green-300">
                        {newPassword}
                      </p>
                      <p className="text-xs text-green-600 text-center">
                        Запомните или сохраните этот пароль для входа в аккаунт
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-medium">Подтверждение условий *</Label>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-2">
                      <Checkbox 
                        id="acceptAgreement" 
                        checked={acceptAgreement} 
                        onCheckedChange={(checked) => setAcceptAgreement(checked === true)}
                      />
                      <label htmlFor="acceptAgreement" className="text-sm text-muted-foreground leading-tight cursor-pointer">
                        Я принимаю{' '}
                        <Link to="/performer-agreement" target="_blank" className="text-accent hover:underline">
                          Договор возмездного оказания услуг
                        </Link>
                      </label>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Checkbox 
                        id="acceptCode" 
                        checked={acceptCode} 
                        onCheckedChange={(checked) => setAcceptCode(checked === true)}
                      />
                      <label htmlFor="acceptCode" className="text-sm text-muted-foreground leading-tight cursor-pointer">
                        Я обязуюсь соблюдать{' '}
                        <Link to="/performer-code" target="_blank" className="text-accent hover:underline">
                          Кодекс исполнителя
                        </Link>
                      </label>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Checkbox 
                        id="acceptImageUsage" 
                        checked={acceptImageUsage} 
                        onCheckedChange={(checked) => setAcceptImageUsage(checked === true)}
                      />
                      <label htmlFor="acceptImageUsage" className="text-sm text-muted-foreground leading-tight cursor-pointer">
                        Я согласен с{' '}
                        <Link to="/image-usage" target="_blank" className="text-accent hover:underline">
                          Офертой на использование изображений
                        </Link>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    📋 После отправки анкеты:
                  </p>
                  <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                    <li>Наш менеджер свяжется с вами в течение 24 часов</li>
                    <li>После верификации ваш профиль будет опубликован</li>
                    <li>Вы сможете начать принимать заказы</li>
                  </ul>
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" onClick={prevStep} className="flex-1">
                    Назад
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={loading || (phoneConfirmed === null && !phoneChangeSuccess)} 
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Отправка...
                      </>
                    ) : (
                      'Отправить анкету'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}