import { Link } from 'react-router-dom';
import { Star, MapPin, Video, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Database } from '@/integrations/supabase/types';

type PerformerProfile = Database['public']['Tables']['performer_profiles']['Row'];
type District = Database['public']['Tables']['districts']['Row'];

interface PerformerCardProps {
  performer: PerformerProfile;
  districts: District[];
}

const performerTypeLabels: Record<string, string> = {
  ded_moroz: 'Дед Мороз',
  snegurochka: 'Снегурочка',
  santa: 'Санта-Клаус',
  duo: 'Дуэт',
};

export function PerformerCard({ performer, districts }: PerformerCardProps) {
  const getDistrictNames = (slugs: string[]) => {
    return slugs
      .map((slug) => districts.find((d) => d.slug === slug)?.name)
      .filter(Boolean)
      .slice(0, 2)
      .join(', ');
  };

  const photoUrl = performer.photo_urls?.[0] || 'https://images.unsplash.com/photo-1576919228236-a097c32a5cd4?w=400&h=400&fit=crop';
  const price = performer.price_from ?? performer.base_price;

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

        {/* Video badge */}
        {performer.video_greeting_url && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-accent text-white">
              <Video className="h-3 w-3 mr-1" />
              Видео
            </Badge>
          </div>
        )}

        {/* Verified badge */}
        {performer.verification_status === 'verified' && (
          <div className="absolute bottom-3 right-3">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
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

        {/* Description */}
        {performer.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {performer.description}
          </p>
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
              {price.toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground"> сом</span>
          </div>
          <Button variant="gold" size="sm" asChild>
            <Link to={`/performer/${performer.id}`}>
              Выбрать
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
