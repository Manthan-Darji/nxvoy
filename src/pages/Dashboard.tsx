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
import PWAInstallPrompt from '@/components/pwa/PWAInstallPrompt';
import { usePWAInstall } from '@/hooks/usePWAInstall';

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
  const { showInstallPrompt, dismissInstallPrompt } = usePWAInstall();

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

  // Check if there's at least one completed trip
  const hasCompletedTrip = trips.some(trip => trip.status?.toLowerCase() === 'completed');

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
      {/* Header - Mobile optimized */}
      <header className="border-b border-white/10 bg-black/40 backdrop-blur-lg sticky top-0 z-40 safe-area-top">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center">
              <Plane className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
              NxVoy
            </span>
          </a>
          <Button 
            variant="ghost" 
            onClick={handleLogout} 
            className="gap-2 text-muted-foreground hover:text-white min-h-[44px] px-3 sm:px-4"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden sm:inline">Log Out</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 sm:py-8 lg:py-10">
        {/* Hero Section - Modernized */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 sm:mb-10"
        >
          <div className="relative">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 font-heading bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent">
              Your Travel Plans
            </h1>
            <div className="absolute -top-1 -right-8 text-3xl sm:text-4xl animate-bounce" style={{ animationDuration: '2s' }}>
              ✈️
            </div>
          </div>
          <p className="text-muted-foreground text-base sm:text-lg md:text-xl">
            Welcome back, <span className="text-primary font-semibold bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent">{displayName}</span>! 
            <span className="block sm:inline"> Ready for your next adventure?</span>
          </p>
        </motion.div>

        {/* Action Bar - Only show when there are trips (not in empty state) */}
        {!isLoading && trips.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8 sm:mb-10"
          >
            {/* Plan New Trip Button - Modernized with better styling */}
            <Button 
              size="lg"
              className="btn-primary-gradient border-0 text-base sm:text-lg group w-full sm:w-auto min-h-[56px] px-6 sm:px-8 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
              onClick={() => setShowTripWizard(true)}
            >
              <Sparkles className="w-5 h-5 mr-2 group-hover:animate-pulse group-hover:scale-110 transition-transform" />
              Plan New Trip with Shasa
            </Button>

            {/* Sort Dropdown - Enhanced styling */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 bg-white/5 backdrop-blur-sm border-white/10 text-white hover:bg-white/10 hover:border-white/20 min-h-[48px] w-full sm:w-auto transition-all duration-200">
                  <ArrowUpDown className="w-4 h-4" />
                  {getSortLabel(sortBy)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="glass-card border-white/10 z-50 bg-background backdrop-blur-xl">
                <DropdownMenuItem 
                  onClick={() => setSortBy('newest')}
                  className="gap-2 cursor-pointer min-h-[44px] hover:bg-white/10 transition-colors"
                >
                  <Clock className="w-4 h-4" />
                  Newest First
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setSortBy('oldest')}
                  className="gap-2 cursor-pointer min-h-[44px] hover:bg-white/10 transition-colors"
                >
                  <Clock className="w-4 h-4 rotate-180" />
                  Oldest First
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setSortBy('upcoming')}
                  className="gap-2 cursor-pointer min-h-[44px] hover:bg-white/10 transition-colors"
                >
                  <CalendarDays className="w-4 h-4" />
                  Upcoming Trips
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </motion.div>
        )}

        {/* Trips Grid - Modernized with better spacing */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6 lg:gap-8">
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
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6 lg:gap-8"
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
                    hasCompletedTrip={hasCompletedTrip}
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

      {/* PWA Install Prompt */}
      <PWAInstallPrompt 
        show={showInstallPrompt} 
        onDismiss={dismissInstallPrompt} 
      />
    </div>
  );
};

export default Dashboard;
