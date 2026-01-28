import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const TripCardSkeleton = () => {
  return (
    <Card className="overflow-hidden glass-card border-white/10">
      {/* Image Skeleton */}
      <Skeleton className="h-48 w-full rounded-none" />

      {/* Content Section */}
      <CardContent className="p-4 space-y-4">
        {/* Date and Duration */}
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>

        {/* Budget */}
        <Skeleton className="h-4 w-24" />

        {/* Button */}
        <Skeleton className="h-10 w-full rounded-md" />
      </CardContent>
    </Card>
  );
};

export default TripCardSkeleton;
