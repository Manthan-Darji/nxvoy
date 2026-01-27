import { useState, useMemo } from 'react';
import { format, addDays } from 'date-fns';
import { Calendar, DollarSign } from 'lucide-react';
import DayTabs from './DayTabs';
import ActivityCard, { Activity } from './ActivityCard';

interface DayData {
  day: number;
  date?: string;
  activities: Activity[];
}

interface ItineraryTimelineProps {
  days: DayData[];
  startDate: string | null;
  onActivitySelect?: (activity: Activity, dayNumber: number) => void;
}

const ItineraryTimeline = ({ days, startDate, onActivitySelect }: ItineraryTimelineProps) => {
  const dayNumbers = days.map(d => d.day);
  const [selectedDay, setSelectedDay] = useState(dayNumbers[0] || 1);

  const dailyCosts = useMemo(() => {
    const costs: Record<number, number> = {};
    days.forEach(day => {
      costs[day.day] = day.activities.reduce((sum, a) => sum + (a.estimatedCost || 0), 0);
    });
    return costs;
  }, [days]);

  const currentDayData = days.find(d => d.day === selectedDay);
  const currentDate = startDate 
    ? addDays(new Date(startDate), selectedDay - 1)
    : null;

  const totalDayCost = currentDayData?.activities.reduce(
    (sum, a) => sum + (a.estimatedCost || 0), 
    0
  ) || 0;

  if (days.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Calendar className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No itinerary yet</p>
        <p className="text-sm">Chat with Shasa to generate your travel plan!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Day Tabs */}
      <DayTabs
        days={dayNumbers}
        selectedDay={selectedDay}
        onSelectDay={setSelectedDay}
        startDate={startDate}
        dailyCosts={dailyCosts}
      />

      {/* Day Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Day {selectedDay}
          </h2>
          {currentDate && (
            <p className="text-sm text-muted-foreground">
              {format(currentDate, 'EEEE, MMMM d, yyyy')}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold">
          <DollarSign className="w-4 h-4" />
          <span>${totalDayCost} today</span>
        </div>
      </div>

      {/* Activities Timeline */}
      <div className="space-y-0">
        {currentDayData?.activities.map((activity, index) => (
          <ActivityCard
            key={`${selectedDay}-${index}`}
            activity={activity}
            index={index}
            isLast={index === currentDayData.activities.length - 1}
          />
        ))}
      </div>
    </div>
  );
};

export default ItineraryTimeline;
