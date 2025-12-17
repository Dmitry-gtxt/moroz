import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCw, Search, CheckCircle, XCircle, ChevronDown, ChevronUp, Send } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { toast } from "sonner";

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

// Проверка наличия кириллицы в тексте
const hasCyrillic = (text: string): boolean => /[а-яА-ЯёЁ]/.test(text);

// Подсчёт SMS
const calculateSmsInfo = (text: string) => {
  const charCount = text.length;
  const isCyrillic = hasCyrillic(text);
  
  // UCS-2 для кириллицы: 70 символов (одна SMS), 67 символов (многочастная)
  // GSM-7 для латиницы: 160 символов (одна SMS), 153 символа (многочастная)
  const singleLimit = isCyrillic ? 70 : 160;
  const multiPartLimit = isCyrillic ? 67 : 153;
  
  let smsCount = 0;
  if (charCount === 0) {
    smsCount = 0;
  } else if (charCount <= singleLimit) {
    smsCount = 1;
  } else {
    smsCount = Math.ceil(charCount / multiPartLimit);
  }
  
  return {
    charCount,
    smsCount,
    singleLimit,
    multiPartLimit,
    isCyrillic,
    encoding: isCyrillic ? "UCS-2 (кириллица)" : "GSM-7 (латиница)",
  };
};

const AdminSmsLogs = () => {
  const [logs, setLogs] = useState<SmsLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Тестовая SMS
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [sending, setSending] = useState(false);

  const smsInfo = useMemo(() => calculateSmsInfo(testMessage), [testMessage]);

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

  const sendTestSms = async () => {
    if (!testPhone || !testMessage) {
      toast.error("Введите номер телефона и текст сообщения");
      return;
    }
    
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-sms", {
        body: { phone: testPhone, message: testMessage },
      });
      
      if (error) throw error;
      
      if (data?.success) {
        toast.success("SMS отправлена успешно!");
        setTestMessage("");
        fetchLogs();
      } else {
        toast.error(data?.error || "Ошибка отправки SMS");
      }
    } catch (err: unknown) {
      console.error("SMS send error:", err);
      toast.error("Ошибка отправки SMS");
    } finally {
      setSending(false);
    }
  };

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

        {/* Форма отправки тестовой SMS */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Тестовая SMS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Номер телефона</label>
              <Input
                placeholder="+7(999)123-45-67"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1.5 block">Текст сообщения</label>
              <Textarea
                placeholder="Введите текст SMS..."
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                rows={4}
              />
              
              {/* Счётчики */}
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <span className="text-muted-foreground">
                  Символов: <span className="font-medium text-foreground">{smsInfo.charCount}</span>
                  {smsInfo.charCount > 0 && (
                    <span className="text-muted-foreground">
                      {" "}/ {smsInfo.smsCount === 1 ? smsInfo.singleLimit : `${smsInfo.multiPartLimit} × ${smsInfo.smsCount}`}
                    </span>
                  )}
                </span>
                <span className="text-muted-foreground">
                  Кол-во SMS: <span className="font-medium text-foreground">{smsInfo.smsCount || "—"}</span>
                </span>
                <span className="text-muted-foreground">
                  Кодировка: <span className="font-medium text-foreground">{smsInfo.encoding}</span>
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {smsInfo.isCyrillic 
                  ? `Кириллица: 1 SMS = до 70 символов, далее по 67 символов на каждую SMS`
                  : `Латиница: 1 SMS = до 160 символов, далее по 153 символа на каждую SMS`
                }
              </p>
            </div>
            
            <Button onClick={sendTestSms} disabled={sending || !testPhone || !testMessage}>
              <Send className="h-4 w-4 mr-2" />
              {sending ? "Отправка..." : "Отправить тест"}
            </Button>
          </CardContent>
        </Card>

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
