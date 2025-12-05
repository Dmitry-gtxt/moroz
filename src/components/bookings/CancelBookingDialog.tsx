import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface CancelBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => Promise<void>;
  bookingDate: string;
  customerName?: string;
  performerName?: string;
  role: 'customer' | 'performer';
  isRejection?: boolean; // true when rejecting a pending booking (vs canceling confirmed)
}

export function CancelBookingDialog({
  open,
  onOpenChange,
  onConfirm,
  bookingDate,
  customerName,
  performerName,
  role,
  isRejection = false,
}: CancelBookingDialogProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!reason.trim()) return;
    
    setLoading(true);
    try {
      await onConfirm(reason);
      setReason('');
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const targetName = role === 'customer' ? performerName : customerName;

  const title = isRejection ? 'Отклонение заявки' : 'Отмена бронирования';
  const actionWord = isRejection ? 'отклонить' : 'отменить';
  const confirmButtonText = isRejection ? 'Отклонить заявку' : 'Подтвердить отмену';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Вы собираетесь {actionWord} заявку на {bookingDate}
            {targetName && ` от клиента ${targetName}`}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!isRejection && (
            <div className="p-4 bg-destructive/10 rounded-lg text-sm text-destructive">
              <p className="font-medium mb-1">Внимание!</p>
              <p>
                {role === 'customer' 
                  ? 'При отмене менее чем за 24 часа предоплата может быть удержана.'
                  : 'Частые отмены могут негативно повлиять на ваш рейтинг.'}
              </p>
            </div>
          )}

          {isRejection && (
            <div className="p-4 bg-muted rounded-lg text-sm">
              <p className="text-muted-foreground">
                Время останется свободным для других клиентов. Клиенту будет отправлено уведомление.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">Причина {isRejection ? 'отклонения' : 'отмены'} *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                isRejection
                  ? 'Например: не работаю в этом районе, уже занят в это время...'
                  : role === 'customer'
                    ? 'Например: изменились планы, ребёнок заболел...'
                    : 'Например: болезнь, форс-мажор, конфликт расписания...'
              }
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Причина будет отправлена клиенту по email
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Отмена
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm}
            disabled={!reason.trim() || loading}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {confirmButtonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
