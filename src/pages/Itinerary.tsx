import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Calendar } from 'lucide-react';
import ItineraryHeader from '@/components/itinerary/ItineraryHeader';
import ItineraryTimeline from '@/components/itinerary/ItineraryTimeline';
import ItineraryMap from '@/components/itinerary/ItineraryMap';
import { Activity } from '@/components/itinerary/ActivityCard';
import { useIsMobile } from '@/hooks/use-mobile';

interface Trip {
  id: string;
  destination: string;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  notes: string | null;
  status: string | null;
}

interface ItineraryItem {
  id: string;
  day_number: number;
  title: string;
  description: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  estimated_cost: number | null;
  category: string | null;
}

interface DayData {
  day: number;
  activities: Activity[];
}

const Itinerary = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | undefined>(undefined);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }

    if (tripId && user) {
      fetchTripData();
    }
  }, [tripId, user, authLoading]);

  const fetchTripData = async () => {
    try {
      // Fetch trip
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .maybeSingle();

      if (tripError) throw tripError;
      if (!tripData) {
        setTrip(null);
        setIsLoading(false);
        return;
      }
      setTrip(tripData);

      // Fetch itinerary items
      const { data: itineraryData, error: itineraryError } = await supabase
        .from('itineraries')
        .select('*')
        .eq('trip_id', tripId)
        .order('day_number', { ascending: true })
        .order('start_time', { ascending: true });

      if (itineraryError) throw itineraryError;
      setItinerary(itineraryData || []);
    } catch (error) {
      console.error('Failed to fetch trip data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Transform itinerary items to DayData format with IDs
  const days: DayData[] = useMemo(() => {
    const grouped = itinerary.reduce((acc, item) => {
      const day = item.day_number;
      if (!acc[day]) acc[day] = [];
      acc[day].push(item);
      return acc;
    }, {} as Record<number, ItineraryItem[]>);

    return Object.entries(grouped).map(([day, items]) => ({
      day: parseInt(day),
      activities: items.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description || '',
        startTime: item.start_time || '09:00',
        endTime: item.end_time || '12:00',
        location: item.location || '',
        latitude: item.latitude,
        longitude: item.longitude,
        estimatedCost: item.estimated_cost || 0,
        category: item.category || 'attraction',
      })),
    }));
  }, [itinerary]);

  const totalCost = itinerary.reduce((sum, item) => sum + (item.estimated_cost || 0), 0);

  // Handle activity update
  const handleActivityUpdate = useCallback(async (dayNumber: number, activityIndex: number, updatedActivity: Activity) => {
    const dayData = days.find(d => d.day === dayNumber);
    if (!dayData) return;

    const originalActivity = dayData.activities[activityIndex];
    const activityId = originalActivity.id;

    if (!activityId) {
      toast({
        title: 'Error',
        description: 'Activity ID not found',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('itineraries')
        .update({
          title: updatedActivity.title,
          description: updatedActivity.description,
          start_time: updatedActivity.startTime,
          end_time: updatedActivity.endTime,
          location: updatedActivity.location,
          estimated_cost: updatedActivity.estimatedCost,
          category: updatedActivity.category,
        })
        .eq('id', activityId);

      if (error) throw error;

      // Refresh data
      await fetchTripData();

      toast({
        title: 'Activity updated! ✅',
        description: 'Your changes have been saved.',
      });
    } catch (error) {
      console.error('Failed to update activity:', error);
      toast({
        title: 'Error',
        description: 'Failed to update activity. Please try again.',
        variant: 'destructive',
      });
    }
  }, [days, toast]);

  // Handle activity delete
  const handleActivityDelete = useCallback(async (dayNumber: number, activityIndex: number) => {
    const dayData = days.find(d => d.day === dayNumber);
    if (!dayData) return;

    const activity = dayData.activities[activityIndex];
    const activityId = activity.id;

    if (!activityId) {
      toast({
        title: 'Error',
        description: 'Activity ID not found',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('itineraries')
        .delete()
        .eq('id', activityId);

      if (error) throw error;

      // Refresh data
      await fetchTripData();

      toast({
        title: 'Activity deleted',
        description: 'The activity has been removed from your itinerary.',
      });
    } catch (error) {
      console.error('Failed to delete activity:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete activity. Please try again.',
        variant: 'destructive',
      });
    }
  }, [days, toast]);

  // Handle activity add
  const handleActivityAdd = useCallback(async (dayNumber: number, newActivity: Activity) => {
    if (!tripId) return;

    try {
      const { error } = await supabase
        .from('itineraries')
        .insert({
          trip_id: tripId,
          day_number: dayNumber,
          title: newActivity.title,
          description: newActivity.description,
          start_time: newActivity.startTime,
          end_time: newActivity.endTime,
          location: newActivity.location,
          estimated_cost: newActivity.estimatedCost,
          category: newActivity.category,
        });

      if (error) throw error;

      // Refresh data
      await fetchTripData();

      toast({
        title: 'Activity added! 🎉',
        description: 'New activity has been added to your itinerary.',
      });
    } catch (error) {
      console.error('Failed to add activity:', error);
      toast({
        title: 'Error',
        description: 'Failed to add activity. Please try again.',
        variant: 'destructive',
      });
    }
  }, [tripId, toast]);

  // Loading State
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="bg-gradient-to-r from-blue-600 to-teal-500 py-8">
          <div className="container max-w-7xl mx-auto px-4">
            <Skeleton className="h-8 w-64 mb-2 bg-white/20" />
            <Skeleton className="h-6 w-48 bg-white/20" />
          </div>
        </div>
        <div className="container max-w-7xl mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3 space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div className="lg:col-span-2">
              <Skeleton className="h-[400px] w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not Found State
  if (!trip) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
            <Calendar className="w-12 h-12 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Trip not found</h1>
          <p className="text-muted-foreground mb-6">
            This trip may have been deleted or you don't have access to it.
          </p>
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Mobile Layout with Tabs
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <ItineraryHeader trip={trip} totalCost={totalCost} days={days} />

        <div className="flex-1 flex flex-col px-3 py-3">
          <Tabs defaultValue="timeline" className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2 mb-3 h-12">
              <TabsTrigger value="timeline" className="flex items-center gap-2 text-sm min-h-[44px]">
                📋 Timeline
              </TabsTrigger>
              <TabsTrigger value="map" className="flex items-center gap-2 text-sm min-h-[44px]">
                🗺️ Map
              </TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="mt-0 flex-1 overflow-auto">
              <ItineraryTimeline
                days={days}
                startDate={trip.start_date}
                onActivityUpdate={handleActivityUpdate}
                onActivityDelete={handleActivityDelete}
                onActivityAdd={handleActivityAdd}
                editable={true}
              />
            </TabsContent>

            <TabsContent value="map" className="mt-0 flex-1">
              <div className="h-[calc(100vh-280px)] min-h-[400px]">
                <ItineraryMap days={days} selectedDay={selectedDay} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  // Desktop Layout with Split View
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <ItineraryHeader trip={trip} totalCost={totalCost} days={days} />

      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Timeline Section - 60% */}
          <div className="lg:col-span-3">
            <ItineraryTimeline
              days={days}
              startDate={trip.start_date}
              onActivityUpdate={handleActivityUpdate}
              onActivityDelete={handleActivityDelete}
              onActivityAdd={handleActivityAdd}
              editable={true}
            />
          </div>

          {/* Map Section - 40% */}
          <div className="lg:col-span-2 lg:sticky lg:top-4 lg:self-start">
            <ItineraryMap days={days} selectedDay={selectedDay} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Itinerary;
