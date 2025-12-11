import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SEOHead } from '@/components/seo/SEOHead';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { 
  MessageCircle, 
  Send, 
  ArrowLeft, 
  User,
  Check,
  CheckCheck,
  Headphones
} from 'lucide-react';

interface SupportChat {
  id: string;
  performer_id: string;
  performer_name: string;
  performer_photo?: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

interface Message {
  id: string;
  text: string;
  sender_id: string;
  sender_type: string;
  created_at: string;
  read_at: string | null;
}

export default function AdminMessages() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedChatId = searchParams.get('chat');
  
  const [chats, setChats] = useState<SupportChat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [currentChat, setCurrentChat] = useState<SupportChat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch support chats
  useEffect(() => {
    if (!user) return;

    const fetchChats = async () => {
      setLoading(true);
      
      const { data: supportChats } = await supabase
        .from('support_chats')
        .select(`
          id,
          performer_id,
          performer_profiles!support_chats_performer_id_fkey (
            display_name,
            photo_urls
          )
        `)
        .order('updated_at', { ascending: false });

      const chatsData: SupportChat[] = [];
      
      for (const chat of supportChats || []) {
        const performer = chat.performer_profiles as any;
        
        const { data: lastMsg } = await supabase
          .from('support_messages')
          .select('text, created_at')
          .eq('chat_id', chat.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const { count: unreadCount } = await supabase
          .from('support_messages')
          .select('id', { count: 'exact', head: true })
          .eq('chat_id', chat.id)
          .eq('sender_type', 'performer')
          .is('read_at', null);

        chatsData.push({
          id: chat.id,
          performer_id: chat.performer_id,
          performer_name: performer?.display_name || 'Исполнитель',
          performer_photo: performer?.photo_urls?.[0],
          last_message: lastMsg?.text || 'Нет сообщений',
          last_message_time: lastMsg?.created_at || new Date().toISOString(),
          unread_count: unreadCount || 0
        });
      }

      chatsData.sort((a, b) => 
        new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime()
      );

      setChats(chatsData);
      setLoading(false);
    };

    fetchChats();
  }, [user]);

  // Fetch messages for selected chat
  useEffect(() => {
    if (!selectedChatId || !user) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('support_messages')
        .select('id, text, sender_id, sender_type, created_at, read_at')
        .eq('chat_id', selectedChatId)
        .order('created_at', { ascending: true });

      setMessages(data || []);

      // Mark messages as read
      await supabase
        .from('support_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('chat_id', selectedChatId)
        .eq('sender_type', 'performer')
        .is('read_at', null);

      const chat = chats.find(c => c.id === selectedChatId);
      setCurrentChat(chat || null);
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`admin-support-messages-${selectedChatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `chat_id=eq.${selectedChatId}`
        },
        async (payload) => {
          const newMsg = payload.new as any;
          setMessages(prev => [...prev, {
            id: newMsg.id,
            text: newMsg.text,
            sender_id: newMsg.sender_id,
            sender_type: newMsg.sender_type,
            created_at: newMsg.created_at,
            read_at: newMsg.read_at
          }]);
          
          if (newMsg.sender_type === 'performer') {
            await supabase
              .from('support_messages')
              .update({ read_at: new Date().toISOString() })
              .eq('id', newMsg.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedChatId, user, chats]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChatId || !user) return;

    setSendingMessage(true);
    
    const { error } = await supabase
      .from('support_messages')
      .insert({
        chat_id: selectedChatId,
        sender_id: user.id,
        sender_type: 'admin',
        text: newMessage.trim()
      });

    if (error) {
      console.error('Error sending message:', error);
    } else {
      setNewMessage('');
    }
    
    setSendingMessage(false);
  };

  const selectChat = (chat: SupportChat) => {
    setSearchParams({ chat: chat.id });
  };

  const goBack = () => {
    setSearchParams({});
    setCurrentChat(null);
    setMessages([]);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <SEOHead title="Сообщения поддержки" description="Чаты поддержки с исполнителями" />
      
      <div className="bg-card border border-border rounded-xl overflow-hidden h-[calc(100vh-12rem)]">
        {/* Header */}
        <div className="bg-card border-b border-border p-4">
          <div className="flex items-center gap-4">
            {selectedChatId ? (
              <>
                <Button variant="ghost" size="icon" onClick={goBack}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-3">
                  {currentChat?.performer_photo ? (
                    <img src={currentChat.performer_photo} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <h1 className="font-semibold text-foreground">
                      {currentChat?.performer_name || 'Исполнитель'}
                    </h1>
                    <p className="text-xs text-muted-foreground">Чат поддержки</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Headphones className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-display font-bold text-foreground">Чаты поддержки</h1>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        {!selectedChatId ? (
          // Chats list
          <ScrollArea className="h-[calc(100%-4rem)]">
            <div className="divide-y divide-border">
              {chats.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Нет активных чатов поддержки</p>
                </div>
              ) : (
                chats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => selectChat(chat)}
                    className={cn(
                      'w-full p-4 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left',
                      chat.unread_count > 0 && 'bg-primary/5'
                    )}
                  >
                    {chat.performer_photo ? (
                      <img 
                        src={chat.performer_photo} 
                        alt="" 
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className={cn(
                          "font-medium truncate",
                          chat.unread_count > 0 ? "text-foreground" : "text-foreground"
                        )}>
                          {chat.performer_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(chat.last_message_time), 'dd.MM HH:mm', { locale: ru })}
                        </span>
                      </div>
                      <p className={cn(
                        "text-sm truncate",
                        chat.unread_count > 0 ? "text-foreground font-medium" : "text-muted-foreground"
                      )}>
                        {chat.last_message}
                      </p>
                    </div>
                    
                    {chat.unread_count > 0 && (
                      <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full min-w-[24px] text-center">
                        {chat.unread_count}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        ) : (
          // Chat view
          <div className="flex flex-col h-[calc(100%-4rem)]">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => {
                  const isAdmin = message.sender_type === 'admin';
                  return (
                    <div
                      key={message.id}
                      className={cn(
                        'flex',
                        isAdmin ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div
                        className={cn(
                          'max-w-[70%] rounded-2xl px-4 py-2',
                          isAdmin
                            ? 'bg-primary text-primary-foreground rounded-br-md'
                            : 'bg-muted text-foreground rounded-bl-md'
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.text}
                        </p>
                        <div className={cn(
                          'flex items-center justify-end gap-1 mt-1',
                          isAdmin ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        )}>
                          <span className="text-[10px]">
                            {format(new Date(message.created_at), 'HH:mm')}
                          </span>
                          {isAdmin && (
                            message.read_at ? (
                              <CheckCheck className="h-3 w-3" />
                            ) : (
                              <Check className="h-3 w-3" />
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

            {/* Message input */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Написать сообщение..."
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  disabled={sendingMessage}
                />
                <Button
                  size="icon"
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
