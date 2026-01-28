import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ActivityInfo {
  title: string;
  cost: number;
  category: string;
  day: number;
}

interface BudgetRequest {
  destination: string;
  totalBudget: number;
  currentSpending: number;
  activities: ActivityInfo[];
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

    const { destination, totalBudget, currentSpending, activities }: BudgetRequest = await req.json();

    const overBudget = currentSpending - totalBudget;
    const savingsNeeded = overBudget > 0 ? overBudget : totalBudget * 0.1; // At least try to save 10%

    const expensiveActivities = [...activities]
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5)
      .map(a => `- ${a.title}: ₹${a.cost} (Day ${a.day}, ${a.category})`)
      .join('\n');

    const prompt = `You are a travel budget advisor for ${destination}. The traveler has:
- Total budget: ₹${totalBudget}
- Current planned spending: ₹${currentSpending}
- ${overBudget > 0 ? `OVER BUDGET by ₹${overBudget}` : `Remaining: ₹${totalBudget - currentSpending}`}

Most expensive planned activities:
${expensiveActivities}

Provide exactly 3 specific, actionable budget-saving suggestions. Focus on:
1. Replace expensive activities with budget-friendly alternatives specific to ${destination}
2. Food/dining tips for the destination
3. Transport savings

Each suggestion should be realistic for ${destination} and include estimated savings.

Respond ONLY with a valid JSON array (no markdown):
[
  {
    "icon": "🍽️",
    "title": "Short title (max 8 words)",
    "description": "Specific suggestion with local alternatives (max 20 words)",
    "savings": 500
  }
]`;

    console.log("Generating budget suggestions for:", destination);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a practical travel budget advisor. Give specific, actionable advice. Always respond with valid JSON only." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
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

    console.log("AI response:", content);

    // Parse JSON from response
    let suggestions;
    try {
      let jsonStr = content.trim();
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      }
      suggestions = JSON.parse(jsonStr);
    } catch (parseError) {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse suggestions from AI response");
      }
    }

    // Validate and sanitize
    const validatedSuggestions = suggestions.slice(0, 3).map((s: any) => ({
      icon: s.icon || '💡',
      title: s.title || 'Budget Tip',
      description: s.description || '',
      savings: typeof s.savings === 'number' ? s.savings : 0,
    }));

    return new Response(JSON.stringify({ 
      success: true, 
      suggestions: validatedSuggestions 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error generating suggestions:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
