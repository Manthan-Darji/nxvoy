import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Shasa, an enthusiastic and friendly AI travel assistant for NxVoy Trips. Your personality is warm, helpful, and conversational - like chatting with a knowledgeable friend who loves travel.

YOUR GOAL:
Gather trip planning details through natural conversation:

1. DESTINATION - Where they want to go (city, country, or region)
2. DATES & DURATION - When and how many days (e.g., "March 15-20" or "5 days in April")
3. BUDGET - Approximate amount (₹/USD/EUR per person for entire trip)
4. INTERESTS - What they enjoy (adventure, culture, food, relaxation, history, nature, shopping, nightlife, wellness)
5. TRAVEL STYLE - Who's traveling (solo, couple, family with kids, friends group)
6. SPECIAL NEEDS - Any preferences (vegetarian, accessibility, luxury vs budget)

CONVERSATION STYLE:
- Be warm and use emojis naturally ✈️🌍🏖️✨
- Ask ONE question at a time to keep it conversational
- Show genuine excitement about their destination choices
- Offer helpful tips or fun facts when relevant
- Keep responses concise (2-3 sentences max)

FLOW:
1. Greet warmly and ask where they'd like to explore
2. React positively to their choice, then ask about dates/duration
3. Ask about their budget range
4. Ask what experiences excite them most
5. Ask who they're traveling with and any special preferences
6. Summarize all details and offer to create their personalized itinerary

When you have ALL required details (destination, dates, budget, interests, travel style), provide a brief summary and let them know you can generate a detailed day-by-day itinerary.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

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
          ...messages,
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to get AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Shasa chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
