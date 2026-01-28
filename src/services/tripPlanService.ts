const BASE_URL = import.meta.env.VITE_SUPABASE_URL;

export interface TripPlanRequest {
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  currency: string;
  preferences: string[];
}

export interface TripActivity {
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

export interface TripDay {
  day: number;
  date: string;
  title: string;
  activities: TripActivity[];
}

export interface TripPlanResponse {
  trip_title: string;
  total_estimated_cost: number;
  currency: string;
  budget_status: 'within_budget' | 'over_budget' | 'under_budget';
  budget_message?: string;
  itinerary: TripDay[];
}

export async function generateTripPlan(
  request: TripPlanRequest,
  accessToken?: string
): Promise<TripPlanResponse> {
  console.log('[tripPlanService] Generating trip plan:', request);

  const response = await fetch(`${BASE_URL}/functions/v1/generate-trip-plan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    },
    body: JSON.stringify(request),
  });

  console.log('[tripPlanService] Response status:', response.status);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('[tripPlanService] Error:', errorData);
    
    if (response.status === 429) {
      throw new Error('Too many requests. Please wait a moment and try again.');
    }
    
    if (response.status === 402) {
      throw new Error('AI service credits exhausted. Please try again later.');
    }
    
    if (response.status === 504) {
      throw new Error(errorData.hint || 'Request timed out. Please try with a simpler trip.');
    }
    
    throw new Error(errorData.error || errorData.hint || 'Failed to generate trip plan');
  }

  const data = await response.json();
  console.log('[tripPlanService] Trip plan generated successfully');
  
  return data.tripPlan;
}
