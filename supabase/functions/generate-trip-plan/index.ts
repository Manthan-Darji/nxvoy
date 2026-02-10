import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an obsessive, high-energy travel planner. You MUST generate a minute-by-minute itinerary. Return ONLY valid JSON - no markdown, no explanations.

CRITICAL RULES:
1. Return parseable JSON only
2. Use realistic Indian prices (buses ₹300-1500, hotels ₹800-3000/night, meals ₹100-500)
3. STRICTLY respect budget
4. HYPER-DENSITY RULE: For EVERY day, you MUST provide entries for ALL of these specific time slots:
   * 08:00 AM - Breakfast / Morning Start
   * 09:30 AM - Activity 1 (Sightseeing)
   * 11:30 AM - Activity 2 (Hidden Gem/Culture)
   * 01:00 PM - Lunch (Specific Famous Restaurant)
   * 02:30 PM - Activity 3 (Adventure/Museum)
   * 04:30 PM - Activity 4 (Relax/Coffee/Snack)
   * 06:30 PM - Activity 5 (Sunset/Viewpoint)
   * 08:00 PM - Dinner
   * 09:30 PM - Nightlife/Walk
   This means MINIMUM 8-9 distinct activities per day. NO EXCEPTIONS.
5. NO GROUPING RULE: Do not group activities. "Visit Museum and Park" is WRONG. Split them into two distinct JSON objects with different times. Each activity must be a separate entry.
6. NO LAZY DAYS: Never suggest "Free time" or "Relax at hotel" unless it is after 10 PM. The user wants to see everything. Every moment must be filled with a specific activity.
7. CONTENT RULE: Prioritize ONLY famous, 4.5+ star rated landmarks and viral food spots. No generic 'walk in park' entries unless it is a famous park (e.g., Central Park, Hyde Park).
8. STRUCTURE: Every activity MUST have:
   - Specific time (HH:MM AM/PM format matching the required slots above)
   - location_name: Exact Google Maps name of the place
   - location_address: FULL address with city name for accurate mapping
   - description: Brief explanation of why it's famous or noteworthy
9. For location_address, ALWAYS include the full address with city name for accurate mapping

JSON SCHEMA:
{
  "trip_title": "string",
  "total_estimated_cost": number,
  "currency": "INR",
  "budget_status": "within_budget" | "over_budget" | "under_budget",
  "budget_message": "string",
  "itinerary": [
    {
      "day": number,
      "date": "YYYY-MM-DD",
      "title": "string",
      "activities": [
        {
          "time": "HH:MM AM/PM",
          "activity": "string",
          "location_name": "string (EXACT Google Maps name, e.g., Gateway of India)",
          "location_address": "string (FULL address with city, e.g., Apollo Bandar, Colaba, Mumbai, Maharashtra 400001)",
          "description": "string (why this place is famous or noteworthy)",
          "cost": number,
          "type": "transport" | "food" | "sightseeing" | "stay" | "activity",
          "duration_minutes": number
        }
      ]
    }
  ]
}`;

serve(async (req) => {
  console.log("[generate-trip-plan] Request received");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { origin, destination, startDate, endDate, budget, currency, preferences, travelers, hidden_gems } = await req.json();
    console.log("[generate-trip-plan] Input:", { origin, destination, startDate, endDate, budget, currency, preferences, travelers, hidden_gems });
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("[generate-trip-plan] LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate trip duration
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    console.log("[generate-trip-plan] Trip duration:", days, "days");

    // Generate dates array
    const dates: string[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }

    // Build concise prompt
    const vibesText = preferences?.length > 0 ? preferences.join(', ') : 'general sightseeing';
    
    // Build traveler context
    let travelerContext = '';
    if (travelers && travelers.travelers && travelers.travelers.length > 0) {
      const travelerDescriptions = travelers.travelers.map((t: { age: number; gender: string }, i: number) => 
        `Person ${i + 1}: Age ${t.age}, ${t.gender}`
      ).join('; ');
      travelerContext = `\n\nTRAVEL GROUP (${travelers.total} people): ${travelerDescriptions}
IMPORTANT: Tailor activities specifically for this group's demographics:
- For travelers under 25: Include nightlife, adventure sports, trendy cafes, Instagram-worthy spots
- For travelers 25-40: Mix of culture, food experiences, moderate adventure
- For travelers 40-60: Focus on heritage, comfortable dining, scenic spots, wellness
- For travelers over 60: Prioritize accessibility, cultural experiences, gentle walks, heritage sites`;
    }

    let hiddenGemsContext = '';
    if (hidden_gems) {
      hiddenGemsContext = `\n\nHIDDEN GEMS MODE ACTIVATED: For at least 30% of activities, suggest NON-TOURISTY, underrated, local-secret spots. Mark these activities by adding "🔶 HIDDEN GEM:" prefix to their activity name. These should be places locals love but tourists rarely visit. Include hole-in-the-wall restaurants, secret viewpoints, lesser-known temples/sites, local markets, and neighborhood gems.`;
    }

    // Maximum token budget for hyper-dense schedules (8-9 activities per day)
    // Set to 8192 (maximum for Flash model) to ensure long responses aren't cut off
    const maxTokens = 8192;

    const prompt = `Create a ${days}-day HYPER-DENSE trip itinerary from ${origin} to ${destination}.
Dates: ${startDate} to ${endDate}
Budget: ${currency} ${budget}
Style: ${vibesText}${travelerContext}${hiddenGemsContext}

MANDATORY STRUCTURE REQUIREMENT:
For EVERY single day, you MUST provide entries for ALL of these specific time slots (8-9 activities minimum):
- 08:00 AM - Breakfast / Morning Start (specific restaurant/cafe name)
- 09:30 AM - Activity 1 (Sightseeing - specific landmark/monument)
- 11:30 AM - Activity 2 (Hidden Gem/Culture - specific museum/gallery/temple)
- 01:00 PM - Lunch (Specific Famous Restaurant - exact name)
- 02:30 PM - Activity 3 (Adventure/Museum - specific activity name)
- 04:30 PM - Activity 4 (Relax/Coffee/Snack - specific cafe/snack spot)
- 06:30 PM - Activity 5 (Sunset/Viewpoint - specific location)
- 08:00 PM - Dinner (Specific Famous Restaurant - exact name)
- 09:30 PM - Nightlife/Walk (specific area/market/street)

CRITICAL REQUIREMENTS:
- Day 1: Include transport from ${origin} to ${destination} (can be at 08:00 AM or earlier)
- Last day: Include return transport (can be at 09:30 PM or later)
- NO GROUPING: Each activity must be a separate JSON object. "Visit Museum and Park" is FORBIDDEN. Split into two entries.
- NO LAZY TIME: Never suggest "Free time", "Relax at hotel", or "Explore on your own" unless it's after 10 PM. Every moment must have a specific, named activity.
- QUALITY: Prioritize ONLY famous, 4.5+ star rated landmarks and viral food spots
- NO generic activities like "walk in park" unless it's a world-famous park
- Each activity must have:
  * Exact time matching the slots above (e.g., "08:00 AM", "01:00 PM")
  * Exact Google Maps location name
  * Full address with city name
  * Brief description of why it's famous
- Stay within budget of ${currency} ${budget}

Generate a HYPER-DENSE itinerary with 8-9 distinct activities per day. Use real, famous places only. Every time slot must be filled.`;

    console.log("[generate-trip-plan] Calling AI gateway with optimized settings...");
    
    // Shorter timeout for better UX
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: prompt },
          ],
          temperature: 0.3,
          max_tokens: maxTokens,
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[generate-trip-plan] AI gateway error:", response.status, errorText);
        
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
            {
              status: 429,
              headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "2" },
            }
          );
        }
        
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: "AI service credits exhausted. Please try again later." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        return new Response(
          JSON.stringify({ error: "AI service temporarily unavailable", details: errorText }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";
      
      console.log("[generate-trip-plan] Raw response length:", content.length);

      // Parse JSON from response
      let tripPlan;
      try {
        let cleanJson = content.trim();
        
        // Remove markdown code blocks if present
        if (cleanJson.includes('```')) {
          const codeBlockMatch = cleanJson.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (codeBlockMatch) {
            cleanJson = codeBlockMatch[1].trim();
          }
        }
        
        // Extract JSON object
        const jsonStartIndex = cleanJson.indexOf('{');
        const jsonEndIndex = cleanJson.lastIndexOf('}');
        if (jsonStartIndex !== -1 && jsonEndIndex > jsonStartIndex) {
          cleanJson = cleanJson.substring(jsonStartIndex, jsonEndIndex + 1);
        }
        
        // Validate JSON structure
        const openBraces = (cleanJson.match(/{/g) || []).length;
        const closeBraces = (cleanJson.match(/}/g) || []).length;
        
        if (openBraces !== closeBraces) {
          console.error("[generate-trip-plan] JSON brace mismatch");
          throw new Error("Incomplete JSON response");
        }
        
        tripPlan = JSON.parse(cleanJson);
        
        // Validate required fields
        if (!tripPlan.trip_title || !tripPlan.itinerary || !Array.isArray(tripPlan.itinerary)) {
          throw new Error("Invalid trip plan structure");
        }
        
        // Ensure dates are set
        tripPlan.itinerary = tripPlan.itinerary.map((day: any, index: number) => ({
          ...day,
          day: day.day || index + 1,
          date: day.date || dates[index] || null,
        }));
        
        console.log("[generate-trip-plan] Successfully parsed", tripPlan.itinerary.length, "days");
        
      } catch (parseError) {
        console.error("[generate-trip-plan] Parse error:", parseError);
        return new Response(
          JSON.stringify({ 
            error: "Failed to parse trip plan", 
            hint: "AI response was malformed. Please try again."
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("[generate-trip-plan] Returning successful response");
      return new Response(JSON.stringify({ tripPlan }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
      
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error("[generate-trip-plan] Request timed out");
        return new Response(
          JSON.stringify({ error: "Request timed out", hint: "Please try with a shorter trip or simpler preferences." }),
          { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw fetchError;
    }
    
  } catch (error) {
    console.error("[generate-trip-plan] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
