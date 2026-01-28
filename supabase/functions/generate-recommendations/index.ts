import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface Activity {
  title: string;
  location: string;
  category: string;
  estimatedCost: number;
}

interface RecommendationRequest {
  destination: string;
  currentActivities: Activity[];
  userInterests: string[];
  budget: number;
  dayNumber: number;
  tripDate?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { destination, currentActivities, userInterests, budget, dayNumber, tripDate }: RecommendationRequest = await req.json();

    const activityList = currentActivities.map(a => `- ${a.title} at ${a.location} (${a.category})`).join('\n');
    const interestsList = userInterests.length > 0 ? userInterests.join(', ') : 'general sightseeing, local experiences';
    const budgetLevel = budget < 5000 ? 'budget' : budget < 15000 ? 'moderate' : 'premium';

    const prompt = `You are Shasa, an AI travel assistant. Based on this itinerary for ${destination}:

Current activities for Day ${dayNumber}:
${activityList || 'No activities yet'}

User interests: ${interestsList}
Budget level: ${budgetLevel} (total trip budget: ₹${budget})
Date: ${tripDate || 'flexible'}

Suggest exactly 3 unique activities that:
- Complement the existing plans (don't duplicate similar activities)
- Match user interests
- Are nearby the current activities (within 5km if possible)
- Fit the budget constraints
- Are lesser-known gems (avoid typical tourist traps)
- Would enhance the overall experience for Day ${dayNumber}

For each recommendation, consider what's missing from the current day - if they have sightseeing, suggest food; if they have food, suggest culture or shopping, etc.

You MUST respond with ONLY a valid JSON array, no markdown, no explanation. Format:
[
  {
    "name": "Activity name",
    "description": "Brief 2-sentence description",
    "why_recommended": "One sentence explaining why Shasa recommends this based on their interests/itinerary",
    "location": "Specific location/address",
    "distance_km": 2.5,
    "estimated_cost": 500,
    "category": "food|culture|adventure|shopping|relaxation|attraction",
    "best_time": "10:00",
    "duration_hours": 1.5
  }
]`;

    console.log("Generating recommendations for:", destination, "Day:", dayNumber);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are Shasa, a smart travel assistant that provides personalized activity recommendations. Always respond with valid JSON only, no markdown formatting." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    console.log("AI response content:", content);

    // Parse JSON from response (handle potential markdown wrapping)
    let recommendations;
    try {
      let jsonStr = content.trim();
      
      // Remove markdown code blocks if present
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      }
      
      recommendations = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Try to extract JSON array from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse recommendations from AI response");
      }
    }

    // Validate and sanitize recommendations
    const validatedRecommendations = recommendations.slice(0, 3).map((rec: any, index: number) => ({
      id: `rec-${Date.now()}-${index}`,
      name: rec.name || "Unnamed Activity",
      description: rec.description || "",
      why_recommended: rec.why_recommended || "Recommended by Shasa",
      location: rec.location || destination,
      distance_km: typeof rec.distance_km === 'number' ? rec.distance_km : 2,
      estimated_cost: typeof rec.estimated_cost === 'number' ? rec.estimated_cost : 0,
      category: rec.category || "attraction",
      best_time: rec.best_time || "10:00",
      duration_hours: typeof rec.duration_hours === 'number' ? rec.duration_hours : 1.5,
    }));

    console.log("Returning recommendations:", validatedRecommendations.length);

    return new Response(JSON.stringify({ 
      success: true, 
      recommendations: validatedRecommendations 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error generating recommendations:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
