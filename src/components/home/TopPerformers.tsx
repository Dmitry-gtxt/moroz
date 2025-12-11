import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PerformerCard } from '@/components/performers/PerformerCard';
import { supabase } from '@/integrations/supabase/client';
import { getCommissionRate } from '@/lib/pricing';
import { ArrowRight, Loader2 } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type PerformerProfile = Database['public']['Tables']['performer_profiles']['Row'];
type District = Database['public']['Tables']['districts']['Row'];

export function TopPerformers() {
  const [performers, setPerformers] = useState<PerformerProfile[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [commissionRate, setCommissionRate] = useState(40);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [performersRes, districtsRes, rate] = await Promise.all([
        supabase
          .from('performer_profiles')
          .select('*')
          .eq('is_active', true)
          .order('rating_average', { ascending: false })
          .limit(6),
        supabase
          .from('districts')
          .select('*'),
        getCommissionRate(),
      ]);

      if (performersRes.data) {
        setPerformers(performersRes.data);
      }
      if (districtsRes.data) {
        setDistricts(districtsRes.data);
      }
      setCommissionRate(rate);
      setLoading(false);
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <section className="py-20 bg-secondary/30">
        <div className="container flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  if (performers.length === 0) {
    return null; // Don't show section if no performers
  }

  return (
    <section className="py-24 bg-secondary/30 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-10 right-10 text-6xl opacity-10 animate-float">⭐</div>
      <div className="absolute bottom-10 left-10 text-6xl opacity-10 animate-float" style={{ animationDelay: '1s' }}>🎅</div>
      
      <div className="container">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 text-gold-dark mb-4">
              <span className="text-lg">🏆</span>
              <span className="text-sm font-medium">Лучшие из лучших</span>
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
              Топ <span className="text-gradient-gold">исполнителей</span>
            </h2>
            <p className="text-muted-foreground">
              Самые высокие рейтинги и отличные отзывы
            </p>
          </div>
          <Button variant="outline" className="group" asChild>
            <Link to="/catalog">
              Смотреть всех
              <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {performers.map((performer, index) => (
            <div 
              key={performer.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <PerformerCard performer={performer} districts={districts} commissionRate={commissionRate} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
