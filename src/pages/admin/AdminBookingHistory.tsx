import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, Search, ChevronDown, ChevronRight, Phone, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Database } from '@/integrations/supabase/types';

type Booking = Database['public']['Tables']['bookings']['Row'];
type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];

interface BookingWithDetails extends Booking {
  performer_name?: string;
  performer_phone?: string | null;
}

interface PerformerBasic {
  id: string;
  display_name: string;
  user_id: string | null;
}

interface GroupedBookings {
  key: string;
  customerName: string;
  performerName: string;
  customerId: string;
  performerId: string;
  customerPhone: string;
  performerPhone: string | null;
  bookings: BookingWithDetails[];
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Ожидает', variant: 'outline' },
  confirmed: { label: 'Подтверждён', variant: 'default' },
  completed: { label: 'Завершён', variant: 'secondary' },
  cancelled: { label: 'Отменён', variant: 'destructive' },
  no_show: { label: 'Неявка', variant: 'destructive' },
  counter_proposed: { label: 'Предложено время', variant: 'secondary' },
  customer_accepted: { label: 'Клиент выбрал', variant: 'outline' },
};

const paymentLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  not_paid: { label: 'Не оплачен', variant: 'outline' },
  prepayment_paid: { label: 'Предоплата', variant: 'secondary' },
  fully_paid: { label: 'Оплачен', variant: 'default' },
  refunded: { label: 'Возврат', variant: 'destructive' },
};

export default function AdminBookingHistory() {
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [performers, setPerformers] = useState<PerformerBasic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  
  // Chat dialog
  const [chatDialog, setChatDialog] = useState<{ open: boolean; bookingId: string | null }>({ open: false, bookingId: null });
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);

    const [bookingsRes, performersRes] = await Promise.all([
      supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase.from('performer_profiles').select('id, display_name, user_id'),
    ]);

    if (bookingsRes.error) {
      toast.error('Ошибка загрузки заказов');
      setLoading(false);
      return;
    }

    // Fetch performer phones from profiles
    const performerUserIds = performersRes.data?.filter(p => p.user_id).map(p => p.user_id) || [];
    const { data: performerProfiles } = performerUserIds.length > 0
      ? await supabase.from('profiles').select('user_id, phone').in('user_id', performerUserIds)
      : { data: [] };

    const performerPhoneMap = new Map<string, string | null>();
    performersRes.data?.forEach(p => {
      if (p.user_id) {
        const profile = performerProfiles?.find(pr => pr.user_id === p.user_id);
        performerPhoneMap.set(p.id, profile?.phone || null);
      }
    });

    const performerMap = new Map(performersRes.data?.map(p => [p.id, p.display_name]) || []);
    const enriched = bookingsRes.data?.map(b => ({
      ...b,
      performer_name: performerMap.get(b.performer_id) || 'Неизвестно',
      performer_phone: performerPhoneMap.get(b.performer_id) || null,
    })) || [];
    setBookings(enriched);

    if (performersRes.data) setPerformers(performersRes.data);
    setLoading(false);
  }

  // Filter by tab
  const getFilteredByTab = (tab: string) => {
    if (tab === 'confirmed') return bookings.filter(b => b.status === 'confirmed');
    if (tab === 'cancelled') return bookings.filter(b => b.status === 'cancelled');
    return bookings;
  };

  // Filter and group bookings
  const filteredBookings = getFilteredByTab(activeTab).filter(b => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.customer_name.toLowerCase().includes(q) ||
      b.performer_name?.toLowerCase().includes(q) ||
      b.address.toLowerCase().includes(q)
    );
  });

  const groupedBookings: GroupedBookings[] = [];
  const groupMap = new Map<string, GroupedBookings>();

  filteredBookings.forEach(booking => {
    const key = `${booking.customer_id}-${booking.performer_id}`;
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        key,
        customerName: booking.customer_name,
        performerName: booking.performer_name || 'Неизвестно',
        customerId: booking.customer_id,
        performerId: booking.performer_id,
        customerPhone: booking.customer_phone,
        performerPhone: booking.performer_phone || null,
        bookings: [],
      });
    }
    groupMap.get(key)!.bookings.push(booking);
  });

  groupMap.forEach(group => groupedBookings.push(group));
  groupedBookings.sort((a, b) => {
    const aDate = new Date(a.bookings[0].created_at);
    const bDate = new Date(b.bookings[0].created_at);
    return bDate.getTime() - aDate.getTime();
  });

  function toggleGroup(key: string) {
    const newSet = new Set(expandedGroups);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setExpandedGroups(newSet);
  }

  async function openChat(bookingId: string) {
    setChatDialog({ open: true, bookingId });
    setLoadingChat(true);

    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true });

    setChatMessages(data || []);
    setLoadingChat(false);
  }

  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
  const cancelledCount = bookings.filter(b => b.status === 'cancelled').length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">История заказов</h1>
          <p className="text-muted-foreground mt-1">Все бронирования с группировкой по связке клиент-исполнитель</p>
        </div>

        <div className="flex gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по имени, адресу..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">Все ({bookings.length})</TabsTrigger>
            <TabsTrigger value="confirmed">Подтверждённые ({confirmedCount})</TabsTrigger>
            <TabsTrigger value="cancelled">Отменённые ({cancelledCount})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : groupedBookings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Заказы не найдены
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {groupedBookings.map((group) => (
                  <Card key={group.key}>
                    <CardHeader 
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => toggleGroup(group.key)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {expandedGroups.has(group.key) ? (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          )}
                          <div>
                            <CardTitle className="text-lg">
                              {group.customerName} → {group.performerName}
                            </CardTitle>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                Клиент: {group.customerPhone}
                              </span>
                              {group.performerPhone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  Исполнитель: {group.performerPhone}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {group.bookings.length} {group.bookings.length === 1 ? 'заказ' : group.bookings.length < 5 ? 'заказа' : 'заказов'}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {group.bookings.some(b => b.status === 'pending') && (
                            <Badge variant="outline">Есть ожидающие</Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    {expandedGroups.has(group.key) && (
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          {group.bookings.map((booking) => {
                            const status = statusLabels[booking.status] || statusLabels.pending;
                            const payment = paymentLabels[booking.payment_status] || paymentLabels.not_paid;
                            const remainingAmount = booking.price_total - booking.prepayment_amount;

                            return (
                              <div
                                key={booking.id}
                                className="flex flex-col gap-2 p-4 rounded-lg bg-muted/30 border border-border"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">
                                        {format(new Date(booking.booking_date), 'd MMM yyyy', { locale: ru })}
                                      </span>
                                      <span className="text-muted-foreground">{booking.booking_time}</span>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {booking.address}
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Badge variant={status.variant}>{status.label}</Badge>
                                      <Badge variant={payment.variant}>{payment.label}</Badge>
                                      <span className="font-semibold">
                                        {booking.prepayment_amount.toLocaleString()} ₽
                                        <span className="text-muted-foreground font-normal text-sm ml-1">
                                          (+{remainingAmount.toLocaleString()} ₽ исполнителю)
                                        </span>
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => openChat(booking.id)}>
                                      <MessageSquare className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>

                                {/* Cancellation reason */}
                                {booking.status === 'cancelled' && booking.cancellation_reason && (
                                  <div className="flex items-start gap-2 p-2 bg-destructive/10 rounded text-sm">
                                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                                    <div>
                                      <span className="font-medium text-destructive">
                                        Причина отмены {booking.cancelled_by === 'performer' ? '(исполнитель)' : booking.cancelled_by === 'customer' ? '(клиент)' : ''}:
                                      </span>
                                      <span className="ml-1 text-muted-foreground">{booking.cancellation_reason}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Chat Dialog */}
      <Dialog open={chatDialog.open} onOpenChange={(open) => setChatDialog({ ...chatDialog, open })}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Переписка по заказу</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            {loadingChat ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : chatMessages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Нет сообщений
              </div>
            ) : (
              <div className="space-y-3">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className="p-3 rounded-lg bg-muted">
                    <p className="text-sm">{msg.text}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(msg.created_at), 'd MMM, HH:mm', { locale: ru })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
