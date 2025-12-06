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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { Check, X, ExternalLink, ChevronDown, MessageCircle, User, Mail, Phone, Power } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { SupportChatDialog } from '@/components/admin/SupportChatDialog';
import type { Database } from '@/integrations/supabase/types';

type VerificationDocument = Database['public']['Tables']['verification_documents']['Row'];
type PerformerProfile = Database['public']['Tables']['performer_profiles']['Row'];

interface DocumentWithPerformer extends VerificationDocument {
  performer_profiles: Pick<PerformerProfile, 'display_name' | 'user_id' | 'is_active' | 'verification_status'> | null;
}

interface PerformerGroup {
  performerId: string;
  displayName: string;
  userId: string | null;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  verificationStatus: string;
  documents: DocumentWithPerformer[];
  hasPending: boolean;
}

const documentTypeLabels: Record<string, string> = {
  passport: 'Паспорт',
  id_card: 'Удостоверение личности',
  certificate: 'Сертификат',
  portfolio: 'Портфолио',
  medical: 'Мед. справка',
  other: 'Другое',
};

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'На проверке', variant: 'outline' },
  approved: { label: 'Одобрен', variant: 'default' },
  rejected: { label: 'Отклонён', variant: 'destructive' },
};

export default function AdminVerification() {
  const [loading, setLoading] = useState(true);
  const [performerGroups, setPerformerGroups] = useState<PerformerGroup[]>([]);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const [userEmails, setUserEmails] = useState<Record<string, string>>({});
  const [userPhones, setUserPhones] = useState<Record<string, string>>({});

  // Rejection dialog state
  const [rejectingDocId, setRejectingDocId] = useState<string | null>(null);
  const [rejectingPerformerId, setRejectingPerformerId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Activation dialog state
  const [activatingPerformerId, setActivatingPerformerId] = useState<string | null>(null);
  const [activatingPerformerName, setActivatingPerformerName] = useState('');

  // Support chat state
  const [chatPerformerId, setChatPerformerId] = useState<string | null>(null);

  async function fetchDocuments() {
    setLoading(true);
    const { data, error } = await supabase
      .from('verification_documents')
      .select('*, performer_profiles(display_name, user_id, is_active, verification_status)')
      .order('uploaded_at', { ascending: false });

    if (error) {
      toast.error('Ошибка загрузки документов');
      console.error(error);
      setLoading(false);
      return;
    }

    const docs = (data as DocumentWithPerformer[]) ?? [];
    
    // Group by performer
    const groups = new Map<string, PerformerGroup>();
    
    for (const doc of docs) {
      const perfId = doc.performer_id;
      if (!groups.has(perfId)) {
        groups.set(perfId, {
          performerId: perfId,
          displayName: doc.performer_profiles?.display_name ?? 'Неизвестно',
          userId: doc.performer_profiles?.user_id ?? null,
          email: null,
          phone: null,
          isActive: doc.performer_profiles?.is_active ?? false,
          verificationStatus: doc.performer_profiles?.verification_status ?? 'unverified',
          documents: [],
          hasPending: false,
        });
      }
      const group = groups.get(perfId)!;
      group.documents.push(doc);
      if (doc.status === 'pending') {
        group.hasPending = true;
      }
    }

    const groupsArray = Array.from(groups.values());
    // Sort by pending first
    groupsArray.sort((a, b) => {
      if (a.hasPending && !b.hasPending) return -1;
      if (!a.hasPending && b.hasPending) return 1;
      return 0;
    });
    
    setPerformerGroups(groupsArray);

    // Auto-open groups with pending docs
    const pendingGroups = new Set<string>();
    groupsArray.forEach(g => {
      if (g.hasPending) pendingGroups.add(g.performerId);
    });
    setOpenGroups(pendingGroups);

    // Fetch emails and phones for all user_ids
    const userIds = groupsArray.map(g => g.userId).filter(Boolean) as string[];
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
    setLoading(false);
  }

  useEffect(() => {
    fetchDocuments();
  }, []);

  const toggleGroup = (performerId: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      if (next.has(performerId)) {
        next.delete(performerId);
      } else {
        next.add(performerId);
      }
      return next;
    });
  };

  async function approveDocument(docId: string, performerId: string, performerName: string) {
    const { error: docError } = await supabase
      .from('verification_documents')
      .update({ 
        status: 'approved', 
        reviewed_at: new Date().toISOString() 
      })
      .eq('id', docId);

    if (docError) {
      toast.error('Ошибка обновления статуса');
      return;
    }

    // Update performer verification status to verified
    await supabase
      .from('performer_profiles')
      .update({ verification_status: 'verified' })
      .eq('id', performerId);

    // Send email notification
    await supabase.functions.invoke('send-notification-email', {
      body: {
        type: 'verification_approved',
        performerId,
        performerName,
      }
    });

    toast.success('Документ одобрен, исполнитель верифицирован');
    fetchDocuments();
  }

  function openRejectDialog(docId: string, performerId: string) {
    setRejectingDocId(docId);
    setRejectingPerformerId(performerId);
    setRejectionReason('');
  }

  async function confirmRejectDocument() {
    if (!rejectingDocId || !rejectingPerformerId || !rejectionReason.trim()) {
      toast.error('Укажите причину отклонения');
      return;
    }

    const { error: docError } = await supabase
      .from('verification_documents')
      .update({ 
        status: 'rejected', 
        reviewed_at: new Date().toISOString(),
        admin_comment: rejectionReason 
      })
      .eq('id', rejectingDocId);

    if (docError) {
      toast.error('Ошибка обновления статуса');
      return;
    }

    // Update performer verification status
    await supabase
      .from('performer_profiles')
      .update({ verification_status: 'rejected' })
      .eq('id', rejectingPerformerId);

    // Get performer name
    const group = performerGroups.find(g => g.performerId === rejectingPerformerId);
    const performerName = group?.displayName ?? 'Исполнитель';

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
        performerName,
        reason: rejectionReason,
      }
    });

    toast.success('Документ отклонён');
    setRejectingDocId(null);
    setRejectingPerformerId(null);
    setRejectionReason('');
    fetchDocuments();
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
    fetchDocuments();
  }

  const pendingGroupsCount = performerGroups.filter(g => g.hasPending).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Верификация</h1>
          <p className="text-muted-foreground mt-1">Проверка документов и анкет исполнителей</p>
        </div>

        {/* Pending verifications */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Заявки на верификацию
              {pendingGroupsCount > 0 && (
                <Badge variant="secondary">{pendingGroupsCount}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : performerGroups.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Нет заявок на верификацию</p>
            ) : (
              <div className="space-y-4">
                {performerGroups.map((group) => (
                  <Collapsible 
                    key={group.performerId} 
                    open={openGroups.has(group.performerId)}
                    onOpenChange={() => toggleGroup(group.performerId)}
                  >
                    <div className={`border rounded-lg ${group.hasPending ? 'border-yellow-400 bg-yellow-50/50' : 'border-border'}`}>
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-4">
                            <ChevronDown className={`h-5 w-5 transition-transform ${openGroups.has(group.performerId) ? 'rotate-180' : ''}`} />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{group.displayName}</span>
                                {group.hasPending && (
                                  <Badge variant="outline" className="text-yellow-600 border-yellow-400">
                                    Ожидает проверки
                                  </Badge>
                                )}
                                {group.verificationStatus === 'verified' && (
                                  <Badge variant="default">Верифицирован</Badge>
                                )}
                                {group.isActive && (
                                  <Badge variant="secondary" className="bg-green-100 text-green-700">Активен</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                {group.userId && userEmails[group.userId] && (
                                  <span className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {userEmails[group.userId]}
                                  </span>
                                )}
                                {group.userId && userPhones[group.userId] && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {userPhones[group.userId]}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setChatPerformerId(group.performerId)}
                              title="Открыть чат"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              title="Управление профилем"
                            >
                              <a href={`/admin/performer/${group.performerId}`} target="_blank" rel="noopener noreferrer">
                                <User className="h-4 w-4" />
                              </a>
                            </Button>
                            {group.verificationStatus === 'verified' && !group.isActive && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => openActivationDialog(group.performerId, group.displayName)}
                              >
                                <Power className="h-4 w-4 mr-1" />
                                Активировать
                              </Button>
                            )}
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="border-t px-4 py-3 space-y-3">
                          {group.documents.map((doc) => {
                            const status = statusLabels[doc.status] ?? statusLabels.pending;
                            return (
                              <div 
                                key={doc.id} 
                                className={`flex items-center justify-between p-3 rounded-lg ${
                                  doc.status === 'pending' ? 'bg-yellow-100/50' : 'bg-muted/50'
                                }`}
                              >
                                <div className="flex items-center gap-4">
                                  <div>
                                    <div className="font-medium">
                                      {documentTypeLabels[doc.document_type] ?? doc.document_type}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      Загружен: {format(new Date(doc.uploaded_at), 'd MMM yyyy, HH:mm', { locale: ru })}
                                    </div>
                                    {doc.admin_comment && (
                                      <div className="text-sm text-destructive mt-1">
                                        Комментарий: {doc.admin_comment}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button variant="ghost" size="sm" asChild>
                                    <a href={doc.document_url} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink className="h-4 w-4 mr-1" />
                                      Открыть
                                    </a>
                                  </Button>
                                  {doc.status === 'pending' ? (
                                    <>
                                      <Button
                                        variant="default"
                                        size="sm"
                                        onClick={() => approveDocument(doc.id, doc.performer_id, group.displayName)}
                                      >
                                        <Check className="h-4 w-4 mr-1" />
                                        Одобрить
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => openRejectDialog(doc.id, doc.performer_id)}
                                      >
                                        <X className="h-4 w-4 mr-1" />
                                        Отклонить
                                      </Button>
                                    </>
                                  ) : (
                                    <Badge variant={status.variant}>{status.label}</Badge>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Rejection reason dialog */}
      <Dialog open={!!rejectingDocId} onOpenChange={() => setRejectingDocId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Причина отклонения</DialogTitle>
            <DialogDescription>
              Укажите причину отклонения документа. Это сообщение будет отправлено исполнителю.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Причина</Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Опишите причину отклонения..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectingDocId(null)}>
              Отмена
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmRejectDocument}
              disabled={!rejectionReason.trim()}
            >
              Отклонить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Profile activation dialog */}
      <Dialog open={!!activatingPerformerId} onOpenChange={() => setActivatingPerformerId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Активировать профиль</DialogTitle>
            <DialogDescription>
              После активации профиль <strong>{activatingPerformerName}</strong> станет видимым в каталоге для клиентов.
              Исполнителю будет отправлено уведомление на почту.
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

      {/* Support chat dialog */}
      {chatPerformerId && (
        <SupportChatDialog
          performerId={chatPerformerId}
          performerName={performerGroups.find(g => g.performerId === chatPerformerId)?.displayName || 'Исполнитель'}
          open={!!chatPerformerId}
          onOpenChange={(open) => !open && setChatPerformerId(null)}
        />
      )}
    </AdminLayout>
  );
}