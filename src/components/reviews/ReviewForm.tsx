import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ReviewFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  performerId: string;
  performerName: string;
  customerId: string;
  onReviewSubmitted: () => void;
}

export function ReviewForm({
  open,
  onOpenChange,
  bookingId,
  performerId,
  performerName,
  customerId,
  onReviewSubmitted,
}: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating < 1) {
      toast.error('Пожалуйста, выберите оценку');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('reviews').insert({
        booking_id: bookingId,
        performer_id: performerId,
        customer_id: customerId,
        rating,
        text: text.trim() || null,
      });

      if (error) throw error;

      // Update performer rating
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

      toast.success('Спасибо за ваш отзыв!');
      onReviewSubmitted();
      onOpenChange(false);
      setRating(5);
      setText('');
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при отправке отзыва');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Оставить отзыв о {performerName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div>
            <Label className="mb-3 block">Ваша оценка</Label>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? 'fill-accent text-accent'
                        : 'text-muted-foreground'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground mt-2">
              {rating === 1 && 'Ужасно'}
              {rating === 2 && 'Плохо'}
              {rating === 3 && 'Нормально'}
              {rating === 4 && 'Хорошо'}
              {rating === 5 && 'Отлично!'}
            </p>
          </div>

          <div>
            <Label htmlFor="review-text">Ваш отзыв (необязательно)</Label>
            <Textarea
              id="review-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Расскажите о вашем опыте..."
              className="mt-2"
              rows={4}
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Отмена
            </Button>
            <Button
              variant="gold"
              className="flex-1"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Отправить'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
