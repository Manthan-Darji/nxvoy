import { supabase } from '@/integrations/supabase/client';

export interface PlanTripTraveler {
  age: number;
  gender: string;
}

export interface PlanTripRequest {
  location: string;
  travelers: {
    total: number;
    travelers: PlanTripTraveler[];
  };
  preferences: {
    hidden_gems: boolean;
  };
}

export interface PlanTripPlace {
  place_name: string;
  description: string;
  category: string;
  min_age: number;
  is_hidden_gem: boolean;
  video_url: string | null;
  badge: string | null;
}

export interface PlanTripResponse {
  location: string;
  tone: string;
  hidden_gems_enabled: boolean;
  has_children: boolean;
  traveler_count: number;
  places: PlanTripPlace[];
  _mock: boolean;
}

export async function planTrip(request: PlanTripRequest): Promise<PlanTripResponse> {
  const { data, error } = await supabase.functions.invoke('plan-trip', {
    body: request,
  });

  if (error) {
    console.error('[planTripService] Error:', error);
    throw new Error(error.message || 'Failed to plan trip');
  }

  return data as PlanTripResponse;
}
