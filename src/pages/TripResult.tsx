import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MapPin, Calendar, Wallet, ArrowLeft, Share2, Download, 
  Bus, Plane, Train, Utensils, Bed, Camera, ShoppingBag,
  Clock, ChevronRight, Navigation
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import TripResultTimeline from '@/components/trip-result/TripResultTimeline';
import TripResultMap from '@/components/trip-result/TripResultMap';

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
  const [trip, setTrip] = useState<TripData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(1);
  const [activeTab, setActiveTab] = useState<'timeline' | 'map'>('timeline');

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
          // Validate that it's a proper trip plan
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
    // TODO: Implement PDF export
    toast({
      title: 'Coming soon! 📄',
      description: 'PDF download will be available soon.',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent"
        />
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
  const currentDayData = trip_plan.itinerary.find(d => d.day === activeDay) || trip_plan.itinerary[0];

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

  const currencySymbol = getCurrencySymbol(trip_plan.currency);
  const budgetDiff = trip.budget - trip_plan.total_estimated_cost;
  const budgetStatus = budgetDiff >= 0 ? 'under' : 'over';

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Banner */}
      <div className="relative h-[280px] md:h-[350px] overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://source.unsplash.com/1600x900/?${encodeURIComponent(trip.destination)},travel')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        
        {/* Header Actions */}
        <div className="absolute top-0 left-0 right-0 p-4 md:p-6 flex justify-between items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
            className="w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              className="w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
            >
              <Share2 className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              className="w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
            >
              <Download className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Trip Title */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-foreground font-display mb-2">
              {trip_plan.trip_title}
            </h1>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                {trip.destination}
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="w-4 h-4 text-primary" />
                {trip.start_date && trip.end_date && (
                  <>
                    {format(new Date(trip.start_date), 'MMM d')} - {format(new Date(trip.end_date), 'MMM d, yyyy')}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Budget Summary Bar */}
      <div className="border-b border-border bg-card/50">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div>
                <div className="text-xs text-muted-foreground">Total Estimated</div>
                <div className="text-lg font-bold font-mono text-foreground">
                  {currencySymbol}{trip_plan.total_estimated_cost.toLocaleString()}
                </div>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <div className="text-xs text-muted-foreground">Your Budget</div>
                <div className="text-lg font-bold font-mono text-foreground">
                  {currencySymbol}{trip.budget?.toLocaleString()}
                </div>
              </div>
            </div>
            
            <div className={`px-4 py-2 rounded-full text-sm font-medium ${
              budgetStatus === 'under' 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-red-500/20 text-red-400'
            }`}>
              {budgetStatus === 'under' 
                ? `${currencySymbol}${Math.abs(budgetDiff).toLocaleString()} under budget ✓`
                : `${currencySymbol}${Math.abs(budgetDiff).toLocaleString()} over budget`
              }
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
        {/* Mobile Tabs */}
        <div className="md:hidden mb-4">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'timeline' | 'map')}>
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="timeline" className="gap-2">
                📋 Timeline
              </TabsTrigger>
              <TabsTrigger value="map" className="gap-2">
                🗺️ Map
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="timeline" className="mt-4">
              <TripResultTimeline
                itinerary={trip_plan.itinerary}
                activeDay={activeDay}
                onDayChange={setActiveDay}
                currencySymbol={currencySymbol}
              />
            </TabsContent>
            
            <TabsContent value="map" className="mt-4">
              <div className="h-[500px] rounded-xl overflow-hidden">
                <TripResultMap
                  activities={currentDayData?.activities || []}
                  destination={trip.destination}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Desktop Split View */}
        <div className="hidden md:grid md:grid-cols-5 gap-6">
          <div className="col-span-3">
            <TripResultTimeline
              itinerary={trip_plan.itinerary}
              activeDay={activeDay}
              onDayChange={setActiveDay}
              currencySymbol={currencySymbol}
            />
          </div>
          <div className="col-span-2">
            <div className="sticky top-6 h-[calc(100vh-200px)] rounded-xl overflow-hidden border border-border">
              <TripResultMap
                activities={currentDayData?.activities || []}
                destination={trip.destination}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripResult;
