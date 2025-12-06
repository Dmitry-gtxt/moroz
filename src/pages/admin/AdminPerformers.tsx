import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { SupportChatDialog } from '@/components/admin/SupportChatDialog';
import { RatingAdjustDialog } from '@/components/admin/RatingAdjustDialog';
import { Eye, Star, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { getCustomerPrice, getPrepaymentAmount, getCommissionRate } from '@/lib/pricing';
import type { Database } from '@/integrations/supabase/types';

type PerformerProfileDB = Database['public']['Tables']['performer_profiles']['Row'];
type PerformerProfile = PerformerProfileDB & {
  user_email?: string;
  user_phone?: string;
};

const performerTypeLabels: Record<string, string> = {
  ded_moroz: 'Дед Мороз',
  snegurochka: 'Снегурочка',
  duo: 'Дуэт',
  animator: 'Аниматор',
};

const verificationLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  unverified: { label: 'Не верифицирован', variant: 'secondary' },
  pending: { label: 'На проверке', variant: 'outline' },
  verified: { label: 'Верифицирован', variant: 'default' },
  rejected: { label: 'Отклонён', variant: 'destructive' },
};

export default function AdminPerformers() {
  const [performers, setPerformers] = useState<PerformerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [commissionRate, setCommissionRateState] = useState(40);
  const [chatDialog, setChatDialog] = useState<{ open: boolean; performerId: string; performerName: string }>({
    open: false,
    performerId: '',
    performerName: '',
  });
  const [ratingDialog, setRatingDialog] = useState<{ 
    open: boolean; 
    performerId: string; 
    performerName: string;
    currentRating: number;
  }>({
    open: false,
    performerId: '',
    performerName: '',
    currentRating: 0,
  });

  async function fetchPerformers() {
    setLoading(true);
    
    const [performersRes, commissionRes] = await Promise.all([
      supabase.from('performer_profiles').select('*').order('created_at', { ascending: false }),
      getCommissionRate(),
    ]);

    if (performersRes.error) {
      toast.error('Ошибка загрузки исполнителей');
      console.error(performersRes.error);
      setLoading(false);
      return;
    }
    
    const performersData = performersRes.data ?? [];
    
    // Get user IDs that we need emails for
    const userIds = performersData
      .map(p => p.user_id)
      .filter((id): id is string => !!id);
    
    // Fetch phones from profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, phone')
      .in('user_id', userIds);
    
    const phoneMap = new Map(profiles?.map(p => [p.user_id, p.phone]) ?? []);
    
    // Fetch emails via edge function
    let emailMap = new Map<string, string>();
    if (userIds.length > 0) {
      try {
        const { data: emailsData } = await supabase.functions.invoke('get-user-emails', {
          body: { userIds },
        });
        if (emailsData?.emails) {
          emailMap = new Map(Object.entries(emailsData.emails));
        }
      } catch (err) {
        console.error('Failed to fetch emails:', err);
      }
    }
    
    // Combine data
    const performersWithContacts: PerformerProfile[] = performersData.map(performer => ({
      ...performer,
      user_email: performer.user_id ? (emailMap.get(performer.user_id) || '') : '',
      user_phone: performer.user_id ? (phoneMap.get(performer.user_id) || '') : '',
    }));
    
    setPerformers(performersWithContacts);
    setCommissionRateState(commissionRes);
    setLoading(false);
  }

  useEffect(() => {
    fetchPerformers();
  }, []);

  async function toggleActive(id: string, currentStatus: boolean) {
    const { error } = await supabase
      .from('performer_profiles')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (error) {
      toast.error('Ошибка обновления статуса');
    } else {
      toast.success(currentStatus ? 'Исполнитель деактивирован' : 'Исполнитель активирован');
      fetchPerformers();
    }
  }

  async function updateVerificationStatus(id: string, newStatus: string) {
    const { error } = await supabase
      .from('performer_profiles')
      .update({ verification_status: newStatus as Database['public']['Enums']['verification_status'] })
      .eq('id', id);

    if (error) {
      toast.error('Ошибка обновления статуса');
    } else {
      toast.success('Статус верификации обновлён');
      fetchPerformers();
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Исполнители</h1>
          <p className="text-muted-foreground mt-1">Управление профилями исполнителей</p>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Все исполнители ({performers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : performers.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Нет зарегистрированных исполнителей</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Имя</TableHead>
                    <TableHead>Контакты</TableHead>
                    <TableHead>Тип</TableHead>
                    <TableHead>Рейтинг</TableHead>
                    <TableHead>Цена</TableHead>
                    <TableHead>Верификация</TableHead>
                    <TableHead>Активен</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {performers.map((performer) => {
                    const verification = verificationLabels[performer.verification_status] ?? verificationLabels.unverified;
                    const performerPrice = performer.base_price;
                    const customerPrice = getCustomerPrice(performerPrice, commissionRate);
                    const prepayment = getPrepaymentAmount(performerPrice, commissionRate);
                    
                    return (
                      <TableRow key={performer.id}>
                        <TableCell className="font-medium">{performer.display_name}</TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            {performer.user_email && (
                              <div className="text-muted-foreground">{performer.user_email}</div>
                            )}
                            {performer.user_phone && (
                              <div className="font-medium">{performer.user_phone}</div>
                            )}
                            {!performer.user_email && !performer.user_phone && '—'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {performer.performer_types?.map((type) => performerTypeLabels[type] ?? type).join(', ') || '—'}
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => setRatingDialog({
                              open: true,
                              performerId: performer.id,
                              performerName: performer.display_name,
                              currentRating: Number(performer.rating_average) || 0,
                            })}
                            className="flex items-center gap-1 hover:bg-muted p-1 rounded transition-colors"
                            title="Изменить рейтинг"
                          >
                            <Star className="h-4 w-4 fill-accent text-accent" />
                            <span>{Number(performer.rating_average).toFixed(1)}</span>
                            <span className="text-muted-foreground">({performer.rating_count})</span>
                          </button>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            <div className="font-semibold text-accent">
                              {customerPrice.toLocaleString()} сом
                            </div>
                            <div className="text-xs text-muted-foreground">
                              исп: {performerPrice.toLocaleString()} + бронь: {prepayment.toLocaleString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={performer.verification_status}
                            onValueChange={(value) => updateVerificationStatus(performer.id, value)}
                          >
                            <SelectTrigger className="w-40">
                              <Badge variant={verification.variant}>{verification.label}</Badge>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unverified">Не верифицирован</SelectItem>
                              <SelectItem value="pending">На проверке</SelectItem>
                              <SelectItem value="verified">Верифицирован</SelectItem>
                              <SelectItem value="rejected">Отклонён</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={performer.is_active}
                            onCheckedChange={() => toggleActive(performer.id, performer.is_active)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setChatDialog({
                                open: true,
                                performerId: performer.id,
                                performerName: performer.display_name,
                              })}
                              title="Чат с исполнителем"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" asChild title="Открыть профиль">
                              <Link to={`/admin/performer/${performer.id}`} target="_blank">
                                <Eye className="h-4 w-4" />
                              </Link>
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

      <SupportChatDialog
        open={chatDialog.open}
        onOpenChange={(open) => setChatDialog({ ...chatDialog, open })}
        performerId={chatDialog.performerId}
        performerName={chatDialog.performerName}
      />

      <RatingAdjustDialog
        open={ratingDialog.open}
        onOpenChange={(open) => setRatingDialog({ ...ratingDialog, open })}
        performerId={ratingDialog.performerId}
        performerName={ratingDialog.performerName}
        currentRating={ratingDialog.currentRating}
        onRatingUpdated={fetchPerformers}
      />
    </AdminLayout>
  );
}
