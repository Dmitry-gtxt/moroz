import { useState, useEffect, useRef, TouchEvent } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { getCustomerPrice, getCommissionRate } from '@/lib/pricing';
import { format, addDays, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale/ru';
import { ChevronLeft, ChevronRight, Flame, Snowflake } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DayPrice {
  date: Date;
  avgPrice: number | null;
  minPrice: number | null;
  slotsCount: number;
  isHoliday: boolean;
}

export function PriceCalendarStrip() {
  const [dayPrices, setDayPrices] = useState<DayPrice[]>([]);
  const [commissionRate, setCommissionRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  // Generate dates from today + 15 days
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = today;
  const endDate = addDays(today, 15);
  
  // Holiday dates (Dec 31, Jan 1, Jan 7)
  const holidayDates = [
    new Date(2025, 11, 31),
    new Date(2026, 0, 1),
    new Date(2026, 0, 7),
  ];

  useEffect(() => {
    async function fetchPrices() {
      const [rate] = await Promise.all([getCommissionRate()]);
      setCommissionRate(rate);

      // First fetch only published performers (is_active=true AND verification_status='verified')
      const { data: publishedPerformers } = await supabase
        .from('performer_profiles')
        .select('id, base_price')
        .eq('is_active', true)
        .eq('verification_status', 'verified');

      const publishedPerformerIds = publishedPerformers?.map(p => p.id) || [];
      const performerPrices = new Map(publishedPerformers?.map(p => [p.id, p.base_price]) || []);

      if (publishedPerformerIds.length === 0) {
        setDayPrices([]);
        setLoading(false);
        return;
      }

      // Fetch free slots in date range ONLY from published performers
      // Note: We need to handle the 1000 row default limit
      const { data: freeSlots } = await supabase
        .from('availability_slots')
        .select('id, date, price, performer_id, status')
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'))
        .eq('status', 'free')
        .in('performer_id', publishedPerformerIds)
        .limit(5000);

      // Fetch booked slots that have unconfirmed bookings (pending or counter_proposed)
      const { data: bookedSlots } = await supabase
        .from('availability_slots')
        .select('id, date, price, performer_id, status')
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'))
        .eq('status', 'booked')
        .in('performer_id', publishedPerformerIds)
        .limit(5000);

      // Get bookings for booked slots to check their status
      const bookedSlotIds = bookedSlots?.map(s => s.id) || [];
      let unconfirmedBookedSlots: typeof bookedSlots = [];
      
      if (bookedSlotIds.length > 0) {
        const { data: bookings } = await supabase
          .from('bookings')
          .select('slot_id, status')
          .in('slot_id', bookedSlotIds)
          .in('status', ['pending', 'counter_proposed']);
        
        const unconfirmedSlotIds = new Set(bookings?.map(b => b.slot_id) || []);
        unconfirmedBookedSlots = bookedSlots?.filter(s => unconfirmedSlotIds.has(s.id)) || [];
      }

      // Combine free slots and unconfirmed booked slots
      const availableSlots = [...(freeSlots || []), ...unconfirmedBookedSlots];
      
      // Debug: log slots count
      console.log('PriceCalendarStrip: free slots fetched:', freeSlots?.length || 0);
      console.log('PriceCalendarStrip: date range in response:', [...new Set(freeSlots?.map(s => s.date) || [])].sort());

      // Generate days array
      const days: DayPrice[] = [];
      let currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        const daySlots = availableSlots?.filter(s => s.date === dateStr) || [];
        
        // Group slots by performer and get min price for each performer
        const performerMinPrices = new Map<string, number>();
        daySlots.forEach(slot => {
          const slotPrice = slot.price ?? performerPrices.get(slot.performer_id) ?? 3000;
          const currentMin = performerMinPrices.get(slot.performer_id);
          if (currentMin === undefined || slotPrice < currentMin) {
            performerMinPrices.set(slot.performer_id, slotPrice);
          }
        });
        
        const performerPricesList = Array.from(performerMinPrices.values());
        // Average price across unique performers (not slots)
        const avgPrice = performerPricesList.length > 0 
          ? Math.round(performerPricesList.reduce((a, b) => a + b, 0) / performerPricesList.length) 
          : null;
        const minPrice = performerPricesList.length > 0 ? Math.min(...performerPricesList) : null;
        
        const isHoliday = holidayDates.some(h => isSameDay(h, currentDate));
        
        days.push({
          date: new Date(currentDate),
          avgPrice,
          minPrice,
          slotsCount: daySlots.length,
          isHoliday,
        });
        
        currentDate = addDays(currentDate, 1);
      }

      setDayPrices(days);
      setLoading(false);
    }

    fetchPrices();
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Touch swipe handlers for mobile
  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const swipeThreshold = 50;
    const diff = touchStartX.current - touchEndX.current;
    
    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        scroll('right');
      } else {
        scroll('left');
      }
    }
  };

  // Find min and max average prices for gradient coloring
  const pricesWithValue = dayPrices.filter(d => d.avgPrice !== null);
  const minPriceOverall = pricesWithValue.length > 0 ? Math.min(...pricesWithValue.map(d => d.avgPrice!)) : 0;
  const maxPriceOverall = pricesWithValue.length > 0 ? Math.max(...pricesWithValue.map(d => d.avgPrice!)) : 0;

  const getPriceColor = (price: number | null) => {
    if (price === null) return 'bg-muted';
    if (maxPriceOverall === minPriceOverall) return 'bg-green-500';
    
    const ratio = (price - minPriceOverall) / (maxPriceOverall - minPriceOverall);
    
    if (ratio < 0.33) return 'bg-green-500';
    if (ratio < 0.66) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getPriceIntensity = (price: number | null) => {
    if (price === null) return 'opacity-30';
    if (maxPriceOverall === minPriceOverall) return 'opacity-100';
    
    const ratio = (price - minPriceOverall) / (maxPriceOverall - minPriceOverall);
    return ratio > 0.7 ? 'opacity-100' : ratio > 0.4 ? 'opacity-80' : 'opacity-60';
  };

  if (loading) {
    return (
      <div className="bg-card border-y border-border py-4">
        <div className="container">
          <div className="h-20 animate-pulse bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-card to-background border-y border-border py-4 overflow-hidden">
      <div className="container">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <h3 className="font-display font-semibold text-foreground">Цены на праздники</h3>
            <div className="flex items-center gap-3 sm:gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500" /> Низкие
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-500" /> Средние
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500" /> Высокие
              </span>
            </div>
          </div>
          <div className="hidden md:flex gap-2">
            <button
              onClick={() => scroll('left')}
              className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable days */}
        <div 
          ref={scrollContainerRef}
          className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 touch-pan-x"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {dayPrices.map((day, index) => {
            const customerPrice = day.avgPrice && commissionRate !== null ? getCustomerPrice(day.avgPrice, commissionRate) : null;
            const isToday = isSameDay(day.date, new Date());
            const isNewYear = isSameDay(day.date, new Date(2026, 0, 1));
            const isNYE = isSameDay(day.date, new Date(2025, 11, 31));
            
            return (
              <Link
                key={index}
                to={`/catalog?date=${format(day.date, 'yyyy-MM-dd')}`}
                className={cn(
                  "flex-shrink-0 w-16 rounded-xl p-2 transition-all hover:scale-105 hover:shadow-lg cursor-pointer",
                  day.isHoliday ? "ring-2 ring-accent ring-offset-2 ring-offset-background" : "",
                  isToday ? "bg-accent/10" : "bg-card border border-border/50"
                )}
              >
                {/* Date */}
                <div className="text-center mb-1.5">
                  <div className="text-[10px] uppercase text-muted-foreground">
                    {format(day.date, 'EEE', { locale: ru })}
                  </div>
                  <div className={cn(
                    "text-sm font-semibold",
                    day.isHoliday ? "text-accent" : "text-foreground"
                  )}>
                    {format(day.date, 'd')}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {format(day.date, 'MMM', { locale: ru })}
                  </div>
                </div>

                {/* Price bar */}
                <div className={cn(
                  "h-1.5 rounded-full mb-1.5",
                  getPriceColor(day.avgPrice),
                  getPriceIntensity(day.avgPrice)
                )} />

                {/* Price */}
                <div className="text-center">
                  {customerPrice ? (
                    <div className="text-xs font-medium text-foreground">
                      {(customerPrice / 1000).toFixed(1)}к
                    </div>
                  ) : (
                    <div className="text-[10px] text-muted-foreground">—</div>
                  )}
                  {day.slotsCount > 0 && (
                    <div className="text-[9px] text-muted-foreground">
                      {day.slotsCount} слот{day.slotsCount === 1 ? '' : day.slotsCount < 5 ? 'а' : 'ов'}
                    </div>
                  )}
                </div>

                {/* Holiday indicator */}
                {(isNYE || isNewYear) && (
                  <div className="flex justify-center mt-1">
                    {isNYE ? (
                      <Flame className="h-3 w-3 text-orange-500" />
                    ) : (
                      <Snowflake className="h-3 w-3 text-blue-400" />
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        {/* Footer hint */}
        <p className="text-xs text-muted-foreground text-center mt-2">
          Нажмите на дату для просмотра доступных исполнителей
        </p>
      </div>
    </div>
  );
}