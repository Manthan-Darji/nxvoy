import { useState, useMemo } from 'react';
import { format, addDays } from 'date-fns';
import { Calendar, DollarSign, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DayTabs from './DayTabs';
import ActivityCard, { Activity } from './ActivityCard';
import ActivityEditModal from './ActivityEditModal';

interface DayData {
  day: number;
  date?: string;
  activities: Activity[];
}

interface ItineraryTimelineProps {
  days: DayData[];
  startDate: string | null;
  onActivitySelect?: (activity: Activity, dayNumber: number) => void;
  onActivityUpdate?: (dayNumber: number, activityIndex: number, updatedActivity: Activity) => void;
  onActivityDelete?: (dayNumber: number, activityIndex: number) => void;
  onActivityAdd?: (dayNumber: number, newActivity: Activity) => void;
  editable?: boolean;
}

const ItineraryTimeline = ({ 
  days, 
  startDate, 
  onActivitySelect,
  onActivityUpdate,
  onActivityDelete,
  onActivityAdd,
  editable = true
}: ItineraryTimelineProps) => {
  const dayNumbers = days.map(d => d.day);
  const [selectedDay, setSelectedDay] = useState(dayNumbers[0] || 1);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  const [modalMode, setModalMode] = useState<'edit' | 'add'>('edit');

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

  const handleEditClick = (activity: Activity, index: number) => {
    setEditingActivity(activity);
    setEditingIndex(index);
    setModalMode('edit');
    setEditModalOpen(true);
  };

  const handleDeleteClick = (activity: Activity, index: number) => {
    onActivityDelete?.(selectedDay, index);
  };

  const handleAddClick = () => {
    setEditingActivity(null);
    setEditingIndex(-1);
    setModalMode('add');
    setEditModalOpen(true);
  };

  const handleSaveActivity = (updatedActivity: Activity) => {
    if (modalMode === 'edit' && editingIndex >= 0) {
      onActivityUpdate?.(selectedDay, editingIndex, updatedActivity);
    } else if (modalMode === 'add') {
      onActivityAdd?.(selectedDay, updatedActivity);
    }
    setEditModalOpen(false);
    setEditingActivity(null);
    setEditingIndex(-1);
  };

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
            onEdit={editable ? (a) => handleEditClick(a, index) : undefined}
            onDelete={editable ? (a) => handleDeleteClick(a, index) : undefined}
          />
        ))}
      </div>

      {/* Add Activity Button */}
      {editable && (
        <Button
          variant="outline"
          className="w-full border-dashed border-2 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors min-h-[48px] text-base"
          onClick={handleAddClick}
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Activity to Day {selectedDay}
        </Button>
      )}

      {/* Edit Modal */}
      <ActivityEditModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingActivity(null);
          setEditingIndex(-1);
        }}
        activity={editingActivity}
        onSave={handleSaveActivity}
        mode={modalMode}
      />
    </div>
  );
};

export default ItineraryTimeline;
