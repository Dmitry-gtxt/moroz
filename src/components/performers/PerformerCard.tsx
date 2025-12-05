import { Link } from 'react-router-dom';
import { PerformerProfile } from '@/types';
import { Star, MapPin, Video, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { districts } from '@/data/mockData';

interface PerformerCardProps {
  performer: PerformerProfile;
}

const performerTypeLabels: Record<string, string> = {
  ded_moroz: 'Дед Мороз',
  snegurochka: 'Снегурочка',
  santa: 'Санта-Клаус',
  duo: 'Дуэт',
};

export function PerformerCard({ performer }: PerformerCardProps) {
  const getDistrictNames = (slugs: string[]) => {
    return slugs
      .map((slug) => districts.find((d) => d.slug === slug)?.name)
      .filter(Boolean)
      .slice(0, 2)
      .join(', ');
  };

  return (
    <div className="group bg-card rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-border/50">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={performer.photoUrls[0]}
          alt={performer.displayName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Badges overlay */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          {performer.type.map((type) => (
            <Badge 
              key={type} 
              variant="secondary"
              className="bg-white/90 backdrop-blur-sm text-foreground"
            >
              {performerTypeLabels[type]}
            </Badge>
          ))}
        </div>

        {/* Video badge */}
        {performer.videoGreetingUrl && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-accent text-white">
              <Video className="h-3 w-3 mr-1" />
              Видео
            </Badge>
          </div>
        )}

        {/* Verified badge */}
        {performer.verificationStatus === 'verified' && (
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
            {performer.displayName}
          </h3>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Star className="h-4 w-4 fill-accent text-accent" />
            <span className="font-semibold text-foreground">{performer.ratingAverage}</span>
            <span className="text-sm text-muted-foreground">({performer.ratingCount})</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {performer.description}
        </p>

        {/* Districts */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <MapPin className="h-4 w-4 flex-shrink-0" />
          <span className="line-clamp-1">{getDistrictNames(performer.districts)}</span>
        </div>

        {/* Price and action */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div>
            <span className="text-sm text-muted-foreground">от </span>
            <span className="font-display text-xl font-bold text-accent">
              {performer.basePrice.toLocaleString()}
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
