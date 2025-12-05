import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PerformerCard } from '@/components/performers/PerformerCard';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight, Loader2 } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type PerformerProfile = Database['public']['Tables']['performer_profiles']['Row'];
type District = Database['public']['Tables']['districts']['Row'];

export function TopPerformers() {
  const [performers, setPerformers] = useState<PerformerProfile[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [performersRes, districtsRes] = await Promise.all([
        supabase
          .from('performer_profiles')
          .select('*')
          .eq('is_active', true)
          .order('rating_average', { ascending: false })
          .limit(6),
        supabase
          .from('districts')
          .select('*'),
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
    <section className="py-20 bg-secondary/30">
      <div className="container">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
              Лучшие исполнители
            </h2>
            <p className="text-muted-foreground">
              Самые высокие рейтинги и отличные отзывы
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/catalog">
              Смотреть всех
              <ArrowRight className="h-4 w-4 ml-1" />
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
              <PerformerCard performer={performer} districts={districts} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
