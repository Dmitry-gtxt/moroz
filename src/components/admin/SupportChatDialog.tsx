import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Send, Eye, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale/ru';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface SupportMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  sender_type: 'performer' | 'admin';
  text: string;
  read_at: string | null;
  created_at: string;
}

interface SupportChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  performerId: string;
  performerName: string;
}

export function SupportChatDialog({ open, onOpenChange, performerId, performerName }: SupportChatDialogProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && performerId) {
      fetchChat();
    }
  }, [open, performerId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function fetchChat() {
    setLoading(true);
    
    // Get or create support chat
    let { data: chat } = await supabase
      .from('support_chats')
      .select('id')
      .eq('performer_id', performerId)
      .maybeSingle();

    if (!chat) {
      const { data: newChat, error } = await supabase
        .from('support_chats')
        .insert({ performer_id: performerId })
        .select('id')
        .single();
      
      if (error) {
        toast.error('Ошибка создания чата');
        setLoading(false);
        return;
      }
      chat = newChat;
    }

    setChatId(chat.id);

    // Fetch messages
    const { data: msgs } = await supabase
      .from('support_messages')
      .select('*')
      .eq('chat_id', chat.id)
      .order('created_at', { ascending: true });

    setMessages((msgs as SupportMessage[]) || []);
    setLoading(false);

    // Mark messages as read
    if (msgs && msgs.length > 0) {
      const unreadIds = msgs.filter(m => !m.read_at && m.sender_type === 'performer').map(m => m.id);
      if (unreadIds.length > 0) {
        await supabase
          .from('support_messages')
          .update({ read_at: new Date().toISOString() })
          .in('id', unreadIds);
      }
    }
  }

  async function sendMessage() {
    if (!newMessage.trim() || !chatId || !user) return;

    setSending(true);
    const { error } = await supabase
      .from('support_messages')
      .insert({
        chat_id: chatId,
        sender_id: user.id,
        sender_type: 'admin',
        text: newMessage.trim(),
      });

    if (error) {
      toast.error('Ошибка отправки сообщения');
    } else {
      setNewMessage('');
      fetchChat();
    }
    setSending(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col">
        <DialogHeader className="flex-shrink-0 flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2">
            Чат с {performerName}
          </DialogTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/admin/performer/${performerId}`} target="_blank">
              <Eye className="h-4 w-4 mr-1" />
              Профиль
            </Link>
          </Button>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Нет сообщений. Начните переписку.
            </div>
          ) : (
            <div className="space-y-3 py-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${
                      msg.sender_type === 'admin'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm">{msg.text}</p>
                    <p className={`text-xs mt-1 ${msg.sender_type === 'admin' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {format(new Date(msg.created_at), 'HH:mm', { locale: ru })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="flex gap-2 pt-4 border-t border-border flex-shrink-0">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Введите сообщение..."
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          />
          <Button onClick={sendMessage} disabled={sending || !newMessage.trim()}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}