import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are a travel itinerary generator. Return ONLY valid JSON - no markdown, no explanations, no text before or after the JSON. Your response must be parseable by JSON.parse().`;

serve(async (req) => {
  console.log("[generate-itinerary] Request received");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { destination, startDate, endDate, budget, interests, tripType } = await req.json();
    console.log("[generate-itinerary] Input:", { destination, startDate, endDate, budget, interests, tripType });
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("[generate-itinerary] LOVABLE_API_KEY is not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Calculate trip duration
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    console.log("[generate-itinerary] Trip duration:", days, "days");

    // Generate dates array
    const dates: string[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }

    const prompt = `Create a ${days}-day itinerary for ${destination}.

Budget: $${budget || 1000} USD total
Interests: ${interests?.join(', ') || 'general sightseeing'}
Traveler: ${tripType || 'solo'}

For EACH day, provide 3-4 activities spread throughout the day.

Return this exact JSON structure (no markdown, no explanation):
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
          "location": "Full Address, City",
          "lat": 0.0000,
          "lng": 0.0000,
          "duration": 180,
          "cost": 25,
          "category": "attraction",
          "description": "Brief description under 80 characters"
        }
      ]
    }
  ]
}

IMPORTANT:
- Use real coordinates (lat/lng) for each location
- Categories MUST be one of: attraction, food, culture, adventure, relaxation, shopping, nightlife, transport
- Keep descriptions brief (under 80 characters)
- Spread activities across morning, afternoon, and evening
- Return ONLY the JSON object`;

    console.log("[generate-itinerary] Calling AI gateway...");
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    try {
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
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[generate-itinerary] AI gateway error:", response.status, errorText);
        return new Response(
          JSON.stringify({ error: "AI service temporarily unavailable", details: errorText }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";
      
      console.log("[generate-itinerary] Raw response length:", content.length);
      console.log("[generate-itinerary] Raw response preview:", content.substring(0, 500));

      // Parse JSON from response
      let itinerary;
      try {
        let cleanJson = content.trim();
        
        // Remove markdown code blocks if present
        if (cleanJson.includes('```')) {
          const codeBlockMatch = cleanJson.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (codeBlockMatch) {
            cleanJson = codeBlockMatch[1].trim();
            console.log("[generate-itinerary] Extracted from markdown code block");
          }
        }
        
        // Extract JSON object
        const jsonStartIndex = cleanJson.indexOf('{');
        const jsonEndIndex = cleanJson.lastIndexOf('}');
        if (jsonStartIndex !== -1 && jsonEndIndex > jsonStartIndex) {
          cleanJson = cleanJson.substring(jsonStartIndex, jsonEndIndex + 1);
        }
        
        // Validate JSON structure before parsing
        const openBraces = (cleanJson.match(/{/g) || []).length;
        const closeBraces = (cleanJson.match(/}/g) || []).length;
        
        if (openBraces !== closeBraces) {
          console.error("[generate-itinerary] JSON brace mismatch - open:", openBraces, "close:", closeBraces);
          throw new Error("Incomplete JSON response");
        }
        
        console.log("[generate-itinerary] Parsing JSON of length:", cleanJson.length);
        const parsed = JSON.parse(cleanJson);
        
        if (!parsed.days || !Array.isArray(parsed.days)) {
          console.error("[generate-itinerary] Invalid structure - missing days array");
          throw new Error("Invalid itinerary structure");
        }
        
        // Transform to consistent format for frontend
        itinerary = parsed.days.map((day: any, dayIndex: number) => ({
          day: day.dayNumber || dayIndex + 1,
          date: day.date || dates[dayIndex] || null,
          activities: (day.activities || []).map((a: any) => ({
            title: a.name || a.title || "Activity",
            description: a.description || "",
            startTime: a.time || a.startTime || "09:00",
            endTime: a.endTime || "12:00",
            location: a.location || a.address || destination,
            latitude: a.lat || a.latitude || null,
            longitude: a.lng || a.longitude || null,
            estimatedCost: a.cost || a.estimatedCost || 0,
            category: a.category || "attraction",
            duration: a.duration || 120,
          })),
        }));
        
        console.log("[generate-itinerary] Successfully parsed", itinerary.length, "days");
        console.log("[generate-itinerary] First day activities:", itinerary[0]?.activities?.length || 0);
        
      } catch (parseError) {
        console.error("[generate-itinerary] Parse error:", parseError);
        console.error("[generate-itinerary] Failed content:", content.substring(0, 1000));
        return new Response(
          JSON.stringify({ 
            error: "Failed to parse itinerary", 
            details: String(parseError),
            hint: "AI response was malformed. Please try again."
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("[generate-itinerary] Returning successful response");
      return new Response(JSON.stringify({ itinerary }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
      
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error("[generate-itinerary] Request timed out after 60 seconds");
        return new Response(
          JSON.stringify({ error: "Request timed out", hint: "The AI took too long to respond. Please try again." }),
          { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw fetchError;
    }
    
  } catch (error) {
    console.error("[generate-itinerary] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
