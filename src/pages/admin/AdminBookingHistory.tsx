import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { Eye, MessageSquare, Search, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Database } from '@/integrations/supabase/types';

type Booking = Database['public']['Tables']['bookings']['Row'];
type PerformerProfile = Database['public']['Tables']['performer_profiles']['Row'];
type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];

interface BookingWithDetails extends Booking {
  performer_name?: string;
}

interface PerformerBasic {
  id: string;
  display_name: string;
}

interface GroupedBookings {
  key: string;
  customerName: string;
  performerName: string;
  customerId: string;
  performerId: string;
  bookings: BookingWithDetails[];
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Ожидает', variant: 'outline' },
  confirmed: { label: 'Подтверждён', variant: 'default' },
  completed: { label: 'Завершён', variant: 'secondary' },
  cancelled: { label: 'Отменён', variant: 'destructive' },
  no_show: { label: 'Неявка', variant: 'destructive' },
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
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  
  // Chat dialog
  const [chatDialog, setChatDialog] = useState<{ open: boolean; bookingId: string | null }>({ open: false, bookingId: null });
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  async function fetchData() {
    setLoading(true);

    let query = supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter as Database['public']['Enums']['booking_status']);
    }

    const [bookingsRes, performersRes] = await Promise.all([
      query,
      supabase.from('performer_profiles').select('id, display_name'),
    ]);

    if (bookingsRes.error) {
      toast.error('Ошибка загрузки заказов');
    } else {
      const performerMap = new Map(performersRes.data?.map(p => [p.id, p.display_name]) || []);
      const enriched = bookingsRes.data?.map(b => ({
        ...b,
        performer_name: performerMap.get(b.performer_id) || 'Неизвестно',
      })) || [];
      setBookings(enriched);
    }

    if (performersRes.data) setPerformers(performersRes.data);
    setLoading(false);
  }

  // Filter and group bookings
  const filteredBookings = bookings.filter(b => {
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
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Фильтр по статусу" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все заказы</SelectItem>
              <SelectItem value="pending">Ожидающие</SelectItem>
              <SelectItem value="confirmed">Подтверждённые</SelectItem>
              <SelectItem value="completed">Завершённые</SelectItem>
              <SelectItem value="cancelled">Отменённые</SelectItem>
            </SelectContent>
          </Select>
        </div>

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
                        <p className="text-sm text-muted-foreground">
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

                        return (
                          <div
                            key={booking.id}
                            className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border"
                          >
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
                              <div className="flex items-center gap-2">
                                <Badge variant={status.variant}>{status.label}</Badge>
                                <Badge variant={payment.variant}>{payment.label}</Badge>
                                <span className="font-semibold">{booking.price_total.toLocaleString()} сом</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => openChat(booking.id)}>
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                            </div>
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