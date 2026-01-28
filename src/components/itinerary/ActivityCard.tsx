import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Clock, DollarSign, ChevronDown, ChevronUp, 
  Navigation, Utensils, Camera, Mountain, Palette, 
  Bed, Car, ShoppingBag, Moon, Ticket, Pencil, Trash2,
  Aperture
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import PhotoRecommendationsPanel from './PhotoRecommendationsPanel';

export interface Activity {
  id?: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  estimatedCost: number;
  category: string;
  duration?: number;
  tips?: string;
  cuisine?: string;
}

interface ActivityCardProps {
  activity: Activity;
  index: number;
  isLast: boolean;
  destination?: string;
  onEdit?: (activity: Activity) => void;
  onDelete?: (activity: Activity) => void;
}

// Categories that should show photo recommendations
const PHOTO_CATEGORIES = ['attraction', 'adventure', 'culture', 'relaxation', 'activity'];

const categoryConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  food: { 
    icon: <Utensils className="w-4 h-4" />, 
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' 
  },
  attraction: { 
    icon: <Camera className="w-4 h-4" />, 
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
  },
  adventure: { 
    icon: <Mountain className="w-4 h-4" />, 
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
  },
  culture: { 
    icon: <Palette className="w-4 h-4" />, 
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' 
  },
  relaxation: { 
    icon: <Bed className="w-4 h-4" />, 
    color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' 
  },
  transport: { 
    icon: <Car className="w-4 h-4" />, 
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' 
  },
  shopping: { 
    icon: <ShoppingBag className="w-4 h-4" />, 
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' 
  },
  nightlife: { 
    icon: <Moon className="w-4 h-4" />, 
    color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' 
  },
  activity: { 
    icon: <Ticket className="w-4 h-4" />, 
    color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' 
  },
};

const formatTime = (time: string) => {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

const ActivityCard = ({ activity, index, isLast, destination, onEdit, onDelete }: ActivityCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPhotoPanel, setShowPhotoPanel] = useState(false);
  const config = categoryConfig[activity.category] || categoryConfig.attraction;
  const showPhotoButton = PHOTO_CATEGORIES.includes(activity.category);

  const handleGetDirections = () => {
    if (activity.latitude && activity.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${activity.latitude},${activity.longitude}`;
      window.open(url, '_blank');
    } else if (activity.location) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.location)}`;
      window.open(url, '_blank');
    }
  };

  const handleDeleteConfirm = () => {
    onDelete?.(activity);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div className="relative flex gap-2 sm:gap-4">
        {/* Timeline connector */}
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-600 to-teal-500 text-white flex items-center justify-center text-xs sm:text-sm font-bold shadow-lg z-10 flex-shrink-0">
            {index + 1}
          </div>
          {!isLast && (
            <div className="w-0.5 flex-1 bg-gradient-to-b from-blue-300 to-teal-300 dark:from-blue-700 dark:to-teal-700 my-2" />
          )}
        </div>

        {/* Card Content */}
        <motion.div 
          className="flex-1 pb-4 min-w-0"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="p-3 sm:p-4 hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500 relative group touch-manipulation">
            {/* Edit/Delete buttons - Always visible on mobile, hover on desktop */}
            {(onEdit || onDelete) && (
              <div className="absolute top-2 right-2 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 sm:h-8 sm:w-8 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                    onClick={() => onEdit(activity)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 sm:h-8 sm:w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <div className="flex-1 min-w-0 pr-16">
                {/* Time & Category Badges - Stack on mobile */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
                  <Badge variant="outline" className="text-[10px] sm:text-xs font-mono">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatTime(activity.startTime)}
                    {activity.endTime && ` - ${formatTime(activity.endTime)}`}
                  </Badge>
                  <Badge className={`text-[10px] sm:text-xs ${config.color}`}>
                    {config.icon}
                    <span className="ml-1 capitalize">{activity.category}</span>
                  </Badge>
                  {activity.cuisine && (
                    <Badge variant="secondary" className="text-[10px] sm:text-xs">
                      {activity.cuisine}
                    </Badge>
                  )}
                </div>

                {/* Activity Name */}
                <h3 className="font-semibold text-foreground text-base sm:text-lg mb-1 break-words">
                  {activity.title}
                </h3>

                {/* Location */}
                {activity.location && (
                  <p className="text-xs sm:text-sm text-muted-foreground flex items-start gap-1 mb-2">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span className="break-words">{activity.location}</span>
                  </p>
                )}

                {/* Description */}
                <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                  {activity.description}
                </p>

                {/* Meta info */}
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {activity.duration && (
                    <span className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded">
                      <Clock className="w-3 h-3" />
                      {activity.duration} min
                    </span>
                  )}
                  {activity.estimatedCost > 0 && (
                    <span className="flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded">
                      <DollarSign className="w-3 h-3" />
                      ${activity.estimatedCost}
                    </span>
                  )}
                  {activity.estimatedCost === 0 && (
                    <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded">
                      Free
                    </span>
                  )}
                </div>

                {/* Expandable Tips */}
                {activity.tips && (
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                          <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-200">
                            💡 <strong>Tip:</strong> {activity.tips}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            </div>

            {/* Action Buttons - Stack vertically on mobile */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-3 pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGetDirections}
                className="text-xs min-h-[44px] sm:min-h-0 justify-center"
              >
                <Navigation className="w-3 h-3 mr-1" />
                Get Directions
              </Button>
              {showPhotoButton && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPhotoPanel(true)}
                  className="text-xs min-h-[44px] sm:min-h-0 justify-center bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30"
                >
                  <Aperture className="w-3 h-3 mr-1" />
                  📷 Photo Spots
                </Button>
              )}
              {activity.tips && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-xs min-h-[44px] sm:min-h-0 justify-center"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-3 h-3 mr-1" />
                      Hide Tips
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3 mr-1" />
                      Show Tips
                    </>
                  )}
                </Button>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this activity?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove "{activity.title}" from your itinerary. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Photo Recommendations Panel */}
      <PhotoRecommendationsPanel
        isOpen={showPhotoPanel}
        onClose={() => setShowPhotoPanel(false)}
        activityName={activity.title}
        location={activity.location}
        category={activity.category}
        destination={destination}
      />
    </>
  );
};

export default ActivityCard;
