import { supabase } from '@/integrations/supabase/client';

export interface WeatherDay {
  date: string;
  temp: { min: number; max: number };
  weather: { main: string; description: string; icon: string };
  humidity: number;
  windSpeed: number;
  pop: number;
  uvi: number;
}

export interface WeatherAlert {
  type: 'rain' | 'heat' | 'cold' | 'perfect' | 'wind' | 'uv';
  severity: 'info' | 'warning' | 'danger';
  message: string;
  suggestion: string;
  dayNumber: number;
}

export async function fetchWeatherForecast(
  destination: string,
  lat?: number,
  lon?: number
): Promise<WeatherDay[]> {
  const { data, error } = await supabase.functions.invoke('get-weather', {
    body: { destination, lat, lon },
  });

  if (error) {
    console.error('Weather fetch error:', error);
    throw new Error('Failed to fetch weather data');
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return data.forecast;
}

export function getWeatherIcon(iconCode: string): string {
  // Map OpenWeatherMap icons to emoji
  const iconMap: Record<string, string> = {
    '01d': '☀️', '01n': '🌙',
    '02d': '⛅', '02n': '☁️',
    '03d': '☁️', '03n': '☁️',
    '04d': '☁️', '04n': '☁️',
    '09d': '🌧️', '09n': '🌧️',
    '10d': '🌦️', '10n': '🌧️',
    '11d': '⛈️', '11n': '⛈️',
    '13d': '❄️', '13n': '❄️',
    '50d': '🌫️', '50n': '🌫️',
  };
  return iconMap[iconCode] || '🌤️';
}

export function generateWeatherAlerts(
  forecast: WeatherDay[],
  startDate: string | null,
  tripDays: number
): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];
  
  if (!startDate || forecast.length === 0) return alerts;
  
  const tripStart = new Date(startDate);
  
  forecast.forEach((day, index) => {
    const dayNumber = index + 1;
    if (dayNumber > tripDays) return;
    
    // Rain alert
    if (day.pop >= 60) {
      alerts.push({
        type: 'rain',
        severity: day.pop >= 80 ? 'danger' : 'warning',
        message: `Rain expected on Day ${dayNumber} (${day.pop}% chance)`,
        suggestion: 'Consider indoor activities like museums, shopping malls, or indoor entertainment',
        dayNumber,
      });
    }
    
    // Extreme heat alert
    if (day.temp.max >= 35) {
      alerts.push({
        type: 'heat',
        severity: day.temp.max >= 40 ? 'danger' : 'warning',
        message: `Very hot day (${day.temp.max}°C) on Day ${dayNumber}`,
        suggestion: 'Plan activities for early morning or evening. Stay hydrated and seek shade during midday',
        dayNumber,
      });
    }
    
    // Cold alert
    if (day.temp.min <= 5) {
      alerts.push({
        type: 'cold',
        severity: day.temp.min <= 0 ? 'danger' : 'warning',
        message: `Cold weather (${day.temp.min}°C) expected on Day ${dayNumber}`,
        suggestion: 'Pack warm clothing and consider indoor activities',
        dayNumber,
      });
    }
    
    // High UV alert
    if (day.uvi >= 8) {
      alerts.push({
        type: 'uv',
        severity: day.uvi >= 11 ? 'danger' : 'warning',
        message: `High UV index (${day.uvi}) on Day ${dayNumber}`,
        suggestion: 'Use sunscreen SPF 50+, wear a hat, and avoid direct sun between 11am-3pm',
        dayNumber,
      });
    }
    
    // Strong wind alert
    if (day.windSpeed >= 40) {
      alerts.push({
        type: 'wind',
        severity: 'warning',
        message: `Strong winds (${day.windSpeed} km/h) expected on Day ${dayNumber}`,
        suggestion: 'Avoid outdoor activities like beach trips or hiking. Consider indoor alternatives',
        dayNumber,
      });
    }
    
    // Perfect weather alert
    if (
      day.pop < 20 &&
      day.temp.max >= 20 &&
      day.temp.max <= 28 &&
      day.windSpeed < 25 &&
      (day.weather.main === 'Clear' || day.weather.main === 'Clouds')
    ) {
      alerts.push({
        type: 'perfect',
        severity: 'info',
        message: `Perfect weather on Day ${dayNumber}!`,
        suggestion: 'Great day for outdoor activities, sightseeing, or beach trips',
        dayNumber,
      });
    }
  });
  
  return alerts;
}

export function getPackingSuggestions(forecast: WeatherDay[]): string[] {
  const suggestions = new Set<string>();
  
  forecast.forEach(day => {
    // Rain gear
    if (day.pop >= 40) {
      suggestions.add('Umbrella');
      suggestions.add('Rain jacket');
    }
    
    // Sun protection
    if (day.uvi >= 6 || day.weather.main === 'Clear') {
      suggestions.add('Sunscreen SPF 50+');
      suggestions.add('Sunglasses');
      suggestions.add('Hat');
    }
    
    // Cold weather
    if (day.temp.min <= 15) {
      suggestions.add('Light jacket');
    }
    if (day.temp.min <= 10) {
      suggestions.add('Warm sweater');
    }
    if (day.temp.min <= 5) {
      suggestions.add('Winter coat');
      suggestions.add('Gloves');
    }
    
    // Hot weather
    if (day.temp.max >= 30) {
      suggestions.add('Light, breathable clothing');
      suggestions.add('Water bottle');
    }
  });
  
  return Array.from(suggestions);
}
