import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, Search, Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface UserData {
  user_id: string;
  full_name: string;
  phone: string | null;
  created_at: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [testPerformersCount, setTestPerformersCount] = useState(0);
  const [testPerformersActive, setTestPerformersActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [togglingTestPerformers, setTogglingTestPerformers] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, performersRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('user_id, full_name, phone, created_at')
          .order('created_at', { ascending: false }),
        supabase
          .from('performer_profiles')
          .select('id, is_active')
          .like('display_name', '[TEST]%')
      ]);

      if (usersRes.error) throw usersRes.error;
      if (performersRes.error) throw performersRes.error;
      
      setUsers(usersRes.data || []);
      setTestPerformersCount(performersRes.data?.length || 0);
      // Check if any test performers are active
      setTestPerformersActive(performersRes.data?.some(p => p.is_active) || false);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteUser = async (userId: string) => {
    setDeletingUserId(userId);
    try {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId }
      });

      if (error) throw error;

      if (data.success) {
        toast.success('Пользователь полностью удалён');
        setUsers(prev => prev.filter(u => u.user_id !== userId));
      } else {
        throw new Error(data.error || 'Неизвестная ошибка');
      }
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(`Ошибка удаления: ${error.message}`);
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleToggleTestPerformers = async () => {
    setTogglingTestPerformers(true);
    try {
      const newActiveState = !testPerformersActive;
      
      // Get all test performer IDs
      const { data: testPerformers, error: fetchError } = await supabase
        .from('performer_profiles')
        .select('id')
        .like('display_name', '[TEST]%');

      if (fetchError) throw fetchError;
      
      if (!testPerformers || testPerformers.length === 0) {
        toast.info('Нет тестовых исполнителей');
        return;
      }

      const ids = testPerformers.map(p => p.id);
      
      const { error } = await supabase
        .from('performer_profiles')
        .update({ is_active: newActiveState })
        .in('id', ids);

      if (error) throw error;

      setTestPerformersActive(newActiveState);
      toast.success(newActiveState ? 'Тестовые исполнители опубликованы' : 'Тестовые исполнители сняты с публикации');
    } catch (error: any) {
      console.error('Error toggling test performers:', error);
      toast.error(`Ошибка: ${error.message}`);
    } finally {
      setTogglingTestPerformers(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.full_name.toLowerCase().includes(searchLower) ||
      (user.phone && user.phone.includes(searchTerm))
    );
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Все пользователи</h1>
            <p className="text-muted-foreground">Управление пользователями системы</p>
          </div>
          {testPerformersCount > 0 && (
            <Button
              variant={testPerformersActive ? "default" : "outline"}
              onClick={handleToggleTestPerformers}
              disabled={togglingTestPerformers}
              className="gap-2"
            >
              {togglingTestPerformers ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : testPerformersActive ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              {testPerformersActive ? 'Скрыть тестовых' : 'Показать тестовых'} ({testPerformersCount})
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between flex-wrap gap-4">
              <span>Список пользователей ({filteredUsers.length})</span>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск по имени или телефону..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'Пользователи не найдены' : 'Нет пользователей'}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Имя</TableHead>
                    <TableHead>Телефон</TableHead>
                    <TableHead>Дата регистрации</TableHead>
                    <TableHead className="w-20">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell className="font-medium">{user.full_name}</TableCell>
                      <TableCell>{user.phone || '—'}</TableCell>
                      <TableCell>
                        {format(new Date(user.created_at), 'dd MMM yyyy, HH:mm', { locale: ru })}
                      </TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              disabled={deletingUserId === user.user_id}
                            >
                              {deletingUserId === user.user_id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Удалить пользователя?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Вы уверены, что хотите полностью удалить пользователя <strong>{user.full_name}</strong>?
                                <br /><br />
                                Это действие необратимо. Будут удалены:
                                <ul className="list-disc pl-4 mt-2 space-y-1">
                                  <li>Аккаунт пользователя</li>
                                  <li>Профиль и все данные</li>
                                  <li>Бронирования</li>
                                  <li>Сообщения и отзывы</li>
                                  <li>Профиль исполнителя (если есть)</li>
                                </ul>
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Отмена</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteUser(user.user_id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Удалить навсегда
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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
