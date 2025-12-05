import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SEOHead } from '@/components/seo/SEOHead';
import { PerformerCard } from '@/components/performers/PerformerCard';
import { CatalogFilters, Filters } from '@/components/catalog/CatalogFilters';
import { supabase } from '@/integrations/supabase/client';
import { SlidersHorizontal, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import type { Database } from '@/integrations/supabase/types';

type PerformerProfile = Database['public']['Tables']['performer_profiles']['Row'];
type District = Database['public']['Tables']['districts']['Row'];
type AvailabilitySlot = Database['public']['Tables']['availability_slots']['Row'];
type PerformerType = Database['public']['Enums']['performer_type'];
type EventFormat = Database['public']['Enums']['event_format'];

// Map of performer_id -> count of pending booking requests
type PendingRequestsMap = Record<string, number>;
// Map of performer_id -> available slots for selected date
type AvailabilityMap = Record<string, AvailabilitySlot[]>;

const Catalog = () => {
  const [searchParams] = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [performers, setPerformers] = useState<PerformerProfile[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequestsMap>({});
  const [availability, setAvailability] = useState<AvailabilityMap>({});
  const [loading, setLoading] = useState(true);
  
  const initialFilters: Filters = {
    district: searchParams.get('district') || undefined,
    date: searchParams.get('date') || undefined,
    timeSlots: searchParams.get('time') ? [searchParams.get('time')!] : undefined,
    sortBy: 'rating',
  };

  const [filters, setFilters] = useState<Filters>(initialFilters);

  // Fetch performers, districts, and pending requests
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      const [performersRes, districtsRes, pendingBookingsRes] = await Promise.all([
        supabase
          .from('performer_profiles')
          .select('*')
          .eq('is_active', true)
          .order('rating_average', { ascending: false }),
        supabase
          .from('districts')
          .select('*')
          .order('name'),
        supabase
          .from('bookings')
          .select('performer_id')
          .eq('status', 'pending')
          .gte('booking_date', new Date().toISOString().split('T')[0]),
      ]);

      if (performersRes.data) {
        setPerformers(performersRes.data);
      }
      if (districtsRes.data) {
        setDistricts(districtsRes.data);
      }
      
      if (pendingBookingsRes.data) {
        const counts: PendingRequestsMap = {};
        pendingBookingsRes.data.forEach((booking) => {
          counts[booking.performer_id] = (counts[booking.performer_id] || 0) + 1;
        });
        setPendingRequests(counts);
      }
      
      setLoading(false);
    }

    fetchData();
  }, []);

  // Fetch availability when date filter changes
  useEffect(() => {
    async function fetchAvailability() {
      if (!filters.date) {
        setAvailability({});
        return;
      }

      const { data } = await supabase
        .from('availability_slots')
        .select('*')
        .eq('date', filters.date)
        .eq('status', 'free')
        .order('start_time');

      if (data) {
        const availMap: AvailabilityMap = {};
        data.forEach((slot) => {
          if (!availMap[slot.performer_id]) {
            availMap[slot.performer_id] = [];
          }
          availMap[slot.performer_id].push(slot);
        });
        setAvailability(availMap);
      }
    }

    fetchAvailability();
  }, [filters.date]);

  const filteredPerformers = useMemo(() => {
    let result = [...performers];

    // Filter by district
    if (filters.district) {
      result = result.filter((p) => p.district_slugs.includes(filters.district!));
    }

    // Filter by performer type
    if (filters.performerType && filters.performerType.length > 0) {
      result = result.filter((p) =>
        (p.performer_types as PerformerType[]).some((t) => filters.performerType!.includes(t))
      );
    }

    // Filter by event format
    if (filters.eventFormat && filters.eventFormat.length > 0) {
      result = result.filter((p) =>
        (p.formats as EventFormat[]).some((f) => filters.eventFormat!.includes(f))
      );
    }

    // Filter by price range
    if (filters.priceFrom) {
      result = result.filter((p) => (p.price_from ?? p.base_price) >= filters.priceFrom!);
    }
    if (filters.priceTo) {
      result = result.filter((p) => (p.price_from ?? p.base_price) <= filters.priceTo!);
    }

    // Filter by minimum rating
    if (filters.minRating) {
      result = result.filter((p) => Number(p.rating_average) >= filters.minRating!);
    }

    // Filter by video presence
    if (filters.hasVideo) {
      result = result.filter((p) => p.video_greeting_url);
    }

    // Filter by availability on selected date and time slots
    if (filters.date && filters.timeSlots && filters.timeSlots.length > 0) {
      result = result.filter((p) => {
        const performerSlots = availability[p.id] || [];
        // Check if performer has at least one of the selected time slots available
        return filters.timeSlots!.some(selectedTime => 
          performerSlots.some(slot => slot.start_time.startsWith(selectedTime.slice(0, 5)))
        );
      });
    }

    // Sort
    switch (filters.sortBy) {
      case 'rating':
        result.sort((a, b) => Number(b.rating_average) - Number(a.rating_average));
        break;
      case 'price_asc':
        result.sort((a, b) => (a.price_from ?? a.base_price) - (b.price_from ?? b.base_price));
        break;
      case 'price_desc':
        result.sort((a, b) => (b.price_from ?? b.base_price) - (a.price_from ?? a.base_price));
        break;
      case 'reviews':
        result.sort((a, b) => (b.rating_count ?? 0) - (a.rating_count ?? 0));
        break;
    }

    return result;
  }, [performers, filters, availability]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.district) count++;
    if (filters.date) count++;
    if (filters.timeSlots?.length) count++;
    if (filters.priceFrom || filters.priceTo) count++;
    if (filters.performerType?.length) count++;
    if (filters.eventFormat?.length) count++;
    if (filters.hasVideo) count++;
    if (filters.minRating) count++;
    return count;
  }, [filters]);

  const clearFilters = () => {
    setFilters({ sortBy: 'rating' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead 
        title="Каталог Дедов Морозов"
        description="Выберите проверенного Деда Мороза или Снегурочку в Бишкеке. Фильтры по району, цене и рейтингу. Отзывы реальных клиентов."
        keywords="каталог дед мороз, снегурочка бишкек, заказать деда мороза, новогодние персонажи"
      />
      <Header />
      <main className="flex-1">
        {/* Page Header */}
        <div className="bg-primary py-12">
          <div className="container">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-white mb-2">
              Каталог исполнителей
            </h1>
            <p className="text-white/70">
              {loading ? 'Загрузка...' : `${filteredPerformers.length} исполнителей`}
            </p>
          </div>
        </div>

        <div className="container py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Desktop Filters Sidebar */}
            <aside className="hidden lg:block w-72 flex-shrink-0">
              <div className="sticky top-24">
                <CatalogFilters
                  filters={filters}
                  districts={districts}
                  onFiltersChange={setFilters}
                  onClear={clearFilters}
                />
              </div>
            </aside>

            {/* Mobile Filters */}
            <div className="lg:hidden flex items-center gap-4 mb-4">
              <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="flex-1">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Фильтры
                    {activeFiltersCount > 0 && (
                      <span className="ml-2 w-5 h-5 rounded-full bg-accent text-white text-xs flex items-center justify-center">
                        {activeFiltersCount}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-full sm:max-w-md overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Фильтры</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <CatalogFilters
                      filters={filters}
                      districts={districts}
                      onFiltersChange={setFilters}
                      onClear={() => {
                        clearFilters();
                        setIsFilterOpen(false);
                      }}
                      onApply={() => setIsFilterOpen(false)}
                    />
                  </div>
                </SheetContent>
              </Sheet>

              {/* Sort Select */}
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as Filters['sortBy'] })}
                className="flex-1 h-10 px-4 rounded-lg border border-input bg-background text-sm"
              >
                <option value="rating">По рейтингу</option>
                <option value="price_asc">Сначала дешевле</option>
                <option value="price_desc">Сначала дороже</option>
                <option value="reviews">По отзывам</option>
              </select>
            </div>

            {/* Results */}
            <div className="flex-1">
              {/* Active filters chips */}
              {activeFiltersCount > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {filters.district && (
                    <FilterChip
                      label={districts.find((d) => d.slug === filters.district)?.name || ''}
                      onRemove={() => setFilters({ ...filters, district: undefined })}
                    />
                  )}
                  {filters.date && (
                    <FilterChip
                      label={new Date(filters.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                      onRemove={() => setFilters({ ...filters, date: undefined })}
                    />
                  )}
                  {filters.timeSlots && filters.timeSlots.length > 0 && (
                    <FilterChip
                      label={`Время: ${filters.timeSlots.length} ч.`}
                      onRemove={() => setFilters({ ...filters, timeSlots: undefined })}
                    />
                  )}
                  {filters.hasVideo && (
                    <FilterChip
                      label="С видео"
                      onRemove={() => setFilters({ ...filters, hasVideo: false })}
                    />
                  )}
                  {filters.minRating && (
                    <FilterChip
                      label={`Рейтинг ${filters.minRating}+`}
                      onRemove={() => setFilters({ ...filters, minRating: undefined })}
                    />
                  )}
                  <button
                    onClick={clearFilters}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Сбросить все
                  </button>
                </div>
              )}

              {/* Loading */}
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredPerformers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredPerformers.map((performer, index) => (
                    <div
                      key={performer.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <PerformerCard 
                        performer={performer} 
                        districts={districts}
                        pendingRequestsCount={pendingRequests[performer.id] || 0}
                        availableSlots={filters.date ? availability[performer.id] : undefined}
                        selectedDate={filters.date}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <p className="text-lg text-muted-foreground mb-4">
                    {performers.length === 0 
                      ? 'Пока нет зарегистрированных исполнителей'
                      : 'По вашим критериям исполнители не найдены'
                    }
                  </p>
                  {performers.length > 0 && (
                    <Button variant="outline" onClick={clearFilters}>
                      Сбросить фильтры
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary text-sm">
      {label}
      <button onClick={onRemove} className="hover:text-destructive transition-colors">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

export default Catalog;