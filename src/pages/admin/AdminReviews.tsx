import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff, Star, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Database } from '@/integrations/supabase/types';

type Review = Database['public']['Tables']['reviews']['Row'];

interface ReviewWithDetails extends Review {
  performer_profiles?: { display_name: string } | null;
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<ReviewWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'visible' | 'hidden'>('all');

  async function fetchReviews() {
    setLoading(true);
    const { data, error } = await supabase
      .from('reviews')
      .select('*, performer_profiles(display_name)')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Ошибка загрузки отзывов');
      console.error(error);
    } else {
      setReviews((data as ReviewWithDetails[]) ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchReviews();
  }, []);

  async function toggleVisibility(id: string, currentVisibility: boolean) {
    const { error } = await supabase
      .from('reviews')
      .update({ is_visible: !currentVisibility })
      .eq('id', id);

    if (error) {
      toast.error('Ошибка обновления');
    } else {
      toast.success(currentVisibility ? 'Отзыв скрыт' : 'Отзыв опубликован');
      setReviews(reviews.map(r => r.id === id ? { ...r, is_visible: !currentVisibility } : r));
    }
  }

  const filteredReviews = reviews.filter(r => {
    if (filter === 'visible') return r.is_visible;
    if (filter === 'hidden') return !r.is_visible;
    return true;
  });

  const stats = {
    total: reviews.length,
    visible: reviews.filter(r => r.is_visible).length,
    hidden: reviews.filter(r => !r.is_visible).length,
    avgRating: reviews.length > 0 
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '0',
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Отзывы</h1>
          <p className="text-muted-foreground mt-1">Модерация отзывов клиентов</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-sm text-muted-foreground">Всего отзывов</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{stats.visible}</div>
              <p className="text-sm text-muted-foreground">Опубликовано</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">{stats.hidden}</div>
              <p className="text-sm text-muted-foreground">Скрыто</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold flex items-center gap-1">
                {stats.avgRating} <Star className="h-5 w-5 text-accent fill-accent" />
              </div>
              <p className="text-sm text-muted-foreground">Средняя оценка</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <Button 
            variant={filter === 'all' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilter('all')}
          >
            Все
          </Button>
          <Button 
            variant={filter === 'visible' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilter('visible')}
          >
            Опубликованные
          </Button>
          <Button 
            variant={filter === 'hidden' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilter('hidden')}
          >
            Скрытые
          </Button>
        </div>

        {/* Reviews Table */}
        <Card>
          <CardHeader>
            <CardTitle>Список отзывов</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredReviews.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Нет отзывов</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Исполнитель</TableHead>
                    <TableHead>Оценка</TableHead>
                    <TableHead className="max-w-xs">Текст</TableHead>
                    <TableHead>Дата</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReviews.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell className="font-medium">
                        {review.performer_profiles?.display_name ?? 'Неизвестно'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-4 w-4 ${i < review.rating ? 'text-accent fill-accent' : 'text-muted'}`}
                            />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {review.text || <span className="text-muted-foreground italic">Без текста</span>}
                      </TableCell>
                      <TableCell>
                        {format(new Date(review.created_at), 'd MMM yyyy', { locale: ru })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={review.is_visible ? 'default' : 'secondary'}>
                          {review.is_visible ? 'Опубликован' : 'Скрыт'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleVisibility(review.id, review.is_visible)}
                        >
                          {review.is_visible ? (
                            <>
                              <EyeOff className="h-4 w-4 mr-1" />
                              Скрыть
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-1" />
                              Показать
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
