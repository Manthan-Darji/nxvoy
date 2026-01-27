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
  estimatedCost: number;
  category: string;
}

export interface ItineraryDay {
  day: number;
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
  const response = await fetch(`${BASE_URL}/functions/v1/generate-itinerary`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    },
    body: JSON.stringify(tripDetails),
  });

  if (!response.ok) {
    throw new Error('Failed to generate itinerary');
  }

  const data = await response.json();
  return data.itinerary;
}
