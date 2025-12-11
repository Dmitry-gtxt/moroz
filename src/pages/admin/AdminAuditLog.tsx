import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'sonner';
import { Loader2, Search, Eye, Download, RefreshCw, Shield } from 'lucide-react';

import type { Database } from '@/integrations/supabase/types';

type AuditLog = Database['public']['Tables']['audit_logs']['Row'];

const actionLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  view_customer_data: { label: 'Просмотр данных клиента', variant: 'default' },
  view_booking_details: { label: 'Просмотр заказа', variant: 'secondary' },
  export_data: { label: 'Экспорт данных', variant: 'destructive' },
  update_booking: { label: 'Изменение заказа', variant: 'outline' },
  view_performer_profile: { label: 'Просмотр профиля', variant: 'secondary' },
};

const entityTypeLabels: Record<string, string> = {
  booking: 'Заказ',
  customer: 'Клиент',
  performer: 'Исполнитель',
  user: 'Пользователь',
};

export default function AdminAuditLog() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [userEmails, setUserEmails] = useState<Record<string, string>>({});

  async function fetchLogs() {
    setLoading(true);
    
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);

    if (actionFilter !== 'all') {
      query = query.eq('action', actionFilter);
    }

    if (entityFilter !== 'all') {
      query = query.eq('entity_type', entityFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching audit logs:', error);
      toast.error('Ошибка загрузки логов');
      setLoading(false);
      return;
    }

    setLogs(data || []);

    // Fetch user emails
    const userIds = [...new Set((data || []).map(log => log.user_id))];
    if (userIds.length > 0) {
      const { data: emailsData } = await supabase.functions.invoke('get-user-emails', {
        body: { userIds }
      });
      if (emailsData?.emails) {
        setUserEmails(emailsData.emails);
      }
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, entityFilter]);

  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const email = userEmails[log.user_id]?.toLowerCase() || '';
    return (
      email.includes(query) ||
      log.action.toLowerCase().includes(query) ||
      log.entity_type.toLowerCase().includes(query) ||
      (log.entity_id && log.entity_id.toLowerCase().includes(query))
    );
  });

  const exportLogs = () => {
    const csv = [
      ['ID', 'User Email', 'Action', 'Entity Type', 'Entity ID', 'Details', 'IP', 'User Agent', 'Timestamp'].join(','),
      ...filteredLogs.map(log => [
        log.id,
        userEmails[log.user_id] || log.user_id,
        log.action,
        log.entity_type,
        log.entity_id || '',
        log.details ? JSON.stringify(log.details) : '',
        log.ip_address || '',
        log.user_agent || '',
        log.created_at,
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Лог экспортирован');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              Аудит-лог
            </h1>
            <p className="text-muted-foreground mt-1">
              Отслеживание доступа к конфиденциальным данным
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchLogs} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Обновить
            </Button>
            <Button variant="outline" onClick={exportLogs} disabled={loading || logs.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Экспорт CSV
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Поиск по email, действию..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Все действия" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все действия</SelectItem>
                  {Object.entries(actionLabels).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Все объекты" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все объекты</SelectItem>
                  {Object.entries(entityTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Записи
              {filteredLogs.length > 0 && (
                <Badge variant="secondary">{filteredLogs.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Eye className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Нет записей в логе</p>
                <p className="text-sm mt-1">Записи появятся при просмотре конфиденциальных данных</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Время</TableHead>
                      <TableHead>Пользователь</TableHead>
                      <TableHead>Действие</TableHead>
                      <TableHead>Объект</TableHead>
                      <TableHead>Детали</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => {
                      const action = actionLabels[log.action] || { label: log.action, variant: 'outline' as const };
                      return (
                        <TableRow key={log.id}>
                          <TableCell className="whitespace-nowrap">
                            <div className="text-sm">
                              {format(new Date(log.created_at), 'd MMM yyyy', { locale: ru })}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(log.created_at), 'HH:mm:ss')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">
                              {userEmails[log.user_id] || 'Загрузка...'}
                            </div>
                            {log.ip_address && (
                              <div className="text-xs text-muted-foreground">
                                IP: {log.ip_address}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={action.variant}>{action.label}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {entityTypeLabels[log.entity_type] || log.entity_type}
                            </div>
                            {log.entity_id && (
                              <div className="text-xs text-muted-foreground font-mono">
                                {log.entity_id.slice(0, 8)}...
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="max-w-xs">
                            {log.details && (
                              <pre className="text-xs text-muted-foreground truncate">
                                {JSON.stringify(log.details)}
                              </pre>
                            )}
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
    </AdminLayout>
  );
}
