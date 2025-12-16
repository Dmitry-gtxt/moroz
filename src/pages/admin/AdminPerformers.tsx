import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { SupportChatDialog } from '@/components/admin/SupportChatDialog';
import { RatingAdjustDialog } from '@/components/admin/RatingAdjustDialog';
import { AdminReviewDialog } from '@/components/admin/AdminReviewDialog';
import { Eye, Star, MessageSquare, ArrowUpDown, ArrowUp, ArrowDown, MessageCirclePlus, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { getCustomerPrice, getPrepaymentAmount, getCommissionRate } from '@/lib/pricing';
import type { Database } from '@/integrations/supabase/types';

type PerformerProfileDB = Database['public']['Tables']['performer_profiles']['Row'];
type PerformerProfile = PerformerProfileDB & {
  user_email?: string;
  user_phone?: string;
};

type SortField = 'display_name' | 'performer_types' | 'rating_average' | 'base_price' | 'verification_status' | 'is_active' | 'created_at';
type SortDirection = 'asc' | 'desc';

const performerTypeLabels: Record<string, string> = {
  ded_moroz: 'Дед Мороз',
  snegurochka: 'Снегурочка',
  duo: 'Дуэт',
  animator: 'Аниматор',
};

const verificationLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  unverified: { label: 'Не верифицирован', variant: 'secondary' },
  pending: { label: 'На проверке', variant: 'outline' },
  verified: { label: 'Верифицирован', variant: 'default' },
  rejected: { label: 'Отклонён', variant: 'destructive' },
};

export default function AdminPerformers() {
  const [performers, setPerformers] = useState<PerformerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [commissionRate, setCommissionRateState] = useState<number | null>(null);
  
  // Sorting state
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Filter state
  const [filterType, setFilterType] = useState<string>('all');
  const [filterRating, setFilterRating] = useState<string>('all');
  const [filterVerification, setFilterVerification] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [chatDialog, setChatDialog] = useState<{ open: boolean; performerId: string; performerName: string }>({
    open: false,
    performerId: '',
    performerName: '',
  });
  const [ratingDialog, setRatingDialog] = useState<{ 
    open: boolean; 
    performerId: string; 
    performerName: string;
    currentRating: number;
  }>({
    open: false,
    performerId: '',
    performerName: '',
    currentRating: 0,
  });
  const [reviewDialog, setReviewDialog] = useState<{
    open: boolean;
    performerId: string;
    performerName: string;
  }>({
    open: false,
    performerId: '',
    performerName: '',
  });

  async function fetchPerformers() {
    setLoading(true);
    
    const [performersRes, commissionRes] = await Promise.all([
      supabase.from('performer_profiles').select('*').order('created_at', { ascending: false }),
      getCommissionRate(),
    ]);

    if (performersRes.error) {
      toast.error('Ошибка загрузки исполнителей');
      console.error(performersRes.error);
      setLoading(false);
      return;
    }
    
    const performersData = performersRes.data ?? [];
    
    const userIds = performersData
      .map(p => p.user_id)
      .filter((id): id is string => !!id);
    
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, phone')
      .in('user_id', userIds);
    
    const phoneMap = new Map(profiles?.map(p => [p.user_id, p.phone]) ?? []);
    
    let emailMap = new Map<string, string>();
    if (userIds.length > 0) {
      try {
        const { data: emailsData } = await supabase.functions.invoke('get-user-emails', {
          body: { userIds },
        });
        if (emailsData?.emails) {
          emailMap = new Map(Object.entries(emailsData.emails));
        }
      } catch (err) {
        console.error('Failed to fetch emails:', err);
      }
    }
    
    const performersWithContacts: PerformerProfile[] = performersData.map(performer => ({
      ...performer,
      user_email: performer.user_id ? (emailMap.get(performer.user_id) || '') : '',
      user_phone: performer.user_id ? (phoneMap.get(performer.user_id) || '') : '',
    }));
    
    setPerformers(performersWithContacts);
    setCommissionRateState(commissionRes);
    setLoading(false);
  }

  useEffect(() => {
    fetchPerformers();
  }, []);

  // Filtered and sorted performers
  const filteredPerformers = useMemo(() => {
    let result = [...performers];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.display_name.toLowerCase().includes(query) ||
        p.user_email?.toLowerCase().includes(query) ||
        p.user_phone?.toLowerCase().includes(query)
      );
    }
    
    // Type filter
    if (filterType !== 'all') {
      result = result.filter(p => p.performer_types?.includes(filterType as any));
    }
    
    // Rating filter
    if (filterRating !== 'all') {
      const rating = parseFloat(filterRating);
      result = result.filter(p => Number(p.rating_average) >= rating);
    }
    
    // Verification filter
    if (filterVerification !== 'all') {
      result = result.filter(p => p.verification_status === filterVerification);
    }
    
    // Active filter
    if (filterActive !== 'all') {
      const isActive = filterActive === 'true';
      result = result.filter(p => p.is_active === isActive);
    }
    
    // Sorting
    result.sort((a, b) => {
      let aVal: any;
      let bVal: any;
      
      switch (sortField) {
        case 'display_name':
          aVal = a.display_name.toLowerCase();
          bVal = b.display_name.toLowerCase();
          break;
        case 'performer_types':
          aVal = a.performer_types?.join(',') || '';
          bVal = b.performer_types?.join(',') || '';
          break;
        case 'rating_average':
          aVal = Number(a.rating_average) || 0;
          bVal = Number(b.rating_average) || 0;
          break;
        case 'base_price':
          aVal = a.base_price || 0;
          bVal = b.base_price || 0;
          break;
        case 'verification_status':
          aVal = a.verification_status;
          bVal = b.verification_status;
          break;
        case 'is_active':
          aVal = a.is_active ? 1 : 0;
          bVal = b.is_active ? 1 : 0;
          break;
        case 'created_at':
          aVal = new Date(a.created_at).getTime();
          bVal = new Date(b.created_at).getTime();
          break;
        default:
          return 0;
      }
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    return result;
  }, [performers, searchQuery, filterType, filterRating, filterVerification, filterActive, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4 ml-1" />
      : <ArrowDown className="h-4 w-4 ml-1" />;
  };

  async function toggleActive(id: string, currentStatus: boolean) {
    const { error } = await supabase
      .from('performer_profiles')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (error) {
      toast.error('Ошибка обновления статуса');
    } else {
      toast.success(currentStatus ? 'Исполнитель деактивирован' : 'Исполнитель активирован');
      fetchPerformers();
    }
  }

  async function updateVerificationStatus(id: string, newStatus: string) {
    const { error } = await supabase
      .from('performer_profiles')
      .update({ verification_status: newStatus as Database['public']['Enums']['verification_status'] })
      .eq('id', id);

    if (error) {
      toast.error('Ошибка обновления статуса');
    } else {
      toast.success('Статус верификации обновлён');
      fetchPerformers();
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Исполнители</h1>
          <p className="text-muted-foreground mt-1">Управление профилями исполнителей</p>
        </div>

        {/* Filters */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Фильтры
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <Input
                  placeholder="Поиск по имени, email, телефону..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Тип" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все типы</SelectItem>
                  <SelectItem value="ded_moroz">Дед Мороз</SelectItem>
                  <SelectItem value="snegurochka">Снегурочка</SelectItem>
                  <SelectItem value="duo">Дуэт</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterRating} onValueChange={setFilterRating}>
                <SelectTrigger>
                  <SelectValue placeholder="Рейтинг" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Любой рейтинг</SelectItem>
                  <SelectItem value="4.5">4.5+</SelectItem>
                  <SelectItem value="4.0">4.0+</SelectItem>
                  <SelectItem value="3.5">3.5+</SelectItem>
                  <SelectItem value="3.0">3.0+</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterVerification} onValueChange={setFilterVerification}>
                <SelectTrigger>
                  <SelectValue placeholder="Верификация" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="verified">Верифицирован</SelectItem>
                  <SelectItem value="pending">На проверке</SelectItem>
                  <SelectItem value="unverified">Не верифицирован</SelectItem>
                  <SelectItem value="rejected">Отклонён</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterActive} onValueChange={setFilterActive}>
                <SelectTrigger>
                  <SelectValue placeholder="Активность" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все</SelectItem>
                  <SelectItem value="true">Активные</SelectItem>
                  <SelectItem value="false">Неактивные</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Все исполнители ({filteredPerformers.length} из {performers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : performers.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Нет зарегистрированных исполнителей</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <button 
                          onClick={() => handleSort('display_name')} 
                          className="flex items-center hover:text-foreground transition-colors"
                        >
                          Имя <SortIcon field="display_name" />
                        </button>
                      </TableHead>
                      <TableHead>Контакты</TableHead>
                      <TableHead>
                        <button 
                          onClick={() => handleSort('performer_types')} 
                          className="flex items-center hover:text-foreground transition-colors"
                        >
                          Тип <SortIcon field="performer_types" />
                        </button>
                      </TableHead>
                      <TableHead>
                        <button 
                          onClick={() => handleSort('rating_average')} 
                          className="flex items-center hover:text-foreground transition-colors"
                        >
                          Рейтинг <SortIcon field="rating_average" />
                        </button>
                      </TableHead>
                      <TableHead>
                        <button 
                          onClick={() => handleSort('base_price')} 
                          className="flex items-center hover:text-foreground transition-colors"
                        >
                          Цена <SortIcon field="base_price" />
                        </button>
                      </TableHead>
                      <TableHead>
                        <button 
                          onClick={() => handleSort('verification_status')} 
                          className="flex items-center hover:text-foreground transition-colors"
                        >
                          Верификация <SortIcon field="verification_status" />
                        </button>
                      </TableHead>
                      <TableHead>
                        <button 
                          onClick={() => handleSort('is_active')} 
                          className="flex items-center hover:text-foreground transition-colors"
                        >
                          Активен <SortIcon field="is_active" />
                        </button>
                      </TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPerformers.map((performer) => {
                      const verification = verificationLabels[performer.verification_status] ?? verificationLabels.unverified;
                      const performerPrice = performer.base_price;
                      const customerPrice = getCustomerPrice(performerPrice, commissionRate);
                      const prepayment = getPrepaymentAmount(performerPrice, commissionRate);
                      
                      return (
                        <TableRow key={performer.id}>
                          <TableCell className="font-medium">{performer.display_name}</TableCell>
                          <TableCell>
                            <div className="space-y-1 text-sm">
                              {performer.user_email && (
                                <div className="text-muted-foreground">{performer.user_email}</div>
                              )}
                              {performer.user_phone && (
                                <div className="font-medium">{performer.user_phone}</div>
                              )}
                              {!performer.user_email && !performer.user_phone && '—'}
                            </div>
                          </TableCell>
                          <TableCell>
                            {performer.performer_types?.map((type) => performerTypeLabels[type] ?? type).join(', ') || '—'}
                          </TableCell>
                          <TableCell>
                            <button
                              onClick={() => setRatingDialog({
                                open: true,
                                performerId: performer.id,
                                performerName: performer.display_name,
                                currentRating: Number(performer.rating_average) || 0,
                              })}
                              className="flex items-center gap-1 hover:bg-muted p-1 rounded transition-colors"
                              title="Изменить рейтинг"
                            >
                              <Star className="h-4 w-4 fill-accent text-accent" />
                              <span>{Number(performer.rating_average).toFixed(1)}</span>
                              <span className="text-muted-foreground">({performer.rating_count})</span>
                            </button>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-0.5">
                              <div className="font-semibold text-accent">
                                {customerPrice.toLocaleString()} ₽
                              </div>
                              <div className="text-xs text-muted-foreground">
                                исп: {performerPrice.toLocaleString()} + бронь: {prepayment.toLocaleString()}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={performer.verification_status}
                              onValueChange={(value) => updateVerificationStatus(performer.id, value)}
                            >
                              <SelectTrigger className="w-40">
                                <Badge variant={verification.variant}>{verification.label}</Badge>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unverified">Не верифицирован</SelectItem>
                                <SelectItem value="pending">На проверке</SelectItem>
                                <SelectItem value="verified">Верифицирован</SelectItem>
                                <SelectItem value="rejected">Отклонён</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={performer.is_active}
                              onCheckedChange={() => toggleActive(performer.id, performer.is_active)}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setReviewDialog({
                                  open: true,
                                  performerId: performer.id,
                                  performerName: performer.display_name,
                                })}
                                title="Написать отзыв"
                              >
                                <MessageCirclePlus className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setChatDialog({
                                  open: true,
                                  performerId: performer.id,
                                  performerName: performer.display_name,
                                })}
                                title="Чат с исполнителем"
                              >
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" asChild title="Открыть профиль">
                                <Link to={`/admin/performer/${performer.id}`} target="_blank">
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <SupportChatDialog
        open={chatDialog.open}
        onOpenChange={(open) => setChatDialog({ ...chatDialog, open })}
        performerId={chatDialog.performerId}
        performerName={chatDialog.performerName}
      />

      <RatingAdjustDialog
        open={ratingDialog.open}
        onOpenChange={(open) => setRatingDialog({ ...ratingDialog, open })}
        performerId={ratingDialog.performerId}
        performerName={ratingDialog.performerName}
        currentRating={ratingDialog.currentRating}
        onRatingUpdated={fetchPerformers}
      />

      <AdminReviewDialog
        open={reviewDialog.open}
        onOpenChange={(open) => setReviewDialog({ ...reviewDialog, open })}
        performerId={reviewDialog.performerId}
        performerName={reviewDialog.performerName}
        onReviewAdded={fetchPerformers}
      />
    </AdminLayout>
  );
}
