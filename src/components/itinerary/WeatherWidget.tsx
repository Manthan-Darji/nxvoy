import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, Sun, CloudRain, Thermometer, Wind, Droplets, AlertTriangle, CheckCircle, Loader2, RefreshCw, Umbrella } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  fetchWeatherForecast, 
  getWeatherIcon, 
  generateWeatherAlerts, 
  getPackingSuggestions,
  WeatherDay,
  WeatherAlert 
} from '@/services/weatherService';
import { format, addDays, parseISO, isSameDay } from 'date-fns';

interface WeatherWidgetProps {
  destination: string;
  startDate: string | null;
  tripDays: number;
  selectedDay?: number;
  onWeatherAlert?: (alerts: WeatherAlert[]) => void;
}

const WeatherWidget = ({ 
  destination, 
  startDate, 
  tripDays,
  selectedDay,
  onWeatherAlert 
}: WeatherWidgetProps) => {
  const [forecast, setForecast] = useState<WeatherDay[]>([]);
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [packingSuggestions, setPackingSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAlerts, setShowAlerts] = useState(true);

  const loadWeather = async () => {
    if (!destination) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await fetchWeatherForecast(destination);
      setForecast(data);
      
      const newAlerts = generateWeatherAlerts(data, startDate, tripDays);
      setAlerts(newAlerts);
      onWeatherAlert?.(newAlerts);
      
      setPackingSuggestions(getPackingSuggestions(data));
    } catch (err) {
      console.error('Weather load error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load weather');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWeather();
  }, [destination, startDate, tripDays]);

  const getWeatherForDay = (dayNumber: number): WeatherDay | null => {
    if (!startDate || forecast.length === 0) return null;
    
    const targetDate = addDays(parseISO(startDate), dayNumber - 1);
    
    return forecast.find(day => {
      const forecastDate = parseISO(day.date);
      return isSameDay(forecastDate, targetDate);
    }) || null;
  };

  const currentDayWeather = selectedDay ? getWeatherForDay(selectedDay) : null;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'danger': return 'bg-red-500/10 text-red-600 border-red-200';
      case 'warning': return 'bg-amber-500/10 text-amber-600 border-amber-200';
      default: return 'bg-green-500/10 text-green-600 border-green-200';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'rain': return <CloudRain className="w-4 h-4" />;
      case 'heat': return <Thermometer className="w-4 h-4" />;
      case 'cold': return <Thermometer className="w-4 h-4" />;
      case 'wind': return <Wind className="w-4 h-4" />;
      case 'uv': return <Sun className="w-4 h-4" />;
      case 'perfect': return <CheckCircle className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-950/30 dark:to-sky-950/30 border-blue-200 dark:border-blue-800">
        <CardContent className="py-6 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading weather forecast...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 border-red-200 dark:border-red-800">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <span>{error}</span>
            </div>
            <Button variant="outline" size="sm" onClick={loadWeather}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Weather Overview Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-950/30 dark:to-sky-950/30 border-blue-200 dark:border-blue-800 overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Cloud className="w-5 h-5 text-blue-500" />
              Weather Forecast
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={loadWeather} className="h-8">
              <RefreshCw className="w-3 h-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Day Weather (if selected) */}
          {currentDayWeather && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/60 dark:bg-white/10 rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Day {selectedDay}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-4xl">
                      {getWeatherIcon(currentDayWeather.weather.icon)}
                    </span>
                    <div>
                      <p className="text-2xl font-bold">
                        {currentDayWeather.temp.max}°C
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Low: {currentDayWeather.temp.min}°C
                      </p>
                    </div>
                  </div>
                  <p className="text-sm capitalize mt-1">
                    {currentDayWeather.weather.description}
                  </p>
                </div>
                <div className="text-right space-y-2">
                  <TooltipProvider>
                    <div className="flex items-center gap-4">
                      <Tooltip>
                        <TooltipTrigger>
                          <div className="flex items-center gap-1 text-sm">
                            <Droplets className="w-4 h-4 text-blue-500" />
                            {currentDayWeather.pop}%
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>Rain probability</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger>
                          <div className="flex items-center gap-1 text-sm">
                            <Wind className="w-4 h-4 text-gray-500" />
                            {currentDayWeather.windSpeed} km/h
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>Wind speed</TooltipContent>
                      </Tooltip>
                      {currentDayWeather.uvi > 0 && (
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="flex items-center gap-1 text-sm">
                              <Sun className="w-4 h-4 text-amber-500" />
                              UV {currentDayWeather.uvi}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>UV Index</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TooltipProvider>
                </div>
              </div>
            </motion.div>
          )}

          {/* 7-Day Forecast Strip */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2">
            {forecast.slice(0, Math.min(tripDays, 7)).map((day, index) => {
              const dayNumber = index + 1;
              const isSelected = dayNumber === selectedDay;
              const dayAlerts = alerts.filter(a => a.dayNumber === dayNumber);
              const hasWarning = dayAlerts.some(a => a.severity !== 'info');
              
              return (
                <motion.div
                  key={day.date}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex-shrink-0 w-16 p-2 rounded-lg text-center transition-all ${
                    isSelected 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10'
                  }`}
                >
                  <p className="text-xs font-medium">Day {dayNumber}</p>
                  <div className="text-2xl my-1 relative">
                    {getWeatherIcon(day.weather.icon)}
                    {hasWarning && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full" />
                    )}
                  </div>
                  <p className={`text-xs font-semibold ${isSelected ? '' : 'text-foreground'}`}>
                    {day.temp.max}°
                  </p>
                  <p className={`text-xs ${isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {day.temp.min}°
                  </p>
                  {day.pop >= 30 && (
                    <Badge variant="secondary" className="text-[10px] px-1 py-0 mt-1">
                      {day.pop}%
                    </Badge>
                  )}
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Weather Alerts */}
      <AnimatePresence>
        {alerts.length > 0 && showAlerts && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-amber-200 dark:border-amber-800">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    Weather Alerts ({alerts.filter(a => a.severity !== 'info').length})
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowAlerts(false)}
                    className="h-8 text-xs"
                  >
                    Dismiss
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {alerts.slice(0, 4).map((alert, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)}`}
                  >
                    <div className="flex items-start gap-2">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1">
                        <p className="font-medium text-sm">{alert.message}</p>
                        <p className="text-xs mt-1 opacity-80">{alert.suggestion}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Packing Suggestions */}
      {packingSuggestions.length > 0 && (
        <Card className="border-violet-200 dark:border-violet-800 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Umbrella className="w-5 h-5 text-violet-500" />
              Packing Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {packingSuggestions.map((item, index) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Badge variant="secondary" className="bg-white/60 dark:bg-white/10">
                    {item}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WeatherWidget;
