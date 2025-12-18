import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Check, X, MessageCircle, User, Mail, Phone, Power, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale/ru';
import { SupportChatDialog } from '@/components/admin/SupportChatDialog';
import type { Database } from '@/integrations/supabase/types';
import { Link } from 'react-router-dom';

type PerformerProfile = Database['public']['Tables']['performer_profiles']['Row'];

interface PerformerWithContact extends PerformerProfile {
  email: string | null;
  phone: string | null;
}

const verificationStatusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  unverified: { label: 'Не верифицирован', variant: 'outline' },
  pending: { label: 'На проверке', variant: 'secondary' },
  verified: { label: 'Верифицирован', variant: 'default' },
  rejected: { label: 'Отклонён', variant: 'destructive' },
};

export default function AdminVerification() {
  const [loading, setLoading] = useState(true);
  const [performers, setPerformers] = useState<PerformerWithContact[]>([]);
  const [userEmails, setUserEmails] = useState<Record<string, string>>({});
  const [userPhones, setUserPhones] = useState<Record<string, string>>({});

  // Rejection dialog state
  const [rejectingPerformerId, setRejectingPerformerId] = useState<string | null>(null);
  const [rejectingPerformerName, setRejectingPerformerName] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  // Verification dialog state
  const [verifyingPerformerId, setVerifyingPerformerId] = useState<string | null>(null);
  const [verifyingPerformerName, setVerifyingPerformerName] = useState('');

  // Activation dialog state
  const [activatingPerformerId, setActivatingPerformerId] = useState<string | null>(null);
  const [activatingPerformerName, setActivatingPerformerName] = useState('');

  // Support chat state
  const [chatPerformerId, setChatPerformerId] = useState<string | null>(null);

  async function fetchPerformers() {
    setLoading(true);
    
    // Fetch performers with pending verification status
    const { data, error } = await supabase
      .from('performer_profiles')
      .select('*')
      .eq('verification_status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Ошибка загрузки исполнителей');
      console.error(error);
      setLoading(false);
      return;
    }

    const performersList = (data ?? []) as PerformerProfile[];
    
    // Fetch emails and phones for all user_ids
    const userIds = performersList.map(p => p.user_id).filter(Boolean) as string[];
    
    if (userIds.length > 0) {
      // Fetch phones from profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, phone')
        .in('user_id', userIds);

      if (profiles) {
        const phones: Record<string, string> = {};
        profiles.forEach(p => {
          if (p.phone) phones[p.user_id] = p.phone;
        });
        setUserPhones(phones);
      }

      // Fetch emails via edge function
      const { data: emailsData } = await supabase.functions.invoke('get-user-emails', {
        body: { userIds }
      });

      if (emailsData?.emails) {
        setUserEmails(emailsData.emails);
      }
    }

    // Map performers with contact info
    const performersWithContact: PerformerWithContact[] = performersList.map(p => ({
      ...p,
      email: p.user_id ? userEmails[p.user_id] || null : null,
      phone: p.user_id ? userPhones[p.user_id] || null : null,
    }));

    setPerformers(performersWithContact);
    setLoading(false);
  }

  useEffect(() => {
    fetchPerformers();
  }, []);

  // Re-map contact info when emails/phones are loaded
  useEffect(() => {
    if (performers.length > 0) {
      setPerformers(prev => prev.map(p => ({
        ...p,
        email: p.user_id ? userEmails[p.user_id] || null : null,
        phone: p.user_id ? userPhones[p.user_id] || null : null,
      })));
    }
  }, [userEmails, userPhones]);

  function openVerifyDialog(performerId: string, performerName: string) {
    setVerifyingPerformerId(performerId);
    setVerifyingPerformerName(performerName);
  }

  async function confirmVerifyPerformer() {
    if (!verifyingPerformerId) return;

    // Update verification status AND auto-activate the profile
    const { error } = await supabase
      .from('performer_profiles')
      .update({ 
        verification_status: 'verified',
        is_active: true 
      })
      .eq('id', verifyingPerformerId);

    if (error) {
      toast.error('Ошибка верификации');
      return;
    }

    // Send notification to support chat
    const { data: chat } = await supabase
      .from('support_chats')
      .select('id')
      .eq('performer_id', verifyingPerformerId)
      .maybeSingle();

    if (chat) {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('support_messages').insert({
        chat_id: chat.id,
        sender_id: user?.id || 'admin',
        sender_type: 'admin',
        text: `✅ Ваш профиль успешно верифицирован. Теперь вы отображаетесь в каталоге.\n\nЧтобы деактивировать видимость вашего профиля или удалить его — напишите в этом чате Администратору.\n\nВ случае изменения фото, видео или любой другой публично доступной информации о себе — ваш профиль будет снят с публикации до перепрохождения модерации.`,
      });
    }

    // Send email notification
    await supabase.functions.invoke('send-notification-email', {
      body: {
        type: 'verification_approved',
        performerId: verifyingPerformerId,
        performerName: verifyingPerformerName,
      }
    });

    toast.success('Исполнитель верифицирован и активирован');
    setVerifyingPerformerId(null);
    setVerifyingPerformerName('');
    fetchPerformers();
  }

  function openRejectDialog(performerId: string, performerName: string) {
    setRejectingPerformerId(performerId);
    setRejectingPerformerName(performerName);
    setRejectionReason('');
  }

  async function confirmRejectPerformer() {
    if (!rejectingPerformerId || !rejectionReason.trim()) {
      toast.error('Укажите причину отклонения');
      return;
    }

    const { error } = await supabase
      .from('performer_profiles')
      .update({ verification_status: 'rejected' })
      .eq('id', rejectingPerformerId);

    if (error) {
      toast.error('Ошибка отклонения');
      return;
    }

    // Send notification to support chat
    const { data: chat } = await supabase
      .from('support_chats')
      .select('id')
      .eq('performer_id', rejectingPerformerId)
      .maybeSingle();

    if (chat) {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('support_messages').insert({
        chat_id: chat.id,
        sender_id: user?.id || 'admin',
        sender_type: 'admin',
        text: `❌ Верификация отклонена\n\nПричина: ${rejectionReason}\n\nВы можете обновить профиль и отправить заявку повторно.`,
      });
    }

    // Send email notification
    await supabase.functions.invoke('send-notification-email', {
      body: {
        type: 'verification_rejected',
        performerId: rejectingPerformerId,
        performerName: rejectingPerformerName,
        reason: rejectionReason,
      }
    });

    toast.success('Заявка отклонена');
    setRejectingPerformerId(null);
    setRejectingPerformerName('');
    setRejectionReason('');
    fetchPerformers();
  }

  function openActivationDialog(performerId: string, performerName: string) {
    setActivatingPerformerId(performerId);
    setActivatingPerformerName(performerName);
  }

  async function confirmActivateProfile() {
    if (!activatingPerformerId) return;

    const { error } = await supabase
      .from('performer_profiles')
      .update({ is_active: true })
      .eq('id', activatingPerformerId);

    if (error) {
      toast.error('Ошибка активации профиля');
      return;
    }

    // Send activation email
    await supabase.functions.invoke('send-notification-email', {
      body: {
        type: 'profile_activated',
        performerId: activatingPerformerId,
        performerName: activatingPerformerName,
      }
    });

    toast.success('Профиль активирован');
    setActivatingPerformerId(null);
    setActivatingPerformerName('');
    fetchPerformers();
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Верификация</h1>
          <p className="text-muted-foreground mt-1">Проверка анкет исполнителей</p>
        </div>

        {/* Pending verifications */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Заявки на верификацию
              {performers.length > 0 && (
                <Badge variant="secondary">{performers.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : performers.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Нет заявок на верификацию</p>
            ) : (
              <div className="space-y-4">
                {performers.map((performer) => {
                  const status = verificationStatusLabels[performer.verification_status] ?? verificationStatusLabels.pending;
                  return (
                    <div 
                      key={performer.id} 
                      className="border rounded-lg border-yellow-400 bg-yellow-50/50 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-lg">{performer.display_name}</span>
                            <Badge variant={status.variant}>{status.label}</Badge>
                            {performer.is_active && (
                              <Badge variant="secondary" className="bg-green-100 text-green-700">Активен</Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2 flex-wrap">
                            {performer.user_id && userEmails[performer.user_id] && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {userEmails[performer.user_id]}
                              </span>
                            )}
                            {performer.user_id && userPhones[performer.user_id] && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {userPhones[performer.user_id]}
                              </span>
                            )}
                            <span>
                              Регистрация: {format(new Date(performer.created_at), 'd MMM yyyy, HH:mm', { locale: ru })}
                            </span>
                          </div>

                          {/* Performer details */}
                          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            {performer.age && (
                              <div>
                                <span className="text-muted-foreground">Возраст:</span> {performer.age} лет
                              </div>
                            )}
                            {performer.experience_years !== null && performer.experience_years > 0 && (
                              <div>
                                <span className="text-muted-foreground">Опыт:</span> {performer.experience_years} лет
                              </div>
                            )}
                            {performer.base_price && (
                              <div>
                                <span className="text-muted-foreground">Мин. цена:</span> {performer.base_price.toLocaleString()} ₽
                              </div>
                            )}
                            {performer.performer_types && performer.performer_types.length > 0 && (
                              <div>
                                <span className="text-muted-foreground">Роли:</span> {performer.performer_types.join(', ')}
                              </div>
                            )}
                          </div>

                          {performer.description && (
                            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                              {performer.description}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setChatPerformerId(performer.id)}
                              title="Открыть чат"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              asChild
                              title="Просмотр профиля"
                            >
                              <Link to={`/admin/performer/${performer.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => openVerifyDialog(performer.id, performer.display_name)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Одобрить
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => openRejectDialog(performer.id, performer.display_name)}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Отклонить
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Verify confirmation dialog */}
      <Dialog open={!!verifyingPerformerId} onOpenChange={() => setVerifyingPerformerId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Подтвердить верификацию</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите верифицировать исполнителя "{verifyingPerformerName}"?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVerifyingPerformerId(null)}>
              Отмена
            </Button>
            <Button onClick={confirmVerifyPerformer} className="bg-green-600 hover:bg-green-700">
              Верифицировать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection dialog */}
      <Dialog open={!!rejectingPerformerId} onOpenChange={() => setRejectingPerformerId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Отклонить заявку</DialogTitle>
            <DialogDescription>
              Укажите причину отклонения для исполнителя "{rejectingPerformerName}". 
              Эта информация будет отправлена исполнителю.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason">Причина отклонения *</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Опишите причину отклонения заявки..."
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectingPerformerId(null)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={confirmRejectPerformer}>
              Отклонить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activation dialog */}
      <Dialog open={!!activatingPerformerId} onOpenChange={() => setActivatingPerformerId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Активировать профиль</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите активировать профиль "{activatingPerformerName}"? 
              После активации профиль появится в публичном каталоге.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActivatingPerformerId(null)}>
              Отмена
            </Button>
            <Button onClick={confirmActivateProfile}>
              <Power className="h-4 w-4 mr-2" />
              Активировать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Support Chat Dialog */}
      {chatPerformerId && (
        <SupportChatDialog 
          open={!!chatPerformerId}
          onOpenChange={(open) => !open && setChatPerformerId(null)}
          performerId={chatPerformerId} 
          performerName={performers.find(p => p.id === chatPerformerId)?.display_name || 'Исполнитель'}
        />
      )}
    </AdminLayout>
  );
}
