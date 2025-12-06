import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Star, MapPin, Save, Loader2, MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Database } from '@/integrations/supabase/types';

type PerformerProfile = Database['public']['Tables']['performer_profiles']['Row'];
type District = Database['public']['Tables']['districts']['Row'];

const verificationLabels: Record<string, string> = {
  unverified: 'Не верифицирован',
  pending: 'На проверке',
  verified: 'Верифицирован',
  rejected: 'Отклонён',
};

const performerTypeLabels: Record<string, string> = {
  ded_moroz: 'Дед Мороз',
  snegurochka: 'Снегурочка',
  duo: 'Дуэт',
  santa: 'Санта-Клаус',
};

interface SupportMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  sender_type: 'performer' | 'admin';
  text: string;
  read_at: string | null;
  created_at: string;
}

export default function AdminPerformerView() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [performer, setPerformer] = useState<PerformerProfile | null>(null);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [chatId, setChatId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Editable fields
  const [formData, setFormData] = useState({
    display_name: '',
    description: '',
    base_price: 0,
    price_from: 0,
    price_to: 0,
    experience_years: 0,
    verification_status: 'unverified' as string,
    is_active: false,
  });

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  async function fetchData() {
    const [performerRes, districtsRes] = await Promise.all([
      supabase.from('performer_profiles').select('*').eq('id', id).maybeSingle(),
      supabase.from('districts').select('*'),
    ]);

    if (performerRes.data) {
      setPerformer(performerRes.data);
      setFormData({
        display_name: performerRes.data.display_name,
        description: performerRes.data.description || '',
        base_price: performerRes.data.base_price,
        price_from: performerRes.data.price_from || 0,
        price_to: performerRes.data.price_to || 0,
        experience_years: performerRes.data.experience_years || 0,
        verification_status: performerRes.data.verification_status,
        is_active: performerRes.data.is_active,
      });
    }
    if (districtsRes.data) setDistricts(districtsRes.data);

    // Fetch support chat
    if (id) {
      const { data: chat } = await supabase
        .from('support_chats')
        .select('id')
        .eq('performer_id', id)
        .maybeSingle();

      if (chat) {
        setChatId(chat.id);
        const { data: msgs } = await supabase
          .from('support_messages')
          .select('*')
          .eq('chat_id', chat.id)
          .order('created_at', { ascending: true });
        setMessages((msgs as SupportMessage[]) || []);
      }
    }

    setLoading(false);
  }

  async function handleSave() {
    if (!id) return;
    setSaving(true);

    const { error } = await supabase
      .from('performer_profiles')
      .update({
        display_name: formData.display_name,
        description: formData.description,
        base_price: formData.base_price,
        price_from: formData.price_from || null,
        price_to: formData.price_to || null,
        experience_years: formData.experience_years,
        verification_status: formData.verification_status as Database['public']['Enums']['verification_status'],
        is_active: formData.is_active,
      })
      .eq('id', id);

    if (error) {
      toast.error('Ошибка сохранения');
    } else {
      toast.success('Изменения сохранены');
      fetchData();
    }
    setSaving(false);
  }

  async function sendMessage() {
    if (!newMessage.trim() || !chatId || !user) return;

    setSendingMessage(true);
    const { error } = await supabase
      .from('support_messages')
      .insert({
        chat_id: chatId,
        sender_id: user.id,
        sender_type: 'admin',
        text: newMessage.trim(),
      });

    if (error) {
      toast.error('Ошибка отправки');
    } else {
      setNewMessage('');
      // Refresh messages
      const { data: msgs } = await supabase
        .from('support_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });
      setMessages((msgs as SupportMessage[]) || []);
    }
    setSendingMessage(false);
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!performer) {
    return (
      <AdminLayout>
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold mb-4">Исполнитель не найден</h1>
          <Button asChild>
            <Link to="/admin/performers">Назад к списку</Link>
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const getDistrictNames = (slugs: string[]) => {
    return slugs.map(slug => districts.find(d => d.slug === slug)?.name).filter(Boolean).join(', ');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/performers">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">{performer.display_name}</h1>
            <p className="text-muted-foreground">Управление профилем исполнителя</p>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Профиль</TabsTrigger>
            <TabsTrigger value="chat">
              <MessageSquare className="h-4 w-4 mr-2" />
              Чат поддержки
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Info Card */}
              <Card className="lg:col-span-1">
                <CardContent className="pt-6">
                  <div className="text-center mb-4">
                    <img
                      src={performer.photo_urls?.[0] || '/placeholder.svg'}
                      alt={performer.display_name}
                      className="w-32 h-32 rounded-xl mx-auto object-cover mb-4"
                    />
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Star className="h-4 w-4 fill-accent text-accent" />
                      <span className="font-semibold">{Number(performer.rating_average).toFixed(1)}</span>
                      <span className="text-muted-foreground">({performer.rating_count})</span>
                    </div>
                    <div className="flex flex-wrap justify-center gap-1">
                      {performer.performer_types?.map(type => (
                        <Badge key={type} variant="secondary">{performerTypeLabels[type] || type}</Badge>
                      ))}
                    </div>
                  </div>
                  {performer.district_slugs.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {getDistrictNames(performer.district_slugs)}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Edit Form */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Редактирование</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label>Имя</Label>
                      <Input
                        value={formData.display_name}
                        onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Описание</Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={4}
                      />
                    </div>
                    <div>
                      <Label>Базовая цена</Label>
                      <Input
                        type="number"
                        value={formData.base_price}
                        onChange={(e) => setFormData({ ...formData, base_price: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label>Цена от</Label>
                      <Input
                        type="number"
                        value={formData.price_from}
                        onChange={(e) => setFormData({ ...formData, price_from: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label>Цена до</Label>
                      <Input
                        type="number"
                        value={formData.price_to}
                        onChange={(e) => setFormData({ ...formData, price_to: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label>Опыт (лет)</Label>
                      <Input
                        type="number"
                        value={formData.experience_years}
                        onChange={(e) => setFormData({ ...formData, experience_years: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label>Статус верификации</Label>
                      <Select
                        value={formData.verification_status}
                        onValueChange={(v) => setFormData({ ...formData, verification_status: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unverified">Не верифицирован</SelectItem>
                          <SelectItem value="pending">На проверке</SelectItem>
                          <SelectItem value="verified">Верифицирован</SelectItem>
                          <SelectItem value="rejected">Отклонён</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="is_active"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="is_active">Активен в каталоге</Label>
                    </div>
                  </div>
                  <Button onClick={handleSave} disabled={saving} className="w-full">
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Сохранить изменения
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="chat">
            <Card>
              <CardHeader>
                <CardTitle>Чат с исполнителем</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4 mb-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Нет сообщений
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg px-3 py-2 ${
                              msg.sender_type === 'admin'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm">{msg.text}</p>
                            <p className={`text-xs mt-1 ${msg.sender_type === 'admin' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                              {format(new Date(msg.created_at), 'd MMM, HH:mm', { locale: ru })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Введите сообщение..."
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  />
                  <Button onClick={sendMessage} disabled={sendingMessage || !newMessage.trim()}>
                    {sendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}