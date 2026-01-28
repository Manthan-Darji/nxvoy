import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RefreshCw, Clock, Route, ArrowRight, Check, X, 
  Sparkles, TrendingDown, MapPin 
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity } from './ActivityCard';

interface OptimizationResult {
  originalOrder: Activity[];
  optimizedOrder: Activity[];
  originalTotalTime: number;
  optimizedTotalTime: number;
  timeSaved: number;
  segmentDetails: {
    from: string;
    to: string;
    duration: number;
    distance: number;
  }[];
}

interface RouteOptimizationModalProps {
  open: boolean;
  onClose: () => void;
  onApply: (optimizedActivities: Activity[]) => void;
  isOptimizing: boolean;
  result: OptimizationResult | null;
  dayNumber: number;
}

const RouteOptimizationModal = ({
  open,
  onClose,
  onApply,
  isOptimizing,
  result,
  dayNumber,
}: RouteOptimizationModalProps) => {
  const [showComparison, setShowComparison] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);

  useEffect(() => {
    if (result && !isOptimizing) {
      setShowComparison(true);
      // Animate progress
      const interval = setInterval(() => {
        setAnimationProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 2;
        });
      }, 20);
      return () => clearInterval(interval);
    } else {
      setShowComparison(false);
      setAnimationProgress(0);
    }
  }, [result, isOptimizing]);

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const savingsPercentage = result
    ? Math.round((result.timeSaved / Math.max(result.originalTotalTime, 1)) * 100)
    : 0;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-5 h-5 text-primary" />
            Route Optimization - Day {dayNumber}
          </DialogTitle>
          <DialogDescription>
            AI-powered route optimization using Traveling Salesman algorithm
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {isOptimizing && (
            <motion.div
              key="optimizing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="py-12 flex flex-col items-center gap-6"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-teal-500 flex items-center justify-center"
              >
                <RefreshCw className="w-8 h-8 text-white" />
              </motion.div>
              <div className="text-center">
                <h3 className="font-semibold text-lg mb-2">Calculating optimal route...</h3>
                <p className="text-muted-foreground text-sm">
                  Analyzing distances and travel times between all locations
                </p>
              </div>
              <Progress value={animationProgress} className="w-64" />
            </motion.div>
          )}

          {showComparison && result && (
            <motion.div
              key="comparison"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Time Savings Highlight */}
              {result.timeSaved > 0 && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-6 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
                    className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500 flex items-center justify-center"
                  >
                    <TrendingDown className="w-8 h-8 text-white" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                    Save {formatTime(result.timeSaved)}!
                  </h3>
                  <p className="text-muted-foreground">
                    That's {savingsPercentage}% less travel time
                  </p>
                </motion.div>
              )}

              {result.timeSaved === 0 && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 text-center">
                  <Check className="w-12 h-12 mx-auto mb-4 text-blue-500" />
                  <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                    Route Already Optimal!
                  </h3>
                  <p className="text-muted-foreground">
                    Your current route is already the most efficient
                  </p>
                </div>
              )}

              {/* Before/After Comparison */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Original Route */}
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="border rounded-xl p-4 bg-muted/30"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                      <Route className="w-4 h-4 text-orange-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Original Route</h4>
                      <Badge variant="outline" className="text-orange-600">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatTime(result.originalTotalTime)} travel
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {result.originalOrder.slice(0, 5).map((activity, i) => (
                      <motion.div
                        key={`orig-${i}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + i * 0.1 }}
                        className="flex items-center gap-2 text-sm"
                      >
                        <span className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-600 flex items-center justify-center text-xs font-bold">
                          {i + 1}
                        </span>
                        <span className="truncate flex-1">{activity.title}</span>
                      </motion.div>
                    ))}
                    {result.originalOrder.length > 5 && (
                      <p className="text-xs text-muted-foreground pl-8">
                        +{result.originalOrder.length - 5} more activities
                      </p>
                    )}
                  </div>
                </motion.div>

                {/* Optimized Route */}
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="border rounded-xl p-4 bg-green-500/5 border-green-500/20"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-green-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Optimized Route</h4>
                      <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatTime(result.optimizedTotalTime)} travel
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {result.optimizedOrder.slice(0, 5).map((activity, i) => (
                      <motion.div
                        key={`opt-${i}`}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + i * 0.1 }}
                        className="flex items-center gap-2 text-sm"
                      >
                        <span className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold">
                          {i + 1}
                        </span>
                        <span className="truncate flex-1">{activity.title}</span>
                      </motion.div>
                    ))}
                    {result.optimizedOrder.length > 5 && (
                      <p className="text-xs text-muted-foreground pl-8">
                        +{result.optimizedOrder.length - 5} more activities
                      </p>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Segment Details */}
              {result.segmentDetails.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="border rounded-xl p-4"
                >
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Optimized Route Segments
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {result.segmentDetails.map((segment, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.7 + i * 0.05 }}
                        className="flex items-center gap-2 text-sm bg-muted/30 rounded-lg p-2"
                      >
                        <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">
                          {i + 1}
                        </span>
                        <span className="truncate flex-1 max-w-[100px]">{segment.from}</span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        <span className="truncate flex-1 max-w-[100px]">{segment.to}</span>
                        <Badge variant="secondary" className="text-xs ml-auto">
                          {segment.duration} min • {segment.distance} km
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isOptimizing}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          {result && result.timeSaved > 0 && (
            <Button
              onClick={() => onApply(result.optimizedOrder)}
              disabled={isOptimizing}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <Check className="w-4 h-4 mr-2" />
              Apply Optimized Route
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RouteOptimizationModal;
