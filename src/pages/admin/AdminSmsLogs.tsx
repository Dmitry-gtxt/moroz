import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, Search, CheckCircle, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface SmsLog {
  id: string;
  created_at: string;
  phone: string;
  message: string;
  reference: string | null;
  request_payload: Record<string, unknown> | null;
  response_status: number | null;
  response_body: Record<string, unknown> | null;
  error_message: string | null;
  success: boolean;
}

const AdminSmsLogs = () => {
  const [logs, setLogs] = useState<SmsLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("sms_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error fetching SMS logs:", error);
    } else {
      setLogs((data as SmsLog[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(
    (log) =>
      log.phone.includes(searchTerm) ||
      log.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">СМС-лог</h1>
          <p className="text-muted-foreground">
            Журнал всех отправленных SMS с ответами сервера
          </p>
        </div>

        <div className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по номеру или тексту..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={fetchLogs} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Обновить
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Последние SMS ({filteredLogs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Загрузка...
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                SMS-логов пока нет
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="border rounded-lg p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {log.success ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        <div>
                          <div className="font-medium">{log.phone}</div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(log.created_at), "dd MMM yyyy, HH:mm:ss", {
                              locale: ru,
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={log.success ? "default" : "destructive"}>
                          {log.response_status ?? "N/A"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpand(log.id)}
                        >
                          {expandedId === log.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="text-sm bg-muted/50 rounded p-2">
                      {log.message.length > 100 && expandedId !== log.id
                        ? log.message.substring(0, 100) + "..."
                        : log.message}
                    </div>

                    {log.error_message && (
                      <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 rounded p-2">
                        Ошибка: {log.error_message}
                      </div>
                    )}

                    {expandedId === log.id && (
                      <div className="space-y-2 pt-2 border-t">
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1">
                            Reference:
                          </div>
                          <code className="text-xs bg-muted p-1 rounded">
                            {log.reference ?? "N/A"}
                          </code>
                        </div>

                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1">
                            Запрос (Request Payload):
                          </div>
                          <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                            {JSON.stringify(log.request_payload, null, 2)}
                          </pre>
                        </div>

                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1">
                            Ответ сервера (Response):
                          </div>
                          <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                            {JSON.stringify(log.response_body, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminSmsLogs;
