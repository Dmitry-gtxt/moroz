import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { PerformerLayout } from './PerformerDashboard';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FloatingSaveButton } from '@/components/ui/floating-save-button';
import { UploadProgress } from '@/components/ui/upload-progress';
import { useVideoUpload } from '@/hooks/useVideoUpload';
import { sendProfileVerificationNotification } from '@/lib/notifications';
import { PushNotificationToggle } from '@/components/notifications/PushNotificationToggle';
import { toast } from 'sonner';
import { Loader2, Upload, X, Video, Trash2, AlertTriangle, Send, Bell } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Database } from '@/integrations/supabase/types';

type PerformerProfile = Database['public']['Tables']['performer_profiles']['Row'];
type PerformerType = Database['public']['Enums']['performer_type'];
type EventFormat = Database['public']['Enums']['event_format'];

const performerTypes: { value: PerformerType; label: string }[] = [
  { value: 'ded_moroz', label: 'Дед Мороз' },
  { value: 'snegurochka', label: 'Снегурочка' },
  { value: 'santa', label: 'Санта Клаус' },
  { value: 'duo', label: 'Дуэт' },
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

export default function PerformerProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<PerformerProfile | null>(null);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resubmitting, setResubmitting] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<PerformerType[]>([]);
  const [selectedFormats, setSelectedFormats] = useState<EventFormat[]>([]);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [basePrice, setBasePrice] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [costumeStyle, setCostumeStyle] = useState('');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [programDuration, setProgramDuration] = useState('30');
  const [programDescription, setProgramDescription] = useState('');
  const [commissionRate, setCommissionRate] = useState(40);

  // Video upload with progress
  const { uploadVideo, uploading: uploadingVideo, progress: uploadProgress, fileName: uploadFileName } = useVideoUpload({
    userId: user?.id || '',
    onSuccess: (url) => setVideoUrl(url),
  });

  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      const [profileRes, districtsRes, commissionRes] = await Promise.all([
        supabase.from('performer_profiles').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('districts').select('*').order('name'),
        supabase.from('public_platform_settings').select('value').eq('key', 'commission_rate').maybeSingle(),
      ]);

      if (profileRes.data) {
        const p = profileRes.data;
        setProfile(p);
        setDisplayName(p.display_name);
        setDescription(p.description || '');
        setSelectedTypes(p.performer_types as PerformerType[]);
        setSelectedFormats(p.formats as EventFormat[]);
        setSelectedDistricts(p.district_slugs);
        setBasePrice(p.base_price.toString());
        setExperienceYears(p.experience_years?.toString() || '');
        setCostumeStyle(p.costume_style || '');
        setPhotoUrls(p.photo_urls);
        setVideoUrl(p.video_greeting_url);
        setProgramDuration((p as any).program_duration?.toString() || '30');
        setProgramDescription((p as any).program_description || '');
      }

      if (districtsRes.data) {
        setDistricts(districtsRes.data);
      }

      if (commissionRes.data?.value) {
        setCommissionRate(parseInt(commissionRes.data.value, 10) || 40);
      }

      setLoading(false);
    }

    if (!authLoading) {
      fetchData();
    }
  }, [user, authLoading]);

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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || photoUrls.length >= 15) return;

    const fileName = `${user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('performer-photos').upload(fileName, file);
    
    if (error) {
      toast.error('Ошибка загрузки фото');
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('performer-photos').getPublicUrl(fileName);
    setPhotoUrls([...photoUrls, publicUrl]);
    toast.success('Фото загружено');
  };

  const removePhoto = (index: number) => {
    setPhotoUrls(photoUrls.filter((_, i) => i !== index));
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    await uploadVideo(file);
  };

  const removeVideo = async () => {
    setVideoUrl(null);
    toast.success('Видео удалено');
  };

  const handleSave = async () => {
    if (!profile) return;

    // Track changed fields for notification
    const changedFields: string[] = [];
    if (displayName !== profile.display_name) changedFields.push('display_name');
    if (description !== (profile.description || '')) changedFields.push('description');
    if (JSON.stringify(selectedTypes) !== JSON.stringify(profile.performer_types)) changedFields.push('performer_types');
    if (JSON.stringify(selectedFormats) !== JSON.stringify(profile.formats)) changedFields.push('formats');
    if (JSON.stringify(selectedDistricts) !== JSON.stringify(profile.district_slugs)) changedFields.push('district_slugs');
    if ((parseInt(basePrice) || profile.base_price) !== profile.base_price) changedFields.push('base_price');
    if ((experienceYears ? parseInt(experienceYears) : null) !== profile.experience_years) changedFields.push('experience_years');
    if ((costumeStyle || null) !== profile.costume_style) changedFields.push('costume_style');
    if (JSON.stringify(photoUrls) !== JSON.stringify(profile.photo_urls)) changedFields.push('photo_urls');
    if (videoUrl !== profile.video_greeting_url) changedFields.push('video_greeting_url');

    // Check if any content fields changed (triggers re-verification by database trigger)
    const contentChanged = changedFields.length > 0;

    setSaving(true);
    const { error, data } = await supabase
      .from('performer_profiles')
      .update({
        display_name: displayName,
        description,
        performer_types: selectedTypes,
        formats: selectedFormats,
        district_slugs: selectedDistricts,
        base_price: parseInt(basePrice) || profile.base_price,
        experience_years: experienceYears ? parseInt(experienceYears) : null,
        costume_style: costumeStyle || null,
        photo_urls: photoUrls,
        video_greeting_url: videoUrl,
        program_duration: programDuration ? parseInt(programDuration) : 30,
        program_description: programDescription || null,
      })
      .eq('id', profile.id)
      .select()
      .single();

    setSaving(false);

    if (error) {
      toast.error('Ошибка сохранения');
      console.error(error);
    } else {
      // Update local profile state with returned data (may have changed verification_status)
      if (data) {
        setProfile(data);
      }

      // If content changed and profile was verified/active, send notifications
      if (contentChanged && (profile.verification_status === 'verified' || profile.is_active)) {
        toast.success('Профиль сохранён и отправлен на проверку');
        
        // Send email notifications (to performer and admin)
        sendProfileVerificationNotification({
          performerId: profile.id,
          performerName: displayName,
          changedFields,
        }).catch(console.error);
      } else {
        toast.success('Профиль сохранён');
      }
    }
  };

  const handleResubmitVerification = async () => {
    if (!profile) return;

    setResubmitting(true);
    const { error } = await supabase
      .from('performer_profiles')
      .update({ verification_status: 'pending' })
      .eq('id', profile.id);

    setResubmitting(false);

    if (error) {
      toast.error('Ошибка отправки заявки');
      console.error(error);
    } else {
      setProfile({ ...profile, verification_status: 'pending' });
      toast.success('Заявка отправлена на повторную проверку');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!profile) {
    return <Navigate to="/become-performer" replace />;
  }

  return (
    <PerformerLayout>
      <div className="space-y-6 max-w-3xl pb-20">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Мой профиль</h1>
          <p className="text-muted-foreground mt-1">Редактирование информации</p>
        </div>

        {/* Rejected verification alert */}
        {profile.verification_status === 'rejected' && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Ваша заявка была отклонена. Обновите данные и отправьте повторно.</span>
              <Button 
                size="sm" 
                onClick={handleResubmitVerification}
                disabled={resubmitting}
              >
                {resubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Отправить на проверку
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {profile.verification_status === 'pending' && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              Ваша заявка находится на рассмотрении. Мы уведомим вас о результате.
            </AlertDescription>
          </Alert>
        )}

        {/* Photos */}
        <Card>
          <CardHeader>
            <CardTitle>Фотографии</CardTitle>
            <CardDescription>
              До 15 фотографий в костюме
              <br />
              <span className="text-amber-600 font-medium">💡 Рекомендация: первое фото желательно сделать квадратным — оно будет использоваться как главное в каталоге</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4">
              {photoUrls.map((url, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                  <img src={url} alt={`Фото ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removePhoto(index)}
                    className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {photoUrls.length < 15 && (
                <label className="aspect-square border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                  <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">Добавить</span>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Video greeting */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Видео-приветствие
            </CardTitle>
            <CardDescription>
              Короткое видео до 50 МБ (mp4, webm, mov). Клиенты смогут увидеть вас в деле!
            </CardDescription>
          </CardHeader>
          <CardContent>
            {uploadingVideo ? (
              <div className="p-6 border-2 border-dashed border-primary/30 rounded-lg bg-primary/5">
                <UploadProgress progress={uploadProgress} fileName={uploadFileName} />
              </div>
            ) : videoUrl ? (
              <div className="space-y-4">
                <div className="relative aspect-video rounded-lg overflow-hidden border bg-black">
                  <video 
                    src={videoUrl} 
                    controls 
                    className="w-full h-full object-contain"
                  />
                </div>
                <Button variant="destructive" size="sm" onClick={removeVideo}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Удалить видео
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                <Video className="h-10 w-10 text-muted-foreground mb-3" />
                <span className="font-medium">Загрузить видео</span>
                <span className="text-sm text-muted-foreground mt-1">MP4, WebM, MOV до 50 МБ</span>
                <input 
                  type="file" 
                  accept="video/mp4,video/webm,video/quicktime" 
                  onChange={handleVideoUpload} 
                  className="hidden" 
                />
              </label>
            )}
          </CardContent>
        </Card>

        {/* Basic info */}
        <Card>
          <CardHeader>
            <CardTitle>Основная информация</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Имя / Псевдоним</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">О себе</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Опыт (лет)</Label>
                <Input
                  type="number"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Костюм</Label>
                <Input
                  value={costumeStyle}
                  onChange={(e) => setCostumeStyle(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Program */}
        <Card>
          <CardHeader>
            <CardTitle>🎭 Программа выступления</CardTitle>
            <CardDescription>Информация о вашей программе для родителей</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="programDuration">Длительность (минут)</Label>
                <Input
                  id="programDuration"
                  type="number"
                  min="10"
                  max="180"
                  value={programDuration}
                  onChange={(e) => setProgramDuration(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Цена для клиента</Label>
                <div className="p-3 rounded-lg bg-accent/10 border border-accent/30">
                  <p className="text-xl font-bold text-accent">
                    {basePrice ? Math.round(parseInt(basePrice) * (1 + commissionRate / 100)).toLocaleString() : '0'} ₽
                  </p>
                  <p className="text-xs text-muted-foreground">
                    (включая {commissionRate}% комиссии)
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="programDescription">Описание программы</Label>
              <Textarea
                id="programDescription"
                value={programDescription}
                onChange={(e) => setProgramDescription(e.target.value)}
                placeholder="Опишите что входит в вашу программу: игры, конкурсы, стихи, вручение подарков..."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Подробное описание поможет родителям сделать выбор
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Тип исполнителя</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {performerTypes.map((type) => (
                <div
                  key={type.value}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
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
          </CardContent>
        </Card>

        {/* Formats & Districts */}
        <Card>
          <CardHeader>
            <CardTitle>Форматы и районы</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Форматы мероприятий</Label>
              <div className="grid grid-cols-3 gap-2">
                {eventFormats.map((format) => (
                  <div
                    key={format.value}
                    className={`p-2 text-sm border rounded cursor-pointer transition-colors ${
                      selectedFormats.includes(format.value)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => toggleFormat(format.value)}
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox checked={selectedFormats.includes(format.value)} />
                      <span>{format.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Районы работы</Label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded-lg">
                {districts.map((district) => (
                  <div
                    key={district.id}
                    className={`p-2 rounded cursor-pointer transition-colors ${
                      selectedDistricts.includes(district.slug)
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => toggleDistrict(district.slug)}
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox checked={selectedDistricts.includes(district.slug)} />
                      <span className="text-sm">{district.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>Минимальная цена</CardTitle>
            <CardDescription>Ваша базовая цена за выступление</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-start">
              <div className="flex-1 space-y-2">
                <Label>Минимальная цена (₽)</Label>
                <Input
                  type="number"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  placeholder="3000"
                />
                <p className="text-xs text-muted-foreground">
                  Это сумма, которую вы получите наличкой после мероприятия.
                </p>
              </div>
              <div className="flex-1 p-3 rounded-lg bg-accent/10 border border-accent/30">
                <p className="text-xs text-muted-foreground mb-1">Цена для клиента:</p>
                <p className="text-xl font-bold text-accent">
                  {basePrice ? Math.round(parseInt(basePrice) * (1 + commissionRate / 100)).toLocaleString() : '0'} ₽
                </p>
                <p className="text-xs text-muted-foreground">
                  (включая {commissionRate}% комиссии)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Уведомления
            </CardTitle>
            <CardDescription>Настройки push-уведомлений</CardDescription>
          </CardHeader>
          <CardContent>
            <PushNotificationToggle />
          </CardContent>
        </Card>
      </div>

      {/* Floating Save Button */}
      <FloatingSaveButton onClick={handleSave} saving={saving} />
    </PerformerLayout>
  );
}
