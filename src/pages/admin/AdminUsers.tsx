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
import { ru } from 'date-fns/locale/ru';

interface UserData {
  id: string;
  email: string | null;
  phone: string | null;
  full_name: string;
  created_at: string;
  last_sign_in_at: string | null;
  roles: string[];
}

const getRoleLabel = (role: string) => {
  switch (role) {
    case 'admin': return 'Админ';
    case 'performer': return 'Исполнитель';
    case 'customer': return 'Клиент';
    default: return role;
  }
};

const getRoleBadgeClass = (role: string) => {
  switch (role) {
    case 'admin': return 'bg-primary/20 text-primary';
    case 'performer': return 'bg-accent/20 text-accent';
    default: return 'bg-muted text-muted-foreground';
  }
};

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
      const { data: { session } } = await supabase.auth.getSession();
      const authHeaders = session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : undefined;

      // Fetch users from edge function
      const { data: usersData, error: usersError } = await supabase.functions.invoke('list-users', {
        headers: authHeaders,
      });

      if (usersError) {
        // Surface the real backend response body (super helpful for 401/403/500)
        if ((usersError as any)?.name === 'FunctionsHttpError' && (usersError as any)?.context) {
          const res = (usersError as any).context as Response;
          const status = res?.status;
          const raw = await res.text().catch(() => '');
          throw new Error(`list-users ${status}: ${raw || usersError.message}`);
        }
        throw usersError;
      }

      if (!usersData?.success) throw new Error(usersData?.error || 'Неизвестная ошибка');

      // Fetch test performers count
      const { data: performersData, error: performersError } = await supabase
        .from('performer_profiles')
        .select('id, is_active')
        .like('display_name', '[TEST]%');

      if (performersError) throw performersError;

      setUsers(usersData.users || []);
      setTestPerformersCount(performersData?.length || 0);
      setTestPerformersActive(performersData?.some(p => p.is_active) || false);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error(`Ошибка загрузки: ${error.message}`);
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
        setUsers(prev => prev.filter(u => u.id !== userId));
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
      (user.phone && user.phone.includes(searchTerm)) ||
      (user.email && user.email.toLowerCase().includes(searchLower))
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
                  placeholder="Поиск..."
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Имя</TableHead>
                      <TableHead>Роль</TableHead>
                      <TableHead>Телефон</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Дата регистрации</TableHead>
                      <TableHead className="w-20">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.full_name}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.roles.map((role) => (
                              <span
                                key={role}
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeClass(role)}`}
                              >
                                {getRoleLabel(role)}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{user.phone || '—'}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{user.email || '—'}</TableCell>
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
                                disabled={deletingUserId === user.id}
                              >
                                {deletingUserId === user.id ? (
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
                                  onClick={() => handleDeleteUser(user.id)}
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
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
