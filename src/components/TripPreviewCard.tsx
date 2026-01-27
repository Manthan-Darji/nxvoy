import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, DollarSign, Heart, Users, Sparkles, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TripDetails, generateItinerary } from '@/services/tripService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';

interface TripPreviewCardProps {
  tripDetails: TripDetails;
  onDismiss: () => void;
  onClose?: () => void;
}

const TripPreviewCard = ({ tripDetails, onDismiss, onClose }: TripPreviewCardProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'TBD';
    try {
      return format(new Date(dateStr), 'MMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  const handleGenerateItinerary = async () => {
    if (!user) {
      toast({
        title: 'Please log in',
        description: 'You need to be logged in to save trips.',
        variant: 'destructive',
      });
      return;
    }

    if (!tripDetails.destination || !tripDetails.startDate || !tripDetails.endDate) {
      toast({
        title: 'Missing details',
        description: 'Please provide destination and dates to generate an itinerary.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      // 1. Create trip in database
      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .insert({
          user_id: user.id,
          destination: tripDetails.destination,
          start_date: tripDetails.startDate,
          end_date: tripDetails.endDate,
          budget: tripDetails.budget,
          notes: tripDetails.interests.join(', '),
          status: 'planning',
        })
        .select()
        .single();

      if (tripError) throw tripError;

      // 2. Generate itinerary via AI
      const itineraryDays = await generateItinerary(
        {
          destination: tripDetails.destination,
          startDate: tripDetails.startDate,
          endDate: tripDetails.endDate,
          budget: tripDetails.budget,
          interests: tripDetails.interests,
          tripType: tripDetails.tripType,
        },
        session?.access_token
      );

      // 3. Save itinerary items to database
      const itineraryItems = itineraryDays.flatMap(day =>
        day.activities.map(activity => ({
          trip_id: trip.id,
          day_number: day.day,
          title: activity.title,
          description: activity.description,
          start_time: activity.startTime,
          end_time: activity.endTime,
          location: activity.location,
          estimated_cost: activity.estimatedCost,
          category: activity.category,
        }))
      );

      const { error: itineraryError } = await supabase
        .from('itineraries')
        .insert(itineraryItems);

      if (itineraryError) throw itineraryError;

      // 4. Update trip status
      await supabase
        .from('trips')
        .update({ status: 'planned' })
        .eq('id', trip.id);

      toast({
        title: 'Itinerary created! 🎉',
        description: `Your trip to ${tripDetails.destination} is ready.`,
      });

      // 5. Close chat and navigate
      onClose?.();
      navigate(`/itinerary/${trip.id}`);

    } catch (error) {
      console.error('Failed to generate itinerary:', error);
      toast({
        title: 'Failed to generate itinerary',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (!tripDetails.isComplete) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="w-full"
    >
      <Card className="p-4 bg-gradient-to-br from-blue-50 to-teal-50 dark:from-blue-900/20 dark:to-teal-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-foreground">Trip Preview</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDismiss}
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span className="font-medium">Trip to {tripDetails.destination}</span>
          </div>
          
          {(tripDetails.startDate || tripDetails.endDate) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>{formatDate(tripDetails.startDate)} - {formatDate(tripDetails.endDate)}</span>
            </div>
          )}

          {tripDetails.budget && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span>Budget: ${tripDetails.budget.toLocaleString()}</span>
            </div>
          )}

          {tripDetails.interests.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Heart className="w-4 h-4 text-red-500" />
              <span className="truncate">{tripDetails.interests.slice(0, 3).join(', ')}</span>
            </div>
          )}

          {tripDetails.tripType && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4 text-purple-600" />
              <span className="capitalize">{tripDetails.tripType} trip</span>
            </div>
          )}
        </div>

        <Button
          onClick={handleGenerateItinerary}
          disabled={isGenerating}
          className="w-full bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white border-0"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating Itinerary...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Itinerary
            </>
          )}
        </Button>
      </Card>
    </motion.div>
  );
};

export default TripPreviewCard;
