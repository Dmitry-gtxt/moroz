import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Copy, CheckCircle2 } from 'lucide-react';

const organizationTypes = [
  { value: 'event_agency', label: 'Event-агентство' },
  { value: 'kids_center', label: 'Детский центр' },
  { value: 'kindergarten', label: 'Садик' },
  { value: 'school', label: 'Школа' },
  { value: 'educational', label: 'Образовательное учреждение' },
  { value: 'individual', label: 'Физическое лицо' },
  { value: 'other', label: 'Другое' },
];

function generateReferralCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default function PartnerRegistration() {
  const [loading, setLoading] = useState(false);
  const [partnerLink, setPartnerLink] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    organization_name: '',
    organization_address: '',
    organization_type: '',
    contact_person_name: '',
    contact_phone: '',
    teacher_last_name: '',
    teacher_first_name: '',
    teacher_middle_name: '',
    teacher_position: '',
    teacher_phone: '',
    teacher_email: '',
    teacher_birth_date: '',
    confirm_max_teachers: false,
    confirm_data_correct: false,
    confirm_personal_data: false,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.organization_name) {
      toast.error('Укажите название организации');
      return;
    }
    
    if (!formData.confirm_personal_data) {
      toast.error('Необходимо согласие на обработку персональных данных');
      return;
    }

    setLoading(true);

    const referralCode = generateReferralCode();

    const { data, error } = await supabase
      .from('partners')
      .insert({
        name: formData.organization_name,
        organization_type: formData.organization_type || null,
        organization_address: formData.organization_address || null,
        contact_person_name: formData.contact_person_name || null,
        contact_phone: formData.contact_phone || null,
        contact_email: formData.teacher_email || null,
        teacher_last_name: formData.teacher_last_name || null,
        teacher_first_name: formData.teacher_first_name || null,
        teacher_middle_name: formData.teacher_middle_name || null,
        teacher_position: formData.teacher_position || null,
        teacher_phone: formData.teacher_phone || null,
        teacher_email: formData.teacher_email || null,
        teacher_birth_date: formData.teacher_birth_date || null,
        referral_code: referralCode,
        registered_self: true,
      })
      .select('access_token')
      .single();

    setLoading(false);

    if (error) {
      console.error('Error creating partner:', error);
      toast.error('Ошибка при регистрации. Попробуйте ещё раз.');
      return;
    }

    const link = `${window.location.origin}/partner/${data.access_token}`;
    setPartnerLink(link);
    toast.success('Регистрация прошла успешно!');
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success('Ссылка скопирована в буфер обмена');
  }

  // Success screen with partner link
  if (partnerLink) {
    return (
      <div className="min-h-screen flex flex-col bg-winter-950">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-lg w-full bg-winter-900/50 border-magic-gold/30">
            <CardHeader className="text-center">
              <CheckCircle2 className="h-16 w-16 mx-auto text-green-500 mb-4" />
              <CardTitle className="text-2xl text-snow-100">Регистрация завершена!</CardTitle>
              <CardDescription className="text-snow-400 text-base">
                Сохраните ссылку на ваш личный кабинет партнёра
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-red-950/30 border border-red-500/30 rounded-lg p-4 text-center">
                <p className="text-red-300 font-semibold mb-2">
                  ⚠️ ВАЖНО! Сохраните эту ссылку!
                </p>
                <p className="text-snow-400 text-sm">
                  Это единственный способ получить доступ к вашему кабинету. Ссылка уникальна и не подлежит восстановлению. Никому не передавайте её.
                </p>
              </div>

              <div className="bg-winter-800 rounded-lg p-4">
                <Label className="text-snow-400 text-sm mb-2 block">Ваша ссылка на кабинет партнёра:</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-winter-950 px-4 py-3 rounded text-magic-gold text-sm break-all">
                    {partnerLink}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(partnerLink)}
                    className="shrink-0 border-magic-gold/30 text-magic-gold hover:bg-magic-gold/10"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button 
                className="w-full" 
                onClick={() => copyToClipboard(partnerLink)}
                size="lg"
              >
                <Copy className="h-4 w-4 mr-2" />
                Скопировать ссылку
              </Button>

              <p className="text-center text-snow-500 text-sm">
                После копирования вы можете перейти по ссылке в свой кабинет партнёра.
              </p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-winter-950">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto bg-winter-900/50 border-snow-700/20">
          <CardHeader>
            <CardTitle className="text-2xl text-snow-100">Анкета для педагогов</CardTitle>
            <CardDescription className="text-snow-400">
              Регистрация на курс повышения квалификации
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Introductory text */}
            <div className="mb-6 p-4 bg-winter-800/50 rounded-lg border border-snow-700/20">
              <p className="text-snow-300 text-sm leading-relaxed mb-3">
                <strong className="text-snow-100">АНО ДПО «Умиус»</strong> — организация дополнительного образования, 
                занимающаяся повышением квалификации учителей. Наше учреждение имеет лицензию на ведение образовательной деятельности.
              </p>
              <p className="text-snow-300 text-sm leading-relaxed mb-3">
                Мы приглашаем педагогов пройти курс повышения квалификации на тему:{' '}
                <strong className="text-magic-gold">«Современные педагогические технологии»</strong>.
              </p>
              <p className="text-snow-300 text-sm leading-relaxed mb-3">
                Курс дистанционный, проходит на нашем портале (будет выслана ссылка после заполнения анкеты), 
                займёт примерно 2-4 часа вашего времени.
              </p>
              <p className="text-snow-300 text-sm leading-relaxed">
                По завершении курса вы получите <strong className="text-snow-100">удостоверение о повышении квалификации</strong> установленного образца (36 часов).
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Section 1: Organization data */}
              <div className="space-y-4">
                <h3 className="font-semibold text-snow-100 border-b border-snow-700/30 pb-2">
                  1. Данные об организации
                </h3>
                
                <div>
                  <Label htmlFor="organization_name" className="text-snow-300">
                    Полное наименование организации *
                  </Label>
                  <Input
                    id="organization_name"
                    value={formData.organization_name}
                    onChange={e => setFormData(prev => ({ ...prev, organization_name: e.target.value }))}
                    placeholder="МБОУ СОШ №1"
                    required
                    className="bg-winter-800 border-snow-700/30 text-snow-100"
                  />
                </div>

                <div>
                  <Label htmlFor="organization_type" className="text-snow-300">
                    Тип организации
                  </Label>
                  <Select
                    value={formData.organization_type}
                    onValueChange={v => setFormData(prev => ({ ...prev, organization_type: v }))}
                  >
                    <SelectTrigger className="bg-winter-800 border-snow-700/30 text-snow-100">
                      <SelectValue placeholder="Выберите тип" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizationTypes.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="organization_address" className="text-snow-300">
                    Адрес организации
                  </Label>
                  <Input
                    id="organization_address"
                    value={formData.organization_address}
                    onChange={e => setFormData(prev => ({ ...prev, organization_address: e.target.value }))}
                    placeholder="г. Москва, ул. Примерная, д. 1"
                    className="bg-winter-800 border-snow-700/30 text-snow-100"
                  />
                </div>

                <div>
                  <Label htmlFor="contact_person_name" className="text-snow-300">
                    ФИО контактного лица
                  </Label>
                  <Input
                    id="contact_person_name"
                    value={formData.contact_person_name}
                    onChange={e => setFormData(prev => ({ ...prev, contact_person_name: e.target.value }))}
                    placeholder="Иванов Иван Иванович"
                    className="bg-winter-800 border-snow-700/30 text-snow-100"
                  />
                </div>

                <div>
                  <Label htmlFor="contact_phone" className="text-snow-300">
                    Телефон контактного лица
                  </Label>
                  <Input
                    id="contact_phone"
                    type="tel"
                    value={formData.contact_phone}
                    onChange={e => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                    placeholder="+7 999 123-45-67"
                    className="bg-winter-800 border-snow-700/30 text-snow-100"
                  />
                </div>
              </div>

              {/* Section 2: Listener data */}
              <div className="space-y-4">
                <h3 className="font-semibold text-snow-100 border-b border-snow-700/30 pb-2">
                  2. Данные на слушателя дистанционного курса
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="teacher_last_name" className="text-snow-300">
                      Фамилия
                    </Label>
                    <Input
                      id="teacher_last_name"
                      value={formData.teacher_last_name}
                      onChange={e => setFormData(prev => ({ ...prev, teacher_last_name: e.target.value }))}
                      placeholder="Иванов"
                      className="bg-winter-800 border-snow-700/30 text-snow-100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="teacher_first_name" className="text-snow-300">
                      Имя
                    </Label>
                    <Input
                      id="teacher_first_name"
                      value={formData.teacher_first_name}
                      onChange={e => setFormData(prev => ({ ...prev, teacher_first_name: e.target.value }))}
                      placeholder="Иван"
                      className="bg-winter-800 border-snow-700/30 text-snow-100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="teacher_middle_name" className="text-snow-300">
                      Отчество
                    </Label>
                    <Input
                      id="teacher_middle_name"
                      value={formData.teacher_middle_name}
                      onChange={e => setFormData(prev => ({ ...prev, teacher_middle_name: e.target.value }))}
                      placeholder="Иванович"
                      className="bg-winter-800 border-snow-700/30 text-snow-100"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="teacher_position" className="text-snow-300">
                    Должность
                  </Label>
                  <Input
                    id="teacher_position"
                    value={formData.teacher_position}
                    onChange={e => setFormData(prev => ({ ...prev, teacher_position: e.target.value }))}
                    placeholder="Заместитель директора"
                    className="bg-winter-800 border-snow-700/30 text-snow-100"
                  />
                </div>

                <div>
                  <Label htmlFor="teacher_birth_date" className="text-snow-300">
                    Дата рождения
                  </Label>
                  <Input
                    id="teacher_birth_date"
                    type="date"
                    value={formData.teacher_birth_date}
                    onChange={e => setFormData(prev => ({ ...prev, teacher_birth_date: e.target.value }))}
                    className="bg-winter-800 border-snow-700/30 text-snow-100"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="teacher_phone" className="text-snow-300">
                      Контактный телефон
                    </Label>
                    <Input
                      id="teacher_phone"
                      type="tel"
                      value={formData.teacher_phone}
                      onChange={e => setFormData(prev => ({ ...prev, teacher_phone: e.target.value }))}
                      placeholder="+7 999 123-45-67"
                      className="bg-winter-800 border-snow-700/30 text-snow-100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="teacher_email" className="text-snow-300">
                      Email
                    </Label>
                    <Input
                      id="teacher_email"
                      type="email"
                      value={formData.teacher_email}
                      onChange={e => setFormData(prev => ({ ...prev, teacher_email: e.target.value }))}
                      placeholder="email@example.com"
                      className="bg-winter-800 border-snow-700/30 text-snow-100"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Confirmations */}
              <div className="space-y-4">
                <h3 className="font-semibold text-snow-100 border-b border-snow-700/30 pb-2">
                  3. Подтверждения
                </h3>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="confirm_max_teachers"
                      checked={formData.confirm_max_teachers}
                      onCheckedChange={v => setFormData(prev => ({ ...prev, confirm_max_teachers: v as boolean }))}
                      className="mt-0.5"
                    />
                    <Label htmlFor="confirm_max_teachers" className="text-snow-300 text-sm cursor-pointer">
                      Подтверждаю корректность указанной информации
                    </Label>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="confirm_data_correct"
                      checked={formData.confirm_data_correct}
                      onCheckedChange={v => setFormData(prev => ({ ...prev, confirm_data_correct: v as boolean }))}
                      className="mt-0.5"
                    />
                    <Label htmlFor="confirm_data_correct" className="text-snow-300 text-sm cursor-pointer">
                      Подтверждаю актуальность указанных контактных данных
                    </Label>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="confirm_personal_data"
                      checked={formData.confirm_personal_data}
                      onCheckedChange={v => setFormData(prev => ({ ...prev, confirm_personal_data: v as boolean }))}
                      className="mt-0.5"
                    />
                    <Label htmlFor="confirm_personal_data" className="text-snow-300 text-sm cursor-pointer">
                      Даю{' '}
                      <a 
                        href="/privacy" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-magic-gold hover:underline"
                      >
                        согласие на обработку персональных данных
                      </a>{' '}
                      *
                    </Label>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={loading}
              >
                {loading ? 'Регистрация...' : 'Отправить'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}