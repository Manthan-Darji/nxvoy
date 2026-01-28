import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WeatherDay {
  date: string;
  temp: { min: number; max: number };
  weather: { main: string; description: string; icon: string };
  humidity: number;
  windSpeed: number;
  pop: number; // Probability of precipitation
  uvi: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { destination, lat, lon } = await req.json();
    
    const apiKey = Deno.env.get('OPENWEATHERMAP_API_KEY');
    if (!apiKey) {
      throw new Error('OpenWeatherMap API key not configured');
    }

    let latitude = lat;
    let longitude = lon;

    // If no coordinates provided, geocode the destination
    if (!latitude || !longitude) {
      const geoUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(destination)}&limit=1&appid=${apiKey}`;
      const geoResponse = await fetch(geoUrl);
      const geoData = await geoResponse.json();
      
      if (!geoData || geoData.length === 0) {
        throw new Error(`Could not find location: ${destination}`);
      }
      
      latitude = geoData[0].lat;
      longitude = geoData[0].lon;
    }

    // Fetch 7-day forecast using One Call API 3.0
    const weatherUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${latitude}&lon=${longitude}&exclude=minutely,hourly,alerts&units=metric&appid=${apiKey}`;
    
    let weatherResponse = await fetch(weatherUrl);
    
    // Fallback to 2.5 API if 3.0 fails
    if (!weatherResponse.ok) {
      const fallbackUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`;
      weatherResponse = await fetch(fallbackUrl);
      
      if (!weatherResponse.ok) {
        const errorText = await weatherResponse.text();
        throw new Error(`Weather API error: ${errorText}`);
      }
      
      // Parse 2.5 API response (3-hour intervals) and aggregate to daily
      const forecastData = await weatherResponse.json();
      const dailyMap = new Map<string, any>();
      
      for (const item of forecastData.list) {
        const date = item.dt_txt.split(' ')[0];
        if (!dailyMap.has(date)) {
          dailyMap.set(date, {
            date,
            temps: [],
            weather: item.weather[0],
            humidity: item.main.humidity,
            windSpeed: item.wind.speed,
            pop: item.pop || 0,
          });
        }
        dailyMap.get(date).temps.push(item.main.temp);
      }
      
      const forecast: WeatherDay[] = Array.from(dailyMap.values()).slice(0, 7).map(day => ({
        date: day.date,
        temp: {
          min: Math.round(Math.min(...day.temps)),
          max: Math.round(Math.max(...day.temps)),
        },
        weather: {
          main: day.weather.main,
          description: day.weather.description,
          icon: day.weather.icon,
        },
        humidity: day.humidity,
        windSpeed: Math.round(day.windSpeed * 3.6), // Convert m/s to km/h
        pop: Math.round(day.pop * 100),
        uvi: 0, // Not available in 2.5 API
      }));

      return new Response(JSON.stringify({ forecast, source: '2.5' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const weatherData = await weatherResponse.json();
    
    const forecast: WeatherDay[] = weatherData.daily.slice(0, 7).map((day: any) => ({
      date: new Date(day.dt * 1000).toISOString().split('T')[0],
      temp: {
        min: Math.round(day.temp.min),
        max: Math.round(day.temp.max),
      },
      weather: {
        main: day.weather[0].main,
        description: day.weather[0].description,
        icon: day.weather[0].icon,
      },
      humidity: day.humidity,
      windSpeed: Math.round(day.wind_speed * 3.6),
      pop: Math.round((day.pop || 0) * 100),
      uvi: Math.round(day.uvi),
    }));

    return new Response(JSON.stringify({ forecast, source: '3.0' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Weather API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
