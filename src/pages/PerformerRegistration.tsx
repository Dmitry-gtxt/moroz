import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Upload, X, Check, Loader2 } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type PerformerType = Database['public']['Enums']['performer_type'];
type EventFormat = Database['public']['Enums']['event_format'];
type DocumentType = Database['public']['Enums']['document_type'];

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

const documentTypes: { value: DocumentType; label: string }[] = [
  { value: 'passport', label: 'Паспорт' },
  { value: 'id_card', label: 'ID-карта' },
  { value: 'other', label: 'Другой документ' },
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
  const [districts, setDistricts] = useState<District[]>([]);
  const [districtsLoading, setDistrictsLoading] = useState(true);
  
  // Form data
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<PerformerType[]>([]);
  const [selectedFormats, setSelectedFormats] = useState<EventFormat[]>([]);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [priceFrom, setPriceFrom] = useState('');
  const [priceTo, setPriceTo] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [costumeStyle, setCostumeStyle] = useState('');
  
  // Files
  const [photos, setPhotos] = useState<File[]>([]);
  const [photosPreviews, setPhotosPreviews] = useState<string[]>([]);
  const [documents, setDocuments] = useState<{ type: DocumentType; file: File }[]>([]);

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

  // Redirect to auth if not logged in (after all hooks)
  if (!authLoading && !user) {
    return <Navigate to="/auth?redirect=/become-performer" replace />;
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > 5) {
      toast.error('Максимум 5 фотографий');
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

  const handleDocumentUpload = (type: DocumentType, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Remove existing document of this type
    setDocuments(docs => [...docs.filter(d => d.type !== type), { type, file }]);
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
      if (!priceFrom) {
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
    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const prevStep = () => setStep(step - 1);

  const handleSubmit = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // 1. Upload photos
      const photoUrls: string[] = [];
      for (const photo of photos) {
        const fileName = `${user.id}/${Date.now()}-${photo.name}`;
        const { error: uploadError } = await supabase.storage
          .from('performer-photos')
          .upload(fileName, photo);
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('performer-photos')
          .getPublicUrl(fileName);
        
        photoUrls.push(publicUrl);
      }

      // 2. Create performer profile
      const { data: profile, error: profileError } = await supabase
        .from('performer_profiles')
        .insert({
          user_id: user.id,
          display_name: displayName,
          description,
          performer_types: selectedTypes,
          formats: selectedFormats,
          district_slugs: selectedDistricts,
          price_from: parseInt(priceFrom),
          price_to: priceTo ? parseInt(priceTo) : null,
          base_price: parseInt(priceFrom),
          experience_years: experienceYears ? parseInt(experienceYears) : 0,
          costume_style: costumeStyle || null,
          photo_urls: photoUrls,
          is_active: false,
          verification_status: 'pending',
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // 3. Upload documents
      for (const doc of documents) {
        const fileName = `${user.id}/${Date.now()}-${doc.file.name}`;
        const { error: docUploadError } = await supabase.storage
          .from('verification-docs')
          .upload(fileName, doc.file);
        
        if (docUploadError) throw docUploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('verification-docs')
          .getPublicUrl(fileName);

        await supabase.from('verification_documents').insert({
          performer_id: profile.id,
          document_type: doc.type,
          document_url: publicUrl,
          status: 'pending',
        });
      }

      // 4. Add performer role
      await supabase.from('user_roles').insert({
        user_id: user.id,
        role: 'performer',
      });

      toast.success('Анкета отправлена на модерацию!');
      navigate('/');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Ошибка при регистрации. Попробуйте снова.');
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
                    <div className="grid grid-cols-2 gap-2 p-2 border rounded-lg">
                      {districts.map((district) => (
                        <div
                          key={district.id}
                          className={`p-3 rounded-lg cursor-pointer transition-colors ${
                            selectedDistricts.includes(district.slug)
                              ? 'bg-primary/10 text-primary border border-primary'
                              : 'hover:bg-muted border border-transparent'
                          }`}
                          onClick={() => toggleDistrict(district.slug)}
                        >
                          <div className="flex items-center gap-2">
                            <Checkbox checked={selectedDistricts.includes(district.slug)} />
                            <span className="text-sm font-medium">{district.name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedDistricts.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Выбрано: {selectedDistricts.length} район(ов)
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priceFrom">Цена от (сом) *</Label>
                    <Input
                      id="priceFrom"
                      type="number"
                      min="0"
                      value={priceFrom}
                      onChange={(e) => setPriceFrom(e.target.value)}
                      placeholder="3000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priceTo">Цена до (сом)</Label>
                    <Input
                      id="priceTo"
                      type="number"
                      min="0"
                      value={priceTo}
                      onChange={(e) => setPriceTo(e.target.value)}
                      placeholder="10000"
                    />
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
                <CardDescription>Загрузите фото в костюме (до 5 шт.)</CardDescription>
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
                  
                  {photos.length < 5 && (
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

          {/* Step 4: Documents */}
          {step === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>Документы для верификации</CardTitle>
                <CardDescription>
                  Загрузите документы для подтверждения личности (опционально, но ускорит модерацию)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {documentTypes.map((docType) => {
                    const uploadedDoc = documents.find(d => d.type === docType.value);
                    return (
                      <div
                        key={docType.value}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{docType.label}</p>
                          {uploadedDoc && (
                            <p className="text-sm text-muted-foreground">
                              {uploadedDoc.file.name}
                            </p>
                          )}
                        </div>
                        <label className="cursor-pointer">
                          <Button variant={uploadedDoc ? "secondary" : "outline"} asChild>
                            <span>
                              {uploadedDoc ? <Check className="h-4 w-4 mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                              {uploadedDoc ? 'Загружено' : 'Загрузить'}
                            </span>
                          </Button>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleDocumentUpload(docType.value, e)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    );
                  })}
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    📋 После отправки анкеты наши модераторы проверят её в течение 24 часов.
                    Вы получите уведомление о результате.
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" onClick={prevStep} className="flex-1">
                    Назад
                  </Button>
                  <Button onClick={handleSubmit} disabled={loading} className="flex-1">
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
