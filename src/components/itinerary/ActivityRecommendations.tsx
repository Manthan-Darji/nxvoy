import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MapPin, Clock, IndianRupee, Plus, RefreshCw, Lightbulb, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity } from './ActivityCard';
import { fetchRecommendations, Recommendation, convertRecommendationToActivity } from '@/services/recommendationService';
import { useToast } from '@/hooks/use-toast';

interface ActivityRecommendationsProps {
  destination: string;
  currentActivities: Activity[];
  budget: number;
  dayNumber: number;
  tripDate?: string;
  onAddActivity: (activity: Activity) => void;
}

const categoryIcons: Record<string, string> = {
  food: '🍽️',
  culture: '🏛️',
  adventure: '🎯',
  shopping: '🛍️',
  relaxation: '🧘',
  attraction: '📸',
  nightlife: '🌙',
  transport: '🚗',
};

const categoryColors: Record<string, string> = {
  food: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  culture: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  adventure: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  shopping: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  relaxation: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  attraction: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  nightlife: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  transport: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300',
};

const ActivityRecommendations = ({
  destination,
  currentActivities,
  budget,
  dayNumber,
  tripDate,
  onAddActivity,
}: ActivityRecommendationsProps) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const { toast } = useToast();

  const loadRecommendations = async () => {
    setIsLoading(true);
    try {
      // Extract user interests from current activities categories
      const interests = [...new Set(currentActivities.map(a => a.category).filter(Boolean))];
      
      const recs = await fetchRecommendations({
        destination,
        currentActivities,
        userInterests: interests,
        budget,
        dayNumber,
        tripDate,
      });
      
      setRecommendations(recs);
      setHasLoaded(true);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
      toast({
        title: 'Could not load recommendations',
        description: error instanceof Error ? error.message : 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddActivity = async (recommendation: Recommendation) => {
    setAddingId(recommendation.id);
    try {
      const activity = convertRecommendationToActivity(recommendation, dayNumber);
      onAddActivity(activity);
      
      // Remove from recommendations
      setRecommendations(prev => prev.filter(r => r.id !== recommendation.id));
      
      toast({
        title: '✨ Activity added!',
        description: `${recommendation.name} has been added to Day ${dayNumber}`,
      });
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="mt-8 pt-6 border-t border-dashed border-muted-foreground/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-full bg-gradient-to-r from-violet-500 to-purple-500">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Shasa's Recommendations</h3>
            <p className="text-xs text-muted-foreground">AI-curated activities just for you</p>
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={loadRecommendations}
          disabled={isLoading}
          className="gap-2"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {hasLoaded ? 'Refresh' : 'Get Suggestions'}
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="mb-4"
          >
            <Sparkles className="w-8 h-8 text-violet-500" />
          </motion.div>
          <p className="text-sm font-medium">Shasa is finding perfect activities...</p>
          <p className="text-xs mt-1">Analyzing your preferences and local gems</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !hasLoaded && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-3">
              <Lightbulb className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              Discover hidden gems
            </p>
            <p className="text-xs text-muted-foreground mb-4 max-w-xs">
              Click "Get Suggestions" for AI-powered activity recommendations based on your itinerary and interests
            </p>
          </CardContent>
        </Card>
      )}

      {/* Recommendations Grid */}
      <AnimatePresence mode="popLayout">
        {!isLoading && recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {recommendations.map((rec, index) => (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow group">
                  {/* Category Banner */}
                  <div className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 ${categoryColors[rec.category] || categoryColors.attraction}`}>
                    <span>{categoryIcons[rec.category] || '📍'}</span>
                    <span className="capitalize">{rec.category}</span>
                  </div>

                  <CardContent className="p-4 space-y-3">
                    {/* Title & Description */}
                    <div>
                      <h4 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {rec.name}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {rec.description}
                      </p>
                    </div>

                    {/* Why Recommended Badge */}
                    <div className="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-2.5 border border-violet-200 dark:border-violet-800">
                      <div className="flex items-start gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-violet-700 dark:text-violet-300 leading-relaxed">
                          {rec.why_recommended}
                        </p>
                      </div>
                    </div>

                    {/* Stats Row */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>{rec.distance_km}km away</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{rec.duration_hours}h</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <IndianRupee className="w-3 h-3" />
                        <span>₹{rec.estimated_cost}</span>
                      </div>
                    </div>

                    {/* Location */}
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      📍 {rec.location}
                    </p>

                    {/* Add Button */}
                    <Button
                      className="w-full gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                      size="sm"
                      onClick={() => handleAddActivity(rec)}
                      disabled={addingId === rec.id}
                    >
                      {addingId === rec.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                      Add to Day {dayNumber}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* No More Recommendations */}
      {!isLoading && hasLoaded && recommendations.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-6 text-center">
            <p className="text-sm text-muted-foreground">
              You've added all suggestions! Click "Refresh" for more ideas ✨
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ActivityRecommendations;
