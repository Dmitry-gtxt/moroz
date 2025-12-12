import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, ShoppingCart, TrendingUp, AlertCircle, Copy, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'sonner';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

interface Partner {
  id: string;
  name: string;
  referral_code: string;
  is_active: boolean;
  created_at: string;
}

interface Registration {
  id: string;
  user_type: string;
  registered_at: string;
}

interface ReferralBooking {
  id: string;
  status: string;
  booking_amount: number;
  created_at: string;
}

export default function PartnerDashboard() {
  const { token } = useParams<{ token: string }>();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [bookings, setBookings] = useState<ReferralBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetchPartnerData();
  }, [token]);

  async function fetchPartnerData() {
    if (!token) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    // Fetch partner by access token
    const { data: partnerData, error: partnerError } = await supabase
      .from('partners')
      .select('*')
      .eq('access_token', token)
      .single();

    if (partnerError || !partnerData) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setPartner(partnerData);

    // Fetch registrations
    const { data: regsData } = await supabase
      .from('referral_registrations')
      .select('*')
      .eq('partner_id', partnerData.id)
      .order('registered_at', { ascending: false });

    setRegistrations(regsData || []);

    // Fetch bookings
    const { data: bookingsData } = await supabase
      .from('referral_bookings')
      .select('*')
      .eq('partner_id', partnerData.id)
      .order('created_at', { ascending: false });

    setBookings(bookingsData || []);
    setLoading(false);
  }

  function getReferralLink() {
    if (!partner) return '';
    return `${window.location.origin}/?ref=${partner.referral_code}`;
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success('Скопировано в буфер обмена');
  }

  // Calculate stats
  const performersCount = registrations.filter(r => r.user_type === 'performer').length;
  const customersCount = registrations.filter(r => r.user_type === 'customer').length;
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed_paid');
  const cancelledBookings = bookings.filter(b => b.status === 'cancelled_after_payment');
  const totalAmount = confirmedBookings.reduce((sum, b) => sum + (b.booking_amount || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-winter-950">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-magic-gold"></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (notFound || !partner) {
    return (
      <div className="min-h-screen flex flex-col bg-winter-950">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Страница не найдена</CardTitle>
              <CardDescription>
                Неверная или недействительная ссылка на кабинет партнёра.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  На главную
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-winter-950">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-3xl font-bold text-snow-100">{partner.name}</h1>
            {!partner.is_active && (
              <Badge variant="destructive">Неактивен</Badge>
            )}
          </div>
          <p className="text-snow-400">Кабинет партнёра</p>
        </div>

        {/* Referral link */}
        <Card className="mb-6 bg-winter-900/50 border-magic-gold/20">
          <CardHeader>
            <CardTitle className="text-snow-100">Ваша реферальная ссылка</CardTitle>
            <CardDescription className="text-snow-400">
              Делитесь этой ссылкой для привлечения клиентов и исполнителей
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-winter-800 px-4 py-2 rounded text-magic-gold text-sm overflow-x-auto">
                {getReferralLink()}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(getReferralLink())}
                className="border-magic-gold/30 text-magic-gold hover:bg-magic-gold/10"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-winter-900/50 border-snow-700/20">
            <CardHeader className="pb-2">
              <CardDescription className="text-snow-400 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Исполнители
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-snow-100">{performersCount}</div>
            </CardContent>
          </Card>
          <Card className="bg-winter-900/50 border-snow-700/20">
            <CardHeader className="pb-2">
              <CardDescription className="text-snow-400 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Клиенты
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-snow-100">{customersCount}</div>
            </CardContent>
          </Card>
          <Card className="bg-winter-900/50 border-snow-700/20">
            <CardHeader className="pb-2">
              <CardDescription className="text-snow-400 flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Оплаченные брони
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">{confirmedBookings.length}</div>
              {cancelledBookings.length > 0 && (
                <div className="text-sm text-red-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {cancelledBookings.length} отменено
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="bg-winter-900/50 border-snow-700/20">
            <CardHeader className="pb-2">
              <CardDescription className="text-snow-400 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Общая сумма
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-magic-gold">
                {totalAmount.toLocaleString('ru-RU')} ₽
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed tables */}
        <Tabs defaultValue="registrations" className="space-y-4">
          <TabsList className="bg-winter-900/50">
            <TabsTrigger value="registrations">Регистрации ({registrations.length})</TabsTrigger>
            <TabsTrigger value="bookings">Брони ({bookings.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="registrations">
            <Card className="bg-winter-900/50 border-snow-700/20">
              <CardHeader>
                <CardTitle className="text-snow-100">Зарегистрированные пользователи</CardTitle>
                <CardDescription className="text-snow-400">
                  Пользователи, которые зарегистрировались по вашей ссылке
                </CardDescription>
              </CardHeader>
              <CardContent>
                {registrations.length === 0 ? (
                  <div className="text-center py-8 text-snow-500">
                    Регистраций пока нет
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-snow-700/20">
                        <TableHead className="text-snow-400">Тип</TableHead>
                        <TableHead className="text-snow-400">Дата регистрации</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {registrations.map(reg => (
                        <TableRow key={reg.id} className="border-snow-700/20">
                          <TableCell>
                            <Badge variant={reg.user_type === 'performer' ? 'default' : 'secondary'}>
                              {reg.user_type === 'performer' ? 'Исполнитель' : 'Клиент'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-snow-300">
                            {format(new Date(reg.registered_at), 'd MMMM yyyy, HH:mm', { locale: ru })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings">
            <Card className="bg-winter-900/50 border-snow-700/20">
              <CardHeader>
                <CardTitle className="text-snow-100">Брони</CardTitle>
                <CardDescription className="text-snow-400">
                  Бронирования от клиентов, зарегистрированных по вашей ссылке
                </CardDescription>
              </CardHeader>
              <CardContent>
                {bookings.length === 0 ? (
                  <div className="text-center py-8 text-snow-500">
                    Бронирований пока нет
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-snow-700/20">
                        <TableHead className="text-snow-400">Статус</TableHead>
                        <TableHead className="text-snow-400">Сумма</TableHead>
                        <TableHead className="text-snow-400">Дата</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings.map(booking => (
                        <TableRow key={booking.id} className="border-snow-700/20">
                          <TableCell>
                            <Badge variant={booking.status === 'confirmed_paid' ? 'default' : 'destructive'}>
                              {booking.status === 'confirmed_paid' ? 'Оплачено' : 'Отменено'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-snow-300 font-medium">
                            {booking.booking_amount.toLocaleString('ru-RU')} ₽
                          </TableCell>
                          <TableCell className="text-snow-300">
                            {format(new Date(booking.created_at), 'd MMMM yyyy, HH:mm', { locale: ru })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
