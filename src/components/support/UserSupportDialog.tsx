import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Headphones, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  text: string;
  sender_id: string;
  sender_type: string;
  created_at: string;
}

interface UserSupportDialogProps {
  trigger?: React.ReactNode;
}

export function UserSupportDialog({ trigger }: UserSupportDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load or create support chat when dialog opens
  useEffect(() => {
    if (!open || !user) return;

    async function loadChat() {
      setLoading(true);
      try {
        // First check if user has a performer profile
        const { data: performerProfile } = await supabase
          .from('performer_profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        let chatData;

        if (performerProfile) {
          // User is a performer - use performer support chat
          const { data: existingChat } = await supabase
            .from('support_chats')
            .select('id')
            .eq('performer_id', performerProfile.id)
            .maybeSingle();

          chatData = existingChat;
        } else {
          // User is a customer - find or create customer support chat
          const { data: existingChat } = await supabase
            .from('support_chats')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();

          if (existingChat) {
            chatData = existingChat;
          } else {
            // Create new support chat for customer
            const { data: newChat, error: createError } = await supabase
              .from('support_chats')
              .insert({ user_id: user.id })
              .select('id')
              .single();

            if (createError) {
              console.error('Error creating support chat:', createError);
              toast.error('Не удалось создать чат поддержки');
              return;
            }
            chatData = newChat;
          }
        }

        if (chatData) {
          setChatId(chatData.id);
          
          // Load messages
          const { data: messagesData } = await supabase
            .from('support_messages')
            .select('*')
            .eq('chat_id', chatData.id)
            .order('created_at', { ascending: true });

          setMessages(messagesData || []);

          // Mark messages as read
          await supabase
            .from('support_messages')
            .update({ read_at: new Date().toISOString() })
            .eq('chat_id', chatData.id)
            .is('read_at', null)
            .neq('sender_id', user.id);
        }
      } catch (error) {
        console.error('Error loading support chat:', error);
        toast.error('Ошибка загрузки чата');
      } finally {
        setLoading(false);
      }
    }

    loadChat();
  }, [open, user]);

  // Subscribe to new messages
  useEffect(() => {
    if (!chatId) return;

    const channel = supabase
      .channel(`support-chat-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          
          // Mark as read if from admin
          if (newMsg.sender_id !== user?.id) {
            supabase
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
  }, [chatId, user?.id]);

  const handleSend = async () => {
    if (!newMessage.trim() || !chatId || !user) return;

    setSending(true);
    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      const { error } = await supabase.from('support_messages').insert({
        chat_id: chatId,
        sender_id: user.id,
        sender_type: 'user',
        text: messageText,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Ошибка отправки сообщения');
      setNewMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Headphones className="h-4 w-4" />
            Написать в поддержку
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Headphones className="h-5 w-5 text-primary" />
            Поддержка
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-3 pb-4">
                {messages.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Напишите ваш вопрос, и мы ответим в ближайшее время
                  </p>
                )}
                {messages.map((msg) => {
                  const isOwn = msg.sender_id === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        'flex',
                        isOwn ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div
                        className={cn(
                          'max-w-[80%] rounded-lg px-3 py-2',
                          isOwn
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                        <p
                          className={cn(
                            'text-xs mt-1',
                            isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                          )}
                        >
                          {new Date(msg.created_at).toLocaleString('ru-RU', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="flex gap-2 pt-2 border-t">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Введите сообщение..."
                className="min-h-[60px] max-h-[120px] resize-none"
                disabled={sending}
              />
              <Button
                onClick={handleSend}
                disabled={!newMessage.trim() || sending}
                size="icon"
                className="h-auto"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
