import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, MapPin, Star, Video, Trash2, Check } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type PerformerType = Database['public']['Enums']['performer_type'];
type EventFormat = Database['public']['Enums']['event_format'];
type District = Database['public']['Tables']['districts']['Row'];

export interface Filters {
  district?: string;
  date?: string;
  timeSlot?: string;
  priceFrom?: number;
  priceTo?: number;
  performerType?: PerformerType[];
  eventFormat?: EventFormat[];
  hasVideo?: boolean;
  minRating?: number;
  sortBy: 'rating' | 'price_asc' | 'price_desc' | 'reviews';
}

interface CatalogFiltersProps {
  filters: Filters;
  districts: District[];
  onFiltersChange: (filters: Filters) => void;
  onClear: () => void;
  onApply?: () => void;
}

const performerTypes: { value: PerformerType; label: string }[] = [
  { value: 'ded_moroz', label: 'Дед Мороз' },
  { value: 'snegurochka', label: 'Снегурочка' },
  { value: 'santa', label: 'Санта-Клаус' },
  { value: 'duo', label: 'Дуэт' },
];

const eventFormats: { value: EventFormat; label: string }[] = [
  { value: 'home', label: 'На дом' },
  { value: 'kindergarten', label: 'Детский сад' },
  { value: 'school', label: 'Школа' },
  { value: 'office', label: 'Офис' },
  { value: 'corporate', label: 'Корпоратив' },
  { value: 'outdoor', label: 'На улице' },
];

export function CatalogFilters({ filters, districts, onFiltersChange, onClear, onApply }: CatalogFiltersProps) {
  const handleTypeChange = (type: PerformerType, checked: boolean) => {
    const currentTypes = filters.performerType || [];
    const newTypes = checked
      ? [...currentTypes, type]
      : currentTypes.filter((t) => t !== type);
    onFiltersChange({ ...filters, performerType: newTypes.length > 0 ? newTypes : undefined });
  };

  const handleFormatChange = (format: EventFormat, checked: boolean) => {
    const currentFormats = filters.eventFormat || [];
    const newFormats = checked
      ? [...currentFormats, format]
      : currentFormats.filter((f) => f !== format);
    onFiltersChange({ ...filters, eventFormat: newFormats.length > 0 ? newFormats : undefined });
  };

  return (
    <div className="space-y-6 p-6 bg-card rounded-2xl border border-border">
      {/* District */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-sm font-semibold">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          Район
        </Label>
        <select
          value={filters.district || ''}
          onChange={(e) => onFiltersChange({ ...filters, district: e.target.value || undefined })}
          className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm"
        >
          <option value="">Все районы</option>
          {districts.map((d) => (
            <option key={d.id} value={d.slug}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {/* Date */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-sm font-semibold">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          Дата
        </Label>
        <input
          type="date"
          value={filters.date || ''}
          onChange={(e) => onFiltersChange({ ...filters, date: e.target.value || undefined })}
          min={new Date().toISOString().split('T')[0]}
          className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm"
        />
      </div>

      {/* Time */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Время начала</Label>
        <select
          value={filters.timeSlot || ''}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              timeSlot: e.target.value || undefined,
            })
          }
          className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm"
        >
          <option value="">Любое время</option>
          {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
            <option key={hour} value={`${hour.toString().padStart(2, '0')}:00`}>
              {hour.toString().padStart(2, '0')}:00
            </option>
          ))}
        </select>
      </div>

      {/* Performer Type */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Тип исполнителя</Label>
        <div className="space-y-2">
          {performerTypes.map((type) => (
            <div key={type.value} className="flex items-center space-x-2">
              <Checkbox
                id={type.value}
                checked={filters.performerType?.includes(type.value) || false}
                onCheckedChange={(checked) => handleTypeChange(type.value, checked as boolean)}
              />
              <label
                htmlFor={type.value}
                className="text-sm cursor-pointer hover:text-foreground transition-colors"
              >
                {type.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Event Format */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Формат мероприятия</Label>
        <div className="space-y-2">
          {eventFormats.map((format) => (
            <div key={format.value} className="flex items-center space-x-2">
              <Checkbox
                id={format.value}
                checked={filters.eventFormat?.includes(format.value) || false}
                onCheckedChange={(checked) => handleFormatChange(format.value, checked as boolean)}
              />
              <label
                htmlFor={format.value}
                className="text-sm cursor-pointer hover:text-foreground transition-colors"
              >
                {format.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">
          Цена: {filters.priceFrom || 0} - {filters.priceTo || 15000} сом
        </Label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="От"
            value={filters.priceFrom || ''}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                priceFrom: e.target.value ? parseInt(e.target.value) : undefined,
              })
            }
            className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm"
          />
          <input
            type="number"
            placeholder="До"
            value={filters.priceTo || ''}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                priceTo: e.target.value ? parseInt(e.target.value) : undefined,
              })
            }
            className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm"
          />
        </div>
      </div>

      {/* Rating */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-sm font-semibold">
          <Star className="h-4 w-4 text-muted-foreground" />
          Минимальный рейтинг
        </Label>
        <div className="flex gap-2">
          {[4, 4.5, 5].map((rating) => (
            <button
              key={rating}
              onClick={() =>
                onFiltersChange({
                  ...filters,
                  minRating: filters.minRating === rating ? undefined : rating,
                })
              }
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                filters.minRating === rating
                  ? 'bg-accent text-white'
                  : 'bg-secondary hover:bg-secondary/80'
              }`}
            >
              {rating}+
            </button>
          ))}
        </div>
      </div>

      {/* Has Video */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="hasVideo"
          checked={filters.hasVideo || false}
          onCheckedChange={(checked) => onFiltersChange({ ...filters, hasVideo: checked as boolean })}
        />
        <label
          htmlFor="hasVideo"
          className="flex items-center gap-2 text-sm cursor-pointer hover:text-foreground transition-colors"
        >
          <Video className="h-4 w-4 text-accent" />
          Есть видео-приветствие
        </label>
      </div>

      {/* Sort (Desktop) */}
      <div className="hidden lg:block space-y-3 pt-4 border-t border-border">
        <Label className="text-sm font-semibold">Сортировка</Label>
        <select
          value={filters.sortBy || 'rating'}
          onChange={(e) => onFiltersChange({ ...filters, sortBy: e.target.value as Filters['sortBy'] })}
          className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm"
        >
          <option value="rating">По рейтингу</option>
          <option value="price_asc">Сначала дешевле</option>
          <option value="price_desc">Сначала дороже</option>
          <option value="reviews">По отзывам</option>
        </select>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-4 border-t border-border">
        {onApply && (
          <Button className="w-full" onClick={onApply}>
            <Check className="h-4 w-4 mr-2" />
            Применить
          </Button>
        )}
        <Button variant="outline" className="w-full" onClick={onClear}>
          <Trash2 className="h-4 w-4 mr-2" />
          Сбросить фильтры
        </Button>
      </div>
    </div>
  );
}
