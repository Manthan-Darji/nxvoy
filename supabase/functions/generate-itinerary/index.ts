import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are a professional travel planner. You MUST return ONLY valid JSON - no markdown, no explanations, no text before or after the JSON.
Your response must be a single JSON object that can be parsed by JSON.parse().`;

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

    const prompt = `Create a ${days}-day itinerary for ${destination} with budget $${budget} USD.
Interests: ${interests?.join(', ') || 'general sightseeing'}
Traveler type: ${tripType || 'solo'}

For EACH day provide 4 activities: morning (9AM), afternoon (2PM), evening (6PM), dinner (8PM).

Return this exact JSON structure:
{
  "days": [
    {
      "dayNumber": 1,
      "date": "${dates[0]}",
      "activities": [
        {
          "time": "09:00",
          "endTime": "12:00",
          "name": "Place Name",
          "location": "Address",
          "duration": 180,
          "cost": 25,
          "category": "attraction",
          "description": "Brief description"
        }
      ]
    }
  ],
  "totalCost": 450
}

Categories: attraction, food, adventure, culture, relaxation, shopping, nightlife, transport.
Keep descriptions brief (under 100 characters). Return ONLY the JSON object.`;

    console.log("Generating itinerary for", destination, "- Days:", days);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 8000,
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
    const content = data.choices?.[0]?.message?.content || "";
    
    console.log("Received response length:", content.length);

    // Parse JSON from response
    let itinerary;
    try {
      // Clean up the content - handle various AI response formats
      let cleanJson = content.trim();
      
      // Remove markdown code blocks if present
      const codeBlockMatch = cleanJson.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        cleanJson = codeBlockMatch[1].trim();
      }
      
      // Try to extract JSON object if there's extra text before/after
      const jsonStartIndex = cleanJson.indexOf('{');
      const jsonEndIndex = cleanJson.lastIndexOf('}');
      if (jsonStartIndex !== -1 && jsonEndIndex > jsonStartIndex) {
        cleanJson = cleanJson.substring(jsonStartIndex, jsonEndIndex + 1);
      }
      
      // Check if JSON appears complete (basic validation)
      const openBraces = (cleanJson.match(/{/g) || []).length;
      const closeBraces = (cleanJson.match(/}/g) || []).length;
      const openBrackets = (cleanJson.match(/\[/g) || []).length;
      const closeBrackets = (cleanJson.match(/\]/g) || []).length;
      
      if (openBraces !== closeBraces || openBrackets !== closeBrackets) {
        console.error("JSON appears incomplete - brace mismatch. Open braces:", openBraces, "Close braces:", closeBraces);
        throw new Error("Incomplete JSON response from AI");
      }
      
      console.log("Parsing JSON of length:", cleanJson.length);
      const parsed = JSON.parse(cleanJson);
      
      // Validate the structure
      if (!parsed.days || !Array.isArray(parsed.days)) {
        throw new Error("Invalid itinerary structure - missing days array");
      }
      
      // Transform to consistent format for frontend
      itinerary = parsed.days.map((day: any) => ({
        day: day.dayNumber,
        date: day.date,
        activities: (day.activities || []).map((a: any) => ({
          title: a.name || "Activity",
          description: a.description || "",
          startTime: a.time || "09:00",
          endTime: a.endTime || "12:00",
          location: a.location || destination,
          coordinates: a.coordinates,
          estimatedCost: a.cost || 0,
          category: a.category || "attraction",
          duration: a.duration || 120,
          cuisine: a.cuisine,
        })),
      }));
      
      console.log("Successfully parsed itinerary with", itinerary.length, "days");
    } catch (e) {
      console.error("Failed to parse itinerary. Error:", e);
      console.error("Raw content (first 1000 chars):", content.substring(0, 1000));
      return new Response(
        JSON.stringify({ 
          error: "Failed to parse itinerary response", 
          details: String(e),
          hint: "The AI response may have been truncated or malformed"
        }),
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
