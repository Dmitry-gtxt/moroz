import { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SEOHead } from '@/components/seo/SEOHead';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'sonner';
import { 
  MessageCircle, 
  Send, 
  ArrowLeft, 
  User,
  Calendar,
  Check,
  CheckCheck,
  Paperclip,
  Image,
  X,
  FileText,
  Loader2
} from 'lucide-react';

interface Dialog {
  booking_id: string;
  other_user_name: string;
  booking_date: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  performer_photo?: string;
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
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedBookingId = searchParams.get('booking');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [dialogs, setDialogs] = useState<Dialog[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [currentDialog, setCurrentDialog] = useState<Dialog | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Fetch dialogs
  useEffect(() => {
    if (!user) return;

    const fetchDialogs = async () => {
      setLoading(true);
      
      // Get all bookings where user is customer or performer
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_date,
          customer_name,
          customer_id,
          performer_id,
          performer_profiles!bookings_performer_id_fkey (
            display_name,
            photo_urls,
            user_id
          )
        `)
        .or(`customer_id.eq.${user.id},performer_id.in.(select id from performer_profiles where user_id = '${user.id}')`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching bookings:', error);
        setLoading(false);
        return;
      }

      // For each booking, get last message and unread count
      const dialogsData: Dialog[] = [];
      
      for (const booking of bookings || []) {
        const performer = booking.performer_profiles as any;
        const isCustomer = booking.customer_id === user.id;
        
        // Get last message
        const { data: lastMsg } = await supabase
          .from('chat_messages')
          .select('text, created_at, sender_id, read_at')
          .eq('booking_id', booking.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Get unread count (messages not from me and not read)
        const { count: unreadCount } = await supabase
          .from('chat_messages')
          .select('id', { count: 'exact', head: true })
          .eq('booking_id', booking.id)
          .neq('sender_id', user.id)
          .is('read_at', null);

        // Only show dialogs that have messages
        if (lastMsg) {
          dialogsData.push({
            booking_id: booking.id,
            other_user_name: isCustomer 
              ? (performer?.display_name || 'Исполнитель')
              : booking.customer_name,
            booking_date: booking.booking_date,
            last_message: lastMsg.text,
            last_message_time: lastMsg.created_at,
            unread_count: unreadCount || 0,
            performer_photo: performer?.photo_urls?.[0]
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
    if (!selectedBookingId || !user) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('booking_id', selectedBookingId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages(data || []);

      // Mark messages as read
      await supabase
        .from('chat_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('booking_id', selectedBookingId)
        .neq('sender_id', user.id)
        .is('read_at', null);

      // Find current dialog info
      const dialog = dialogs.find(d => d.booking_id === selectedBookingId);
      setCurrentDialog(dialog || null);
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages-${selectedBookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `booking_id=eq.${selectedBookingId}`
        },
        async (payload) => {
          const newMsg = payload.new as Message;
          setMessages(prev => [...prev, newMsg]);
          
          // Mark as read if not from me
          if (newMsg.sender_id !== user.id) {
            await supabase
              .from('chat_messages')
              .update({ read_at: new Date().toISOString() })
              .eq('id', newMsg.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedBookingId, user, dialogs]);

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
      const fileName = `${user.id}/${selectedBookingId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
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
    if ((!newMessage.trim() && attachments.length === 0) || !selectedBookingId || !user) return;

    setSendingMessage(true);
    
    // Upload files first
    const uploadedUrls = await uploadFiles();
    
    const { error } = await supabase
      .from('chat_messages')
      .insert({
        booking_id: selectedBookingId,
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
      
      // Send push notification to the other user
      try {
        await supabase.functions.invoke('send-push-notification', {
          body: {
            type: 'new_message',
            bookingId: selectedBookingId,
            senderId: user.id,
            senderName: currentDialog?.other_user_name || 'Пользователь'
          }
        });
      } catch (e) {
        console.error('Error sending notification:', e);
      }
    }
    
    setSendingMessage(false);
  };

  const selectDialog = (bookingId: string) => {
    setSearchParams({ booking: bookingId });
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <SEOHead title="Сообщения" description="Ваши диалоги" />
      
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-card border-b border-border p-4">
            <div className="flex items-center gap-4">
              {selectedBookingId ? (
                <>
                  <Button variant="ghost" size="icon" onClick={goBack}>
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <div>
                    <h1 className="font-semibold text-foreground">
                      {currentDialog?.other_user_name || 'Диалог'}
                    </h1>
                    {currentDialog && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(currentDialog.booking_date), 'd MMMM yyyy', { locale: ru })}
                      </p>
                    )}
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
          {!selectedBookingId ? (
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
                    key={dialog.booking_id}
                    onClick={() => selectDialog(dialog.booking_id)}
                    className={cn(
                      'w-full p-4 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left',
                      dialog.unread_count > 0 && 'bg-primary/5'
                    )}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      {dialog.performer_photo ? (
                        <img 
                          src={dialog.performer_photo} 
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
                        Заказ на {format(new Date(dialog.booking_date), 'd MMM', { locale: ru })}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : (
            // Chat view
            <div className="flex flex-col h-[calc(100vh-80px)]">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((msg) => {
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
                </div>
              </ScrollArea>

              {/* Attachments preview */}
              {attachments.length > 0 && (
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
    </>
  );
}