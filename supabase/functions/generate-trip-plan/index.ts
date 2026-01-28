import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Shasa, an expert Indian travel agent with deep knowledge of transportation (buses, trains, flights), hotels, restaurants, and attractions across India and international destinations.

CRITICAL INSTRUCTIONS:
1. Return ONLY valid JSON - no markdown, no explanations, no text before or after the JSON.
2. Your response must be parseable by JSON.parse().
3. Use REALISTIC current prices for Indian buses (GSRTC, RSRTC, private operators like RedBus), trains, hotels, and restaurants.
4. STRICTLY respect the user's budget - if the budget is too low, suggest budget-friendly options.
5. Include actual transport options (bus names, routes, approximate timings).
6. For each activity, specify the type: "transport", "food", "sightseeing", "stay", or "activity".

JSON SCHEMA (follow exactly):
{
  "trip_title": "string (e.g., '5 Days in Goa')",
  "total_estimated_cost": number,
  "currency": "string (INR, USD, etc.)",
  "budget_status": "within_budget" | "over_budget" | "under_budget",
  "budget_message": "string (friendly message about budget)",
  "itinerary": [
    {
      "day": number,
      "date": "YYYY-MM-DD",
      "title": "string (e.g., 'Arrival & Beach Day')",
      "activities": [
        {
          "time": "HH:MM AM/PM",
          "activity": "string",
          "location_name": "string",
          "location_address": "string (optional, for mapping)",
          "cost": number,
          "type": "transport" | "food" | "sightseeing" | "stay" | "activity",
          "duration_minutes": number,
          "notes": "string (optional tips)",
          "transport_details": {
            "provider": "string (e.g., 'GSRTC Volvo')",
            "from": "string",
            "to": "string",
            "booking_link": "string (optional)"
          }
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
    const { origin, destination, startDate, endDate, budget, currency, preferences } = await req.json();
    console.log("[generate-trip-plan] Input:", { origin, destination, startDate, endDate, budget, currency, preferences });
    
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

    // Build the prompt
    const vibesText = preferences && preferences.length > 0 
      ? preferences.join(', ') 
      : 'general sightseeing, balanced activities';

    const activitiesPerDay = days <= 4 ? '4-6' : days <= 7 ? '3-5' : '3-4';
    // Keep responses bounded; large token budgets can encourage long outputs and slower generations.
    const maxTokens = Math.min(9000, 1200 * days + 1500);

    const prompt = `Create a detailed ${days}-day trip itinerary:

FROM: ${origin}
TO: ${destination}
DATES: ${startDate} to ${endDate}
BUDGET: ${currency} ${budget} (total for entire trip)
TRAVEL STYLE: ${vibesText}

REQUIREMENTS:
1. Day 1 MUST include transport from ${origin} to ${destination} (bus/train/flight based on distance and budget).
2. Last day should include return transport to ${origin}.
3. Include realistic costs in ${currency}:
   - Inter-city buses: ₹300-1500 depending on AC/sleeper
   - Hotels: ₹800-3000/night for budget-mid range
   - Meals: ₹100-500 per meal
   - Local transport: ₹50-300 per ride
4. Each day should have ${activitiesPerDay} activities covering morning, afternoon, and evening.
5. Include at least 2-3 meals per day.
6. Ensure total cost stays within budget of ${currency} ${budget}.

Generate realistic, actionable itinerary with real place names and accurate pricing for India.`;

    console.log("[generate-trip-plan] Calling AI gateway...");
    
     // Create abort controller for timeout (keep bounded for better UX)
    const controller = new AbortController();
     const timeoutId = setTimeout(() => controller.abort(), 75000);

    try {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Faster + more consistent structured output than preview models
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: prompt },
          ],
          temperature: 0.4,
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
      console.log("[generate-trip-plan] Raw response preview:", content.substring(0, 500));

      // Parse JSON from response
      let tripPlan;
      try {
        let cleanJson = content.trim();
        
        // Remove markdown code blocks if present
        if (cleanJson.includes('```')) {
          const codeBlockMatch = cleanJson.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (codeBlockMatch) {
            cleanJson = codeBlockMatch[1].trim();
            console.log("[generate-trip-plan] Extracted from markdown code block");
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
          console.error("[generate-trip-plan] JSON brace mismatch - open:", openBraces, "close:", closeBraces);
          throw new Error("Incomplete JSON response");
        }
        
        console.log("[generate-trip-plan] Parsing JSON of length:", cleanJson.length);
        tripPlan = JSON.parse(cleanJson);
        
        // Validate required fields
        if (!tripPlan.trip_title || !tripPlan.itinerary || !Array.isArray(tripPlan.itinerary)) {
          console.error("[generate-trip-plan] Invalid structure - missing required fields");
          throw new Error("Invalid trip plan structure");
        }
        
        // Ensure dates are properly set
        tripPlan.itinerary = tripPlan.itinerary.map((day: any, index: number) => ({
          ...day,
          day: day.day || index + 1,
          date: day.date || dates[index] || null,
        }));
        
        console.log("[generate-trip-plan] Successfully parsed", tripPlan.itinerary.length, "days");
        console.log("[generate-trip-plan] Total estimated cost:", tripPlan.total_estimated_cost);
        
      } catch (parseError) {
        console.error("[generate-trip-plan] Parse error:", parseError);
        console.error("[generate-trip-plan] Failed content:", content.substring(0, 1000));
        return new Response(
          JSON.stringify({ 
            error: "Failed to parse trip plan", 
            details: String(parseError),
            hint: "AI response was malformed. Please try again."
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if budget is too low
      if (tripPlan.budget_status === 'over_budget') {
        console.log("[generate-trip-plan] Warning: Trip exceeds budget");
      }

      console.log("[generate-trip-plan] Returning successful response");
      return new Response(JSON.stringify({ tripPlan }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
      
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error("[generate-trip-plan] Request timed out after 75 seconds");
        return new Response(
          JSON.stringify({ error: "Request timed out", hint: "The trip is complex. Please try with fewer days or simpler preferences." }),
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
