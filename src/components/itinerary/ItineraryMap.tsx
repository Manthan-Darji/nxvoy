import { useMemo, useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline, InfoWindow } from '@react-google-maps/api';
import { MapPin, Navigation, AlertCircle, Loader2, RefreshCw, Clock, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity } from './ActivityCard';
import { calculateTotalTravelTime } from '@/services/routeOptimizationService';

interface DayData {
  day: number;
  activities: Activity[];
}

interface ItineraryMapProps {
  days: DayData[];
  selectedDay?: number;
  onOptimizeRoute?: (dayNumber: number) => void;
  isOptimizing?: boolean;
}

interface MarkerData {
  lat: number;
  lng: number;
  name: string;
  time: string;
  day: number;
  index: number;
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

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  minHeight: '350px',
};

const defaultCenter = { lat: 48.8566, lng: 2.3522 }; // Paris as default

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
  ],
};

const ItineraryMap = ({ days, selectedDay, onOptimizeRoute, isOptimizing }: ItineraryMapProps) => {
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || '',
  });

  // Get all locations with coordinates
  const markers = useMemo(() => {
    const allMarkers: MarkerData[] = [];

    days.forEach(dayData => {
      if (selectedDay && dayData.day !== selectedDay) return;
      
      dayData.activities.forEach((activity, index) => {
        // Support both latitude/longitude and coordinates format
        const lat = activity.latitude ?? (activity as any).coordinates?.lat;
        const lng = activity.longitude ?? (activity as any).coordinates?.lng;
        
        if (lat && lng) {
          allMarkers.push({
            lat: lat,
            lng: lng,
            name: activity.title,
            time: activity.startTime || '',
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
    if (markers.length === 0) return defaultCenter;
    
    const sumLat = markers.reduce((sum, m) => sum + m.lat, 0);
    const sumLng = markers.reduce((sum, m) => sum + m.lng, 0);
    
    return {
      lat: sumLat / markers.length,
      lng: sumLng / markers.length,
    };
  }, [markers]);

  // Create polyline path for routes
  const polylinePaths = useMemo(() => {
    if (selectedDay) {
      // Single day - one polyline
      const dayMarkers = markers.filter(m => m.day === selectedDay);
      return [{
        path: dayMarkers.map(m => ({ lat: m.lat, lng: m.lng })),
        color: dayColors[(selectedDay - 1) % dayColors.length],
      }];
    }
    
    // All days - separate polylines per day
    const paths: { path: { lat: number; lng: number }[]; color: string }[] = [];
    const groupedByDay: Record<number, MarkerData[]> = {};
    
    markers.forEach(m => {
      if (!groupedByDay[m.day]) groupedByDay[m.day] = [];
      groupedByDay[m.day].push(m);
    });
    
    Object.entries(groupedByDay).forEach(([day, dayMarkers]) => {
      paths.push({
        path: dayMarkers.map(m => ({ lat: m.lat, lng: m.lng })),
        color: dayColors[(parseInt(day) - 1) % dayColors.length],
      });
    });
    
    return paths;
  }, [markers, selectedDay]);

  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    
    if (markers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      markers.forEach((marker: MarkerData) => {
        bounds.extend({ lat: marker.lat, lng: marker.lng });
      });
      mapInstance.fitBounds(bounds);
    }
  }, [markers]);

  const openInGoogleMaps = () => {
    if (markers.length === 0) return;
    
    if (markers.length === 1) {
      const m = markers[0];
      window.open(`https://www.google.com/maps?q=${m.lat},${m.lng}`, '_blank');
    } else {
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

  // Create custom marker icon with number
  const createMarkerIcon = (dayNumber: number, activityIndex: number): google.maps.Symbol => {
    const color = dayColors[(dayNumber - 1) % dayColors.length];
    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale: 12,
    };
  };

  // No API key
  if (!apiKey) {
    return (
      <Card className="h-full min-h-[350px] flex flex-col items-center justify-center text-muted-foreground p-4 sm:p-6">
        <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 mb-4 text-warning" />
        <p className="text-base sm:text-lg font-medium text-center text-foreground">Google Maps API key required</p>
        <p className="text-xs sm:text-sm text-center">Add VITE_GOOGLE_MAPS_API_KEY to enable the map</p>
      </Card>
    );
  }

  // Loading error
  if (loadError) {
    return (
      <Card className="h-full min-h-[350px] flex flex-col items-center justify-center text-muted-foreground p-4 sm:p-6">
        <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 mb-4 text-destructive" />
        <p className="text-base sm:text-lg font-medium text-center">Failed to load Google Maps</p>
        <p className="text-xs sm:text-sm text-center">Please check your API key and try again</p>
      </Card>
    );
  }

  // Loading state
  if (!isLoaded) {
    return (
      <Card className="h-full min-h-[350px] flex flex-col items-center justify-center text-muted-foreground p-4 sm:p-6">
        <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 mb-4 animate-spin text-primary" />
        <p className="text-base sm:text-lg font-medium text-center">Loading map...</p>
      </Card>
    );
  }

  // No markers
  if (markers.length === 0) {
    return (
      <Card className="h-full min-h-[350px] flex flex-col items-center justify-center text-muted-foreground p-4 sm:p-6">
        <MapPin className="w-10 h-10 sm:w-12 sm:h-12 mb-4 opacity-50" />
        <p className="text-base sm:text-lg font-medium text-center">No locations yet</p>
        <p className="text-xs sm:text-sm text-center">Activities with coordinates will appear on the map</p>
      </Card>
    );
  }

  return (
    <Card className="h-full min-h-[350px] overflow-hidden flex flex-col">
      {/* Map */}
      <div className="flex-1 relative">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={13}
          options={mapOptions}
          onLoad={onMapLoad}
        >
          {/* Polylines for routes */}
          {polylinePaths.map((polyline, idx) => (
            <Polyline
              key={idx}
              path={polyline.path}
              options={{
                strokeColor: polyline.color,
                strokeOpacity: 0.8,
                strokeWeight: 3,
              }}
            />
          ))}

          {/* Markers */}
          {markers.map((marker, idx) => (
            <Marker
              key={`${marker.day}-${marker.index}`}
              position={{ lat: marker.lat, lng: marker.lng }}
              icon={createMarkerIcon(marker.day, marker.index)}
              label={{
                text: String(marker.index),
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: '11px',
              }}
              onClick={() => setSelectedMarker(marker)}
            />
          ))}

          {/* Info Window */}
          {selectedMarker && (
            <InfoWindow
              position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
              onCloseClick={() => setSelectedMarker(null)}
            >
              <div className="p-2 min-w-[150px]">
                <p className="font-semibold" style={{ color: '#111827' }}>{selectedMarker.name}</p>
                <p className="text-sm" style={{ color: '#4B5563' }}>
                  Day {selectedMarker.day} • {selectedMarker.time}
                </p>
                <button
                  className="mt-2 text-sm hover:underline"
                  style={{ color: '#2563EB' }}
                  onClick={() => {
                    window.open(
                      `https://www.google.com/maps/dir/?api=1&destination=${selectedMarker.lat},${selectedMarker.lng}`,
                      '_blank'
                    );
                  }}
                >
                  Get Directions →
                </button>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>

        {/* Action buttons */}
        <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap gap-2">
          <Button 
            onClick={openInGoogleMaps} 
            size="sm"
            variant="secondary"
            className="shadow-lg text-xs sm:text-sm min-h-[40px]"
          >
            <Navigation className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Full Route</span>
            <span className="sm:hidden">Route</span>
          </Button>
          
          {onOptimizeRoute && selectedDay && (
            <Button
              onClick={() => onOptimizeRoute(selectedDay)}
              disabled={isOptimizing}
              size="sm"
              className="shadow-lg text-xs sm:text-sm min-h-[40px] bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600"
            >
              {isOptimizing ? (
                <Loader2 className="w-4 h-4 mr-1 sm:mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-1 sm:mr-2" />
              )}
              <span className="hidden sm:inline">Optimize Route</span>
              <span className="sm:hidden">Optimize</span>
            </Button>
          )}
        </div>
        
        {/* Travel time indicator */}
        {selectedDay && (() => {
          const dayData = days.find(d => d.day === selectedDay);
          const travelTime = dayData ? calculateTotalTravelTime(dayData.activities) : 0;
          return travelTime > 0 ? (
            <div className="absolute top-3 right-3 z-10">
              <Badge variant="secondary" className="shadow-lg bg-background/90 backdrop-blur-sm">
                <Clock className="w-3 h-3 mr-1" />
                ~{travelTime} min travel
              </Badge>
            </div>
          ) : null;
        })()}
      </div>

      {/* Markers Legend - More compact on mobile */}
      <div className="p-3 sm:p-4 border-t bg-card">
        <h4 className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3">Locations</h4>
        <div className="space-y-1.5 sm:space-y-2 max-h-[120px] sm:max-h-[150px] overflow-y-auto">
          {markers.map((marker, i) => (
            <button
              key={i}
              className="flex items-center gap-2 text-xs sm:text-sm w-full text-left hover:bg-muted/50 p-1.5 sm:p-2 rounded transition-colors min-h-[36px]"
              onClick={() => {
                setSelectedMarker(marker);
                map?.panTo({ lat: marker.lat, lng: marker.lng });
                map?.setZoom(15);
              }}
            >
              <span 
                className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-white text-[10px] sm:text-xs font-bold flex-shrink-0"
                style={{ backgroundColor: dayColors[(marker.day - 1) % dayColors.length] }}
              >
                {marker.index}
              </span>
              <span className="truncate text-foreground flex-1">
                {marker.name}
              </span>
              <span className="text-[10px] sm:text-xs text-muted-foreground flex-shrink-0">
                Day {marker.day}
              </span>
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default ItineraryMap;
