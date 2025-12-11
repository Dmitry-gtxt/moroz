import { Bell, BellOff, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export function PushNotificationToggle() {
  const { isSupported, isSubscribed, isLoading, permission, subscribe, unsubscribe } = usePushNotifications();

  if (!isSupported) {
    return (
      <div className="flex items-center gap-3 text-muted-foreground">
        <BellOff className="h-5 w-5" />
        <span className="text-sm">Push-уведомления не поддерживаются в этом браузере</span>
      </div>
    );
  }

  const handleToggle = async (checked: boolean) => {
    if (checked) {
      await subscribe();
    } else {
      await unsubscribe();
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {isSubscribed ? (
          <Bell className="h-5 w-5 text-primary" />
        ) : (
          <BellOff className="h-5 w-5 text-muted-foreground" />
        )}
        <div>
          <Label htmlFor="push-toggle" className="text-base cursor-pointer">
            Push-уведомления
          </Label>
          <p className="text-sm text-muted-foreground">
            {permission === 'denied' 
              ? 'Уведомления заблокированы в настройках браузера'
              : isSubscribed 
                ? 'Вы будете получать уведомления о заказах и сообщениях'
                : 'Включите для получения уведомлений'}
          </p>
        </div>
      </div>
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Switch
          id="push-toggle"
          checked={isSubscribed}
          onCheckedChange={handleToggle}
          disabled={permission === 'denied'}
        />
      )}
    </div>
  );
}
