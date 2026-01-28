import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseRealtimeItineraryProps {
  tripId: string;
  userId: string | undefined;
  onItineraryChange: () => void;
}

export function useRealtimeItinerary({ tripId, userId, onItineraryChange }: UseRealtimeItineraryProps) {
  const { toast } = useToast();

  useEffect(() => {
    if (!tripId || !userId) return;

    // Subscribe to itinerary changes
    const channel = supabase
      .channel(`itinerary-changes-${tripId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'itineraries',
          filter: `trip_id=eq.${tripId}`,
        },
        async (payload) => {
          // Don't show toast for own changes (check via a brief delay)
          // The payload doesn't include who made the change, so we refresh and
          // show a generic notification
          
          if (payload.eventType === 'INSERT') {
            toast({
              title: '✨ New activity added',
              description: 'The itinerary has been updated by a collaborator',
            });
          } else if (payload.eventType === 'UPDATE') {
            toast({
              title: '📝 Activity updated',
              description: 'A collaborator made changes to the itinerary',
            });
          } else if (payload.eventType === 'DELETE') {
            toast({
              title: '🗑️ Activity removed',
              description: 'A collaborator removed an activity',
            });
          }
          
          onItineraryChange();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [tripId, userId, onItineraryChange, toast]);

  // Log activity helper
  const logActivity = useCallback(async (
    action: string,
    entityType: string,
    entityId?: string,
    entityName?: string,
    metadata?: Record<string, any>
  ) => {
    if (!userId || !tripId) return;
    
    await supabase.from('trip_activity_log').insert({
      trip_id: tripId,
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      entity_name: entityName,
      metadata,
    });
  }, [tripId, userId]);

  return { logActivity };
}
