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

    const prompt = `Create a detailed ${days}-day travel itinerary for a trip to ${destination}.

Trip Details:
- Dates: ${startDate} to ${endDate} (${days} days)
- Budget: $${budget} USD total
- Travel Style: ${tripType || 'solo'}
- Interests: ${interests?.join(', ') || 'general sightseeing'}

For each day, provide 3-4 activities with:
- Title (short, descriptive)
- Description (2-3 sentences about the activity)
- Suggested time (morning/afternoon/evening or specific hours)
- Location/address
- Estimated cost in USD
- Category (sightseeing, food, adventure, culture, relaxation, transport)

Format your response as a JSON array:
[
  {
    "day": 1,
    "activities": [
      {
        "title": "Activity name",
        "description": "What you'll do and why it's great",
        "startTime": "09:00",
        "endTime": "12:00",
        "location": "Specific place name, area",
        "estimatedCost": 25,
        "category": "sightseeing"
      }
    ]
  }
]

Make it realistic, fun, and within budget. Include mix of must-sees and hidden gems.
Only return the JSON array, no other text.`;

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
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      itinerary = JSON.parse(jsonMatch[1].trim());
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
