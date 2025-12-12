import { Skeleton } from '@/components/ui/skeleton';

export function PerformerCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl overflow-hidden shadow-md border border-border/50">
      {/* Image skeleton */}
      <Skeleton className="aspect-[4/3] w-full" />
      
      {/* Content */}
      <div className="p-5">
        {/* Name and rating */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-5 w-16" />
        </div>

        {/* Description */}
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-3" />

        {/* Duration */}
        <Skeleton className="h-4 w-28 mb-3" />

        {/* Districts */}
        <Skeleton className="h-4 w-40 mb-4" />

        {/* Price and action */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
