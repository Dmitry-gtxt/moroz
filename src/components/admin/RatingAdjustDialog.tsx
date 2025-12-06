import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Minus, Loader2, Star } from 'lucide-react';

interface RatingAdjustDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  performerId: string;
  performerName: string;
  currentRating: number;
  onRatingUpdated: () => void;
}

export function RatingAdjustDialog({
  open,
  onOpenChange,
  performerId,
  performerName,
  currentRating,
  onRatingUpdated,
}: RatingAdjustDialogProps) {
  const [adjustment, setAdjustment] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (adjustment === 0) {
      toast.error('Выберите изменение рейтинга');
      return;
    }
    if (!reason.trim()) {
      toast.error('Укажите причину изменения');
      return;
    }

    setLoading(true);

    try {
      // Update performer rating
      const newRating = Math.max(0, Math.min(5, currentRating + adjustment));
      
      const { error: updateError } = await supabase
        .from('performer_profiles')
        .update({ rating_average: newRating })
        .eq('id', performerId);

      if (updateError) throw updateError;

      // Send message to support chat
      const { data: chatData } = await supabase
        .from('support_chats')
        .select('id')
        .eq('performer_id', performerId)
        .maybeSingle();

      if (chatData) {
        const message = adjustment > 0 
          ? `📈 Ваш рейтинг повышен на ${adjustment} (новый рейтинг: ${newRating.toFixed(1)})\n\nПричина: ${reason}`
          : `📉 Ваш рейтинг понижен на ${Math.abs(adjustment)} (новый рейтинг: ${newRating.toFixed(1)})\n\nПричина: ${reason}`;

        await supabase.from('support_messages').insert({
          chat_id: chatData.id,
          sender_id: (await supabase.auth.getUser()).data.user?.id || '',
          sender_type: 'admin',
          text: message,
        });
      }

      toast.success('Рейтинг обновлён и уведомление отправлено');
      onRatingUpdated();
      onOpenChange(false);
      setAdjustment(0);
      setReason('');
    } catch (error) {
      console.error('Error adjusting rating:', error);
      toast.error('Ошибка при изменении рейтинга');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-accent" />
            Изменить рейтинг: {performerName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-center">
            <p className="text-muted-foreground mb-2">Текущий рейтинг</p>
            <div className="text-3xl font-bold text-accent">
              {currentRating.toFixed(1)}
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <Button
              variant={adjustment === -1 ? 'destructive' : 'outline'}
              size="lg"
              onClick={() => setAdjustment(-1)}
            >
              <Minus className="h-5 w-5 mr-1" />
              -1
            </Button>
            <Button
              variant={adjustment === -0.5 ? 'destructive' : 'outline'}
              onClick={() => setAdjustment(-0.5)}
            >
              -0.5
            </Button>
            <Button
              variant={adjustment === 0.5 ? 'default' : 'outline'}
              onClick={() => setAdjustment(0.5)}
            >
              +0.5
            </Button>
            <Button
              variant={adjustment === 1 ? 'default' : 'outline'}
              size="lg"
              onClick={() => setAdjustment(1)}
            >
              <Plus className="h-5 w-5 mr-1" />
              +1
            </Button>
          </div>

          {adjustment !== 0 && (
            <div className="text-center text-lg">
              Новый рейтинг: <span className="font-bold">{Math.max(0, Math.min(5, currentRating + adjustment)).toFixed(1)}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">Причина изменения *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Опишите причину изменения рейтинга..."
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Это сообщение будет отправлено исполнителю в чат поддержки
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={loading || adjustment === 0 || !reason.trim()}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Применить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
