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
import { Check, X, MessageCircle, Mail, Phone, Eye } from 'lucide-react';
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

export default function AdminModeration() {
  const [loading, setLoading] = useState(true);
  const [performers, setPerformers] = useState<PerformerWithContact[]>([]);
  const [userEmails, setUserEmails] = useState<Record<string, string>>({});
  const [userPhones, setUserPhones] = useState<Record<string, string>>({});

  const [rejectingPerformerId, setRejectingPerformerId] = useState<string | null>(null);
  const [rejectingPerformerName, setRejectingPerformerName] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const [approvingPerformerId, setApprovingPerformerId] = useState<string | null>(null);
  const [approvingPerformerName, setApprovingPerformerName] = useState('');

  const [chatPerformerId, setChatPerformerId] = useState<string | null>(null);
  const [chatPerformerName, setChatPerformerName] = useState('');

  async function fetchPerformers() {
    setLoading(true);

    // Fetch profiles that are pending moderation (edited after initial verification)
    const { data, error } = await supabase
      .from('performer_profiles')
      .select('*')
      .eq('verification_status', 'pending')
      .eq('is_active', false)
      .order('updated_at', { ascending: false });

    if (error) {
      toast.error('Ошибка загрузки исполнителей');
      console.error(error);
      setLoading(false);
      return;
    }

    // Filter for re-moderation cases (updated significantly after created)
    const moderationCases = (data ?? []).filter(p => {
      const created = new Date(p.created_at).getTime();
      const updated = new Date(p.updated_at).getTime();
      return (updated - created) > 3600000; // More than 1 hour difference
    }) as PerformerProfile[];

    const userIds = moderationCases.map(p => p.user_id).filter(Boolean) as string[];

    if (userIds.length > 0) {
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

      const { data: emailsData } = await supabase.functions.invoke('get-user-emails', {
        body: { userIds }
      });

      if (emailsData?.emails) {
        setUserEmails(emailsData.emails);
      }
    }

    const performersWithContact: PerformerWithContact[] = moderationCases.map(p => ({
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

  useEffect(() => {
    if (performers.length > 0) {
      setPerformers(prev => prev.map(p => ({
        ...p,
        email: p.user_id ? userEmails[p.user_id] || null : null,
        phone: p.user_id ? userPhones[p.user_id] || null : null,
      })));
    }
  }, [userEmails, userPhones]);

  function openApproveDialog(performerId: string, performerName: string) {
    setApprovingPerformerId(performerId);
    setApprovingPerformerName(performerName);
  }

  async function confirmApprove() {
    if (!approvingPerformerId) return;

    // Approve moderation = set verified and active
    const { error } = await supabase
      .from('performer_profiles')
      .update({ 
        verification_status: 'verified',
        is_active: true 
      })
      .eq('id', approvingPerformerId);

    if (error) {
      toast.error('Ошибка одобрения');
      return;
    }

    // Send notification to support chat
    const { data: chat } = await supabase
      .from('support_chats')
      .select('id')
      .eq('performer_id', approvingPerformerId)
      .maybeSingle();

    if (chat) {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('support_messages').insert({
        chat_id: chat.id,
        sender_id: user?.id || 'admin',
        sender_type: 'admin',
        text: `✅ Изменения одобрены!\n\nВаш профиль прошёл модерацию и снова отображается в каталоге.`,
      });
    }

    // Send email notification
    await supabase.functions.invoke('send-notification-email', {
      body: {
        type: 'moderation_approved',
        performerId: approvingPerformerId,
        performerName: approvingPerformerName,
      }
    });

    toast.success('Профиль одобрен и опубликован');
    setApprovingPerformerId(null);
    setApprovingPerformerName('');
    fetchPerformers();
  }

  function openRejectDialog(performerId: string, performerName: string) {
    setRejectingPerformerId(performerId);
    setRejectingPerformerName(performerName);
    setRejectionReason('');
  }

  async function confirmReject() {
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
        text: `❌ Изменения отклонены\n\nПричина: ${rejectionReason}\n\nВы можете исправить профиль и отправить на модерацию повторно.`,
      });
    }

    await supabase.functions.invoke('send-notification-email', {
      body: {
        type: 'moderation_rejected',
        performerId: rejectingPerformerId,
        performerName: rejectingPerformerName,
        reason: rejectionReason,
      }
    });

    toast.success('Изменения отклонены');
    setRejectingPerformerId(null);
    setRejectingPerformerName('');
    setRejectionReason('');
    fetchPerformers();
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Модерация</h1>
          <p className="text-muted-foreground mt-1">Проверка изменённых профилей</p>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Профили на модерации
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
              <p className="text-center py-8 text-muted-foreground">Нет профилей на модерации</p>
            ) : (
              <div className="space-y-4">
                {performers.map((performer) => (
                  <div 
                    key={performer.id} 
                    className="border rounded-lg border-orange-400 bg-orange-50/50 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-lg">{performer.display_name}</span>
                          <Badge variant="secondary" className="bg-orange-100 text-orange-700">Ожидает модерации</Badge>
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
                            Изменено: {format(new Date(performer.updated_at), 'd MMM yyyy, HH:mm', { locale: ru })}
                          </span>
                        </div>

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

                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setChatPerformerId(performer.id);
                              setChatPerformerName(performer.display_name);
                            }}
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
                            onClick={() => openApproveDialog(performer.id, performer.display_name)}
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
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Approve dialog */}
      <Dialog open={!!approvingPerformerId} onOpenChange={() => setApprovingPerformerId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Одобрить изменения</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите одобрить изменения профиля "{approvingPerformerName}"? 
              Профиль будет опубликован в каталоге.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovingPerformerId(null)}>
              Отмена
            </Button>
            <Button onClick={confirmApprove} className="bg-green-600 hover:bg-green-700">
              Одобрить и опубликовать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={!!rejectingPerformerId} onOpenChange={() => setRejectingPerformerId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Отклонить изменения</DialogTitle>
            <DialogDescription>
              Укажите причину отклонения для "{rejectingPerformerName}".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Причина отклонения</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Опишите причину отклонения..."
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectingPerformerId(null)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={confirmReject}>
              Отклонить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Support chat dialog */}
      {chatPerformerId && (
        <SupportChatDialog
          performerId={chatPerformerId}
          performerName={chatPerformerName}
          open={!!chatPerformerId}
          onOpenChange={(open) => !open && setChatPerformerId(null)}
        />
      )}
    </AdminLayout>
  );
}
