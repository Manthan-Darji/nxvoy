import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Mock hidden gem places per location category
const HIDDEN_GEMS: Record<string, Array<{ place_name: string; description: string; video_url: string; category: string; min_age: number }>> = {
  default: [
    { place_name: "Secret Underground Art Gallery", description: "A converted basement turned art space, showcasing local street artists. Locals-only vibe.", video_url: "", category: "culture", min_age: 0 },
    { place_name: "The Forgotten Rooftop Garden", description: "Hidden atop a 1920s building, this rooftop garden offers panoramic views locals guard jealously.", video_url: "", category: "sightseeing", min_age: 0 },
    { place_name: "Midnight Chai Lane", description: "A narrow alley where chai vendors serve until 2AM. The city's best-kept late-night secret.", video_url: "", category: "food", min_age: 0 },
    { place_name: "The Vinyl Basement", description: "An unmarked door leads to a speakeasy with live jazz and rare vinyl sets.", video_url: "", category: "nightlife", min_age: 18 },
    { place_name: "Grandmother's Kitchen", description: "A home-restaurant run by local grandmothers, serving recipes passed down 5 generations.", video_url: "", category: "food", min_age: 0 },
  ],
};

// Mock popular places
const POPULAR_PLACES = [
  { place_name: "City Central Monument", description: "The most iconic landmark in the city, a must-see for every visitor.", category: "sightseeing", min_age: 0 },
  { place_name: "Heritage Walking Tour", description: "A guided walk through the old quarter covering major historical sites.", category: "activity", min_age: 0 },
  { place_name: "Famous Food Street", description: "The city's most popular food market with dozens of stalls.", category: "food", min_age: 0 },
  { place_name: "Sunset Viewpoint Park", description: "The go-to spot for stunning sunset views over the skyline.", category: "sightseeing", min_age: 0 },
  { place_name: "Night Market & Bazaar", description: "Vibrant night market with shopping, street food, and live performances.", category: "nightlife", min_age: 0 },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { location, travelers, preferences } = await req.json();
    console.log("[plan-trip] Input:", { location, travelers, preferences });

    if (!location || typeof location !== "string" || location.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Location is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Save the request to trip_requests (if user is authenticated)
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;

    if (authHeader) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );

      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id ?? null;

      if (userId) {
        const { error: insertError } = await supabase
          .from("trip_requests")
          .insert({
            user_id: userId,
            location: location.trim(),
            demographics: travelers?.travelers ?? [],
            settings: { hidden_gems: preferences?.hidden_gems ?? false },
          });

        if (insertError) {
          console.error("[plan-trip] Failed to save request:", insertError);
          // Non-blocking — continue even if save fails
        } else {
          console.log("[plan-trip] Request saved to trip_requests");
        }
      }
    }

    // 2. Determine traveler constraints
    const travelerList: Array<{ age: number; gender: string }> = travelers?.travelers ?? [];
    const hasChildren = travelerList.some((t) => t.age < 12);
    const hiddenGemsEnabled = preferences?.hidden_gems === true;

    // 3. Build mock response
    let places;

    if (hiddenGemsEnabled) {
      // Return hidden gems, filtered by age constraints
      places = (HIDDEN_GEMS.default || [])
        .filter((gem) => {
          if (hasChildren && gem.category === "nightlife") return false;
          if (hasChildren && gem.min_age > 0) return false;
          return true;
        })
        .slice(0, 3)
        .map((gem) => ({
          ...gem,
          is_hidden_gem: true,
          badge: gem.min_age >= 18 ? "Underrated" : "Local Secret",
        }));
    } else {
      // Return popular places, filtered by age constraints
      places = POPULAR_PLACES
        .filter((p) => {
          if (hasChildren && p.category === "nightlife") return false;
          return true;
        })
        .slice(0, 3)
        .map((p) => ({
          ...p,
          is_hidden_gem: false,
          video_url: null,
          badge: null,
        }));
    }

    // 4. Tailor tone based on dominant age group
    let tone = "general";
    if (travelerList.length > 0) {
      const avgAge = travelerList.reduce((sum, t) => sum + t.age, 0) / travelerList.length;
      if (avgAge < 25) tone = "young-adventurer";
      else if (avgAge < 40) tone = "explorer";
      else if (avgAge < 60) tone = "heritage-lover";
      else tone = "comfort-seeker";
    }

    const response = {
      location: location.trim(),
      tone,
      hidden_gems_enabled: hiddenGemsEnabled,
      has_children: hasChildren,
      traveler_count: travelerList.length || 1,
      places,
      _mock: true, // flag indicating this is mock data
    };

    console.log("[plan-trip] Returning", places.length, "places, tone:", tone);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[plan-trip] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
