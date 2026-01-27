import { useMemo } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity } from './ActivityCard';

interface DayData {
  day: number;
  activities: Activity[];
}

interface ItineraryMapProps {
  days: DayData[];
  selectedDay?: number;
}

const dayColors = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
];

const ItineraryMap = ({ days, selectedDay }: ItineraryMapProps) => {
  // Get all locations with coordinates
  const markers = useMemo(() => {
    const allMarkers: Array<{
      lat: number;
      lng: number;
      name: string;
      day: number;
      index: number;
    }> = [];

    days.forEach(dayData => {
      if (selectedDay && dayData.day !== selectedDay) return;
      
      dayData.activities.forEach((activity, index) => {
        if (activity.coordinates?.lat && activity.coordinates?.lng) {
          allMarkers.push({
            lat: activity.coordinates.lat,
            lng: activity.coordinates.lng,
            name: activity.title,
            day: dayData.day,
            index: index + 1,
          });
        }
      });
    });

    return allMarkers;
  }, [days, selectedDay]);

  // Calculate center of all markers
  const center = useMemo(() => {
    if (markers.length === 0) return null;
    
    const sumLat = markers.reduce((sum, m) => sum + m.lat, 0);
    const sumLng = markers.reduce((sum, m) => sum + m.lng, 0);
    
    return {
      lat: sumLat / markers.length,
      lng: sumLng / markers.length,
    };
  }, [markers]);

  // Generate Google Maps Static URL
  const mapUrl = useMemo(() => {
    if (markers.length === 0 || !center) return null;

    const markerParams = markers
      .map((m, i) => {
        const color = dayColors[(m.day - 1) % dayColors.length].replace('#', '0x');
        return `markers=color:${color}%7Clabel:${m.index}%7C${m.lat},${m.lng}`;
      })
      .join('&');

    // Create path for route
    const pathCoords = markers.map(m => `${m.lat},${m.lng}`).join('|');
    const pathParam = markers.length > 1 
      ? `&path=color:0x3B82F6FF|weight:3|${pathCoords}` 
      : '';

    return `https://maps.googleapis.com/maps/api/staticmap?size=600x400&maptype=roadmap&${markerParams}${pathParam}&key=`;
  }, [markers, center]);

  const openInGoogleMaps = () => {
    if (markers.length === 0) return;
    
    if (markers.length === 1) {
      const m = markers[0];
      window.open(`https://www.google.com/maps?q=${m.lat},${m.lng}`, '_blank');
    } else {
      // Create directions URL with waypoints
      const origin = markers[0];
      const destination = markers[markers.length - 1];
      const waypoints = markers.slice(1, -1).map(m => `${m.lat},${m.lng}`).join('|');
      
      let url = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}`;
      if (waypoints) {
        url += `&waypoints=${waypoints}`;
      }
      window.open(url, '_blank');
    }
  };

  if (markers.length === 0) {
    return (
      <Card className="h-full min-h-[400px] flex flex-col items-center justify-center text-muted-foreground p-6">
        <MapPin className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-lg font-medium text-center">No locations yet</p>
        <p className="text-sm text-center">Activities with coordinates will appear on the map</p>
      </Card>
    );
  }

  return (
    <Card className="h-full min-h-[400px] overflow-hidden flex flex-col">
      {/* Map Placeholder - In a real app, use Google Maps API or Mapbox */}
      <div className="flex-1 bg-gradient-to-br from-blue-100 to-teal-100 dark:from-blue-900/20 dark:to-teal-900/20 relative">
        {/* Simulated map with markers list */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center p-6">
            <MapPin className="w-16 h-16 mx-auto mb-4 text-blue-500" />
            <p className="text-lg font-medium text-foreground mb-2">
              {markers.length} Location{markers.length !== 1 ? 's' : ''} Mapped
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Click below to view the full route in Google Maps
            </p>
            <Button onClick={openInGoogleMaps} className="bg-gradient-to-r from-blue-600 to-teal-500">
              <Navigation className="w-4 h-4 mr-2" />
              Open in Google Maps
            </Button>
          </div>
        </div>
      </div>

      {/* Markers Legend */}
      <div className="p-4 border-t bg-card">
        <h4 className="text-sm font-semibold mb-3">Locations</h4>
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {markers.map((marker, i) => (
            <div 
              key={i} 
              className="flex items-center gap-2 text-sm"
            >
              <span 
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ backgroundColor: dayColors[(marker.day - 1) % dayColors.length] }}
              >
                {marker.index}
              </span>
              <span className="truncate text-muted-foreground">
                {marker.name}
              </span>
              <span className="text-xs text-muted-foreground flex-shrink-0">
                Day {marker.day}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default ItineraryMap;
