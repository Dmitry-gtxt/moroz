import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Copy, ExternalLink, Users, ShoppingCart, AlertCircle, Info } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale/ru';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Partner {
  id: string;
  name: string;
  contact_email: string | null;
  contact_phone: string | null;
  organization_type: string | null;
  access_token: string;
  referral_code: string;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

interface PartnerStats {
  visits_count: number;
  performers_count: number;
  customers_count: number;
  confirmed_bookings: number;
  cancelled_bookings: number;
  total_amount: number;
}

const organizationTypes = [
  { value: 'event_agency', label: 'Event-агентство' },
  { value: 'kids_center', label: 'Детский центр' },
  { value: 'kindergarten', label: 'Садик' },
  { value: 'school', label: 'Школа' },
  { value: 'educational', label: 'Образовательное учреждение' },
  { value: 'individual', label: 'Физическое лицо' },
  { value: 'other', label: 'Другое' },
];

export default function AdminPartners() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [stats, setStats] = useState<Record<string, PartnerStats>>({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contact_email: '',
    contact_phone: '',
    organization_type: '',
    referral_code: '',
    notes: '',
  });

  useEffect(() => {
    fetchPartners();
  }, []);

  async function fetchPartners() {
    setLoading(true);
    
    const { data: partnersData, error } = await supabase
      .from('partners')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Ошибка загрузки партнёров');
      console.error(error);
      setLoading(false);
      return;
    }

    setPartners(partnersData || []);

    // Fetch stats for each partner
    const statsMap: Record<string, PartnerStats> = {};
    
    for (const partner of partnersData || []) {
      const [visitsData, regData, bookingsData] = await Promise.all([
        supabase
          .from('referral_visits')
          .select('id', { count: 'exact', head: true })
          .eq('partner_id', partner.id),
        supabase
          .from('referral_registrations')
          .select('user_type')
          .eq('partner_id', partner.id),
        supabase
          .from('referral_bookings')
          .select('status, booking_amount')
          .eq('partner_id', partner.id),
      ]);

      const regs = regData.data || [];
      const bookings = bookingsData.data || [];

      statsMap[partner.id] = {
        visits_count: visitsData.count || 0,
        performers_count: regs.filter(r => r.user_type === 'performer').length,
        customers_count: regs.filter(r => r.user_type === 'customer').length,
        confirmed_bookings: bookings.filter(b => b.status === 'confirmed_paid').length,
        cancelled_bookings: bookings.filter(b => b.status === 'cancelled_after_payment').length,
        total_amount: bookings
          .filter(b => b.status === 'confirmed_paid')
          .reduce((sum, b) => sum + (b.booking_amount || 0), 0),
      };
    }

    setStats(statsMap);
    setLoading(false);
  }

  async function handleCreatePartner(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.name || !formData.referral_code) {
      toast.error('Заполните обязательные поля');
      return;
    }

    const { error } = await supabase
      .from('partners')
      .insert({
        name: formData.name,
        contact_email: formData.contact_email || null,
        contact_phone: formData.contact_phone || null,
        organization_type: formData.organization_type || null,
        referral_code: formData.referral_code.toUpperCase(),
        notes: formData.notes || null,
      });

    if (error) {
      if (error.code === '23505') {
        toast.error('Партнёр с таким реферальным кодом уже существует');
      } else {
        toast.error('Ошибка создания партнёра');
        console.error(error);
      }
      return;
    }

    toast.success('Партнёр создан');
    setDialogOpen(false);
    setFormData({ name: '', contact_email: '', contact_phone: '', organization_type: '', referral_code: '', notes: '' });
    fetchPartners();
  }

  async function togglePartnerActive(partnerId: string, isActive: boolean) {
    const { error } = await supabase
      .from('partners')
      .update({ is_active: isActive })
      .eq('id', partnerId);

    if (error) {
      toast.error('Ошибка обновления');
      return;
    }

    setPartners(prev => prev.map(p => p.id === partnerId ? { ...p, is_active: isActive } : p));
    toast.success(isActive ? 'Партнёр активирован' : 'Партнёр деактивирован');
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success('Скопировано в буфер обмена');
  }

  function getReferralLink(code: string) {
    return `https://Дед-Морозы.РФ/?ref=${code}`;
  }

  function getPartnerDashboardLink(token: string) {
    return `${window.location.origin}/partner/${token}`;
  }

  function generateReferralCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, referral_code: code }));
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Партнёры</h1>
            <p className="text-muted-foreground">Управление партнёрской программой</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Добавить партнёра
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Новый партнёр</DialogTitle>
                <DialogDescription>
                  Создайте партнёра для отслеживания рефералов
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreatePartner} className="space-y-4">
                <div>
                  <Label htmlFor="name">Название организации *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Event Agency Pro"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="organization_type">Тип организации</Label>
                  <Select
                    value={formData.organization_type}
                    onValueChange={v => setFormData(prev => ({ ...prev, organization_type: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите тип" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizationTypes.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contact_email">Email</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={formData.contact_email}
                      onChange={e => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                      placeholder="partner@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_phone">Телефон</Label>
                    <Input
                      id="contact_phone"
                      type="tel"
                      value={formData.contact_phone}
                      onChange={e => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                      placeholder="+7 999 123-45-67"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="referral_code">Реферальный код *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="referral_code"
                      value={formData.referral_code}
                      onChange={e => setFormData(prev => ({ ...prev, referral_code: e.target.value.toUpperCase() }))}
                      placeholder="PARTNER2024"
                      required
                      className="uppercase"
                    />
                    <Button type="button" variant="outline" onClick={generateReferralCode}>
                      Генерировать
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes">Заметки</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Дополнительная информация о партнёре..."
                  />
                </div>
                <DialogFooter>
                  <Button type="submit">Создать партнёра</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Важно:</strong> Реферальная куки действует 30 дней с момента первого перехода по ссылке.
            После истечения срока привязка к партнёру не произойдёт.
          </AlertDescription>
        </Alert>

        <Alert className="bg-blue-950/30 border-blue-500/30">
          <ExternalLink className="h-4 w-4 text-blue-400" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              <strong>Ссылка для самостоятельной регистрации партнёров:</strong>
            </span>
            <div className="flex items-center gap-2 ml-4">
              <code className="bg-muted px-2 py-1 rounded text-sm">
                {window.location.origin}/dfuioh12-85tyHDksjdu374
              </code>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copyToClipboard(`${window.location.origin}/dfuioh12-85tyHDksjdu374`)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Список партнёров</CardTitle>
            <CardDescription>
              Всего партнёров: {partners.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : partners.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Партнёры ещё не добавлены
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Партнёр</TableHead>
                    <TableHead>Тип</TableHead>
                    <TableHead>Код</TableHead>
                    <TableHead>Переходы</TableHead>
                    <TableHead>Регистрации</TableHead>
                    <TableHead>Брони</TableHead>
                    <TableHead>Сумма</TableHead>
                    <TableHead>Активен</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partners.map(partner => {
                    const partnerStats = stats[partner.id] || { visits_count: 0, performers_count: 0, customers_count: 0, confirmed_bookings: 0, cancelled_bookings: 0, total_amount: 0 };
                    const totalRegs = partnerStats.performers_count + partnerStats.customers_count;
                    const conversionRate = partnerStats.visits_count > 0 
                      ? ((totalRegs / partnerStats.visits_count) * 100).toFixed(1) 
                      : '0';
                    return (
                      <TableRow key={partner.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {partner.name}
                              {(partner as any).registered_self && (
                                <Badge variant="secondary" className="text-xs">Сам</Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {partner.contact_email || partner.contact_phone || '—'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {organizationTypes.find(t => t.value === partner.organization_type)?.label || '—'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <code className="bg-muted px-2 py-1 rounded text-sm">{partner.referral_code}</code>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <span className="font-medium">{partnerStats.visits_count}</span>
                            <span className="text-muted-foreground text-xs ml-1">→ {conversionRate}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{partnerStats.performers_count} исп.</span>
                            <span className="text-muted-foreground">/</span>
                            <span>{partnerStats.customers_count} клиент.</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                            <span className="text-green-600">{partnerStats.confirmed_bookings}</span>
                            {partnerStats.cancelled_bookings > 0 && (
                              <>
                                <span className="text-muted-foreground">/</span>
                                <span className="text-red-500 flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  {partnerStats.cancelled_bookings}
                                </span>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {partnerStats.total_amount.toLocaleString('ru-RU')} ₽
                          </span>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={partner.is_active}
                            onCheckedChange={v => togglePartnerActive(partner.id, v)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => copyToClipboard(getReferralLink(partner.referral_code))}
                              title="Копировать реферальную ссылку"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const link = getPartnerDashboardLink(partner.access_token);
                                copyToClipboard(link);
                              }}
                              title="Копировать ссылку на кабинет партнёра"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
