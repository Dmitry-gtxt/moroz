import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, CheckCircle2, XCircle, ExternalLink, Copy, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
interface TestResult {
  success: boolean;
  response?: any;
  error?: string;
  duration?: number;
}

export default function AdminVtbTest() {
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, TestResult>>({});
  
  // Test form data
  const [amount, setAmount] = useState('10000');
  const [orderNumber, setOrderNumber] = useState(`TEST_${Date.now()}`);
  
  // Credentials - user can enter their own
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');

  // Sandbox URL
  const SANDBOX_URL = 'https://vtb.rbsuat.com/payment/rest';

  const testCases = [
    {
      id: 'register',
      name: 'Тест 1: Регистрация заказа (register.do)',
      description: 'Создание нового заказа в системе ВТБ',
      endpoint: '/register.do',
    },
    {
      id: 'status',
      name: 'Тест 2: Статус заказа (getOrderStatusExtended.do)',
      description: 'Проверка статуса созданного заказа',
      endpoint: '/getOrderStatusExtended.do',
      requiresOrderId: true,
    },
  ];

  const testCards = [
    { number: '4000001111111118', name: 'Успешная оплата с 3DS', cvc: '123', exp: '12/30' },
    { number: '4000001111111126', name: 'Отклонённая карта', cvc: '123', exp: '12/30' },
    { number: '5000001111111115', name: 'Mastercard успешная', cvc: '123', exp: '12/30' },
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Скопировано в буфер обмена');
  };

  const runTest = async (testId: string) => {
    setLoading(testId);
    const startTime = Date.now();

    try {
      let requestBody: Record<string, any>;
      
      if (testId === 'register') {
        requestBody = {
          action: 'register',
          amount: amount,
          orderNumber: orderNumber,
          returnUrl: `${window.location.origin}/cabinet/payment?success=true`,
          failUrl: `${window.location.origin}/cabinet/payment?success=false`,
          userName: userName,
          password: password,
        };
      } else if (testId === 'status') {
        const registerResult = results['register'];
        if (!registerResult?.response?.orderId) {
          throw new Error('Сначала выполните тест регистрации заказа');
        }
        requestBody = {
          action: 'status',
          orderId: registerResult.response.orderId,
          userName: userName,
          password: password,
        };
      } else {
        throw new Error('Неизвестный тест');
      }

      const { data, error } = await supabase.functions.invoke('vtb-sandbox-test', {
        body: requestBody,
      });

      if (error) {
        throw new Error(error.message);
      }

      const duration = Date.now() - startTime;

      setResults(prev => ({
        ...prev,
        [testId]: {
          success: data.success,
          response: data.response,
          duration,
        },
      }));

      if (data.success) {
        toast.success(`Тест "${testId}" пройден успешно`);
      } else {
        const errorMsg = data.response?.errorMessage || data.error || 'Неизвестная ошибка';
        toast.error(`Тест "${testId}" завершился с ошибкой: ${errorMsg}`);
      }

    } catch (error: any) {
      const duration = Date.now() - startTime;
      setResults(prev => ({
        ...prev,
        [testId]: {
          success: false,
          error: error.message,
          duration,
        },
      }));
      toast.error(`Ошибка теста: ${error.message}`);
    } finally {
      setLoading(null);
    }
  };

  const runAllTests = async () => {
    for (const test of testCases) {
      if (test.requiresOrderId && !results['register']?.response?.orderId) {
        continue;
      }
      await runTest(test.id);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const getStatusBadge = (orderStatus: number) => {
    const statuses: Record<number, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      0: { label: 'Зарегистрирован', variant: 'outline' },
      1: { label: 'Предавторизация', variant: 'secondary' },
      2: { label: 'Оплачен', variant: 'default' },
      3: { label: 'Отменён', variant: 'destructive' },
      4: { label: 'Возвращён', variant: 'destructive' },
      5: { label: 'ACS инициирован', variant: 'secondary' },
      6: { label: 'Отклонён', variant: 'destructive' },
    };
    const status = statuses[orderStatus] || { label: `Статус ${orderStatus}`, variant: 'outline' as const };
    return <Badge variant={status.variant}>{status.label}</Badge>;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Тестирование VTB API</h1>
          <p className="text-muted-foreground mt-1">
            Песочница платёжного шлюза VTB (vtb.rbsuat.com)
          </p>
        </div>

        {/* Connection Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Параметры подключения</CardTitle>
            <CardDescription>
              Введите credentials из личного кабинета{' '}
              <a 
                href="https://sandbox.vtb.ru/sandbox/cabinet/index.html" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                sandbox.vtb.ru
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-muted-foreground">URL</Label>
                <div className="flex items-center gap-2">
                  <code className="text-sm bg-muted px-2 py-1 rounded flex-1 truncate">
                    {SANDBOX_URL}
                  </code>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(SANDBOX_URL)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="userName">userName</Label>
                <Input 
                  id="userName"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="your-merchant-api"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">password</Label>
                <Input 
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>
            {(!userName || !password) && (
              <p className="text-sm text-amber-600">
                ⚠️ Введите userName и password для тестирования
              </p>
            )}
          </CardContent>
        </Card>

        {/* Test Parameters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Параметры теста</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Сумма (в копейках)</Label>
                <Input 
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="10000"
                />
                <p className="text-xs text-muted-foreground">
                  10000 копеек = 100 рублей
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="orderNumber">Номер заказа</Label>
                <div className="flex gap-2">
                  <Input 
                    id="orderNumber"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    placeholder="TEST_ORDER_001"
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => setOrderNumber(`TEST_${Date.now()}`)}
                  >
                    Новый
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Cases */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Тест-кейсы</CardTitle>
              <CardDescription>Последовательное тестирование API</CardDescription>
            </div>
            <Button onClick={runAllTests} disabled={loading !== null}>
              <Play className="h-4 w-4 mr-2" />
              Запустить все
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {testCases.map((test) => {
              const result = results[test.id];
              const isLoading = loading === test.id;
              const isDisabled = test.requiresOrderId && !results['register']?.response?.orderId;

              return (
                <div key={test.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">{test.name}</h3>
                      <p className="text-sm text-muted-foreground">{test.description}</p>
                      <code className="text-xs bg-muted px-2 py-0.5 rounded mt-1 inline-block">
                        {SANDBOX_URL}{test.endpoint}
                      </code>
                    </div>
                    <div className="flex items-center gap-2">
                      {result && (
                        <div className="flex items-center gap-2">
                          {result.success ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                          {result.duration && (
                            <span className="text-xs text-muted-foreground">
                              {result.duration}ms
                            </span>
                          )}
                        </div>
                      )}
                      <Button 
                        size="sm" 
                        onClick={() => runTest(test.id)}
                        disabled={isLoading || isDisabled}
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {isDisabled && (
                    <p className="text-sm text-amber-600">
                      ⚠️ Сначала выполните тест регистрации заказа
                    </p>
                  )}

                  {result && (
                    <div className="mt-3 space-y-2">
                      {result.error ? (
                        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded text-sm text-red-600 dark:text-red-400">
                          {result.error}
                        </div>
                      ) : result.response && (
                        <div className="space-y-2">
                          {/* Show key info */}
                          {result.response.orderId && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">orderId:</span>
                              <code className="text-sm bg-muted px-2 py-0.5 rounded">
                                {result.response.orderId}
                              </code>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6"
                                onClick={() => copyToClipboard(result.response.orderId)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                          {result.response.formUrl && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">Ссылка на оплату:</span>
                              <a 
                                href={result.response.formUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline flex items-center gap-1"
                              >
                                Открыть форму оплаты
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          )}
                          {result.response.orderStatus !== undefined && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">Статус:</span>
                              {getStatusBadge(result.response.orderStatus)}
                            </div>
                          )}
                          {result.response.amount !== undefined && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">Сумма:</span>
                              <span className="text-sm font-medium">
                                {(result.response.amount / 100).toLocaleString()} ₽
                              </span>
                            </div>
                          )}
                          
                          {/* Full response */}
                          <details className="mt-2">
                            <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                              Полный ответ JSON
                            </summary>
                            <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-auto max-h-60">
                              {JSON.stringify(result.response, null, 2)}
                            </pre>
                          </details>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Test Cards */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Тестовые карты
            </CardTitle>
            <CardDescription>
              Используйте на платёжной странице VTB для тестирования
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {testCards.map((card, idx) => (
                <div key={idx} className="border rounded-lg p-4 space-y-2">
                  <p className="font-medium text-sm">{card.name}</p>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Номер:</span>
                      <div className="flex items-center gap-1">
                        <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">
                          {card.number}
                        </code>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-5 w-5"
                          onClick={() => copyToClipboard(card.number)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">CVC:</span>
                      <code className="text-xs bg-muted px-2 py-0.5 rounded">{card.cvc}</code>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Срок:</span>
                      <code className="text-xs bg-muted px-2 py-0.5 rounded">{card.exp}</code>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Имя:</span>
                      <code className="text-xs bg-muted px-2 py-0.5 rounded">TEST CARDHOLDER</code>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Documentation Link */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Документация VTB Sandbox</h3>
                <p className="text-sm text-muted-foreground">
                  Полная документация API платёжного шлюза
                </p>
              </div>
              <a 
                href="https://sandbox.vtb.ru/sandbox/ru/integration/api/rest.html" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button variant="outline">
                  Открыть документацию
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
