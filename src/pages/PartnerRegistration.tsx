import { useState } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { Copy, CheckCircle2, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  const [birthDate, setBirthDate] = useState<Date | undefined>();
  const [formData, setFormData] = useState({
    organization_name: '',
    organization_address: '',
    contact_person_name: '',
    contact_phone: '',
    teacher_last_name: '',
    teacher_first_name: '',
    teacher_middle_name: '',
    teacher_position: '',
    teacher_phone: '',
    teacher_email: '',
    confirm_max_teachers: false,
    confirm_data_correct: false,
    confirm_personal_data: false
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
    const {
      data,
      error
    } = await supabase.from('partners').insert({
      name: formData.organization_name,
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
      teacher_birth_date: birthDate ? format(birthDate, 'yyyy-MM-dd') : null,
      referral_code: referralCode,
      registered_self: true
    }).select('access_token').single();
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
    return <div className="min-h-screen flex flex-col bg-winter-950">
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
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(partnerLink)} className="shrink-0 border-magic-gold/30 text-magic-gold hover:bg-magic-gold/10">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button className="w-full" onClick={() => copyToClipboard(partnerLink)} size="lg">
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
      </div>;
  }
  return <div className="min-h-screen flex flex-col bg-winter-950">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto bg-winter-900/50 border-snow-700/20">
          <CardHeader>
            <CardTitle className="text-2xl text-snow-100">Анкета для педагогов</CardTitle>
            
          </CardHeader>
          <CardContent>
            {/* Introductory text */}
            <div className="mb-6 p-4 bg-winter-800/50 rounded-lg border border-snow-700/20 space-y-4">
              <p className="text-snow-100 font-semibold text-lg">Уважаемые коллеги!</p>
              
              <p className="text-snow-300 text-sm leading-relaxed">
                Мы ценим вас как партнеров проекта и в знак благодарности подготовили для ваших педагогов приятный новогодний подарок — бесплатный доступ к полезной образовательной программе.
              </p>
              
              <p className="text-snow-300 text-sm leading-relaxed">
                В рамках дистанционного курса педагоги познакомятся с основами мнемотехник для быстрого и легкого запоминания информации, а также получат практические инструменты, которые смогут применять в своей педагогической деятельности и на занятиях с обучающимися.
              </p>
              
              <div className="bg-winter-900/50 p-3 rounded border border-snow-700/20">
                <p className="text-snow-100 font-medium mb-2">Важная информация:</p>
                <ul className="text-snow-300 text-sm space-y-1 list-disc list-inside">
                  <li>От одной образовательной организации к участию в дистанционном обучении могут быть направлены не более трех педагогов.</li>
                  <li>При этом на каждого педагога необходимо заполнить отдельную анкету.</li>
                  <li>Номер телефона и адрес электронной почты должны быть уникальными для каждого педагога, действующими и регулярно используемыми.</li>
                </ul>
              </div>
              
              <p className="text-snow-300 text-sm leading-relaxed">
                Обучение проходит в онлайн-формате на образовательной платформе партнера:{' '}
                <a href="https://umius.ru/" target="_blank" rel="noopener noreferrer" className="text-magic-gold hover:underline">
                  https://umius.ru/
                </a>
              </p>
              
              <p className="text-snow-300 text-sm leading-relaxed">
                После заполнения анкеты в течение трех рабочих дней будет предоставлен бесплатный доступ к личному кабинету с курсом.
              </p>
              
              <p className="text-snow-300 text-sm leading-relaxed">
                Доступ к курсу предоставляется бесплатно сроком на 30 календарных дней.
              </p>
              
              <p className="text-snow-300 text-sm leading-relaxed">
                По итогам прохождения всех модулей и обязательных тестирований автоматически формируется электронный сертификат о прохождении курса.
              </p>
              
              <p className="text-snow-300 text-sm leading-relaxed italic">
                В завершение поздравляем вас с наступающим Новым годом и желаем приятных, спокойных праздников, вдохновения, профессиональных успехов и новых достижений в наступающем году!
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Section 1: Organization data */}
              <div className="space-y-4">
                <h3 className="font-semibold text-snow-100 border-b border-snow-700/30 pb-2">
                  1. Данные об образовательной организации
                </h3>
                
                <div>
                  <Label htmlFor="organization_name" className="text-snow-300">
                    Полное наименование образовательной организации *
                  </Label>
                  <Input id="organization_name" value={formData.organization_name} onChange={e => setFormData(prev => ({
                  ...prev,
                  organization_name: e.target.value
                }))} placeholder="МБОУ СОШ №1 г. Москвы" required className="!bg-winter-800 border-snow-700/30 !text-snow-100 placeholder:text-snow-500" />
                </div>

                <div>
                  <Label htmlFor="organization_address" className="text-snow-300">
                    Адрес образовательной организации
                  </Label>
                  <Input id="organization_address" value={formData.organization_address} onChange={e => setFormData(prev => ({
                  ...prev,
                  organization_address: e.target.value
                }))} placeholder="г. Москва, ул. Примерная, д. 1" className="!bg-winter-800 border-snow-700/30 !text-snow-100 placeholder:text-snow-500" />
                </div>

                <div>
                  <Label htmlFor="contact_person_name" className="text-snow-300">
                    ФИО контактного лица, заполняющего анкету
                  </Label>
                  <Input id="contact_person_name" value={formData.contact_person_name} onChange={e => setFormData(prev => ({
                  ...prev,
                  contact_person_name: e.target.value
                }))} placeholder="Иванов Иван Иванович" className="!bg-winter-800 border-snow-700/30 !text-snow-100 placeholder:text-snow-500" />
                </div>

                <div>
                  <Label htmlFor="contact_phone" className="text-snow-300">
                    Телефон контактного лица
                  </Label>
                  <Input id="contact_phone" type="tel" value={formData.contact_phone} onChange={e => setFormData(prev => ({
                  ...prev,
                  contact_phone: e.target.value
                }))} placeholder="+7 999 123-45-67" className="!bg-winter-800 border-snow-700/30 !text-snow-100 placeholder:text-snow-500" />
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
                    <Input id="teacher_last_name" value={formData.teacher_last_name} onChange={e => setFormData(prev => ({
                    ...prev,
                    teacher_last_name: e.target.value
                  }))} placeholder="Иванов" className="!bg-winter-800 border-snow-700/30 !text-snow-100 placeholder:text-snow-500" />
                  </div>
                  <div>
                    <Label htmlFor="teacher_first_name" className="text-snow-300">
                      Имя
                    </Label>
                    <Input id="teacher_first_name" value={formData.teacher_first_name} onChange={e => setFormData(prev => ({
                    ...prev,
                    teacher_first_name: e.target.value
                  }))} placeholder="Иван" className="!bg-winter-800 border-snow-700/30 !text-snow-100 placeholder:text-snow-500" />
                  </div>
                  <div>
                    <Label htmlFor="teacher_middle_name" className="text-snow-300">
                      Отчество (при наличии)
                    </Label>
                    <Input id="teacher_middle_name" value={formData.teacher_middle_name} onChange={e => setFormData(prev => ({
                    ...prev,
                    teacher_middle_name: e.target.value
                  }))} placeholder="Иванович" className="!bg-winter-800 border-snow-700/30 !text-snow-100 placeholder:text-snow-500" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="teacher_position" className="text-snow-300">
                    Должность
                  </Label>
                  <Input id="teacher_position" value={formData.teacher_position} onChange={e => setFormData(prev => ({
                  ...prev,
                  teacher_position: e.target.value
                }))} placeholder="Заместитель директора" className="!bg-winter-800 border-snow-700/30 !text-snow-100 placeholder:text-snow-500" />
                </div>

                <div>
                  <Label className="text-snow-300">
                    Дата рождения
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal !bg-winter-800 border-snow-700/30 hover:!bg-winter-700",
                          !birthDate && "text-snow-500"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-snow-400" />
                        {birthDate ? (
                          <span className="text-snow-100">{format(birthDate, "dd.MM.yyyy")}</span>
                        ) : (
                          <span>Выберите дату</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-winter-800 border-snow-700/30" align="start">
                      <Calendar
                        mode="single"
                        selected={birthDate}
                        onSelect={setBirthDate}
                        disabled={(date) => date > new Date() || date < new Date("1940-01-01")}
                        initialFocus
                        locale={ru}
                        className="pointer-events-auto"
                        captionLayout="dropdown-buttons"
                        fromYear={1940}
                        toYear={new Date().getFullYear()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="teacher_phone" className="text-snow-300">
                      Контактный номер телефона (уникальный, действующий)
                    </Label>
                    <Input id="teacher_phone" type="tel" value={formData.teacher_phone} onChange={e => setFormData(prev => ({
                    ...prev,
                    teacher_phone: e.target.value
                  }))} placeholder="+7 999 123-45-67" className="!bg-winter-800 border-snow-700/30 !text-snow-100 placeholder:text-snow-500" />
                  </div>
                  <div>
                    <Label htmlFor="teacher_email" className="text-snow-300">
                      Адрес электронной почты (уникальный, действующий)
                    </Label>
                    <Input id="teacher_email" type="email" value={formData.teacher_email} onChange={e => setFormData(prev => ({
                    ...prev,
                    teacher_email: e.target.value
                  }))} placeholder="email@example.com" className="!bg-winter-800 border-snow-700/30 !text-snow-100 placeholder:text-snow-500" />
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
                    <Checkbox id="confirm_max_teachers" checked={formData.confirm_max_teachers} onCheckedChange={v => setFormData(prev => ({
                    ...prev,
                    confirm_max_teachers: v as boolean
                  }))} className="mt-0.5" />
                    <Label htmlFor="confirm_max_teachers" className="text-snow-300 text-sm cursor-pointer">
                      Подтверждаю, что от одной образовательной организации направлено не более трех педагогов
                    </Label>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox id="confirm_data_correct" checked={formData.confirm_data_correct} onCheckedChange={v => setFormData(prev => ({
                    ...prev,
                    confirm_data_correct: v as boolean
                  }))} className="mt-0.5" />
                    <Label htmlFor="confirm_data_correct" className="text-snow-300 text-sm cursor-pointer">
                      Подтверждаю корректность и актуальность указанных контактных данных
                    </Label>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox id="confirm_personal_data" checked={formData.confirm_personal_data} onCheckedChange={v => setFormData(prev => ({
                    ...prev,
                    confirm_personal_data: v as boolean
                  }))} className="mt-0.5" />
                    <Label htmlFor="confirm_personal_data" className="text-snow-300 text-sm cursor-pointer">
                      <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-magic-gold hover:underline">
                        Согласие на обработку персональных данных
                      </a>{' '}
                      *
                    </Label>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? 'Отправка...' : 'Отправить!'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>;
}