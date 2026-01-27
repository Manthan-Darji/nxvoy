export interface TripDetails {
  destination: string | null;
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
  interests: string[];
  tripType: string | null;
  isComplete: boolean;
}

export interface ItineraryActivity {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  estimatedCost: number;
  category: string;
  duration?: number;
}

export interface ItineraryDay {
  day: number;
  date?: string;
  activities: ItineraryActivity[];
}

const BASE_URL = import.meta.env.VITE_SUPABASE_URL;

export async function extractTripDetails(
  messages: { role: string; content: string }[],
  accessToken?: string
): Promise<TripDetails> {
  const response = await fetch(`${BASE_URL}/functions/v1/extract-trip-details`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    throw new Error('Failed to extract trip details');
  }

  return response.json();
}

export async function generateItinerary(
  tripDetails: Omit<TripDetails, 'isComplete'>,
  accessToken?: string
): Promise<ItineraryDay[]> {
  console.log('[tripService] Calling generate-itinerary with:', tripDetails);
  
  const response = await fetch(`${BASE_URL}/functions/v1/generate-itinerary`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    },
    body: JSON.stringify(tripDetails),
  });

  console.log('[tripService] Response status:', response.status);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('[tripService] Error response:', errorData);
    throw new Error(errorData.error || errorData.hint || 'Failed to generate itinerary');
  }

  const data = await response.json();
  console.log('[tripService] Received itinerary with', data.itinerary?.length, 'days');
  
  return data.itinerary;
}
