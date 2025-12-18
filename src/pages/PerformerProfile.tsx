import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { getCustomerPrice, getCommissionRate } from '@/lib/pricing';
import { cleanVerificationPhone } from '@/lib/utils';
import { 
  Star, MapPin, Clock, Users, Video, CheckCircle, 
  ChevronLeft, ChevronRight, Calendar, Play, MessageCircle, Loader2, X
} from 'lucide-react';
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isBefore, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Database } from '@/integrations/supabase/types';

type PerformerProfileType = Database['public']['Tables']['performer_profiles']['Row'];
type District = Database['public']['Tables']['districts']['Row'];
type AvailabilitySlot = Database['public']['Tables']['availability_slots']['Row'] & {
  price?: number | null;
};
type Review = Database['public']['Tables']['reviews']['Row'];

const performerTypeLabels: Record<string, string> = {
  ded_moroz: 'Дед Мороз',
  snegurochka: 'Снегурочка',
  santa: 'Санта-Клаус',
  duo: 'Дуэт',
};

const formatLabels: Record<string, string> = {
  home: 'На дом',
  kindergarten: 'Детский сад',
  school: 'Школа',
  office: 'Офис',
  corporate: 'Корпоратив',
  outdoor: 'На улице',
};

const PerformerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  
  const [performer, setPerformer] = useState<PerformerProfileType | null>(null);
  const [districts, setDistricts] = useState<District[]>([]);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [pendingSlotIds, setPendingSlotIds] = useState<Set<string>>(new Set());
  const [reviews, setReviews] = useState<Review[]>([]);
  const [commissionRate, setCommissionRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [videoWatched, setVideoWatched] = useState(false);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd || !performer?.photo_urls) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      setCurrentPhotoIndex(prev => 
        prev === performer.photo_urls!.length - 1 ? 0 : prev + 1
      );
    }
    if (isRightSwipe) {
      setCurrentPhotoIndex(prev => 
        prev === 0 ? performer.photo_urls!.length - 1 : prev - 1
      );
    }
  };

  useEffect(() => {
    async function fetchData() {
      if (!id) return;

      const [performerRes, districtsRes, slotsRes, reviewsRes, rate] = await Promise.all([
        supabase.from('performer_profiles').select('*').eq('id', id).maybeSingle(),
        supabase.from('districts').select('*'),
        supabase.from('availability_slots').select('*').eq('performer_id', id).eq('status', 'free').gte('date', format(new Date(), 'yyyy-MM-dd')),
        supabase.from('reviews').select('*').eq('performer_id', id).eq('is_visible', true).order('created_at', { ascending: false }),
        getCommissionRate(),
      ]);

      if (performerRes.data) setPerformer(performerRes.data);
      if (districtsRes.data) setDistricts(districtsRes.data);
      if (slotsRes.data) {
        setSlots(slotsRes.data);
        
        // Check which slots have pending or counter_proposed bookings
        const slotIds = slotsRes.data.map(s => s.id);
        if (slotIds.length > 0) {
          // Check bookings table for pending bookings
          const { data: pendingBookings } = await supabase
            .from('bookings')
            .select('slot_id')
            .in('slot_id', slotIds)
            .in('status', ['pending', 'counter_proposed', 'customer_accepted']);
          
          // Also check booking_proposals for slots proposed to customers
          const { data: proposedSlots } = await supabase
            .from('booking_proposals')
            .select('slot_id')
            .in('slot_id', slotIds)
            .eq('status', 'pending');
          
          const pendingIds = new Set<string>();
          pendingBookings?.forEach(b => b.slot_id && pendingIds.add(b.slot_id));
          proposedSlots?.forEach(p => p.slot_id && pendingIds.add(p.slot_id));
          
          setPendingSlotIds(pendingIds);
        }
      }
      if (reviewsRes.data) setReviews(reviewsRes.data);
      setCommissionRate(rate);
      
      setLoading(false);
    }

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!performer) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Исполнитель не найден</h1>
            <Button asChild>
              <Link to="/catalog">Вернуться в каталог</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const getDistrictNames = (slugs: string[]) => {
    return slugs
      .map((slug) => districts.find((d) => d.slug === slug)?.name)
      .filter(Boolean)
      .join(', ');
  };

  // Calendar logic
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getSlotsForDate = (dateStr: string) => {
    return slots.filter((s) => s.date === dateStr);
  };

  const hasAvailableSlots = (dateStr: string) => {
    return getSlotsForDate(dateStr).length > 0;
  };

  // Get price range for a date
  const getPriceRangeForDate = (dateStr: string) => {
    const dateSlots = getSlotsForDate(dateStr);
    if (dateSlots.length === 0) return null;
    
    const prices = dateSlots.map(s => s.price ?? performer.base_price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    return { min: getCustomerPrice(minPrice, commissionRate), max: getCustomerPrice(maxPrice, commissionRate) };
  };

  // Get slot price
  const getSlotCustomerPrice = (slot: AvailabilitySlot) => {
    const slotPrice = slot.price ?? performer.base_price;
    return getCustomerPrice(slotPrice, commissionRate);
  };

  const availableSlotsForSelectedDate = selectedDate ? getSlotsForDate(selectedDate) : [];
  const selectedDatePriceRange = selectedDate ? getPriceRangeForDate(selectedDate) : null;
  const photoUrl = performer.photo_urls?.[0] || 'https://images.unsplash.com/photo-1576919228236-a097c32a5cd4?w=400&h=400&fit=crop';
  
  // Get min price for display (from all slots or base price)
  const allPrices = slots.map(s => s.price ?? performer.base_price);
  const minPerformerPrice = allPrices.length > 0 ? Math.min(...allPrices) : performer.base_price;
  const customerPriceFrom = getCustomerPrice(minPerformerPrice, commissionRate);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead 
        title={performer.display_name}
        description={`Закажите ${performer.display_name} в Самаре. Рейтинг ${Number(performer.rating_average).toFixed(1)}, ${performer.rating_count ?? 0} отзывов. Цена от ${customerPriceFrom.toLocaleString()} ₽.`}
        type="profile"
      />
      <Header />
      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="bg-card border-b border-border">
          <div className="container py-3">
            <nav className="flex items-center text-sm overflow-x-auto">
              <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap">
                Главная
              </Link>
              <span className="text-muted-foreground/40 mx-3">/</span>
              <Link to="/catalog" className="text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap">
                Каталог
              </Link>
              <span className="text-muted-foreground/40 mx-3">/</span>
              <span className="text-foreground font-medium truncate max-w-[200px] sm:max-w-none">{performer.display_name}</span>
            </nav>
          </div>
        </div>

        <div className="container py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Header */}
              <div className="flex flex-col md:flex-row gap-6">
                {/* Photo */}
                <div className="flex-shrink-0 w-full md:w-64">
                  <button 
                    className="relative w-full md:w-64 aspect-square rounded-2xl overflow-hidden cursor-zoom-in group"
                    onClick={() => {
                      setCurrentPhotoIndex(0);
                      setPhotoModalOpen(true);
                    }}
                  >
                    <img
                      src={photoUrl}
                      alt={performer.display_name}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    {performer.verification_status === 'verified' && (
                      <div className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                        <CheckCircle className="h-6 w-6 text-white" />
                      </div>
                    )}
                  </button>
                  {performer.video_greeting_url && performer.video_greeting_url.trim() !== '' && (
                    <Button 
                      variant="outline" 
                      className={`w-full mt-3 gap-2 border-red-300/50 bg-red-50/20 text-red-500 hover:bg-red-100/40 hover:border-red-400/60 ${!videoWatched ? 'shadow-[0_0_12px_rgba(239,68,68,0.25)]' : ''}`}
                      onClick={() => {
                        setVideoModalOpen(true);
                        setVideoWatched(true);
                      }}
                    >
                      <Play className="h-4 w-4" />
                      Смотреть видео
                    </Button>
                  )}

                  {/* Photo Gallery */}
                  {performer.photo_urls && performer.photo_urls.length > 1 && (
                    <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                      {performer.photo_urls.map((url, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setCurrentPhotoIndex(index);
                            setPhotoModalOpen(true);
                          }}
                          className={`relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                            index === 0 ? 'border-primary' : 'border-transparent hover:border-primary/50'
                          }`}
                        >
                          <img
                            src={url}
                            alt={`Фото ${index + 1}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Photo Modal */}
                  <Dialog open={photoModalOpen} onOpenChange={setPhotoModalOpen}>
                    <DialogContent className="max-w-4xl p-0 bg-black/95 border-none">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 z-10 text-white hover:bg-white/20"
                        onClick={() => setPhotoModalOpen(false)}
                      >
                        <X className="h-6 w-6" />
                      </Button>
                      
                      {performer.photo_urls && performer.photo_urls.length > 1 && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                            onClick={() => setCurrentPhotoIndex(prev => 
                              prev === 0 ? performer.photo_urls!.length - 1 : prev - 1
                            )}
                          >
                            <ChevronLeft className="h-8 w-8" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                            onClick={() => setCurrentPhotoIndex(prev => 
                              prev === performer.photo_urls!.length - 1 ? 0 : prev + 1
                            )}
                          >
                            <ChevronRight className="h-8 w-8" />
                          </Button>
                        </>
                      )}
                      
                      <div 
                        className="flex items-center justify-center min-h-[60vh]"
                        onTouchStart={onTouchStart}
                        onTouchMove={onTouchMove}
                        onTouchEnd={onTouchEnd}
                      >
                        <img
                          src={performer.photo_urls?.[currentPhotoIndex] || photoUrl}
                          alt={`${performer.display_name} - фото ${currentPhotoIndex + 1}`}
                          className="max-w-full max-h-[80vh] object-contain select-none pointer-events-none"
                          draggable={false}
                        />
                      </div>
                      
                      {performer.photo_urls && performer.photo_urls.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                          {performer.photo_urls.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentPhotoIndex(index)}
                              className={`w-2 h-2 rounded-full transition-all ${
                                index === currentPhotoIndex ? 'bg-white w-4' : 'bg-white/50 hover:bg-white/70'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>

                  {/* Video Modal */}
                  <Dialog open={videoModalOpen} onOpenChange={setVideoModalOpen}>
                    <DialogContent className="max-w-4xl p-0 bg-black/95 border-none">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 z-10 text-white hover:bg-white/20"
                        onClick={() => setVideoModalOpen(false)}
                      >
                        <X className="h-6 w-6" />
                      </Button>
                      <div className="aspect-video w-full">
                        <video
                          src={performer.video_greeting_url!}
                          controls
                          autoPlay
                          className="w-full h-full"
                        />
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {(performer.performer_types as string[])?.map((type) => (
                      <Badge key={type} variant="secondary" className="bg-accent/10 text-accent">
                        {performerTypeLabels[type] || type}
                      </Badge>
                    ))}
                    {performer.verification_status === 'verified' && (
                      <Badge className="bg-green-100 text-green-700">Проверен</Badge>
                    )}
                  </div>

                  <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
                    {performer.display_name}
                  </h1>

                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="h-5 w-5 fill-accent text-accent" />
                      <span className="font-bold text-lg">{Number(performer.rating_average).toFixed(1)}</span>
                      <span className="text-muted-foreground">({performer.rating_count ?? 0} отзывов)</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {performer.district_slugs.length > 0 && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {getDistrictNames(performer.district_slugs)}
                      </div>
                    )}
                    {performer.experience_years && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Опыт: {performer.experience_years} лет
                      </div>
                    )}
                    {performer.age && (
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {performer.age} лет
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {performer.description && cleanVerificationPhone(performer.description) && (
                <div className="bg-card rounded-2xl p-6 border border-border">
                  <h2 className="font-display text-xl font-semibold mb-4">О себе</h2>
                  <p className="text-muted-foreground whitespace-pre-line">{cleanVerificationPhone(performer.description)}</p>
                </div>
              )}

              {/* Formats */}
              {(performer.formats as string[])?.length > 0 && (
                <div className="bg-card rounded-2xl p-6 border border-border">
                  <h2 className="font-display text-xl font-semibold mb-4">Форматы мероприятий</h2>
                  <div className="flex flex-wrap gap-2">
                    {(performer.formats as string[]).map((f) => (
                      <Badge key={f} variant="secondary" className="text-sm py-1.5 px-3">
                        {formatLabels[f] || f}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}


              {/* Reviews */}
              <div className="bg-card rounded-2xl p-6 border border-border">
                <h2 className="font-display text-xl font-semibold mb-6">
                  Отзывы ({reviews.length})
                </h2>
                {reviews.length > 0 ? (
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div key={review.id} className="border-b border-border last:border-0 pb-6 last:pb-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-foreground">Клиент</p>
                            <p className="text-sm text-muted-foreground">
                              {format(parseISO(review.created_at), 'd MMMM yyyy', { locale: ru })}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating
                                    ? 'fill-accent text-accent'
                                    : 'text-muted'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {review.text && <p className="text-muted-foreground">{review.text}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Пока нет отзывов
                  </p>
                )}
              </div>
            </div>

            {/* Sidebar - Booking */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Price Card */}
                <div className="bg-card rounded-2xl p-6 border border-border shadow-lg">
                  <div className="text-center mb-6">
                    <span className="text-sm text-muted-foreground">Стоимость от</span>
                    <div className="font-display text-4xl font-bold text-accent">
                      {customerPriceFrom.toLocaleString()} 
                      <span className="text-xl font-normal text-muted-foreground"> ₽</span>
                    </div>
                    <span className="text-sm text-muted-foreground">за визит 20-30 минут</span>
                  </div>

                  {/* Calendar */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                        disabled={isBefore(addMonths(currentMonth, -1), startOfMonth(new Date()))}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="font-semibold">
                        {format(currentMonth, 'LLLL yyyy', { locale: ru })}
                      </span>
                      <button
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
                      {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => (
                        <div key={day} className="py-1 text-muted-foreground font-medium">
                          {day}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {/* Empty cells for days before month start */}
                      {[...Array((monthStart.getDay() + 6) % 7)].map((_, i) => (
                        <div key={`empty-${i}`} className="aspect-square" />
                      ))}
                      
                      {days.map((day) => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const isAvailable = hasAvailableSlots(dateStr);
                        const isPast = isBefore(day, new Date()) && !isToday(day);
                        const isSelected = selectedDate === dateStr;

                        return (
                          <button
                            key={dateStr}
                            onClick={() => {
                              if (isAvailable && !isPast) {
                                setSelectedDate(dateStr);
                                setSelectedSlot(null);
                              }
                            }}
                            disabled={!isAvailable || isPast}
                            className={`
                              aspect-square rounded-lg text-sm font-medium transition-all
                              ${isSelected ? 'bg-accent text-white' : ''}
                              ${isAvailable && !isPast && !isSelected ? 'bg-green-100 text-green-700 hover:bg-green-200' : ''}
                              ${isPast ? 'text-muted-foreground/50 cursor-not-allowed' : ''}
                              ${!isAvailable && !isPast ? 'text-muted-foreground cursor-not-allowed' : ''}
                              ${isToday(day) && !isSelected ? 'ring-2 ring-accent' : ''}
                            `}
                          >
                            {format(day, 'd')}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Time Slots */}
                  {selectedDate && (
                    <div className="mb-6">
                      <h3 className="font-semibold mb-2">
                        Доступное время на {format(parseISO(selectedDate), 'd MMMM', { locale: ru })}
                      </h3>
                      {selectedDatePriceRange && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {selectedDatePriceRange.min === selectedDatePriceRange.max 
                            ? `Цена: ${selectedDatePriceRange.min.toLocaleString()} ₽`
                            : `Цена: ${selectedDatePriceRange.min.toLocaleString()} — ${selectedDatePriceRange.max.toLocaleString()} ₽`
                          }
                        </p>
                      )}
                      {availableSlotsForSelectedDate.length > 0 ? (
                        <div className="grid grid-cols-1 gap-2">
                          {availableSlotsForSelectedDate.map((slot) => {
                            const hasPendingBooking = pendingSlotIds.has(slot.id);
                            const slotPrice = getSlotCustomerPrice(slot);
                            return (
                              <button
                                key={slot.id}
                                onClick={() => setSelectedSlot(slot.id)}
                                className={`
                                  py-2 px-3 rounded-lg text-sm font-medium transition-colors relative flex items-center justify-between
                                  ${selectedSlot === slot.id 
                                    ? 'bg-accent text-white' 
                                    : hasPendingBooking
                                      ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300'
                                      : 'bg-secondary hover:bg-secondary/80'
                                  }
                                `}
                              >
                                <span>
                                  {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                                </span>
                                <span className={`text-xs ${selectedSlot === slot.id ? 'text-white/80' : 'text-muted-foreground'}`}>
                                  {slotPrice.toLocaleString()} ₽
                                </span>
                                {hasPendingBooking && selectedSlot !== slot.id && (
                                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full" title="Есть другие заявки" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Нет свободных слотов</p>
                      )}
                      
                      {/* Warning for slots with pending bookings */}
                      {selectedSlot && pendingSlotIds.has(selectedSlot) && (
                        <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                          <p className="text-xs text-amber-800 dark:text-amber-200">
                            <strong>Внимание:</strong> У исполнителя на это время уже есть заявки, но он их пока не принял. 
                            Вы можете подать заявку на это время — исполнитель может выбрать вас или предложит другое время.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Book Button */}
                  <Button 
                    variant="gold" 
                    size="lg" 
                    className="w-full"
                    disabled={!selectedSlot}
                    asChild={!!selectedSlot}
                  >
                    {selectedSlot ? (
                      <Link to={`/booking/${performer.id}?slot=${selectedSlot}`}>
                        <Calendar className="h-5 w-5 mr-2" />
                        Забронировать
                      </Link>
                    ) : (
                      <>
                        <Calendar className="h-5 w-5 mr-2" />
                        Выберите дату и время
                      </>
                    )}
                  </Button>

                  <div className="mt-3">
                    <Button variant="outline" className="w-full" disabled>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Написать сообщение
                    </Button>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Чат доступен после подтверждения бронирования
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PerformerProfile;
