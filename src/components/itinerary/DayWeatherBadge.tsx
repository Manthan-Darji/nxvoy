import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Droplets, Wind, Sun } from 'lucide-react';
import { getWeatherIcon, WeatherDay } from '@/services/weatherService';

interface DayWeatherBadgeProps {
  weather: WeatherDay | null;
  compact?: boolean;
}

const DayWeatherBadge = ({ weather, compact = false }: DayWeatherBadgeProps) => {
  if (!weather) return null;

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-950/50 rounded-full text-xs"
            >
              <span>{getWeatherIcon(weather.weather.icon)}</span>
              <span className="font-medium">{weather.temp.max}°</span>
              {weather.pop >= 30 && (
                <span className="text-blue-500 flex items-center">
                  <Droplets className="w-3 h-3" />
                  {weather.pop}%
                </span>
              )}
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-semibold capitalize">{weather.weather.description}</p>
              <div className="text-xs space-y-1">
                <p>🌡️ {weather.temp.max}°C / {weather.temp.min}°C</p>
                <p>💧 Rain: {weather.pop}%</p>
                <p>💨 Wind: {weather.windSpeed} km/h</p>
                {weather.uvi > 0 && <p>☀️ UV: {weather.uvi}</p>}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-950/30 dark:to-sky-950/30 rounded-lg border border-blue-100 dark:border-blue-900"
    >
      <div className="text-3xl">
        {getWeatherIcon(weather.weather.icon)}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">{weather.temp.max}°C</span>
          <span className="text-sm text-muted-foreground">/ {weather.temp.min}°C</span>
        </div>
        <p className="text-sm text-muted-foreground capitalize">
          {weather.weather.description}
        </p>
      </div>
      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Droplets className="w-3 h-3 text-blue-500" />
          <span>{weather.pop}%</span>
        </div>
        <div className="flex items-center gap-1">
          <Wind className="w-3 h-3" />
          <span>{weather.windSpeed} km/h</span>
        </div>
        {weather.uvi > 0 && (
          <div className="flex items-center gap-1">
            <Sun className="w-3 h-3 text-amber-500" />
            <span>UV {weather.uvi}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default DayWeatherBadge;
