import React from 'react';
import { motion } from 'framer-motion';
import { 
  Bus, Plane, Train, Utensils, Bed, Camera, ShoppingBag,
  Clock, MapPin, ChevronRight, ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface TripActivity {
  time: string;
  activity: string;
  location_name: string;
  location_address?: string;
  cost: number;
  type: 'transport' | 'food' | 'sightseeing' | 'stay' | 'activity';
  duration_minutes?: number;
  notes?: string;
  transport_details?: {
    provider: string;
    from: string;
    to: string;
    booking_link?: string;
  };
}

interface TripDay {
  day: number;
  date: string;
  title: string;
  activities: TripActivity[];
}

interface TripResultTimelineProps {
  itinerary: TripDay[];
  activeDay: number;
  onDayChange: (day: number) => void;
  currencySymbol: string;
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'transport':
      return Bus;
    case 'food':
      return Utensils;
    case 'sightseeing':
      return Camera;
    case 'stay':
      return Bed;
    case 'activity':
      return ShoppingBag;
    default:
      return MapPin;
  }
};

const getActivityColor = (type: string) => {
  switch (type) {
    case 'transport':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'food':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'sightseeing':
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'stay':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'activity':
      return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

const TripResultTimeline = React.forwardRef<HTMLDivElement, TripResultTimelineProps>(({ 
  itinerary, 
  activeDay, 
  onDayChange,
  currencySymbol 
}, ref) => {
  const currentDay = itinerary.find(d => d.day === activeDay) || itinerary[0];

  // Calculate day total
  const dayTotal = currentDay?.activities.reduce((sum, act) => sum + (act.cost || 0), 0) || 0;

  return (
    <div ref={ref} className="space-y-6">
      {/* Day Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {itinerary.map((day) => (
          <button
            key={day.day}
            onClick={() => onDayChange(day.day)}
            className={cn(
              "flex-shrink-0 px-4 py-3 rounded-xl border transition-all duration-200 text-left min-w-[120px]",
              activeDay === day.day
                ? "bg-primary/20 border-primary text-primary"
                : "bg-card/50 border-border/50 text-muted-foreground hover:border-primary/50"
            )}
          >
            <div className="text-xs font-medium">Day {day.day}</div>
            <div className="text-sm font-semibold truncate text-foreground">
              {day.date && format(new Date(day.date), 'MMM d')}
            </div>
          </button>
        ))}
      </div>

      {/* Day Header */}
      {currentDay && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Day {currentDay.day}: {currentDay.title}
            </h2>
            {currentDay.date && (
              <p className="text-sm text-muted-foreground">
                {format(new Date(currentDay.date), 'EEEE, MMMM d, yyyy')}
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Day Total</div>
            <div className="text-lg font-bold font-mono text-foreground">
              {currencySymbol}{dayTotal.toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Activities Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />

        <div className="space-y-4">
          {currentDay?.activities.map((activity, index) => {
            const Icon = getActivityIcon(activity.type);
            const colorClass = getActivityColor(activity.type);

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative pl-14"
              >
                {/* Icon */}
                <div className={cn(
                  "absolute left-0 w-12 h-12 rounded-xl border flex items-center justify-center",
                  colorClass
                )}>
                  <Icon className="w-5 h-5" />
                </div>

                {/* Content Card */}
                <div className={cn(
                  "p-4 rounded-xl border transition-all",
                  activity.type === 'transport' 
                    ? "bg-blue-500/5 border-blue-500/20" 
                    : "bg-card/50 border-border/50 hover:border-border"
                )}>
                  {/* Time & Cost */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      {activity.time}
                      {activity.duration_minutes && (
                        <span className="text-xs">
                          · {activity.duration_minutes} min
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-sm font-medium text-foreground">
                      {currencySymbol}{activity.cost.toLocaleString()}
                    </div>
                  </div>

                  {/* Activity Name */}
                  <h3 className="font-semibold text-foreground mb-1">
                    {activity.activity}
                  </h3>

                  {/* Location */}
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{activity.location_name}</span>
                  </div>

                  {/* Transport Details (for transport type) */}
                  {activity.type === 'transport' && activity.transport_details && (
                    <div className="mt-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-blue-400 font-medium mb-1">
                            {activity.transport_details.provider}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-foreground">
                            <span>{activity.transport_details.from}</span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            <span>{activity.transport_details.to}</span>
                          </div>
                        </div>
                        {activity.transport_details.booking_link && (
                          <a
                            href={activity.transport_details.booking_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4 text-blue-400" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {activity.notes && (
                    <p className="mt-2 text-sm text-muted-foreground italic">
                      💡 {activity.notes}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

TripResultTimeline.displayName = 'TripResultTimeline';

export default TripResultTimeline;
