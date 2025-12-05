import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PerformerCard } from '@/components/performers/PerformerCard';
import { mockPerformers } from '@/data/mockData';
import { ArrowRight } from 'lucide-react';

export function TopPerformers() {
  // Get top 6 performers by rating
  const topPerformers = [...mockPerformers]
    .sort((a, b) => b.ratingAverage - a.ratingAverage)
    .slice(0, 6);

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
          {topPerformers.map((performer, index) => (
            <div 
              key={performer.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <PerformerCard performer={performer} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
