import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { destination, startDate, endDate, budget, interests, tripType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Calculate trip duration
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Generate dates array
    const dates: string[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }

    const prompt = `Create a detailed ${days}-day itinerary for ${destination} with budget $${budget} USD.

For each day, provide:
- Morning activity (9 AM - 12 PM): attraction name, location, description, estimated cost, duration
- Afternoon activity (1 PM - 5 PM): same details  
- Evening activity (6 PM - 9 PM): same details
- Restaurant recommendations for lunch and dinner with cuisine type

Consider these interests: ${interests?.join(', ') || 'general sightseeing'}
Traveler type: ${tripType || 'solo'}

Return as JSON:
{
  "days": [
    {
      "dayNumber": 1,
      "date": "${dates[0]}",
      "activities": [
        {
          "time": "09:00",
          "endTime": "12:00",
          "name": "Activity Name",
          "location": "Full address or area",
          "coordinates": {"lat": 0.0, "lng": 0.0},
          "duration": 180,
          "cost": 25,
          "category": "attraction",
          "description": "Brief description of the activity"
        },
        {
          "time": "12:30",
          "endTime": "14:00",
          "name": "Lunch at Restaurant Name",
          "location": "Restaurant address",
          "coordinates": {"lat": 0.0, "lng": 0.0},
          "duration": 90,
          "cost": 30,
          "category": "food",
          "cuisine": "Local/Italian/etc",
          "description": "Description of the restaurant and recommended dishes"
        }
      ]
    }
  ],
  "totalCost": 450,
  "summary": "Brief trip summary highlighting key experiences"
}

Categories to use: attraction, food, adventure, culture, relaxation, shopping, nightlife, transport
Make it realistic, fun, and within budget. Include mix of must-sees and hidden gems.
Only return valid JSON, no markdown or other text.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "user", content: prompt },
        ],
        temperature: 0.8,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate itinerary" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";
    
    // Parse JSON from response
    let itinerary;
    try {
      // Handle markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      const cleanJson = jsonMatch[1].trim();
      const parsed = JSON.parse(cleanJson);
      
      // Transform to consistent format for frontend
      if (parsed.days) {
        itinerary = parsed.days.map((day: any) => ({
          day: day.dayNumber,
          date: day.date,
          activities: day.activities.map((a: any) => ({
            title: a.name,
            description: a.description,
            startTime: a.time,
            endTime: a.endTime,
            location: a.location,
            coordinates: a.coordinates,
            estimatedCost: a.cost,
            category: a.category,
            duration: a.duration,
            cuisine: a.cuisine,
          })),
        }));
      } else {
        itinerary = parsed;
      }
    } catch (e) {
      console.error("Failed to parse itinerary:", content, e);
      return new Response(
        JSON.stringify({ error: "Failed to parse itinerary response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ itinerary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Generate itinerary error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
