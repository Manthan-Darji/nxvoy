import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  MapPin, Calendar, DollarSign, Clock, ArrowLeft, 
  Utensils, Camera, Mountain, Palette, Bed, Car
} from 'lucide-react';
import { format } from 'date-fns';

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
  estimated_cost: number | null;
  category: string | null;
}

const categoryIcons: Record<string, React.ReactNode> = {
  food: <Utensils className="w-4 h-4" />,
  sightseeing: <Camera className="w-4 h-4" />,
  adventure: <Mountain className="w-4 h-4" />,
  culture: <Palette className="w-4 h-4" />,
  relaxation: <Bed className="w-4 h-4" />,
  transport: <Car className="w-4 h-4" />,
};

const categoryColors: Record<string, string> = {
  food: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  sightseeing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  adventure: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  culture: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  relaxation: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  transport: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300',
};

const Itinerary = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
        .single();

      if (tripError) throw tripError;
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

  // Group itinerary by day
  const groupedByDay = itinerary.reduce((acc, item) => {
    const day = item.day_number;
    if (!acc[day]) acc[day] = [];
    acc[day].push(item);
    return acc;
  }, {} as Record<number, ItineraryItem[]>);

  const totalCost = itinerary.reduce((sum, item) => sum + (item.estimated_cost || 0), 0);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <Skeleton className="h-10 w-64 mb-4" />
          <Skeleton className="h-6 w-48 mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container max-w-4xl mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Trip not found</h1>
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Trip Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <MapPin className="w-8 h-8 text-blue-600" />
                Trip to {trip.destination}
              </h1>
              <div className="flex flex-wrap gap-4 mt-3 text-muted-foreground">
                {trip.start_date && trip.end_date && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(trip.start_date), 'MMM d')} - {format(new Date(trip.end_date), 'MMM d, yyyy')}
                  </span>
                )}
                {trip.budget && (
                  <span className="flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4" />
                    Budget: ${trip.budget.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
            <Badge variant="outline" className="capitalize">
              {trip.status || 'planning'}
            </Badge>
          </div>

          {/* Budget Summary */}
          <Card className="p-4 bg-gradient-to-r from-blue-50 to-teal-50 dark:from-blue-900/20 dark:to-teal-900/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Estimated Total Cost</span>
              <span className="text-lg font-bold text-blue-700 dark:text-blue-300">
                ${totalCost.toLocaleString()}
              </span>
            </div>
            {trip.budget && (
              <div className="mt-2 h-2 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 to-teal-500 transition-all"
                  style={{ width: `${Math.min((totalCost / trip.budget) * 100, 100)}%` }}
                />
              </div>
            )}
          </Card>
        </div>

        {/* Itinerary Days */}
        <div className="space-y-8">
          {Object.entries(groupedByDay).map(([day, items]) => (
            <div key={day}>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-teal-500 text-white flex items-center justify-center text-sm font-bold">
                  {day}
                </span>
                Day {day}
              </h2>
              
              <div className="space-y-3 ml-4 border-l-2 border-blue-200 dark:border-blue-800 pl-6">
                {items.map((item) => (
                  <Card key={item.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground">{item.title}</h3>
                          {item.category && (
                            <Badge 
                              variant="secondary" 
                              className={`text-xs ${categoryColors[item.category] || categoryColors.sightseeing}`}
                            >
                              {categoryIcons[item.category] || categoryIcons.sightseeing}
                              <span className="ml-1 capitalize">{item.category}</span>
                            </Badge>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                        )}
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          {(item.start_time || item.end_time) && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {item.start_time}{item.end_time && ` - ${item.end_time}`}
                            </span>
                          )}
                          {item.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {item.location}
                            </span>
                          )}
                        </div>
                      </div>
                      {item.estimated_cost !== null && item.estimated_cost > 0 && (
                        <span className="text-sm font-medium text-green-600 dark:text-green-400 whitespace-nowrap">
                          ${item.estimated_cost}
                        </span>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        {itinerary.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No itinerary items yet. Chat with Shasa to generate one!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Itinerary;
