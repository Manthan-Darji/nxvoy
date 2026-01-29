import { motion } from 'framer-motion';
import { MapPin, Calendar, Wallet } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { useDestinationPhoto } from '@/hooks/useDestinationPhoto';
import { cn } from '@/lib/utils';

interface HeroImageHeaderProps {
  destination: string;
  startDate: string | null;
  endDate: string | null;
  days: number;
  estimatedCost: number;
  budget: number | null;
  currencySymbol: string;
  budgetStatus: 'under' | 'over';
  budgetDiff: number;
}

const HeroImageHeader = ({
  destination,
  startDate,
  endDate,
  days,
  estimatedCost,
  budget,
  currencySymbol,
  budgetStatus,
  budgetDiff,
}: HeroImageHeaderProps) => {
  // Fetch hero image - this is non-blocking
  const { photoUrl, isLoading } = useDestinationPhoto(destination);

  return (
    <Card className="overflow-hidden mb-6">
      <CardContent className="p-0">
        {/* Always render the container - never block */}
        <div className="relative h-64 sm:h-80 w-full bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
          {/* Hero Image Background - Optional overlay that fades in */}
          {photoUrl && (
            <motion.img
              src={photoUrl}
              alt={destination}
              className="absolute inset-0 w-full h-full object-cover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              onError={(e) => {
                // Hide image if it fails to load
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          
          {/* Dark overlay for text readability - only when image is present */}
          {photoUrl && (
            <div className="absolute inset-0 bg-black/50" />
          )}

          {/* Content Overlay - Always visible */}
          <div className="relative z-10 flex items-start gap-4 p-6 h-full">
            {/* Bus Animation - Only show when no hero image */}
            {!photoUrl && (
              <div className="flex-shrink-0 hidden sm:block">
                <div 
                  dangerouslySetInnerHTML={{
                    __html: `<dotlottie-wc src="https://lottie.host/51b77627-2c12-4acd-85b0-bb49f2186269/FjOvjBqyGn.lottie" style="width: 100px; height: 100px" autoplay loop></dotlottie-wc>`
                  }}
                />
              </div>
            )}

            {/* Trip Info - Always rendered */}
            <div className="flex-1 space-y-3">
              {/* Destination & Dates */}
              <div>
                <div className={cn(
                  "flex items-center gap-2",
                  photoUrl ? "text-white" : "text-foreground"
                )}>
                  <MapPin className={cn(
                    "w-5 h-5",
                    photoUrl ? "text-white" : "text-primary"
                  )} />
                  <span className="text-xl sm:text-2xl font-bold">{destination}</span>
                </div>
                <div className={cn(
                  "flex items-center gap-2 mt-1",
                  photoUrl ? "text-white/90" : "text-muted-foreground"
                )}>
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">
                    {startDate && endDate && (
                      <>
                        {format(new Date(startDate), 'MMM d')} - {format(new Date(endDate), 'MMM d, yyyy')}
                      </>
                    )}
                  </span>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    photoUrl 
                      ? "bg-white/20 text-white" 
                      : "bg-muted"
                  )}>
                    {days} days
                  </span>
                </div>
              </div>

              {/* Budget Summary */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Wallet className={cn(
                    "w-4 h-4",
                    photoUrl ? "text-white/80" : "text-muted-foreground"
                  )} />
                  <div>
                    <div className={cn(
                      "text-xs",
                      photoUrl ? "text-white/80" : "text-muted-foreground"
                    )}>Est. Cost</div>
                    <div className={cn(
                      "font-mono font-bold",
                      photoUrl ? "text-white" : "text-foreground"
                    )}>
                      {currencySymbol}{estimatedCost.toLocaleString()}
                    </div>
                  </div>
                </div>
                
                <div className={cn(
                  "h-8 w-px hidden sm:block",
                  photoUrl ? "bg-white/30" : "bg-border"
                )} />
                
                {budget && (
                  <>
                    <div>
                      <div className={cn(
                        "text-xs",
                        photoUrl ? "text-white/80" : "text-muted-foreground"
                      )}>Budget</div>
                      <div className={cn(
                        "font-mono font-bold",
                        photoUrl ? "text-white" : "text-foreground"
                      )}>
                        {currencySymbol}{budget.toLocaleString()}
                      </div>
                    </div>
                    
                    <div className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium",
                      budgetStatus === 'under' 
                        ? photoUrl
                          ? 'bg-green-500/30 text-white border border-green-400/50'
                          : 'bg-green-500/20 text-green-600 dark:text-green-400'
                        : photoUrl
                          ? 'bg-red-500/30 text-white border border-red-400/50'
                          : 'bg-red-500/20 text-red-600 dark:text-red-400'
                    )}>
                      {budgetStatus === 'under' 
                        ? `${currencySymbol}${Math.abs(budgetDiff).toLocaleString()} under ✓`
                        : `${currencySymbol}${Math.abs(budgetDiff).toLocaleString()} over`
                      }
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HeroImageHeader;
