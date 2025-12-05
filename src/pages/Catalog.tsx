import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PerformerCard } from '@/components/performers/PerformerCard';
import { CatalogFilters } from '@/components/catalog/CatalogFilters';
import { mockPerformers, districts } from '@/data/mockData';
import { PerformerFilters, PerformerType, EventFormat } from '@/types';
import { SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

const Catalog = () => {
  const [searchParams] = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const initialFilters: PerformerFilters = {
    district: searchParams.get('district') || undefined,
    date: searchParams.get('date') || undefined,
    timeSlot: (searchParams.get('time') as 'morning' | 'afternoon' | 'evening') || undefined,
    sortBy: 'rating',
  };

  const [filters, setFilters] = useState<PerformerFilters>(initialFilters);

  const filteredPerformers = useMemo(() => {
    let result = [...mockPerformers];

    // Filter by district
    if (filters.district) {
      result = result.filter((p) => p.districts.includes(filters.district!));
    }

    // Filter by performer type
    if (filters.performerType && filters.performerType.length > 0) {
      result = result.filter((p) =>
        p.type.some((t) => filters.performerType!.includes(t))
      );
    }

    // Filter by event format
    if (filters.eventFormat && filters.eventFormat.length > 0) {
      result = result.filter((p) =>
        p.formats.some((f) => filters.eventFormat!.includes(f))
      );
    }

    // Filter by price range
    if (filters.priceFrom) {
      result = result.filter((p) => p.basePrice >= filters.priceFrom!);
    }
    if (filters.priceTo) {
      result = result.filter((p) => p.basePrice <= filters.priceTo!);
    }

    // Filter by minimum rating
    if (filters.minRating) {
      result = result.filter((p) => p.ratingAverage >= filters.minRating!);
    }

    // Filter by video presence
    if (filters.hasVideo) {
      result = result.filter((p) => p.videoGreetingUrl);
    }

    // Sort
    switch (filters.sortBy) {
      case 'rating':
        result.sort((a, b) => b.ratingAverage - a.ratingAverage);
        break;
      case 'price_asc':
        result.sort((a, b) => a.basePrice - b.basePrice);
        break;
      case 'price_desc':
        result.sort((a, b) => b.basePrice - a.basePrice);
        break;
      case 'reviews':
        result.sort((a, b) => b.ratingCount - a.ratingCount);
        break;
    }

    return result;
  }, [filters]);

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
              {filteredPerformers.length} исполнителей в Бишкеке
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
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
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

              {/* Grid */}
              {filteredPerformers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredPerformers.map((performer, index) => (
                    <div
                      key={performer.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <PerformerCard performer={performer} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <p className="text-lg text-muted-foreground mb-4">
                    По вашим критериям исполнители не найдены
                  </p>
                  <Button variant="outline" onClick={clearFilters}>
                    Сбросить фильтры
                  </Button>
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
