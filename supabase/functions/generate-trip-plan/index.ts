import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Shasa, an expert Indian travel agent. Return ONLY valid JSON - no markdown, no explanations.

CRITICAL RULES:
1. Return parseable JSON only
2. Use realistic Indian prices (buses ₹300-1500, hotels ₹800-3000/night, meals ₹100-500)
3. STRICTLY respect budget
4. Include 3-4 activities per day (morning, afternoon, evening + meals)
5. For location_address, ALWAYS include the full address with city name for accurate mapping

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
          "location_name": "string (e.g., Gateway of India)",
          "location_address": "string (FULL address with city, e.g., Apollo Bandar, Colaba, Mumbai, Maharashtra 400001)",
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

    // Build concise prompt
    const vibesText = preferences?.length > 0 ? preferences.join(', ') : 'general sightseeing';
    
    // Reduced token budget for faster response
    const maxTokens = Math.min(6000, 1000 * days + 1000);

    const prompt = `Create a ${days}-day trip from ${origin} to ${destination}.
Dates: ${startDate} to ${endDate}
Budget: ${currency} ${budget}
Style: ${vibesText}

Requirements:
- Day 1: Include transport from ${origin} to ${destination}
- Last day: Include return transport
- 3-4 activities per day including 2 meals
- Include FULL addresses with city name in location_address for accurate mapping
- Stay within budget of ${currency} ${budget}

Be concise. Generate realistic itinerary with real places.`;

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
