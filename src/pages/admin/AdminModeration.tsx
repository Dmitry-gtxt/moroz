import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Check, X, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Database } from '@/integrations/supabase/types';

type VerificationDocument = Database['public']['Tables']['verification_documents']['Row'];
type PerformerProfile = Database['public']['Tables']['performer_profiles']['Row'];

interface DocumentWithPerformer extends VerificationDocument {
  performer_profiles: Pick<PerformerProfile, 'display_name'> | null;
}

const documentTypeLabels: Record<string, string> = {
  passport: 'Паспорт',
  certificate: 'Сертификат',
  portfolio: 'Портфолио',
  medical: 'Мед. справка',
};

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'На проверке', variant: 'outline' },
  approved: { label: 'Одобрен', variant: 'default' },
  rejected: { label: 'Отклонён', variant: 'destructive' },
};

export default function AdminModeration() {
  const [documents, setDocuments] = useState<DocumentWithPerformer[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchDocuments() {
    setLoading(true);
    const { data, error } = await supabase
      .from('verification_documents')
      .select('*, performer_profiles(display_name)')
      .order('uploaded_at', { ascending: false });

    if (error) {
      toast.error('Ошибка загрузки документов');
      console.error(error);
    } else {
      setDocuments((data as DocumentWithPerformer[]) ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchDocuments();
  }, []);

  async function updateDocumentStatus(id: string, performerId: string, status: 'approved' | 'rejected') {
    const { error: docError } = await supabase
      .from('verification_documents')
      .update({ 
        status, 
        reviewed_at: new Date().toISOString() 
      })
      .eq('id', id);

    if (docError) {
      toast.error('Ошибка обновления статуса');
      return;
    }

    // If approved, update performer verification status
    if (status === 'approved') {
      await supabase
        .from('performer_profiles')
        .update({ verification_status: 'verified' })
        .eq('id', performerId);
    }

    toast.success(status === 'approved' ? 'Документ одобрен' : 'Документ отклонён');
    fetchDocuments();
  }

  const pendingDocs = documents.filter(d => d.status === 'pending');
  const reviewedDocs = documents.filter(d => d.status !== 'pending');

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Модерация</h1>
          <p className="text-muted-foreground mt-1">Проверка документов и анкет исполнителей</p>
        </div>

        {/* Pending Documents */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              На проверке
              {pendingDocs.length > 0 && (
                <Badge variant="secondary">{pendingDocs.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : pendingDocs.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Нет документов на проверке</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Исполнитель</TableHead>
                    <TableHead>Тип документа</TableHead>
                    <TableHead>Дата загрузки</TableHead>
                    <TableHead>Документ</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingDocs.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">
                        {doc.performer_profiles?.display_name ?? 'Неизвестно'}
                      </TableCell>
                      <TableCell>{documentTypeLabels[doc.document_type] ?? doc.document_type}</TableCell>
                      <TableCell>
                        {format(new Date(doc.uploaded_at), 'd MMM yyyy, HH:mm', { locale: ru })}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <a href={doc.document_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Открыть
                          </a>
                        </Button>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => updateDocumentStatus(doc.id, doc.performer_id, 'approved')}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Одобрить
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => updateDocumentStatus(doc.id, doc.performer_id, 'rejected')}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Отклонить
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Reviewed Documents */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>История проверок</CardTitle>
          </CardHeader>
          <CardContent>
            {reviewedDocs.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">История пуста</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Исполнитель</TableHead>
                    <TableHead>Тип документа</TableHead>
                    <TableHead>Дата проверки</TableHead>
                    <TableHead>Статус</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviewedDocs.map((doc) => {
                    const status = statusLabels[doc.status] ?? statusLabels.pending;
                    return (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">
                          {doc.performer_profiles?.display_name ?? 'Неизвестно'}
                        </TableCell>
                        <TableCell>{documentTypeLabels[doc.document_type] ?? doc.document_type}</TableCell>
                        <TableCell>
                          {doc.reviewed_at 
                            ? format(new Date(doc.reviewed_at), 'd MMM yyyy, HH:mm', { locale: ru })
                            : '—'
                          }
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
