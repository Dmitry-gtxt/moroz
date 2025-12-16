import { useEffect, useState, useRef } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SEOHead } from '@/components/seo/SEOHead';
import { CustomerLayout } from '@/components/customer/CustomerLayout';
import { PerformerLayout } from '@/pages/performer/PerformerDashboard';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'sonner';
import { 
  MessageCircle, 
  Send, 
  ArrowLeft, 
  User,
  Check,
  CheckCheck,
  Paperclip,
  X,
  FileText,
  Loader2,
  Headphones
} from 'lucide-react';

interface Dialog {
  id: string;
  type: 'booking' | 'support';
  other_user_name: string;
  subtitle: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  photo?: string;
}

interface Message {
  id: string;
  text: string;
  sender_id: string;
  created_at: string;
  read_at: string | null;
  attachments?: string[] | null;
}

export default function Messages() {
  const { user, loading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedChatId = searchParams.get('chat');
  const selectedChatType = searchParams.get('type') as 'booking' | 'support' | null;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [dialogs, setDialogs] = useState<Dialog[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [currentDialog, setCurrentDialog] = useState<Dialog | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [hasPerformerProfile, setHasPerformerProfile] = useState<boolean | null>(null);

  // Check if user has performer profile
  useEffect(() => {
    async function checkPerformerProfile() {
      if (!user) return;
      const { data } = await supabase
        .from('performer_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      setHasPerformerProfile(!!data);
    }
    if (user) checkPerformerProfile();
  }, [user]);

  // Fetch dialogs (both booking chats and support chats)
  useEffect(() => {
    if (!user) return;

    const fetchDialogs = async () => {
      setLoading(true);
      const dialogsData: Dialog[] = [];
      
      // First get performer profile id if exists
      const { data: performerProfile } = await supabase
        .from('performer_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      // 1. Fetch booking-related dialogs (ONLY for paid bookings - chat is available after prepayment)
      // Exclude admin-created pseudo-bookings for reviews (marked with customer_phone: '+7-admin-review')
      let bookingsQuery = supabase
        .from('bookings')
        .select(`
          id,
          booking_date,
          customer_name,
          customer_id,
          performer_id,
          payment_status,
          customer_phone,
          performer_profiles!bookings_performer_id_fkey (
            display_name,
            photo_urls,
            user_id
          )
        `)
        .in('payment_status', ['prepayment_paid', 'fully_paid'])
        .neq('customer_phone', '+7-admin-review')
        .order('created_at', { ascending: false });

      // Build OR filter based on whether user is customer or performer
      if (performerProfile) {
        bookingsQuery = bookingsQuery.or(`customer_id.eq.${user.id},performer_id.eq.${performerProfile.id}`);
      } else {
        bookingsQuery = bookingsQuery.eq('customer_id', user.id);
      }

      const { data: bookings } = await bookingsQuery;

      for (const booking of bookings || []) {
        const performer = booking.performer_profiles as any;
        const isCustomer = booking.customer_id === user.id;
        
        const { data: lastMsg } = await supabase
          .from('chat_messages')
          .select('text, created_at, sender_id, read_at')
          .eq('booking_id', booking.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const { count: unreadCount } = await supabase
          .from('chat_messages')
          .select('id', { count: 'exact', head: true })
          .eq('booking_id', booking.id)
          .neq('sender_id', user.id)
          .is('read_at', null);

        // Show dialog even if no messages yet (paid booking = chat available)
        dialogsData.push({
          id: booking.id,
          type: 'booking',
          other_user_name: isCustomer 
            ? (performer?.display_name || 'Исполнитель')
            : booking.customer_name,
          subtitle: `Заказ на ${format(new Date(booking.booking_date), 'd MMM', { locale: ru })}`,
          last_message: lastMsg?.text || 'Начните диалог...',
          last_message_time: lastMsg?.created_at || booking.booking_date,
          unread_count: unreadCount || 0,
          photo: performer?.photo_urls?.[0]
        });
      }

      // 2. Fetch support chat (for performers) - reuse performerProfile from above
      if (performerProfile) {
        const { data: supportChat } = await supabase
          .from('support_chats')
          .select('id')
          .eq('performer_id', performerProfile.id)
          .maybeSingle();

        if (supportChat) {
          const { data: lastSupportMsg } = await supabase
            .from('support_messages')
            .select('text, created_at, sender_id, read_at')
            .eq('chat_id', supportChat.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          const { count: unreadSupportCount } = await supabase
            .from('support_messages')
            .select('id', { count: 'exact', head: true })
            .eq('chat_id', supportChat.id)
            .neq('sender_id', user.id)
            .is('read_at', null);

          // Always show support chat if it exists
          dialogsData.push({
            id: supportChat.id,
            type: 'support',
            other_user_name: 'Поддержка',
            subtitle: 'Служба поддержки платформы',
            last_message: lastSupportMsg?.text || 'Напишите нам, если нужна помощь',
            last_message_time: lastSupportMsg?.created_at || new Date().toISOString(),
            unread_count: unreadSupportCount || 0,
            photo: undefined
          });
        }
      }

      // Sort by last message time
      dialogsData.sort((a, b) => 
        new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime()
      );

      setDialogs(dialogsData);
      setLoading(false);
    };

    fetchDialogs();
  }, [user]);

  // Fetch messages for selected dialog
  useEffect(() => {
    if (!selectedChatId || !selectedChatType || !user) return;

    const fetchMessages = async () => {
      if (selectedChatType === 'booking') {
        const { data } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('booking_id', selectedChatId)
          .order('created_at', { ascending: true });

        setMessages(data || []);

        // Mark messages as read
        await supabase
          .from('chat_messages')
          .update({ read_at: new Date().toISOString() })
          .eq('booking_id', selectedChatId)
          .neq('sender_id', user.id)
          .is('read_at', null);
      } else {
        const { data } = await supabase
          .from('support_messages')
          .select('id, text, sender_id, created_at, read_at')
          .eq('chat_id', selectedChatId)
          .order('created_at', { ascending: true });

        setMessages(data?.map(m => ({ ...m, attachments: null })) || []);

        // Mark messages as read
        await supabase
          .from('support_messages')
          .update({ read_at: new Date().toISOString() })
          .eq('chat_id', selectedChatId)
          .neq('sender_id', user.id)
          .is('read_at', null);
      }

      const dialog = dialogs.find(d => d.id === selectedChatId && d.type === selectedChatType);
      setCurrentDialog(dialog || null);
    };

    fetchMessages();

    // Subscribe to new messages
    const tableName = selectedChatType === 'booking' ? 'chat_messages' : 'support_messages';
    const filterColumn = selectedChatType === 'booking' ? 'booking_id' : 'chat_id';
    
    const channel = supabase
      .channel(`messages-${selectedChatType}-${selectedChatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: tableName,
          filter: `${filterColumn}=eq.${selectedChatId}`
        },
        async (payload) => {
          const newMsg = payload.new as any;
          setMessages(prev => [...prev, {
            id: newMsg.id,
            text: newMsg.text,
            sender_id: newMsg.sender_id,
            created_at: newMsg.created_at,
            read_at: newMsg.read_at,
            attachments: newMsg.attachments || null
          }]);
          
          // Mark as read if not from me
          if (newMsg.sender_id !== user.id) {
            await supabase
              .from(tableName)
              .update({ read_at: new Date().toISOString() })
              .eq('id', newMsg.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedChatId, selectedChatType, user, dialogs]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + attachments.length > 5) {
      toast.error('Максимум 5 файлов за раз');
      return;
    }
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`Файл ${file.name} слишком большой (макс. 10 МБ)`);
        return false;
      }
      return true;
    });
    setAttachments(prev => [...prev, ...validFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async (): Promise<string[]> => {
    if (attachments.length === 0) return [];
    
    setUploadingFiles(true);
    const urls: string[] = [];
    
    for (const file of attachments) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${selectedChatId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error } = await supabase.storage
        .from('chat-attachments')
        .upload(fileName, file);

      if (error) {
        console.error('Error uploading file:', error);
        toast.error(`Ошибка загрузки ${file.name}`);
      } else {
        const { data: urlData } = supabase.storage
          .from('chat-attachments')
          .getPublicUrl(fileName);
        urls.push(urlData.publicUrl);
      }
    }
    
    setUploadingFiles(false);
    return urls;
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && attachments.length === 0) || !selectedChatId || !selectedChatType || !user) return;

    setSendingMessage(true);
    
    if (selectedChatType === 'booking') {
      const uploadedUrls = await uploadFiles();
      
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          booking_id: selectedChatId,
          sender_id: user.id,
          text: newMessage.trim() || (uploadedUrls.length > 0 ? '📎 Вложение' : ''),
          attachments: uploadedUrls.length > 0 ? uploadedUrls : null
        });

      if (error) {
        console.error('Error sending message:', error);
        toast.error('Ошибка отправки сообщения');
      } else {
        setNewMessage('');
        setAttachments([]);
        
        try {
          await supabase.functions.invoke('send-push-notification', {
            body: {
              type: 'new_message',
              bookingId: selectedChatId,
              senderId: user.id,
              senderName: currentDialog?.other_user_name || 'Пользователь'
            }
          });
        } catch (e) {
          console.error('Error sending notification:', e);
        }
      }
    } else {
      // Support chat
      const { error } = await supabase
        .from('support_messages')
        .insert({
          chat_id: selectedChatId,
          sender_id: user.id,
          sender_type: 'performer',
          text: newMessage.trim()
        });

      if (error) {
        console.error('Error sending support message:', error);
        toast.error('Ошибка отправки сообщения');
      } else {
        setNewMessage('');
        setAttachments([]);
        
        // Send push notification to admins
        try {
          await supabase.functions.invoke('send-push-notification', {
            body: {
              type: 'new_support_message',
              chatId: selectedChatId,
              senderType: 'performer'
            }
          });
        } catch (e) {
          console.error('Error sending push notification:', e);
        }
      }
    }
    
    setSendingMessage(false);
  };

  const selectDialog = (dialog: Dialog) => {
    setSearchParams({ chat: dialog.id, type: dialog.type });
  };

  const goBack = () => {
    setSearchParams({});
    setCurrentDialog(null);
    setMessages([]);
    setAttachments([]);
  };

  const isImageUrl = (url: string) => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  };

  if (authLoading || loading || hasPerformerProfile === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth?redirect=/messages" replace />;
  }

  const Layout = hasPerformerProfile ? PerformerLayout : CustomerLayout;

  const content = (
    <div className="space-y-4">
      <SEOHead title="Сообщения" description="Ваши диалоги" />
      
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Header */}
        <div className="bg-card border-b border-border p-4">
          <div className="flex items-center gap-4">
            {selectedChatId ? (
              <>
                <Button variant="ghost" size="icon" onClick={goBack}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-3">
                  {currentDialog?.type === 'support' ? (
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Headphones className="h-5 w-5 text-primary" />
                    </div>
                  ) : currentDialog?.photo ? (
                    <img src={currentDialog.photo} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <h1 className="font-semibold text-foreground">
                      {currentDialog?.other_user_name || 'Диалог'}
                    </h1>
                    {currentDialog && (
                      <p className="text-xs text-muted-foreground">
                        {currentDialog.subtitle}
                      </p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <MessageCircle className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-display font-bold text-foreground">Сообщения</h1>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        {!selectedChatId ? (
          // Dialogs list
          <div className="divide-y divide-border">
            {dialogs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>У вас пока нет сообщений</p>
              </div>
            ) : (
              dialogs.map((dialog) => (
                <button
                  key={`${dialog.type}-${dialog.id}`}
                  onClick={() => selectDialog(dialog)}
                  className={cn(
                    'w-full p-4 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left',
                    dialog.unread_count > 0 && 'bg-primary/5'
                  )}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {dialog.type === 'support' ? (
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Headphones className="h-6 w-6 text-primary" />
                      </div>
                    ) : dialog.photo ? (
                      <img 
                        src={dialog.photo} 
                        alt="" 
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    {dialog.unread_count > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center font-medium">
                        {dialog.unread_count}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn(
                        'font-medium text-foreground truncate',
                        dialog.unread_count > 0 && 'font-semibold'
                      )}>
                        {dialog.other_user_name}
                      </span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {format(new Date(dialog.last_message_time), 'HH:mm', { locale: ru })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate mt-0.5">
                      {dialog.last_message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {dialog.subtitle}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        ) : (
          // Chat view
          <div className="flex flex-col h-[500px]">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Начните диалог</p>
                  </div>
                ) : messages.map((msg) => {
                  const isMe = msg.sender_id === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        'flex',
                        isMe ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div
                        className={cn(
                          'max-w-[80%] rounded-2xl px-4 py-2',
                          isMe
                            ? 'bg-primary text-primary-foreground rounded-br-md'
                            : 'bg-muted text-foreground rounded-bl-md'
                        )}
                      >
                        {/* Attachments */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {msg.attachments.map((url, idx) => (
                              isImageUrl(url) ? (
                                <a key={idx} href={url} target="_blank" rel="noopener noreferrer">
                                  <img 
                                    src={url} 
                                    alt="Вложение" 
                                    className="max-w-full rounded-lg max-h-60 object-cover"
                                  />
                                </a>
                              ) : (
                                <a 
                                  key={idx}
                                  href={url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className={cn(
                                    'flex items-center gap-2 text-sm underline',
                                    isMe ? 'text-primary-foreground' : 'text-foreground'
                                  )}
                                >
                                  <FileText className="h-4 w-4" />
                                  Файл
                                </a>
                              )
                            ))}
                          </div>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{msg.text !== '📎 Вложение' && msg.text}</p>
                        <div className={cn(
                          'flex items-center gap-1 mt-1',
                          isMe ? 'justify-end' : 'justify-start'
                        )}>
                          <span className={cn(
                            'text-xs',
                            isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'
                          )}>
                            {format(new Date(msg.created_at), 'HH:mm')}
                          </span>
                          {isMe && (
                            msg.read_at ? (
                              <CheckCheck className="h-3.5 w-3.5 text-primary-foreground/70" />
                            ) : (
                              <Check className="h-3.5 w-3.5 text-primary-foreground/70" />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Attachments preview - only for booking chats */}
            {selectedChatType === 'booking' && attachments.length > 0 && (
              <div className="px-4 py-2 border-t border-border bg-muted/50">
                <div className="flex flex-wrap gap-2">
                  {attachments.map((file, idx) => (
                    <div key={idx} className="relative group">
                      {file.type.startsWith('image/') ? (
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt={file.name}
                          className="h-16 w-16 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="h-16 w-16 bg-muted rounded-lg flex items-center justify-center">
                          <FileText className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <button
                        onClick={() => removeAttachment(idx)}
                        className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Message input */}
            <div className="p-4 border-t border-border bg-card">
              <form 
                onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                className="flex gap-2"
              >
                {selectedChatType === 'booking' && (
                  <>
                    <input 
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.txt"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={sendingMessage || uploadingFiles}
                    >
                      <Paperclip className="h-5 w-5" />
                    </Button>
                  </>
                )}
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Написать сообщение..."
                  className="flex-1"
                  disabled={sendingMessage || uploadingFiles}
                />
                <Button 
                  type="submit" 
                  size="icon"
                  disabled={(!newMessage.trim() && attachments.length === 0) || sendingMessage || uploadingFiles}
                >
                  {(sendingMessage || uploadingFiles) ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return <Layout>{content}</Layout>;
}
