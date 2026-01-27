import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EXTRACTION_PROMPT = `You are a trip details extractor. Analyze the conversation and extract trip planning details.

Return a JSON object with these fields (use null for missing info):
{
  "destination": "city/country name or null",
  "startDate": "YYYY-MM-DD format or null",
  "endDate": "YYYY-MM-DD format or null", 
  "budget": number in USD or null,
  "interests": ["array", "of", "interests"] or [],
  "tripType": "solo/couple/family/friends or null",
  "isComplete": true if destination AND (dates OR duration) AND budget are provided
}

Be smart about interpreting:
- "next weekend" → calculate actual dates
- "3 days" with start date → calculate end date
- "$2000" or "2000 dollars" → 2000
- "₹50000" → convert roughly to USD
- "me and my wife" → "couple"
- "with kids" → "family"

Only return the JSON object, nothing else.`;

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

    // Build conversation summary for extraction
    const conversationText = messages
      .map((m: { role: string; content: string }) => `${m.role}: ${m.content}`)
      .join("\n");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: EXTRACTION_PROMPT },
          { role: "user", content: `Extract trip details from this conversation:\n\n${conversationText}` },
        ],
        temperature: 0.1,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to extract trip details" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    
    // Parse JSON from response (handle markdown code blocks)
    let tripDetails;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      tripDetails = JSON.parse(jsonMatch[1].trim());
    } catch {
      console.error("Failed to parse trip details:", content);
      tripDetails = {
        destination: null,
        startDate: null,
        endDate: null,
        budget: null,
        interests: [],
        tripType: null,
        isComplete: false,
      };
    }

    return new Response(JSON.stringify(tripDetails), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Extract trip details error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
