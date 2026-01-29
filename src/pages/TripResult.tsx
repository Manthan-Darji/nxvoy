import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MapPin, Calendar, ArrowLeft, Share2, Download, 
  Wallet, Map as MapIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import TripResultTimeline from '@/components/trip-result/TripResultTimeline';
import TripResultMap from '@/components/trip-result/TripResultMap';
import { Card, CardContent } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';

interface TripActivity {
  time: string;
  activity: string;
  location_name: string;
  location_address?: string;
  cost: number;
  type: 'transport' | 'food' | 'sightseeing' | 'stay' | 'activity';
  duration_minutes?: number;
  notes?: string;
  transport_details?: {
    provider: string;
    from: string;
    to: string;
    booking_link?: string;
  };
}

interface TripDay {
  day: number;
  date: string;
  title: string;
  activities: TripActivity[];
}

interface TripPlan {
  trip_title: string;
  total_estimated_cost: number;
  currency: string;
  budget_status: string;
  budget_message?: string;
  itinerary: TripDay[];
}

interface TripData {
  id: string;
  destination: string;
  start_date: string;
  end_date: string;
  budget: number;
  notes: string;
  status: string;
  trip_plan?: TripPlan;
}

const TripResult = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [trip, setTrip] = useState<TripData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(1);
  const [showMap, setShowMap] = useState(false);
  
  const lottieRef = useRef<HTMLDivElement>(null);

  // Load dotlottie-wc script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@lottiefiles/dotlottie-wc@0.8.11/dist/dotlottie-wc.js';
    script.type = 'module';
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  useEffect(() => {
    fetchTrip();
  }, [tripId]);

  const fetchTrip = async () => {
    if (!tripId) return;

    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        toast({
          title: 'Trip not found',
          description: 'The trip you are looking for does not exist.',
          variant: 'destructive',
        });
        navigate('/dashboard');
        return;
      }

      // Parse trip plan from notes if it exists
      let tripPlan: TripPlan | undefined;
      if (data.notes) {
        try {
          const parsed = JSON.parse(data.notes);
          if (parsed && parsed.trip_title && Array.isArray(parsed.itinerary)) {
            tripPlan = parsed;
          } else {
            console.warn('[TripResult] Notes exists but is not a valid trip plan');
          }
        } catch (parseError) {
          console.error('[TripResult] Failed to parse trip notes:', parseError);
        }
      }

      if (!tripPlan) {
        toast({
          title: 'Trip data incomplete',
          description: 'This trip\'s itinerary could not be loaded. Please try generating a new trip.',
          variant: 'destructive',
        });
        navigate('/dashboard');
        return;
      }

      setTrip({ ...data, trip_plan: tripPlan });
    } catch (error) {
      console.error('Error fetching trip:', error);
      toast({
        title: 'Error',
        description: 'Failed to load trip details',
        variant: 'destructive',
      });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: 'Link copied! 🎒',
        description: 'Share this link with your travel buddies!',
      });
    } catch {
      toast({
        title: 'Unable to copy',
        description: 'Please copy the URL manually',
        variant: 'destructive',
      });
    }
  };

  const handleDownload = () => {
    toast({
      title: 'Coming soon! 📄',
      description: 'PDF download will be available soon.',
    });
  };

  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = {
      INR: '₹',
      USD: '$',
      EUR: '€',
      GBP: '£',
      AED: 'د.إ',
    };
    return symbols[currency] || currency;
  };

  // Get activities for current day (for map)
  const getCurrentDayActivities = () => {
    if (!trip?.trip_plan) return [];
    const currentDay = trip.trip_plan.itinerary.find(d => d.day === activeDay);
    return currentDay?.activities || [];
  };

  // Loading state with bus Lottie animation
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div 
          ref={lottieRef}
          dangerouslySetInnerHTML={{
            __html: `<dotlottie-wc src="https://lottie.host/51b77627-2c12-4acd-85b0-bb49f2186269/FjOvjBqyGn.lottie" style="width: 200px; height: 200px" autoplay loop></dotlottie-wc>`
          }}
        />
        <p className="text-muted-foreground animate-pulse">Loading your adventure...</p>
      </div>
    );
  }

  if (!trip || !trip.trip_plan) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <h2 className="text-2xl font-bold text-foreground mb-4">Trip not found</h2>
        <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
      </div>
    );
  }

  const { trip_plan } = trip;
  const currencySymbol = getCurrencySymbol(trip_plan.currency);
  const budgetDiff = trip.budget - trip_plan.total_estimated_cost;
  const budgetStatus = budgetDiff >= 0 ? 'under' : 'over';

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <h1 className="text-lg font-semibold text-foreground truncate max-w-[200px] sm:max-w-none">
            {trip_plan.trip_title}
          </h1>

          <div className="flex gap-1">
            {/* Mobile map toggle */}
            {isMobile && (
              <Button
                variant={showMap ? "default" : "ghost"}
                size="icon"
                onClick={() => setShowMap(!showMap)}
                className="rounded-full"
              >
                <MapIcon className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              className="rounded-full"
            >
              <Share2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              className="rounded-full"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - Split Layout */}
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-57px)]">
        {/* Left Column - Itinerary (Scrollable) */}
        <div className={`
          w-full lg:w-[55%] xl:w-[50%] 
          ${isMobile && showMap ? 'hidden' : 'block'}
          overflow-y-auto
        `}>
          <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
            {/* Trip Info Card with Bus Animation */}
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
                  {/* Small Bus Animation - decorative in header */}
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none hidden sm:block">
                    <div 
                      dangerouslySetInnerHTML={{
                        __html: `<dotlottie-wc src="https://lottie.host/51b77627-2c12-4acd-85b0-bb49f2186269/FjOvjBqyGn.lottie" style="width: 100px; height: 100px" autoplay loop></dotlottie-wc>`
                      }}
                    />
                  </div>
                  
                  <div className="relative p-6 space-y-4">
                    {/* Destination & Dates */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-foreground">
                        <MapPin className="w-5 h-5 text-primary" />
                        <span className="text-xl font-bold">{trip.destination}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">
                          {trip.start_date && trip.end_date && (
                            <>
                              {format(new Date(trip.start_date), 'MMM d')} - {format(new Date(trip.end_date), 'MMM d, yyyy')}
                            </>
                          )}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                          {trip_plan.itinerary.length} days
                        </span>
                      </div>
                    </div>

                    {/* Budget Summary */}
                    <div className="flex items-center gap-4 pt-2">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <div className="text-xs text-muted-foreground">Est. Cost</div>
                          <div className="font-mono font-bold text-foreground">
                            {currencySymbol}{trip_plan.total_estimated_cost.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="h-8 w-px bg-border" />
                      
                      <div>
                        <div className="text-xs text-muted-foreground">Budget</div>
                        <div className="font-mono font-bold text-foreground">
                          {currencySymbol}{trip.budget?.toLocaleString()}
                        </div>
                      </div>
                      
                      <div className={`ml-auto px-3 py-1.5 rounded-full text-xs font-medium ${
                        budgetStatus === 'under' 
                          ? 'bg-green-500/20 text-green-600 dark:text-green-400' 
                          : 'bg-red-500/20 text-red-600 dark:text-red-400'
                      }`}>
                        {budgetStatus === 'under' 
                          ? `${currencySymbol}${Math.abs(budgetDiff).toLocaleString()} under ✓`
                          : `${currencySymbol}${Math.abs(budgetDiff).toLocaleString()} over`
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <TripResultTimeline
                itinerary={trip_plan.itinerary}
                activeDay={activeDay}
                onDayChange={setActiveDay}
                currencySymbol={currencySymbol}
              />
            </motion.div>
          </main>
        </div>

        {/* Right Column - Sticky Map */}
        <div className={`
          w-full lg:w-[45%] xl:w-[50%]
          ${isMobile && !showMap ? 'hidden' : 'block'}
          lg:sticky lg:top-[57px] lg:h-[calc(100vh-57px)]
          h-[60vh] lg:h-auto
          border-l border-border
        `}>
          <TripResultMap
            activities={getCurrentDayActivities()}
            destination={trip.destination}
          />
        </div>
      </div>
    </div>
  );
};

export default TripResult;
