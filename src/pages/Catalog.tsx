import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PerformerCard } from '@/components/performers/PerformerCard';
import { CatalogFilters, Filters } from '@/components/catalog/CatalogFilters';
import { supabase } from '@/integrations/supabase/client';
import { SlidersHorizontal, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import type { Database } from '@/integrations/supabase/types';

type PerformerProfile = Database['public']['Tables']['performer_profiles']['Row'];
type District = Database['public']['Tables']['districts']['Row'];
type PerformerType = Database['public']['Enums']['performer_type'];
type EventFormat = Database['public']['Enums']['event_format'];

const Catalog = () => {
  const [searchParams] = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [performers, setPerformers] = useState<PerformerProfile[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  
  const initialFilters: Filters = {
    district: searchParams.get('district') || undefined,
    date: searchParams.get('date') || undefined,
    timeSlot: (searchParams.get('time') as 'morning' | 'afternoon' | 'evening') || undefined,
    sortBy: 'rating',
  };

  const [filters, setFilters] = useState<Filters>(initialFilters);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      const [performersRes, districtsRes] = await Promise.all([
        supabase
          .from('performer_profiles')
          .select('*')
          .eq('is_active', true)
          .order('rating_average', { ascending: false }),
        supabase
          .from('districts')
          .select('*')
          .order('name'),
      ]);

      if (performersRes.data) {
        setPerformers(performersRes.data);
      }
      if (districtsRes.data) {
        setDistricts(districtsRes.data);
      }
      
      setLoading(false);
    }

    fetchData();
  }, []);

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
  }, [performers, filters]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.district) count++;
    if (filters.date) count++;
    if (filters.timeSlot) count++;
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
                      onFiltersChange={(newFilters) => {
                        setFilters(newFilters);
                      }}
                      onClear={() => {
                        clearFilters();
                        setIsFilterOpen(false);
                      }}
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
                      <PerformerCard performer={performer} districts={districts} />
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
