import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AdminReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  performerId: string;
  performerName: string;
  onReviewAdded?: () => void;
}

export function AdminReviewDialog({
  open,
  onOpenChange,
  performerId,
  performerName,
  onReviewAdded,
}: AdminReviewDialogProps) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) {
      toast.error('Введите текст отзыва');
      return;
    }

    setLoading(true);
    try {
      // Get current user (admin)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Необходима авторизация');
        return;
      }

      // Create a pseudo-booking for admin review
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          performer_id: performerId,
          customer_id: user.id,
          customer_name: customerName || 'Клиент (по телефону)',
          customer_phone: '+7-admin-review',
          address: 'Отзыв по телефону',
          booking_date: new Date().toISOString().split('T')[0],
          booking_time: '12:00',
          district_slug: 'samara-leninsky',
          price_total: 0,
          prepayment_amount: 0,
          status: 'completed',
          payment_status: 'fully_paid',
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Create the review
      const { error: reviewError } = await supabase
        .from('reviews')
        .insert({
          performer_id: performerId,
          customer_id: user.id,
          booking_id: booking.id,
          rating,
          text: text.trim(),
          is_visible: true,
        });

      if (reviewError) throw reviewError;

      // Update performer's rating
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('performer_id', performerId)
        .eq('is_visible', true);

      if (reviews && reviews.length > 0) {
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        await supabase
          .from('performer_profiles')
          .update({
            rating_average: avgRating,
            rating_count: reviews.length,
          })
          .eq('id', performerId);
      }

      toast.success('Отзыв добавлен');
      setText('');
      setCustomerName('');
      setRating(5);
      onOpenChange(false);
      onReviewAdded?.();
    } catch (error) {
      console.error('Error adding review:', error);
      toast.error('Ошибка при добавлении отзыва');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Написать отзыв для {performerName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Имя клиента (опционально)</Label>
            <Input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Имя клиента, оставившего отзыв"
            />
          </div>

          <div className="space-y-2">
            <Label>Оценка</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-6 w-6 ${
                      star <= (hoverRating || rating)
                        ? 'fill-accent text-accent'
                        : 'text-muted-foreground'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Текст отзыва</Label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Введите текст отзыва от клиента..."
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Добавление...' : 'Добавить отзыв'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
