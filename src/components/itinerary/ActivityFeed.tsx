import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Clock, Plus, Edit, Trash2, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { getRecentActivity, ActivityLog } from '@/services/collaborationService';
import { formatDistanceToNow } from 'date-fns';

interface ActivityFeedProps {
  tripId: string;
}

const ActivityFeed = ({ tripId }: ActivityFeedProps) => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadActivity = async () => {
    const data = await getRecentActivity(tripId, 15);
    setActivities(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadActivity();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`activity-${tripId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trip_activity_log',
          filter: `trip_id=eq.${tripId}`,
        },
        () => {
          loadActivity();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [tripId]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'added':
        return <Plus className="w-3 h-3 text-green-500" />;
      case 'updated':
        return <Edit className="w-3 h-3 text-blue-500" />;
      case 'deleted':
        return <Trash2 className="w-3 h-3 text-red-500" />;
      case 'reordered':
        return <MapPin className="w-3 h-3 text-purple-500" />;
      default:
        return <Activity className="w-3 h-3 text-muted-foreground" />;
    }
  };

  const getActionText = (activity: ActivityLog) => {
    const name = activity.profile?.name || 'Someone';
    const entityName = activity.entity_name || activity.entity_type;
    
    switch (activity.action) {
      case 'added':
        return <><strong>{name}</strong> added <strong>{entityName}</strong></>;
      case 'updated':
        return <><strong>{name}</strong> updated <strong>{entityName}</strong></>;
      case 'deleted':
        return <><strong>{name}</strong> removed <strong>{entityName}</strong></>;
      case 'reordered':
        return <><strong>{name}</strong> optimized the route</>;
      default:
        return <><strong>{name}</strong> modified the itinerary</>;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (activities.length === 0 && !isLoading) {
    return null;
  }

  return (
    <Card className="border-muted">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-48">
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {activities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ delay: index * 0.03 }}
                  className="flex items-start gap-3"
                >
                  <Avatar className="w-6 h-6 flex-shrink-0">
                    <AvatarFallback className="text-[10px] bg-primary/10">
                      {activity.profile?.name ? getInitials(activity.profile.name) : '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs leading-relaxed">
                      {getActionIcon(activity.action)}
                      <span className="ml-1">{getActionText(activity)}</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ActivityFeed;
