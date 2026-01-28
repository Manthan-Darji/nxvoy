import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, LogOut, Sparkles, ArrowUpDown, CalendarDays, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import TripWizard from '@/components/trip-wizard/TripWizard';
import TripCard from '@/components/dashboard/TripCard';
import TripCardSkeleton from '@/components/dashboard/TripCardSkeleton';
import EmptyTripsState from '@/components/dashboard/EmptyTripsState';

interface Trip {
  id: string;
  destination: string;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  status: string | null;
  created_at: string;
}

type SortOption = 'newest' | 'oldest' | 'upcoming';

const Dashboard = () => {
  const [showTripWizard, setShowTripWizard] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingTripId, setDeletingTripId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const fetchTrips = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('trips')
        .select('id, destination, start_date, end_date, budget, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTrips(data || []);
    } catch (error) {
      console.error('Error fetching trips:', error);
      toast.error('Failed to load your trips');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleDeleteTrip = async (tripId: string) => {
    setDeletingTripId(tripId);
    try {
      // First delete associated itineraries
      const { error: itineraryError } = await supabase
        .from('itineraries')
        .delete()
        .eq('trip_id', tripId);

      if (itineraryError) throw itineraryError;

      // Then delete the trip
      const { error: tripError } = await supabase
        .from('trips')
        .delete()
        .eq('id', tripId);

      if (tripError) throw tripError;

      setTrips(prev => prev.filter(trip => trip.id !== tripId));
      toast.success('Trip deleted successfully');
    } catch (error) {
      console.error('Error deleting trip:', error);
      toast.error('Failed to delete trip');
    } finally {
      setDeletingTripId(null);
    }
  };

  const sortedTrips = [...trips].sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'upcoming':
        if (!a.start_date && !b.start_date) return 0;
        if (!a.start_date) return 1;
        if (!b.start_date) return -1;
        return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
      case 'newest':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const displayName = profile?.name || user?.email?.split('@')[0] || 'Traveler';

  const getSortLabel = (option: SortOption) => {
    switch (option) {
      case 'newest': return 'Newest First';
      case 'oldest': return 'Oldest First';
      case 'upcoming': return 'Upcoming Trips';
    }
  };

  return (
    <div className="min-h-screen bg-background pb-safe-area-bottom">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/40 backdrop-blur-lg sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center">
              <Plane className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
              NxVoy
            </span>
          </a>
          <Button 
            variant="ghost" 
            onClick={handleLogout} 
            className="gap-2 text-muted-foreground hover:text-white"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 font-heading">
            Your Travel Plans ✈️
          </h1>
          <p className="text-muted-foreground text-lg">
            Welcome back, <span className="text-primary font-semibold">{displayName}</span>! 
            Ready for your next adventure?
          </p>
        </motion.div>

        {/* Action Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
        >
          {/* Plan New Trip Button */}
          <Button 
            size="lg"
            className="btn-primary-gradient border-0 text-lg group"
            onClick={() => setShowTripWizard(true)}
          >
            <Sparkles className="w-5 h-5 mr-2 group-hover:animate-pulse" />
            Plan New Trip with Shasa
          </Button>

          {/* Sort Dropdown */}
          {trips.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 bg-white/5 border-white/10 text-white hover:bg-white/10">
                  <ArrowUpDown className="w-4 h-4" />
                  {getSortLabel(sortBy)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="glass-card border-white/10">
                <DropdownMenuItem 
                  onClick={() => setSortBy('newest')}
                  className="gap-2 cursor-pointer"
                >
                  <Clock className="w-4 h-4" />
                  Newest First
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setSortBy('oldest')}
                  className="gap-2 cursor-pointer"
                >
                  <Clock className="w-4 h-4 rotate-180" />
                  Oldest First
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setSortBy('upcoming')}
                  className="gap-2 cursor-pointer"
                >
                  <CalendarDays className="w-4 h-4" />
                  Upcoming Trips
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </motion.div>

        {/* Trips Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <TripCardSkeleton key={i} />
            ))}
          </div>
        ) : trips.length === 0 ? (
          <EmptyTripsState onStartPlanning={() => setShowTripWizard(true)} />
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {sortedTrips.map((trip, index) => (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <TripCard 
                    trip={trip} 
                    onDelete={handleDeleteTrip}
                    isDeleting={deletingTripId === trip.id}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      {/* Trip Wizard Modal */}
      <AnimatePresence>
        {showTripWizard && (
          <TripWizard onClose={() => {
            setShowTripWizard(false);
            fetchTrips(); // Refresh trips after wizard closes
          }} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
