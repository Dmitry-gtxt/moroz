import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCw, Search, CheckCircle, XCircle, ChevronDown, ChevronUp, Send, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale/ru";
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
  
  // 2FA тест
  const [twoFaPhone, setTwoFaPhone] = useState("");
  const [twoFaTemplateId, setTwoFaTemplateId] = useState("78"); // По умолчанию шаблон регистрации
  const [twoFaSending, setTwoFaSending] = useState(false);
  const [twoFaResult, setTwoFaResult] = useState<{
    success: boolean;
    auth_id?: string;
    expires_at?: string;
    error?: string;
    details?: Record<string, unknown>;
  } | null>(null);
  
  // 2FA Verify test
  const [verifyAuthId, setVerifyAuthId] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{
    verified: boolean;
    error?: string;
    details?: Record<string, unknown>;
  } | null>(null);

  const smsInfo = useMemo(() => calculateSmsInfo(testMessage), [testMessage]);

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("sms_logs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching SMS logs:", error);
    } else {
      setLogs((data as SmsLog[]) ?? []);
    }
    setLoading(false);
  };

  // Определение типа SMS по template_id и контенту
  const getSmsTypeInfo = (log: SmsLog): { title: string; description: string; color: string } => {
    const payload = log.request_payload as Record<string, unknown> | null;
    const templateId = payload?.template_id?.toString() || '';
    const message = log.message.toLowerCase();
    
    // По template_id (2FA шаблоны)
    if (templateId === '78') {
      return {
        title: '📝 Регистрация',
        description: 'Код подтверждения при регистрации нового пользователя',
        color: 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300'
      };
    }
    if (templateId === '79') {
      return {
        title: '🔑 Восстановление пароля',
        description: 'Код для сброса пароля пользователя',
        color: 'bg-orange-500/10 border-orange-500/30 text-orange-700 dark:text-orange-300'
      };
    }
    if (templateId === '80') {
      return {
        title: '📥 Новая заявка исполнителю',
        description: 'Клиент создал бронирование → SMS исполнителю',
        color: 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-300'
      };
    }
    if (templateId === '81') {
      return {
        title: '❌ Отказ/Отмена клиенту',
        description: 'Исполнитель отклонил или отменил заказ → SMS клиенту',
        color: 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300'
      };
    }
    if (templateId === '82') {
      return {
        title: '🔄 Предложение слотов клиенту',
        description: 'Исполнитель предложил альтернативное время → SMS клиенту',
        color: 'bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-300'
      };
    }
    if (templateId === '83') {
      return {
        title: '✅ Подтверждение клиенту',
        description: 'Исполнитель подтвердил заказ → SMS клиенту',
        color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
      };
    }
    
    // По содержимому сообщения (для произвольных SMS)
    if (message.includes('код') || message.includes('code')) {
      return {
        title: '🔐 Код подтверждения',
        description: 'SMS с кодом верификации',
        color: 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300'
      };
    }
    if (message.includes('заказ') || message.includes('бронирован')) {
      return {
        title: '📋 Уведомление о заказе',
        description: 'Информация о бронировании',
        color: 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-300'
      };
    }
    if (message.includes('отмен') || message.includes('отказ')) {
      return {
        title: '🚫 Отмена',
        description: 'Уведомление об отмене',
        color: 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300'
      };
    }
    
    return {
      title: '📨 Произвольная SMS',
      description: 'Тестовое или ручное сообщение админа',
      color: 'bg-gray-500/10 border-gray-500/30 text-gray-700 dark:text-gray-300'
    };
  };

  // Получение контекста SMS (кому, от кого)
  const getSmsContext = (log: SmsLog): string => {
    const payload = log.request_payload as Record<string, unknown> | null;
    const templateId = payload?.template_id?.toString() || '';
    const phone = log.phone;
    
    // Форматирование телефона для отображения
    const formatPhone = (p: string) => {
      if (!p) return 'неизвестный';
      return p.startsWith('+') ? p : `+${p}`;
    };
    
    const formattedPhone = formatPhone(phone);
    
    switch (templateId) {
      case '78':
        return `Новый пользователь: ${formattedPhone}`;
      case '79':
        return `Восстановление для: ${formattedPhone}`;
      case '80':
        return `Исполнитель получил заявку: ${formattedPhone}`;
      case '81':
        return `Клиент уведомлён об отказе: ${formattedPhone}`;
      case '82':
        return `Клиент получил предложение: ${formattedPhone}`;
      case '83':
        return `Клиент получил подтверждение: ${formattedPhone}`;
      default:
        return `Получатель: ${formattedPhone}`;
    }
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

  // Доступные шаблоны 2FA (утверждённые)
  const templates2FA = [
    { id: "78", name: "1. При регистрации" },
    { id: "79", name: "2. При восстановлении пароля" },
    { id: "80", name: "3. При подаче заявки на услугу" },
    { id: "81", name: "5. При отказе исполнителем" },
    { id: "82", name: "6. При изменении слота" },
  ];

  const send2FaCode = async () => {
    if (!twoFaPhone) {
      toast.error("Введите номер телефона");
      return;
    }
    if (!twoFaTemplateId) {
      toast.error("Выберите шаблон");
      return;
    }
    
    setTwoFaSending(true);
    setTwoFaResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke("send-2fa-code", {
        body: { 
          phone: twoFaPhone, 
          template_id: twoFaTemplateId,
          code_digits: 6,
          code_lifetime: 300,
          code_max_tries: 3,
        },
      });
      
      if (error) throw error;
      
      setTwoFaResult(data);
      
      if (data?.success) {
        toast.success("OTP отправлен через Notificore 2FA!");
        fetchLogs();
      } else {
        toast.error(data?.error || "Ошибка отправки OTP");
      }
    } catch (err: unknown) {
      console.error("2FA error:", err);
      const errorMessage = err instanceof Error ? err.message : "Ошибка отправки";
      setTwoFaResult({ success: false, error: errorMessage });
      toast.error(errorMessage);
    } finally {
      setTwoFaSending(false);
    }
  };
  
  // Verify 2FA code
  const verify2FaCode = async () => {
    if (!verifyAuthId || !verifyCode) {
      toast.error("Введите Auth ID и код");
      return;
    }
    
    setVerifying(true);
    setVerifyResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke("verify-2fa-code", {
        body: { 
          auth_id: verifyAuthId, 
          access_code: verifyCode,
        },
      });
      
      if (error) throw error;
      
      setVerifyResult(data);
      
      if (data?.verified) {
        toast.success("Код верифицирован успешно!");
      } else {
        toast.error(data?.error || "Неверный код");
      }
    } catch (err: unknown) {
      console.error("Verify error:", err);
      const errorMessage = err instanceof Error ? err.message : "Ошибка проверки";
      setVerifyResult({ verified: false, error: errorMessage });
      toast.error(errorMessage);
    } finally {
      setVerifying(false);
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

        {/* 2FA Тест через Notificore API */}
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Тест 2FA (Notificore API)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Номер телефона</label>
                <Input
                  placeholder="+7(999)123-45-67"
                  value={twoFaPhone}
                  onChange={(e) => setTwoFaPhone(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Шаблон (template_id)</label>
                <select
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  value={twoFaTemplateId}
                  onChange={(e) => setTwoFaTemplateId(e.target.value)}
                >
                  {templates2FA.map((t) => (
                    <option key={t.id} value={t.id}>
                      ID {t.id}: {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex gap-4 items-center flex-wrap">
              <Button onClick={send2FaCode} disabled={twoFaSending || !twoFaPhone}>
                <ShieldCheck className="h-4 w-4 mr-2" />
                {twoFaSending ? "Отправка..." : "Отправить OTP"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Код генерируется Notificore, 6 цифр, срок жизни 5 мин, 3 попытки
              </p>
            </div>
            
            {twoFaResult && (
              <div className={`p-4 rounded-lg border ${
                twoFaResult.success 
                  ? "bg-green-500/10 border-green-500/30" 
                  : "bg-red-500/10 border-red-500/30"
              }`}>
                {twoFaResult.success ? (
                  <>
                    <div className="text-sm text-muted-foreground mb-1">Успешно! Auth ID:</div>
                    <code className="text-sm font-mono text-green-500 break-all">
                      {twoFaResult.auth_id}
                    </code>
                    {twoFaResult.expires_at && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Истекает: {twoFaResult.expires_at}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Код сгенерирован и отправлен Notificore. Проверьте SMS на телефоне.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-sm text-red-500 font-medium">Ошибка: {twoFaResult.error}</div>
                    {twoFaResult.details && (
                      <pre className="text-xs mt-2 bg-muted/50 p-2 rounded overflow-x-auto">
                        {JSON.stringify(twoFaResult.details, null, 2)}
                      </pre>
                    )}
                  </>
                )}
              </div>
            )}
            
            {/* Verify 2FA section */}
            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Проверка кода
              </h4>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Auth ID</label>
                  <Input
                    placeholder="auth_id из ответа выше"
                    value={verifyAuthId}
                    onChange={(e) => setVerifyAuthId(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Код из SMS</label>
                  <Input
                    placeholder="123456"
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={verify2FaCode} disabled={verifying || !verifyAuthId || !verifyCode} variant="secondary">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {verifying ? "Проверка..." : "Проверить код"}
                  </Button>
                </div>
              </div>
              
              {verifyResult && (
                <div className={`mt-3 p-3 rounded-lg border ${
                  verifyResult.verified 
                    ? "bg-green-500/10 border-green-500/30" 
                    : "bg-red-500/10 border-red-500/30"
                }`}>
                  {verifyResult.verified ? (
                    <div className="text-sm text-green-500 font-medium">✓ Код верифицирован успешно!</div>
                  ) : (
                    <div className="text-sm text-red-500">✗ Ошибка: {verifyResult.error}</div>
                  )}
                  {verifyResult.details && (
                    <pre className="text-xs mt-2 bg-muted/50 p-2 rounded overflow-x-auto">
                      {JSON.stringify(verifyResult.details, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Форма отправки тестовой SMS */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Произвольная SMS</CardTitle>
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
                {filteredLogs.map((log) => {
                  const typeInfo = getSmsTypeInfo(log);
                  const context = getSmsContext(log);
                  
                  return (
                    <div
                      key={log.id}
                      className={`border rounded-lg overflow-hidden ${typeInfo.color}`}
                    >
                      {/* Header с типом SMS */}
                      <div className="px-4 py-2 border-b border-current/10 flex items-center justify-between">
                        <div>
                          <span className="font-semibold">{typeInfo.title}</span>
                          <span className="text-xs ml-2 opacity-70">{typeInfo.description}</span>
                        </div>
                        <Badge variant={log.success ? "default" : "destructive"} className="text-xs">
                          {log.success ? 'Доставлено' : 'Ошибка'}
                        </Badge>
                      </div>
                      
                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {log.success ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                            <div>
                              <div className="font-medium text-foreground">{log.phone}</div>
                              <div className="text-xs text-muted-foreground">
                                {context}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(log.created_at), "dd MMM yyyy, HH:mm:ss", {
                                  locale: ru,
                                })}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              HTTP {log.response_status ?? "N/A"}
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

                        <div className="text-sm bg-background/50 rounded p-2 text-foreground">
                          {log.message.length > 150 && expandedId !== log.id
                            ? log.message.substring(0, 150) + "..."
                            : log.message}
                        </div>

                        {log.error_message && (
                          <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 rounded p-2">
                            Ошибка: {log.error_message}
                          </div>
                        )}

                        {expandedId === log.id && (
                          <div className="space-y-2 pt-2 border-t border-current/10">
                            <div>
                              <div className="text-xs font-medium text-muted-foreground mb-1">
                                Reference:
                              </div>
                              <code className="text-xs bg-background p-1 rounded text-foreground">
                                {log.reference ?? "N/A"}
                              </code>
                            </div>

                            <div>
                              <div className="text-xs font-medium text-muted-foreground mb-1">
                                Запрос (Request Payload):
                              </div>
                              <pre className="text-xs bg-background p-2 rounded overflow-x-auto text-foreground">
                                {JSON.stringify(log.request_payload, null, 2)}
                              </pre>
                            </div>

                            <div>
                              <div className="text-xs font-medium text-muted-foreground mb-1">
                                Ответ сервера (Response):
                              </div>
                              <pre className="text-xs bg-background p-2 rounded overflow-x-auto text-foreground">
                                {JSON.stringify(log.response_body, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminSmsLogs;
