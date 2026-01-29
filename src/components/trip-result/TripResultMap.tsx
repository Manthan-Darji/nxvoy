import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GoogleMap, InfoWindow, Marker } from '@react-google-maps/api';
import { Loader2, MapPin, Navigation } from 'lucide-react';
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

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 20.5937,
  lng: 78.9629,
};

const darkModeStyles: google.maps.MapTypeStyle[] = [
  { featureType: 'all', elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
  { featureType: 'all', elementType: 'labels.text.fill', stylers: [{ color: '#8b8b8b' }] },
  { featureType: 'all', elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a2e' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2d2d44' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e0e1a' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#252538' }] },
];

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
  styles: darkModeStyles,
};

type ActivityMarker = {
  index: number;
  name: string;
  position: google.maps.LatLngLiteral;
};

const TripResultMap = ({ activities, destination }: TripResultMapProps) => {
  const { isLoaded, loadError } = useGoogleMaps();

  const mapRef = useRef<google.maps.Map | null>(null);

  const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral>(defaultCenter);
  const [mainPin, setMainPin] = useState<google.maps.LatLngLiteral | null>(null);
  const [activityPins, setActivityPins] = useState<ActivityMarker[]>([]);
  const [hoveredActivity, setHoveredActivity] = useState<ActivityMarker | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const getHslToken = useCallback((token: string, fallback: string) => {
    try {
      const raw = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
      // shadcn tokens are stored like: "222.2 47.4% 11.2%" and used as: hsl(var(--token))
      return raw ? `hsl(${raw})` : fallback;
    } catch {
      return fallback;
    }
  }, []);

  const activityDotFill = useMemo(() => getHslToken('--primary', '#3b82f6'), [getHslToken]);
  const activityDotStroke = useMemo(() => getHslToken('--primary-foreground', '#ffffff'), [getHslToken]);

  const mainMarkerIcon = useMemo<google.maps.Icon | undefined>(() => {
    // Standard Google pin icon (scaled larger)
    if (!window.google?.maps) return undefined;
    return {
      url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
      scaledSize: new google.maps.Size(48, 48),
      anchor: new google.maps.Point(12, 34),
    };
  }, []);

  const destinationQuery = useMemo(() => {
    const trimmed = destination?.trim() ?? '';
    if (!trimmed) return '';
    // CRITICAL: If just city name, append ", India".
    return trimmed.includes(',') ? trimmed : `${trimmed}, India`;
  }, [destination]);

  const geocodeAddress = useCallback(
    (geocoder: google.maps.Geocoder, address: string): Promise<google.maps.LatLngLiteral | null> => {
      console.log('Geocoding address:', address);
      return new Promise((resolve) => {
        try {
          geocoder.geocode({ address }, (results, status) => {
            if (status === google.maps.GeocoderStatus.OK && results?.[0]?.geometry?.location) {
              const loc = results[0].geometry.location;
              resolve({ lat: loc.lat(), lng: loc.lng() });
              return;
            }

            // ZERO_RESULTS / OVER_QUERY_LIMIT / REQUEST_DENIED etc.
            resolve(null);
          });
        } catch (err) {
          console.warn('[TripResultMap] Geocoding threw error for:', address, err);
          resolve(null);
        }
      });
    },
    []
  );

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  // Core logic: Geocode destination & activities when props change.
  useEffect(() => {
    if (!isLoaded) return;
    if (!mapRef.current) return;
    if (!destinationQuery) return;

    console.log('Map received locations:', { destination, activities });

    const map = mapRef.current;
    const geocoder = new google.maps.Geocoder();
    let cancelled = false;

    const run = async () => {
      setIsGeocoding(true);
      setHoveredActivity(null);
      setActivityPins([]);
      setMainPin(null);

      const bounds = new google.maps.LatLngBounds();

      // Step A: Main pin
      let mainCoords = await geocodeAddress(geocoder, destinationQuery);
      if (!mainCoords && destinationQuery !== destination) {
        mainCoords = await geocodeAddress(geocoder, destination);
      }

      if (cancelled) return;

      if (mainCoords) {
        setMainPin(mainCoords);
        setMapCenter(mainCoords);
        bounds.extend(mainCoords);
      } else {
        console.warn('[TripResultMap] Could not geocode destination:', destinationQuery);
      }

      // Step B: Activity pins
      const pins: ActivityMarker[] = [];
      const baseDestinationForActivities = destinationQuery || destination;

      for (let i = 0; i < activities.length; i++) {
        const a = activities[i];
        const addr = `${a.location_name}, ${baseDestinationForActivities}`;
        const coords = await geocodeAddress(geocoder, addr);

        if (cancelled) return;

        if (coords) {
          pins.push({ index: i, name: a.activity || a.location_name, position: coords });
          bounds.extend(coords);
        } else {
          console.warn('Location not found:', addr);
        }
      }

      if (cancelled) return;

      setActivityPins(pins);

      // Step C: View fix
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds);
        map.panToBounds(bounds);
      } else if (mainCoords) {
        // Requirement: never blank; at least center on main destination
        map.setCenter(mainCoords);
        map.setZoom(12);
      } else {
        // Worst-case fallback
        map.setCenter(defaultCenter);
        map.setZoom(4);
      }

      setIsGeocoding(false);
    };

    run().catch((err) => {
      console.error('[TripResultMap] Geocoding run failed:', err);
      setIsGeocoding(false);
    });

    return () => {
      cancelled = true;
    };
  }, [activities, destination, destinationQuery, geocodeAddress, isLoaded]);

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

  return (
    <div className="relative w-full h-full">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={mapCenter}
        zoom={mapCenter === defaultCenter ? 4 : 12}
        options={mapOptions}
        onLoad={onMapLoad}
      >
        {/* Main destination marker - large red pin */}
        {mainPin && (
          <Marker position={mainPin} title={destination} icon={mainMarkerIcon} zIndex={1000} />
        )}

        {/* Activity markers - small blue dots */}
        {activityPins.map((pin) => (
          <Marker
            key={pin.index}
            position={pin.position}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: activityDotFill,
              fillOpacity: 0.95,
              strokeColor: activityDotStroke,
              strokeOpacity: 1,
              strokeWeight: 2,
              scale: 7,
            }}
            onMouseOver={() => setHoveredActivity(pin)}
            onMouseOut={() => setHoveredActivity((prev) => (prev?.index === pin.index ? null : prev))}
            zIndex={pin.index + 1}
          />
        ))}

        {/* Hover tooltip */}
        {hoveredActivity && (
          <InfoWindow
            position={hoveredActivity.position}
            options={{ disableAutoPan: true }}
            onCloseClick={() => setHoveredActivity(null)}
          >
            <div className="px-2 py-1">
              <p className="text-xs font-medium text-foreground">{hoveredActivity.name}</p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Geocoding progress overlay */}
      {isGeocoding && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Locating places...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripResultMap;
