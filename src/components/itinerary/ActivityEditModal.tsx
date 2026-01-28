import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity } from './ActivityCard';

interface ActivityEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: Activity | null;
  onSave: (activity: Activity) => void;
  mode: 'edit' | 'add';
}

const CATEGORIES = [
  { value: 'attraction', label: 'Attraction' },
  { value: 'food', label: 'Restaurant' },
  { value: 'activity', label: 'Activity' },
  { value: 'relaxation', label: 'Beach/Relaxation' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'culture', label: 'Culture' },
  { value: 'adventure', label: 'Adventure' },
  { value: 'nightlife', label: 'Nightlife' },
  { value: 'transport', label: 'Transport' },
];

const ActivityEditModal = ({ isOpen, onClose, activity, onSave, mode }: ActivityEditModalProps) => {
  const [formData, setFormData] = useState<Activity>({
    title: '',
    description: '',
    startTime: '09:00',
    endTime: '10:00',
    location: '',
    latitude: null,
    longitude: null,
    estimatedCost: 0,
    category: 'attraction',
    duration: 60,
  });

  useEffect(() => {
    if (activity && mode === 'edit') {
      setFormData(activity);
    } else if (mode === 'add') {
      setFormData({
        title: '',
        description: '',
        startTime: '09:00',
        endTime: '10:00',
        location: '',
        latitude: null,
        longitude: null,
        estimatedCost: 0,
        category: 'attraction',
        duration: 60,
      });
    }
  }, [activity, mode, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto w-[calc(100%-2rem)] mx-auto rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {mode === 'edit' ? 'Edit Activity' : 'Add New Activity'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Time */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime" className="text-sm">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
                className="min-h-[44px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime" className="text-sm">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                required
                className="min-h-[44px]"
              />
            </div>
          </div>

          {/* Activity Name */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm">Activity Name</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Visit Eiffel Tower"
              required
              className="min-h-[44px]"
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="text-sm">Location Address</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., Champ de Mars, Paris"
              className="min-h-[44px]"
            />
          </div>

          {/* Duration and Cost */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration" className="text-sm">Duration (min)</Label>
              <Input
                id="duration"
                type="number"
                min="0"
                value={formData.duration || 0}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                className="min-h-[44px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost" className="text-sm">Cost ($)</Label>
              <Input
                id="cost"
                type="number"
                min="0"
                step="0.01"
                value={formData.estimatedCost}
                onChange={(e) => setFormData({ ...formData, estimatedCost: parseFloat(e.target.value) || 0 })}
                className="min-h-[44px]"
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger className="min-h-[44px]">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-[100]">
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value} className="min-h-[44px]">
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add details about this activity..."
              rows={3}
              className="min-h-[80px]"
            />
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="min-h-[44px] w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" className="bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 min-h-[44px] w-full sm:w-auto">
              {mode === 'edit' ? 'Save Changes' : 'Add Activity'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ActivityEditModal;
