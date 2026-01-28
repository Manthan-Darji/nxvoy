import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, Sun, Clock, CloudSun, X, ChevronRight, 
  Sunrise, Sunset, Users, Aperture, ExternalLink, Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PhotoSpot {
  name: string;
  description: string;
  bestTime: string;
  tip: string;
}

interface PhotoRecommendations {
  photoSpots: PhotoSpot[];
  goldenHour: {
    morning: string;
    evening: string;
  };
  crowdFreeTimes: string[];
  weatherTip: string;
  gearTip: string;
}

interface PhotoRecommendationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activityName: string;
  location: string;
  category: string;
  destination?: string;
}

// Sample photo URLs from Unsplash for different categories
const getUnsplashPhotos = (category: string, location: string) => {
  const query = encodeURIComponent(`${location} ${category} travel photography`);
  return [
    `https://source.unsplash.com/400x300/?${query}&sig=1`,
    `https://source.unsplash.com/400x300/?${query}&sig=2`,
    `https://source.unsplash.com/400x300/?${query}&sig=3`,
  ];
};

const PhotoRecommendationsPanel = ({
  isOpen,
  onClose,
  activityName,
  location,
  category,
  destination,
}: PhotoRecommendationsPanelProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<PhotoRecommendations | null>(null);
  const [samplePhotos, setSamplePhotos] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen && !recommendations) {
      fetchRecommendations();
    }
    if (isOpen) {
      setSamplePhotos(getUnsplashPhotos(category, location));
    }
  }, [isOpen]);

  const fetchRecommendations = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('photo-spots', {
        body: { location, activityName, category, destination },
      });

      if (error) throw error;

      if (data?.success && data?.data) {
        setRecommendations(data.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Failed to fetch photo recommendations:', error);
      toast.error('Failed to load photo recommendations');
      // Set fallback recommendations
      setRecommendations({
        photoSpots: [
          {
            name: `${activityName} - Best Viewpoint`,
            description: 'Capture the essence of this location',
            bestTime: 'Golden hour',
            tip: 'Arrive early for the best lighting',
          },
        ],
        goldenHour: { morning: '6:00 AM', evening: '6:30 PM' },
        crowdFreeTimes: ['Early morning', 'Late evening'],
        weatherTip: 'Overcast days provide soft, even lighting',
        gearTip: 'Wide-angle lens recommended',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 md:hidden"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-background border-l z-50 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-600/10 to-pink-600/10">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">📷 Photo Spots</h2>
                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {activityName}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <ScrollArea className="h-[calc(100vh-80px)]">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                  <p className="text-sm text-muted-foreground">
                    Finding best photo spots...
                  </p>
                </div>
              ) : recommendations ? (
                <div className="p-4 space-y-6">
                  {/* Sample Photos */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Aperture className="w-4 h-4 text-purple-500" />
                      Inspiration Gallery
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      {samplePhotos.map((url, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.1 }}
                          className="aspect-square rounded-lg overflow-hidden relative group cursor-pointer"
                        >
                          <img
                            src={url}
                            alt={`Sample ${i + 1}`}
                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <ExternalLink className="w-5 h-5 text-white" />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Golden Hour */}
                  <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800">
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Sun className="w-4 h-4 text-amber-500" />
                      Golden Hour Times
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Sunrise className="w-4 h-4 text-orange-500" />
                        <div>
                          <p className="text-xs text-muted-foreground">Morning</p>
                          <p className="font-mono font-medium">{recommendations.goldenHour.morning}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Sunset className="w-4 h-4 text-pink-500" />
                        <div>
                          <p className="text-xs text-muted-foreground">Evening</p>
                          <p className="font-mono font-medium">{recommendations.goldenHour.evening}</p>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Photo Spots */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Camera className="w-4 h-4 text-purple-500" />
                      Best Photo Spots
                    </h3>
                    <div className="space-y-3">
                      {recommendations.photoSpots.map((spot, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Card className="p-3 hover:shadow-md transition-shadow">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                                  {index + 1}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-foreground text-sm">
                                  {spot.name}
                                </h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {spot.description}
                                </p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  <Badge variant="secondary" className="text-xs">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {spot.bestTime}
                                  </Badge>
                                </div>
                                {spot.tip && (
                                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-2 flex items-start gap-1">
                                    <span>💡</span>
                                    <span>{spot.tip}</span>
                                  </p>
                                )}
                              </div>
                              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Crowd-Free Times */}
                  <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800">
                    <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-500" />
                      Crowd-Free Times
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {recommendations.crowdFreeTimes.map((time, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {time}
                        </Badge>
                      ))}
                    </div>
                  </Card>

                  {/* Weather & Gear Tips */}
                  <div className="grid grid-cols-1 gap-3">
                    <Card className="p-3">
                      <div className="flex items-start gap-2">
                        <CloudSun className="w-4 h-4 text-sky-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-foreground">Weather Tip</p>
                          <p className="text-xs text-muted-foreground">{recommendations.weatherTip}</p>
                        </div>
                      </div>
                    </Card>
                    <Card className="p-3">
                      <div className="flex items-start gap-2">
                        <Aperture className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-foreground">Gear Tip</p>
                          <p className="text-xs text-muted-foreground">{recommendations.gearTip}</p>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              ) : null}
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PhotoRecommendationsPanel;
