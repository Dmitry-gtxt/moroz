import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, Video, CheckCircle, Clock, Calendar, Play, X, Timer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { getCustomerPrice } from '@/lib/pricing';
import type { Database } from '@/integrations/supabase/types';

type PerformerProfile = Database['public']['Tables']['performer_profiles']['Row'] & {
  program_duration?: number | null;
  program_description?: string | null;
};
type District = Database['public']['Tables']['districts']['Row'];
type AvailabilitySlot = Database['public']['Tables']['availability_slots']['Row'] & {
  price?: number | null;
};

interface PerformerCardProps {
  performer: PerformerProfile;
  districts: District[];
  pendingRequestsCount?: number;
  availableSlots?: AvailabilitySlot[]; // Available slots for selected date
  selectedDate?: string; // Currently selected date filter
  commissionRate?: number; // Pre-fetched commission rate
}

const performerTypeLabels: Record<string, string> = {
  ded_moroz: 'Дед Мороз',
  snegurochka: 'Снегурочка',
  santa: 'Санта-Клаус',
  duo: 'Дуэт',
};

export function PerformerCard({ 
  performer, 
  districts, 
  pendingRequestsCount = 0,
  availableSlots,
  selectedDate,
  commissionRate = 40,
}: PerformerCardProps) {
  const [showVideo, setShowVideo] = useState(false);
  const getDistrictNames = (slugs: string[]) => {
    return slugs
      .map((slug) => districts.find((d) => d.slug === slug)?.name)
      .filter(Boolean)
      .slice(0, 2)
      .join(', ');
  };

  // Format available hours for display
  const getAvailableHours = () => {
    if (!availableSlots || availableSlots.length === 0) return null;
    
    const hours = availableSlots
      .map(slot => {
        const hour = parseInt(slot.start_time.slice(0, 2));
        return hour === 0 ? '24' : hour.toString();
      })
      .slice(0, 6); // Show max 6 hours
    
    const remaining = availableSlots.length - 6;
    
    return {
      hours,
      remaining: remaining > 0 ? remaining : 0,
      total: availableSlots.length,
    };
  };

  // Get min price from available slots or base price
  const getMinPrice = () => {
    if (availableSlots && availableSlots.length > 0) {
      const prices = availableSlots.map(s => s.price ?? performer.base_price);
      return Math.min(...prices);
    }
    return performer.base_price;
  };

  const availableHoursData = selectedDate ? getAvailableHours() : null;

  const photoUrl = performer.photo_urls?.[0] || 'https://images.unsplash.com/photo-1576919228236-a097c32a5cd4?w=400&h=400&fit=crop';
  const minPerformerPrice = getMinPrice();
  const customerPrice = getCustomerPrice(minPerformerPrice, commissionRate);

  return (
    <div className="group bg-card rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-border/50">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={photoUrl}
          alt={performer.display_name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Badges overlay */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          {(performer.performer_types as string[])?.map((type) => (
            <Badge 
              key={type} 
              variant="secondary"
              className="bg-white/90 backdrop-blur-sm text-foreground"
            >
              {performerTypeLabels[type] || type}
            </Badge>
          ))}
        </div>

        {/* Video play button */}
        {performer.video_greeting_url && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowVideo(true);
            }}
            className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-accent text-white text-xs font-medium hover:bg-accent/90 transition-colors shadow-lg"
          >
            <Play className="h-3 w-3 fill-current" />
            Видео
          </button>
        )}

        {/* Verified badge */}
        {performer.verification_status === 'verified' && (
          <div className="absolute bottom-3 right-3">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
          </div>
        )}

        {/* Pending requests indicator */}
        {pendingRequestsCount > 0 && !selectedDate && (
          <div className="absolute bottom-3 left-3">
            <Badge variant="secondary" className="bg-amber-500/90 text-white border-0">
              <Clock className="h-3 w-3 mr-1" />
              {pendingRequestsCount} {pendingRequestsCount === 1 ? 'запрос' : pendingRequestsCount < 5 ? 'запроса' : 'запросов'}
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Name and rating */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="font-display font-semibold text-lg text-foreground line-clamp-1">
            {performer.display_name}
          </h3>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Star className="h-4 w-4 fill-accent text-accent" />
            <span className="font-semibold text-foreground">
              {Number(performer.rating_average).toFixed(1)}
            </span>
            <span className="text-sm text-muted-foreground">({performer.rating_count ?? 0})</span>
          </div>
        </div>

        {/* Availability for selected date */}
        {selectedDate && (
          <div className="mb-4 p-3 rounded-lg bg-secondary/50">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Свободно на {new Date(selectedDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}:
              </span>
            </div>
            {availableHoursData ? (
              <div className="flex flex-wrap gap-1">
                {availableHoursData.hours.map((hour, i) => (
                  <span 
                    key={i}
                    className="px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs font-medium"
                  >
                    {hour}:00
                  </span>
                ))}
                {availableHoursData.remaining > 0 && (
                  <span className="px-2 py-0.5 text-xs text-muted-foreground">
                    +{availableHoursData.remaining}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">Нет свободных слотов</span>
            )}
          </div>
        )}

        {/* Description */}
        {!selectedDate && performer.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {performer.description}
          </p>
        )}

        {/* Program duration */}
        {(performer as any).program_duration && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Timer className="h-4 w-4 flex-shrink-0 text-accent" />
            <span>Программа: {(performer as any).program_duration} мин</span>
          </div>
        )}

        {/* Districts */}
        {performer.district_slugs.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span className="line-clamp-1">{getDistrictNames(performer.district_slugs)}</span>
          </div>
        )}

        {/* Price and action */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div>
            <span className="text-sm text-muted-foreground">от </span>
            <span className="font-display text-xl font-bold text-accent">
              {customerPrice.toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground"> ₽</span>
          </div>
          <Button variant="gold" size="sm" className="min-h-[44px] min-w-[100px]" asChild>
            <Link to={`/performer/${performer.id}${selectedDate ? `?date=${selectedDate}` : ''}`}>
              Подробнее
            </Link>
          </Button>
        </div>

        {/* Video dialog */}
        <Dialog open={showVideo} onOpenChange={setShowVideo}>
          <DialogContent className="max-w-3xl p-0 overflow-hidden bg-black">
            <button
              onClick={() => setShowVideo(false)}
              className="absolute top-2 right-2 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <video
              src={performer.video_greeting_url || ''}
              controls
              autoPlay
              className="w-full max-h-[80vh] object-contain"
            >
              Ваш браузер не поддерживает воспроизведение видео.
            </video>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}