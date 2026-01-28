import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Check, MapPin, Calendar, Wallet, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { usePWAInstall } from '@/hooks/usePWAInstall';

interface TripSuccessStateProps {
  tripData: {
    destination: string;
    origin: string;
    startDate: Date | undefined;
    endDate: Date | undefined;
    budget: string;
    currency: string;
    preferences: string[];
    duration: number;
    currencySymbol: string;
  };
  tripId: string | null;
  onClose: () => void;
}

const TripSuccessState = ({ tripData, tripId, onClose }: TripSuccessStateProps) => {
  const navigate = useNavigate();
  const { markFirstTripCreated } = usePWAInstall();

  // Mark first trip created for PWA install prompt
  useEffect(() => {
    markFirstTripCreated();
  }, [markFirstTripCreated]);

  const handleViewItinerary = () => {
    if (tripId) {
      onClose();
      navigate(`/trip/${tripId}`);
    }
  };

  const handleBackToDashboard = () => {
    onClose();
    navigate('/dashboard');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-6"
    >
      {/* Background celebration effect */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              y: "100vh",
              x: `${Math.random() * 100}vw`,
              rotate: 0,
            }}
            animate={{ 
              y: "-10vh",
              rotate: 360,
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              delay: Math.random() * 2,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute w-3 h-3 rounded-full bg-primary/60"
          />
        ))}
      </div>

      {/* Main content */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", delay: 0.2 }}
        className="relative z-10 flex flex-col items-center gap-6 max-w-lg text-center"
      >
        {/* Success icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.3, stiffness: 200 }}
          className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30"
        >
          <Check className="w-10 h-10 text-white" strokeWidth={3} />
        </motion.div>

        {/* Success message */}
        <div className="space-y-2">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-2xl md:text-3xl font-bold text-foreground font-display"
          >
            Your trip is ready! 🎉
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-muted-foreground"
          >
            Shasa has crafted the perfect itinerary for you
          </motion.p>
        </div>

        {/* Trip card preview */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="w-full p-6 rounded-2xl glass-card border border-border/50 space-y-6"
        >
          {/* Destination header */}
          <div className="text-center">
            <h3 className="text-xl font-bold text-foreground flex items-center justify-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              {tripData.destination}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              from {tripData.origin}
            </p>
          </div>

          {/* Trip details grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-xl bg-card/50">
              <Calendar className="w-4 h-4 mx-auto mb-1 text-primary" />
              <div className="text-xs text-muted-foreground">Duration</div>
              <div className="font-semibold text-foreground">{tripData.duration} days</div>
            </div>
            <div className="text-center p-3 rounded-xl bg-card/50">
              <Wallet className="w-4 h-4 mx-auto mb-1 text-green-400" />
              <div className="text-xs text-muted-foreground">Budget</div>
              <div className="font-semibold font-mono text-foreground">
                {tripData.currencySymbol}{parseFloat(tripData.budget).toLocaleString()}
              </div>
            </div>
            <div className="text-center p-3 rounded-xl bg-card/50">
              <Sparkles className="w-4 h-4 mx-auto mb-1 text-purple-400" />
              <div className="text-xs text-muted-foreground">Vibes</div>
              <div className="font-semibold text-foreground">
                {tripData.preferences.length || 'Any'}
              </div>
            </div>
          </div>

          {/* Dates */}
          {tripData.startDate && tripData.endDate && (
            <div className="text-center py-3 px-4 rounded-xl bg-primary/10 border border-primary/20">
              <div className="text-sm text-primary font-medium">
                {format(tripData.startDate, "MMM d")} → {format(tripData.endDate, "MMM d, yyyy")}
              </div>
            </div>
          )}
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col sm:flex-row gap-3 w-full"
        >
          <Button
            variant="outline"
            onClick={handleBackToDashboard}
            className="flex-1 h-12 border-border/50"
          >
            Back to Dashboard
          </Button>
          <Button
            onClick={handleViewItinerary}
            className="flex-1 h-12 btn-primary-gradient border-0 gap-2"
          >
            View Full Itinerary
            <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>

        {/* Fun message */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-xs text-muted-foreground"
        >
          ✨ Your itinerary includes transport, stays, food & activities!
        </motion.p>
      </motion.div>
    </motion.div>
  );
};

export default TripSuccessState;
