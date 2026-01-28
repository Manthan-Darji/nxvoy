import { useEffect, useState, useRef, useCallback } from 'react';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { MapPin, Navigation, Loader2 } from 'lucide-react';
import { useGoogleMaps } from '@/context/GoogleMapsContext';

interface TripActivity {
  time: string;
  activity: string;
  location_name: string;
  location_address?: string;
  cost: number;
  type: 'transport' | 'food' | 'sightseeing' | 'stay' | 'activity';
}

interface TripResultMapProps {
  activities: TripActivity[];
  destination: string;
}

interface GeocodedActivity extends TripActivity {
  position: google.maps.LatLngLiteral | null;
  index: number;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 20.5937,
  lng: 78.9629,
};

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
  styles: [
    {
      featureType: 'all',
      elementType: 'geometry',
      stylers: [{ color: '#1a1a2e' }],
    },
    {
      featureType: 'all',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#8b8b8b' }],
    },
    {
      featureType: 'all',
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#1a1a2e' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#2d2d44' }],
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#0e0e1a' }],
    },
    {
      featureType: 'poi',
      elementType: 'geometry',
      stylers: [{ color: '#252538' }],
    },
  ],
};

const TripResultMap = ({ activities, destination }: TripResultMapProps) => {
  const [center, setCenter] = useState(defaultCenter);
  const [selectedActivity, setSelectedActivity] = useState<GeocodedActivity | null>(null);
  const [geocodedActivities, setGeocodedActivities] = useState<GeocodedActivity[]>([]);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingProgress, setGeocodingProgress] = useState(0);
  const mapRef = useRef<google.maps.Map | null>(null);
  const geocodeCacheRef = useRef<Map<string, google.maps.LatLngLiteral>>(new Map());
  
  const { isLoaded, loadError } = useGoogleMaps();

  // Geocode the destination to center the map
  useEffect(() => {
    if (!isLoaded || !destination) return;

    const geocodeDestination = async () => {
      const cacheKey = `destination:${destination}`;
      if (geocodeCacheRef.current.has(cacheKey)) {
        setCenter(geocodeCacheRef.current.get(cacheKey)!);
        return;
      }

      try {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: destination }, (results, status) => {
          if (status === 'OK' && results?.[0]) {
            const newCenter = {
              lat: results[0].geometry.location.lat(),
              lng: results[0].geometry.location.lng(),
            };
            geocodeCacheRef.current.set(cacheKey, newCenter);
            setCenter(newCenter);
          }
        });
      } catch (error) {
        console.warn('Failed to geocode destination:', error);
      }
    };

    geocodeDestination();
  }, [isLoaded, destination]);

  // Geocode each activity location using Places API
  const geocodeActivities = useCallback(async () => {
    if (!mapRef.current || !activities.length || !destination) return;

    setIsGeocoding(true);
    setGeocodingProgress(0);

    const service = new google.maps.places.PlacesService(mapRef.current);
    const results: GeocodedActivity[] = [];

    for (let i = 0; i < activities.length; i++) {
      const activity = activities[i];
      const searchQuery = activity.location_address 
        ? `${activity.location_name}, ${activity.location_address}`
        : `${activity.location_name}, ${destination}`;
      
      const cacheKey = searchQuery.toLowerCase();
      
      // Check cache first
      if (geocodeCacheRef.current.has(cacheKey)) {
        results.push({
          ...activity,
          position: geocodeCacheRef.current.get(cacheKey)!,
          index: i,
        });
        setGeocodingProgress(((i + 1) / activities.length) * 100);
        continue;
      }

      // Use Places API findPlaceFromQuery
      try {
        const position = await new Promise<google.maps.LatLngLiteral | null>((resolve) => {
          service.findPlaceFromQuery(
            {
              query: searchQuery,
              fields: ['geometry', 'name'],
            },
            (placeResults, status) => {
              if (status === google.maps.places.PlacesServiceStatus.OK && placeResults?.[0]?.geometry?.location) {
                const location = placeResults[0].geometry.location;
                const pos = { lat: location.lat(), lng: location.lng() };
                geocodeCacheRef.current.set(cacheKey, pos);
                resolve(pos);
              } else {
                // Fallback: try with just location name
                service.findPlaceFromQuery(
                  {
                    query: `${activity.location_name}, ${destination}`,
                    fields: ['geometry', 'name'],
                  },
                  (fallbackResults, fallbackStatus) => {
                    if (fallbackStatus === google.maps.places.PlacesServiceStatus.OK && fallbackResults?.[0]?.geometry?.location) {
                      const location = fallbackResults[0].geometry.location;
                      const pos = { lat: location.lat(), lng: location.lng() };
                      geocodeCacheRef.current.set(cacheKey, pos);
                      resolve(pos);
                    } else {
                      resolve(null);
                    }
                  }
                );
              }
            }
          );
        });

        results.push({
          ...activity,
          position,
          index: i,
        });
      } catch (error) {
        console.warn(`Failed to geocode activity "${activity.location_name}":`, error);
        results.push({
          ...activity,
          position: null,
          index: i,
        });
      }

      setGeocodingProgress(((i + 1) / activities.length) * 100);
      
      // Small delay to respect API rate limits
      if (i < activities.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    setGeocodedActivities(results);
    setIsGeocoding(false);
  }, [activities, destination]);

  // Trigger geocoding when map loads
  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    geocodeActivities();
  }, [geocodeActivities]);

  if (loadError) {
    return (
      <div className="w-full h-full bg-card/50 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Unable to load map</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full bg-card/50 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Navigation className="w-8 h-8 mx-auto mb-2 animate-pulse" />
          <p>Loading map...</p>
        </div>
      </div>
    );
  }

  const getMarkerIcon = (type: string) => {
    const colors: Record<string, string> = {
      transport: '#3b82f6',
      food: '#f97316',
      sightseeing: '#a855f7',
      stay: '#22c55e',
      activity: '#ec4899',
    };
    
    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: colors[type] || '#6b7280',
      fillOpacity: 1,
      strokeWeight: 2,
      strokeColor: '#ffffff',
      scale: 12,
    };
  };

  // Filter activities that have valid positions
  const activitiesWithPositions = geocodedActivities.filter(a => a.position !== null);

  return (
    <div className="relative w-full h-full">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={12}
        options={mapOptions}
        onLoad={onMapLoad}
      >
        {/* Destination center marker */}
        <Marker
          position={center}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#ef4444',
            fillOpacity: 1,
            strokeWeight: 3,
            strokeColor: '#ffffff',
            scale: 15,
          }}
          title={destination}
        />

        {/* Activity markers with real geocoded positions */}
        {activitiesWithPositions.map((activity) => (
          <Marker
            key={activity.index}
            position={activity.position!}
            icon={getMarkerIcon(activity.type)}
            onClick={() => setSelectedActivity(activity)}
            label={{
              text: String(activity.index + 1),
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: 'bold',
            }}
          />
        ))}

        {/* Info Window */}
        {selectedActivity && selectedActivity.position && (
          <InfoWindow
            position={selectedActivity.position}
            onCloseClick={() => setSelectedActivity(null)}
          >
            <div className="p-2 max-w-[200px]">
              <h4 className="font-semibold text-sm text-gray-900 mb-1">
                {selectedActivity.activity}
              </h4>
              <p className="text-xs text-gray-600">
                {selectedActivity.location_name}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {selectedActivity.time}
              </p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Geocoding progress overlay */}
      {isGeocoding && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Locating places... {Math.round(geocodingProgress)}%
            </p>
          </div>
        </div>
      )}

      {/* Legend showing unmapped activities */}
      {!isGeocoding && geocodedActivities.length > 0 && activitiesWithPositions.length < geocodedActivities.length && (
        <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm rounded-lg p-2 text-xs text-muted-foreground">
          <p>{activitiesWithPositions.length} of {geocodedActivities.length} locations mapped</p>
        </div>
      )}
    </div>
  );
};

export default TripResultMap;
