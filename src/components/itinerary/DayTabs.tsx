import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface DayTabsProps {
  days: number[];
  selectedDay: number;
  onSelectDay: (day: number) => void;
  startDate: string | null;
  dailyCosts: Record<number, number>;
}

const DayTabs = ({ days, selectedDay, onSelectDay, startDate, dailyCosts }: DayTabsProps) => {
  const getDateForDay = (dayNumber: number) => {
    if (!startDate) return null;
    return addDays(new Date(startDate), dayNumber - 1);
  };

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
      {days.map((day) => {
        const date = getDateForDay(day);
        const isSelected = selectedDay === day;
        const cost = dailyCosts[day] || 0;

        return (
          <button
            key={day}
            onClick={() => onSelectDay(day)}
            className={cn(
              "flex-shrink-0 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all duration-200 min-w-[80px] sm:min-w-[100px]",
              "border-2 text-left touch-manipulation min-h-[60px]",
              isSelected
                ? "bg-gradient-to-br from-blue-600 to-teal-500 text-white border-transparent shadow-lg scale-105"
                : "bg-card hover:bg-muted border-border hover:border-blue-300"
            )}
          >
            <div className="font-bold text-xs sm:text-sm">Day {day}</div>
            {date && (
              <div className={cn(
                "text-[10px] sm:text-xs mt-0.5",
                isSelected ? "text-white/80" : "text-muted-foreground"
              )}>
                {format(date, 'MMM d')}
              </div>
            )}
            <div className={cn(
              "text-[10px] sm:text-xs mt-1 font-medium",
              isSelected ? "text-white/90" : "text-green-600 dark:text-green-400"
            )}>
              ${cost}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default DayTabs;
