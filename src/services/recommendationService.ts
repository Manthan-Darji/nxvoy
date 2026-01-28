import { supabase } from '@/integrations/supabase/client';
import { Activity } from '@/components/itinerary/ActivityCard';

export interface Recommendation {
  id: string;
  name: string;
  description: string;
  why_recommended: string;
  location: string;
  distance_km: number;
  estimated_cost: number;
  category: string;
  best_time: string;
  duration_hours: number;
}

export interface RecommendationRequest {
  destination: string;
  currentActivities: Activity[];
  userInterests: string[];
  budget: number;
  dayNumber: number;
  tripDate?: string;
}

export async function fetchRecommendations(request: RecommendationRequest): Promise<Recommendation[]> {
  const { data, error } = await supabase.functions.invoke('generate-recommendations', {
    body: request,
  });

  if (error) {
    console.error('Error fetching recommendations:', error);
    throw new Error(error.message || 'Failed to fetch recommendations');
  }

  if (!data.success) {
    throw new Error(data.error || 'Failed to generate recommendations');
  }

  return data.recommendations;
}

export function convertRecommendationToActivity(recommendation: Recommendation, dayNumber: number): Activity {
  // Calculate end time based on best_time and duration
  const [hours, minutes] = recommendation.best_time.split(':').map(Number);
  const endHours = hours + Math.floor(recommendation.duration_hours);
  const endMinutes = minutes + Math.round((recommendation.duration_hours % 1) * 60);
  
  const adjustedEndHours = endHours + Math.floor(endMinutes / 60);
  const adjustedEndMinutes = endMinutes % 60;
  
  const endTime = `${String(adjustedEndHours).padStart(2, '0')}:${String(adjustedEndMinutes).padStart(2, '0')}`;

  return {
    title: recommendation.name,
    description: recommendation.description,
    startTime: recommendation.best_time,
    endTime: endTime,
    location: recommendation.location,
    estimatedCost: recommendation.estimated_cost,
    category: recommendation.category,
  };
}
