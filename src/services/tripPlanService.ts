const BASE_URL = import.meta.env.VITE_SUPABASE_URL;

export class HttpError extends Error {
  status: number;
  hint?: string;
  retryAfterSeconds?: number;

  constructor(message: string, status: number, opts?: { hint?: string; retryAfterSeconds?: number }) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.hint = opts?.hint;
    this.retryAfterSeconds = opts?.retryAfterSeconds;
  }
}

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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 second client timeout

  try {
    const response = await fetch(`${BASE_URL}/functions/v1/generate-trip-plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    console.log('[tripPlanService] Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const retryAfterHeader = response.headers.get('Retry-After');
      const retryAfterSeconds = retryAfterHeader ? Number(retryAfterHeader) : undefined;
      console.error('[tripPlanService] Error:', errorData);
      
      if (response.status === 429) {
        throw new HttpError('Too many requests. Please wait a moment and try again.', 429, {
          retryAfterSeconds: Number.isFinite(retryAfterSeconds) ? retryAfterSeconds : undefined,
          hint: errorData.hint,
        });
      }
      
      if (response.status === 402) {
        throw new HttpError('AI service credits exhausted. Please try again later.', 402, {
          hint: errorData.hint,
        });
      }
      
      if (response.status === 504) {
        throw new HttpError(errorData.hint || 'Request timed out. Please try with a simpler trip.', 504);
      }
      
      throw new HttpError(errorData.error || errorData.hint || 'Failed to generate trip plan', response.status, {
        hint: errorData.hint,
        retryAfterSeconds: Number.isFinite(retryAfterSeconds) ? retryAfterSeconds : undefined,
      });
    }

    const data = await response.json();
    
    if (!data.tripPlan || !data.tripPlan.itinerary) {
      throw new Error('Invalid response from server. Please try again.');
    }
    
    console.log('[tripPlanService] Trip plan generated successfully');
    
    return data.tripPlan;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new HttpError(
        'Request timed out. Please try again with a shorter trip or simpler preferences.',
        504
      );
    }
    
    throw error;
  }
}
