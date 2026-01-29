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

// Activity type colors
const activityColors: Record<string, string> = {
  transport: '#3b82f6',
  food: '#f97316',
  sightseeing: '#a855f7',
  stay: '#22c55e',
  activity: '#ec4899',
};

const TripResultMap = ({ activities, destination }: TripResultMapProps) => {
  const [destinationCenter, setDestinationCenter] = useState<google.maps.LatLngLiteral | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<GeocodedActivity | null>(null);
  const [geocodedActivities, setGeocodedActivities] = useState<GeocodedActivity[]>([]);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingProgress, setGeocodingProgress] = useState(0);
  const mapRef = useRef<google.maps.Map | null>(null);
  const geocodeCacheRef = useRef<Map<string, google.maps.LatLngLiteral>>(new Map());
  
  const { isLoaded, loadError } = useGoogleMaps();

  // Use Places API to geocode a query - more reliable than Geocoder
  const geocodeWithPlaces = useCallback((
    service: google.maps.places.PlacesService,
    query: string
  ): Promise<google.maps.LatLngLiteral | null> => {
    return new Promise((resolve) => {
      service.findPlaceFromQuery(
        {
          query,
          fields: ['geometry', 'name'],
        },
        (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results?.[0]?.geometry?.location) {
            const location = results[0].geometry.location;
            resolve({ lat: location.lat(), lng: location.lng() });
          } else {
            resolve(null);
          }
        }
      );
    });
  }, []);

  // Geocode the destination using Places API
  const geocodeDestination = useCallback(async (service: google.maps.places.PlacesService) => {
    if (!destination) return;

    const cacheKey = `destination:${destination.toLowerCase()}`;
    if (geocodeCacheRef.current.has(cacheKey)) {
      setDestinationCenter(geocodeCacheRef.current.get(cacheKey)!);
      return;
    }

    // Try with ", India" suffix first for better accuracy
    let position = await geocodeWithPlaces(service, `${destination}, India`);
    
    // Fallback to just destination name
    if (!position) {
      position = await geocodeWithPlaces(service, destination);
    }

    if (position) {
      geocodeCacheRef.current.set(cacheKey, position);
      setDestinationCenter(position);
    }
  }, [destination, geocodeWithPlaces]);

  // Geocode each activity location using Places API
  const geocodeActivities = useCallback(async (service: google.maps.places.PlacesService) => {
    if (!activities.length || !destination) return;

    setIsGeocoding(true);
    setGeocodingProgress(0);

    const results: GeocodedActivity[] = [];

    for (let i = 0; i < activities.length; i++) {
      const activity = activities[i];
      
      // Build search query - prefer full address, fallback to location name + destination
      const searchQueries = [
        activity.location_address ? `${activity.location_name}, ${activity.location_address}` : null,
        `${activity.location_name}, ${destination}, India`,
        `${activity.location_name}, ${destination}`,
        activity.location_name,
      ].filter(Boolean) as string[];

      const cacheKey = searchQueries[0].toLowerCase();
      
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

      // Try each search query until one works
      let position: google.maps.LatLngLiteral | null = null;
      for (const query of searchQueries) {
        position = await geocodeWithPlaces(service, query);
        if (position) {
          geocodeCacheRef.current.set(cacheKey, position);
          break;
        }
      }

      results.push({
        ...activity,
        position,
        index: i,
      });

      setGeocodingProgress(((i + 1) / activities.length) * 100);
      
      // Small delay to respect API rate limits
      if (i < activities.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 80));
      }
    }

    setGeocodedActivities(results);
    setIsGeocoding(false);

    // Auto-fit bounds to show all markers
    if (mapRef.current && results.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      
      // Include destination center
      if (destinationCenter) {
        bounds.extend(destinationCenter);
      }
      
      // Include all activity positions
      results.forEach(activity => {
        if (activity.position) {
          bounds.extend(activity.position);
        }
      });

      // Only fit if we have valid bounds
      if (!bounds.isEmpty()) {
        mapRef.current.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
      }
    }
  }, [activities, destination, destinationCenter, geocodeWithPlaces]);

  // Initialize geocoding when map loads
  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    
    const service = new google.maps.places.PlacesService(map);
    
    // Geocode destination first, then activities
    geocodeDestination(service).then(() => {
      geocodeActivities(service);
    });
  }, [geocodeDestination, geocodeActivities]);

  // Update bounds when destination center changes
  useEffect(() => {
    if (mapRef.current && destinationCenter && geocodedActivities.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(destinationCenter);
      
      geocodedActivities.forEach(activity => {
        if (activity.position) {
          bounds.extend(activity.position);
        }
      });

      if (!bounds.isEmpty()) {
        mapRef.current.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
      }
    }
  }, [destinationCenter, geocodedActivities]);

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

  // Filter activities that have valid positions
  const activitiesWithPositions = geocodedActivities.filter(a => a.position !== null);

  return (
    <div className="relative w-full h-full">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={destinationCenter || defaultCenter}
        zoom={12}
        options={mapOptions}
        onLoad={onMapLoad}
      >
        {/* Main destination marker - large red pin */}
        {destinationCenter && (
          <Marker
            position={destinationCenter}
            icon={{
              path: 'M12 0C7.31 0 3.5 3.81 3.5 8.5C3.5 14.88 12 24 12 24S20.5 14.88 20.5 8.5C20.5 3.81 16.69 0 12 0ZM12 11.5C10.34 11.5 9 10.16 9 8.5S10.34 5.5 12 5.5S15 6.84 15 8.5S13.66 11.5 12 11.5Z',
              fillColor: '#ef4444',
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: '#ffffff',
              scale: 1.8,
              anchor: new google.maps.Point(12, 24),
            }}
            title={destination}
            zIndex={1000}
          />
        )}

        {/* Activity markers - numbered colored circles */}
        {activitiesWithPositions.map((activity) => (
          <Marker
            key={activity.index}
            position={activity.position!}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: activityColors[activity.type] || '#6b7280',
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: '#ffffff',
              scale: 10,
            }}
            onClick={() => setSelectedActivity(activity)}
            label={{
              text: String(activity.index + 1),
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: 'bold',
            }}
            zIndex={activity.index + 1}
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
              {selectedActivity.location_address && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {selectedActivity.location_address}
                </p>
              )}
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

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm rounded-lg p-3 text-xs">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-4 h-4 flex items-center justify-center">
            <svg width="12" height="16" viewBox="0 0 24 24" fill="#ef4444">
              <path d="M12 0C7.31 0 3.5 3.81 3.5 8.5C3.5 14.88 12 24 12 24S20.5 14.88 20.5 8.5C20.5 3.81 16.69 0 12 0ZM12 11.5C10.34 11.5 9 10.16 9 8.5S10.34 5.5 12 5.5S15 6.84 15 8.5S13.66 11.5 12 11.5Z"/>
            </svg>
          </div>
          <span className="text-muted-foreground">{destination}</span>
        </div>
        {!isGeocoding && geocodedActivities.length > 0 && (
          <p className="text-muted-foreground">
            {activitiesWithPositions.length} of {geocodedActivities.length} locations mapped
          </p>
        )}
      </div>
    </div>
  );
};

export default TripResultMap;
