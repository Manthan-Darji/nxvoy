const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface PhotoSpotRequest {
  location: string;
  activityName: string;
  category: string;
  destination: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { location, activityName, category, destination }: PhotoSpotRequest = await req.json();

    if (!location || !activityName) {
      return new Response(
        JSON.stringify({ error: 'Location and activity name required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[photo-spots] Generating recommendations for:', activityName, 'at', location);

    const prompt = `You are a professional travel photographer assistant. Generate photography recommendations for visiting "${activityName}" at "${location}" in ${destination || 'this destination'}.

Return a JSON object with this exact structure:
{
  "photoSpots": [
    {
      "name": "Spot name",
      "description": "Brief description of what makes this spot special",
      "bestTime": "Best time to shoot (e.g., 'Sunrise 6:30 AM', 'Golden hour 7PM')",
      "tip": "Photography tip for this spot"
    }
  ],
  "goldenHour": {
    "morning": "6:15 AM - 7:00 AM",
    "evening": "6:45 PM - 7:30 PM"
  },
  "crowdFreeTimes": ["Early morning before 8 AM", "Late afternoon after 5 PM"],
  "weatherTip": "Best weather conditions for photography",
  "gearTip": "Recommended camera settings or equipment"
}

Generate 3-4 photo spots near or at this location. Be specific about timing and include local knowledge that photographers would appreciate.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[photo-spots] AI API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to generate recommendations' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Parse JSON from response
    let recommendations;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('[photo-spots] Parse error:', parseError);
      // Return default structure
      recommendations = {
        photoSpots: [
          {
            name: `${activityName} - Main View`,
            description: 'The classic viewpoint for capturing this location',
            bestTime: 'Golden hour',
            tip: 'Use a wide-angle lens for panoramic shots'
          }
        ],
        goldenHour: {
          morning: '6:00 AM - 7:00 AM',
          evening: '6:30 PM - 7:30 PM'
        },
        crowdFreeTimes: ['Early morning', 'Late afternoon'],
        weatherTip: 'Partly cloudy days provide the best lighting',
        gearTip: 'A tripod is recommended for low-light conditions'
      };
    }

    console.log('[photo-spots] Generated', recommendations.photoSpots?.length || 0, 'photo spots');

    return new Response(
      JSON.stringify({ success: true, data: recommendations }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[photo-spots] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
