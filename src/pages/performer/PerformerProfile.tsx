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
import { toast } from 'sonner';
import { Loader2, Upload, X, Video, Trash2 } from 'lucide-react';
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

  // Video upload with progress
  const { uploadVideo, uploading: uploadingVideo, progress: uploadProgress, fileName: uploadFileName } = useVideoUpload({
    userId: user?.id || '',
    onSuccess: (url) => setVideoUrl(url),
  });

  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      const [profileRes, districtsRes] = await Promise.all([
        supabase.from('performer_profiles').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('districts').select('*').order('name'),
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
      }

      if (districtsRes.data) {
        setDistricts(districtsRes.data);
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
    if (!file || !user || photoUrls.length >= 5) return;

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

    setSaving(true);
    const { error } = await supabase
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
      })
      .eq('id', profile.id);

    setSaving(false);

    if (error) {
      toast.error('Ошибка сохранения');
      console.error(error);
    } else {
      toast.success('Профиль сохранён');
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

        {/* Photos */}
        <Card>
          <CardHeader>
            <CardTitle>Фотографии</CardTitle>
            <CardDescription>До 5 фотографий в костюме</CardDescription>
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
              {photoUrls.length < 5 && (
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

        {/* Types */}
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
            <CardTitle>Цена</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-w-xs">
              <Label>Цена за 30 минут (сом)</Label>
              <Input
                type="number"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Это сумма, которую вы получите наличкой после мероприятия.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Floating Save Button */}
      <FloatingSaveButton onClick={handleSave} saving={saving} />
    </PerformerLayout>
  );
}
