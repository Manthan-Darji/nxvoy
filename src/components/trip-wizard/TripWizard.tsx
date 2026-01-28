import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, Calendar, Wallet, Sparkles, ChevronLeft, X, Locate } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { generateTripPlan } from '@/services/tripPlanService';
import ProcessingState from './ProcessingState';
import TripSuccessState from './TripSuccessState';

interface TripData {
  destination: string;
  origin: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  budget: string;
  currency: string;
  preferences: string[];
}

interface TripWizardProps {
  onClose: () => void;
}

const MOCK_DESTINATIONS = [
  'Paris, France',
  'Tokyo, Japan',
  'New York, USA',
  'Bali, Indonesia',
  'London, UK',
  'Dubai, UAE',
  'Rome, Italy',
  'Barcelona, Spain',
  'Goa, India',
  'Maldives',
  'Singapore',
  'Bangkok, Thailand',
];

const PREFERENCE_OPTIONS = [
  { id: 'relaxed', label: '😌 Relaxed', icon: '😌' },
  { id: 'adventure', label: '🏔️ Adventure', icon: '🏔️' },
  { id: 'family', label: '👨‍👩‍👧‍👦 Family', icon: '👨‍👩‍👧‍👦' },
  { id: 'solo', label: '🎒 Solo', icon: '🎒' },
  { id: 'packed', label: '⚡ Packed Schedule', icon: '⚡' },
  { id: 'cultural', label: '🏛️ Cultural', icon: '🏛️' },
  { id: 'foodie', label: '🍜 Foodie', icon: '🍜' },
  { id: 'romantic', label: '💕 Romantic', icon: '💕' },
];

const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
];

const TripWizard = ({ onClose }: TripWizardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredDestinations, setFilteredDestinations] = useState<string[]>([]);
  const [generatedTripId, setGeneratedTripId] = useState<string | null>(null);
  
  const [tripData, setTripData] = useState<TripData>({
    destination: '',
    origin: '',
    startDate: undefined,
    endDate: undefined,
    budget: '',
    currency: 'INR',
    preferences: [],
  });

  // Filter destinations based on input
  useEffect(() => {
    if (tripData.destination.length > 0) {
      const filtered = MOCK_DESTINATIONS.filter(dest =>
        dest.toLowerCase().includes(tripData.destination.toLowerCase())
      );
      setFilteredDestinations(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [tripData.destination]);

  const updateTripData = (field: keyof TripData, value: any) => {
    setTripData(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerateTrip = async () => {
    if (!user) {
      toast({
        title: 'Please log in',
        description: 'You need to be logged in to create trips.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Call the edge function to generate trip plan
      const tripPlan = await generateTripPlan(
        {
          origin: tripData.origin,
          destination: tripData.destination,
          startDate: tripData.startDate ? format(tripData.startDate, 'yyyy-MM-dd') : '',
          endDate: tripData.endDate ? format(tripData.endDate, 'yyyy-MM-dd') : '',
          budget: parseFloat(tripData.budget),
          currency: tripData.currency,
          preferences: tripData.preferences,
        },
        session?.access_token
      );

      console.log('[TripWizard] Trip plan generated:', tripPlan.trip_title);

      // Check budget status and show warning if over budget
      if (tripPlan.budget_status === 'over_budget') {
        toast({
          title: 'Budget Warning ⚠️',
          description: tripPlan.budget_message || 'The estimated cost exceeds your budget.',
        });
      }

      // Save to database
      const { data: savedTrip, error: saveError } = await supabase
        .from('trips')
        .insert({
          user_id: user.id,
          destination: tripData.destination,
          start_date: tripData.startDate ? format(tripData.startDate, 'yyyy-MM-dd') : null,
          end_date: tripData.endDate ? format(tripData.endDate, 'yyyy-MM-dd') : null,
          budget: parseFloat(tripData.budget),
          notes: JSON.stringify(tripPlan), // Store the full trip plan as JSON
          status: 'planned',
        })
        .select()
        .single();

      if (saveError) {
        throw saveError;
      }

      console.log('[TripWizard] Trip saved with ID:', savedTrip.id);
      setGeneratedTripId(savedTrip.id);
      setIsSuccess(true);

    } catch (error) {
      console.error('[TripWizard] Error generating trip:', error);
      toast({
        title: 'Failed to generate trip',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Start the actual trip generation
      handleGenerateTrip();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSelectDestination = (dest: string) => {
    updateTripData('destination', dest);
    setShowSuggestions(false);
    setTimeout(() => handleNext(), 300);
  };

  const handleUseCurrentLocation = () => {
    // Mock current location
    updateTripData('origin', 'Rajkot, Gujarat, India');
  };

  const togglePreference = (prefId: string) => {
    setTripData(prev => ({
      ...prev,
      preferences: prev.preferences.includes(prefId)
        ? prev.preferences.filter(p => p !== prefId)
        : [...prev.preferences, prefId],
    }));
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return tripData.destination.trim().length > 0;
      case 1:
        return tripData.origin.trim().length > 0;
      case 2:
        return tripData.startDate && tripData.endDate && tripData.endDate > tripData.startDate;
      case 3:
        return tripData.budget.trim().length > 0 && parseFloat(tripData.budget) > 0;
      case 4:
        return true; // Preferences are optional
      default:
        return false;
    }
  };

  const getTripDuration = () => {
    if (tripData.startDate && tripData.endDate) {
      return differenceInDays(tripData.endDate, tripData.startDate) + 1;
    }
    return 0;
  };

  const getCurrencySymbol = () => {
    return CURRENCIES.find(c => c.code === tripData.currency)?.symbol || '₹';
  };

  if (isProcessing) {
    return <ProcessingState destination={tripData.destination} budget={`${getCurrencySymbol()}${tripData.budget}`} />;
  }

  if (isSuccess) {
    return (
      <TripSuccessState 
        tripData={{
          ...tripData,
          duration: getTripDuration(),
          currencySymbol: getCurrencySymbol(),
        }}
        tripId={generatedTripId}
        onClose={onClose} 
      />
    );
  }

  const stepVariants = {
    enter: { opacity: 0, x: 50 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 md:p-6 border-b border-border/50 safe-area-top">
        <div className="flex items-center gap-2 sm:gap-3">
          {currentStep > 0 && (
            <Button variant="ghost" size="icon" onClick={handleBack} className="text-muted-foreground min-w-[44px] min-h-[44px]">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <span className="font-semibold text-foreground hidden sm:inline">Shasa</span>
          </div>
        </div>
        
        {/* Progress dots */}
        <div className="flex gap-1.5 sm:gap-2">
          {[0, 1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                step === currentStep
                  ? "w-4 sm:w-6 bg-primary"
                  : step < currentStep
                  ? "bg-primary/60"
                  : "bg-muted"
              )}
            />
          ))}
        </div>

        <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground min-w-[44px] min-h-[44px]">
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 md:p-12 overflow-y-auto pb-safe-area-bottom">
        <AnimatePresence mode="wait">
          {/* Step 0: Destination */}
          {currentStep === 0 && (
            <motion.div
              key="destination"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="w-full max-w-xl space-y-8"
            >
              <div className="text-center space-y-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="w-16 h-16 mx-auto rounded-2xl bg-primary/20 flex items-center justify-center"
                >
                  <MapPin className="w-8 h-8 text-primary" />
                </motion.div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground font-display">
                  Where do you want to go? ✈️
                </h2>
                <p className="text-muted-foreground">
                  Tell me your dream destination, and I'll craft the perfect journey.
                </p>
              </div>

              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search for a city or place..."
                  value={tripData.destination}
                  onChange={(e) => updateTripData('destination', e.target.value)}
                  className="h-12 sm:h-14 text-base sm:text-lg bg-card/50 border-border/50 rounded-xl pl-10 sm:pl-12 focus:border-primary"
                />
                <MapPin className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                
                {/* Autocomplete suggestions */}
                <AnimatePresence>
                  {showSuggestions && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-card border border-border/50 rounded-xl overflow-hidden shadow-xl z-10"
                    >
                      {filteredDestinations.slice(0, 5).map((dest, index) => (
                        <motion.button
                          key={dest}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => handleSelectDestination(dest)}
                          className="w-full px-4 py-3 text-left hover:bg-primary/10 transition-colors flex items-center gap-3 border-b border-border/30 last:border-0"
                        >
                          <MapPin className="w-4 h-4 text-primary" />
                          <span className="text-foreground">{dest}</span>
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex justify-center pt-4">
                <Button
                  onClick={handleNext}
                  disabled={!isStepValid()}
                  className="btn-primary-gradient border-0 px-8 h-12 min-h-[48px] w-full sm:w-auto"
                >
                  Continue
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 1: Origin */}
          {currentStep === 1 && (
            <motion.div
              key="origin"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="w-full max-w-xl space-y-8"
            >
              <div className="text-center space-y-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="w-16 h-16 mx-auto rounded-2xl bg-secondary/20 flex items-center justify-center"
                >
                  <Navigation className="w-8 h-8 text-secondary-foreground" />
                </motion.div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground font-display">
                  Where are you starting from? 🚀
                </h2>
                <p className="text-muted-foreground">
                  I need to know your starting point to find the best routes.
                </p>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Enter your city..."
                    value={tripData.origin}
                    onChange={(e) => updateTripData('origin', e.target.value)}
                    className="h-12 sm:h-14 text-base sm:text-lg bg-card/50 border-border/50 rounded-xl pl-10 sm:pl-12 focus:border-primary"
                  />
                  <Navigation className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                </div>
                
                <Button
                  variant="ghost"
                  onClick={handleUseCurrentLocation}
                  className="w-full h-12 text-primary hover:bg-primary/10 gap-2 min-h-[48px]"
                >
                  <Locate className="w-4 h-4" />
                  Use my current location
                </Button>
              </div>

              <div className="flex justify-center pt-4">
                <Button
                  onClick={handleNext}
                  disabled={!isStepValid()}
                  className="btn-primary-gradient border-0 px-8 h-12 min-h-[48px] w-full sm:w-auto"
                >
                  Continue
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Dates */}
          {currentStep === 2 && (
            <motion.div
              key="dates"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="w-full max-w-xl space-y-8"
            >
              <div className="text-center space-y-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="w-16 h-16 mx-auto rounded-2xl bg-accent/20 flex items-center justify-center"
                >
                  <Calendar className="w-8 h-8 text-accent-foreground" />
                </motion.div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground font-display">
                  When are you planning to travel? 📅
                </h2>
                <p className="text-muted-foreground">
                  Pick your dates and I'll find the best deals.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Start Date */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full h-12 sm:h-14 justify-start text-left font-normal bg-card/50 border-border/50 rounded-xl min-h-[48px]",
                          !tripData.startDate && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {tripData.startDate ? format(tripData.startDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-card border-border z-[100]" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={tripData.startDate}
                        onSelect={(date) => updateTripData('startDate', date)}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* End Date */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">End Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full h-12 sm:h-14 justify-start text-left font-normal bg-card/50 border-border/50 rounded-xl min-h-[48px]",
                          !tripData.endDate && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {tripData.endDate ? format(tripData.endDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-card border-border z-[100]" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={tripData.endDate}
                        onSelect={(date) => updateTripData('endDate', date)}
                        disabled={(date) => 
                          date < new Date() || 
                          (tripData.startDate ? date <= tripData.startDate : false)
                        }
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {tripData.startDate && tripData.endDate && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center p-4 rounded-xl bg-primary/10 border border-primary/20"
                >
                  <span className="text-primary font-semibold">
                    {getTripDuration()} days trip to {tripData.destination}
                  </span>
                </motion.div>
              )}

              <div className="flex justify-center pt-4">
                <Button
                  onClick={handleNext}
                  disabled={!isStepValid()}
                  className="btn-primary-gradient border-0 px-8 h-12 min-h-[48px] w-full sm:w-auto"
                >
                  Continue
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Budget */}
          {currentStep === 3 && (
            <motion.div
              key="budget"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="w-full max-w-xl space-y-8"
            >
              <div className="text-center space-y-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="w-16 h-16 mx-auto rounded-2xl bg-green-500/20 flex items-center justify-center"
                >
                  <Wallet className="w-8 h-8 text-green-400" />
                </motion.div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground font-display">
                  What's your total budget? 💰
                </h2>
                <p className="text-muted-foreground">
                  This includes travel, stay, food, and activities.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Select
                  value={tripData.currency}
                  onValueChange={(value) => updateTripData('currency', value)}
                >
                  <SelectTrigger className="w-full sm:w-28 h-12 sm:h-14 bg-card/50 border-border/50 rounded-xl min-h-[48px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border z-[100]">
                    {CURRENCIES.map((curr) => (
                      <SelectItem key={curr.code} value={curr.code} className="min-h-[44px]">
                        {curr.symbol} {curr.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <div className="relative flex-1">
                  <Input
                    type="number"
                    placeholder="Enter amount..."
                    value={tripData.budget}
                    onChange={(e) => updateTripData('budget', e.target.value)}
                    className="h-12 sm:h-14 text-base sm:text-lg bg-card/50 border-border/50 rounded-xl pl-10 focus:border-primary font-mono min-h-[48px]"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">
                    {getCurrencySymbol()}
                  </span>
                </div>
              </div>

              {tripData.budget && parseFloat(tripData.budget) > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-3 gap-3 text-center"
                >
                  <div className="p-3 rounded-xl bg-card/50 border border-border/50">
                    <div className="text-xs text-muted-foreground">Per Day</div>
                    <div className="text-sm font-mono text-foreground">
                      {getCurrencySymbol()}{Math.round(parseFloat(tripData.budget) / Math.max(getTripDuration(), 1)).toLocaleString()}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-card/50 border border-border/50">
                    <div className="text-xs text-muted-foreground">Duration</div>
                    <div className="text-sm font-mono text-foreground">
                      {getTripDuration()} days
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-card/50 border border-border/50">
                    <div className="text-xs text-muted-foreground">Total</div>
                    <div className="text-sm font-mono text-foreground">
                      {getCurrencySymbol()}{parseFloat(tripData.budget).toLocaleString()}
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="flex justify-center pt-4">
                <Button
                  onClick={handleNext}
                  disabled={!isStepValid()}
                  className="btn-primary-gradient border-0 px-8 h-12 min-h-[48px] w-full sm:w-auto"
                >
                  Continue
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Preferences */}
          {currentStep === 4 && (
            <motion.div
              key="preferences"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="w-full max-w-xl space-y-8"
            >
              <div className="text-center space-y-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="w-16 h-16 mx-auto rounded-2xl bg-purple-500/20 flex items-center justify-center"
                >
                  <Sparkles className="w-8 h-8 text-purple-400" />
                </motion.div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground font-display">
                  Any specific vibe? ✨
                </h2>
                <p className="text-muted-foreground">
                  Select what resonates with you (optional).
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                {PREFERENCE_OPTIONS.map((pref, index) => (
                  <motion.button
                    key={pref.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => togglePreference(pref.id)}
                    className={cn(
                      "px-4 sm:px-5 py-2.5 sm:py-3 rounded-full text-sm font-medium transition-all duration-200 border min-h-[44px] touch-manipulation",
                      tripData.preferences.includes(pref.id)
                        ? "bg-primary/20 border-primary text-primary"
                        : "bg-card/50 border-border/50 text-muted-foreground hover:border-primary/50 hover:text-foreground"
                    )}
                  >
                    {pref.label}
                  </motion.button>
                ))}
              </div>

              {/* Trip Summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="p-6 rounded-2xl glass-card border border-border/50 space-y-4"
              >
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Trip Summary
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Destination</span>
                    <div className="font-medium text-foreground">{tripData.destination}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">From</span>
                    <div className="font-medium text-foreground">{tripData.origin}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Duration</span>
                    <div className="font-medium text-foreground">{getTripDuration()} days</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Budget</span>
                    <div className="font-medium font-mono text-foreground">
                      {getCurrencySymbol()}{parseFloat(tripData.budget || '0').toLocaleString()}
                    </div>
                  </div>
                </div>
              </motion.div>

              <div className="flex justify-center pt-4">
                <Button
                  onClick={handleNext}
                  className="btn-primary-gradient border-0 px-8 h-12 gap-2 min-h-[48px] w-full sm:w-auto"
                >
                  <Sparkles className="w-4 h-4" />
                  Let Shasa Plan My Trip
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default TripWizard;
