import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GoogleMap, Marker, OverlayView } from '@react-google-maps/api';
import { Loader2, MapPin, Navigation } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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

const mapContainerStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  minHeight: 400,
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

const TripResultMap = React.forwardRef<HTMLDivElement, TripResultMapProps>(({ activities, destination }, forwardedRef) => {
  const { isLoaded, loadError } = useGoogleMaps();

  const mapRef = useRef<google.maps.Map | null>(null);

  const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral>(defaultCenter);
  const [mainPin, setMainPin] = useState<google.maps.LatLngLiteral | null>(null);
  const [activityPins, setActivityPins] = useState<ActivityMarker[]>([]);
  const [isResolvingPlaces, setIsResolvingPlaces] = useState(false);

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
  const cardBg = useMemo(() => getHslToken('--background', '#0b0b12'), [getHslToken]);
  const cardFg = useMemo(() => getHslToken('--foreground', '#ffffff'), [getHslToken]);

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

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const findPlaceLatLng = useCallback(
    async (placesService: google.maps.places.PlacesService, query: string): Promise<google.maps.LatLngLiteral | null> => {
      const address = query.trim();
      if (!address) return null;

      console.log('Geocoding address:', address);

      return new Promise((resolve, reject) => {
        try {
          placesService.findPlaceFromQuery(
            {
              query: address,
              fields: ['geometry', 'name'],
            },
            (results, status) => {
              if (status === google.maps.places.PlacesServiceStatus.OK && results?.[0]?.geometry?.location) {
                const loc = results[0].geometry.location;
                resolve({ lat: loc.lat(), lng: loc.lng() });
                return;
              }

              // If key restrictions are wrong, Google often returns REQUEST_DENIED.
              if (status === google.maps.places.PlacesServiceStatus.REQUEST_DENIED) {
                reject(new Error('REQUEST_DENIED'));
                return;
              }

              resolve(null);
            }
          );
        } catch (err) {
          reject(err);
        }
      });
    },
    []
  );

  // Core logic: Resolve destination & activities via Places when props change.
  useEffect(() => {
    if (!isLoaded) return;
    if (!mapRef.current) return;

    const trimmedDestination = destination?.trim() ?? '';
    if (!trimmedDestination) return;

    console.log('Map received locations:', { destination: trimmedDestination, activities });

    const map = mapRef.current;
    const placesService = new google.maps.places.PlacesService(map);
    let cancelled = false;

    const run = async () => {
      setIsResolvingPlaces(true);
      setActivityPins([]);
      setMainPin(null);

      const bounds = new google.maps.LatLngBounds();

      try {
        // Step A: Destination pin
        let mainCoords: google.maps.LatLngLiteral | null = null;
        try {
          mainCoords = await findPlaceLatLng(placesService, destinationQuery);
        } catch (err) {
          // Re-throw for outer error handler
          throw err;
        }

        if (!mainCoords && destinationQuery !== trimmedDestination) {
          // fallback: raw destination string
          mainCoords = await findPlaceLatLng(placesService, trimmedDestination);
        }

        if (cancelled) return;

        if (mainCoords) {
          setMainPin(mainCoords);
          setMapCenter(mainCoords);
          bounds.extend(mainCoords);
        } else {
          // Never blank: fallback to India center
          toast.warning('Could not find destination');
          setMapCenter(defaultCenter);
          map.setCenter(defaultCenter);
          map.setZoom(4);
          bounds.extend(defaultCenter);
        }

        // Step B: Activity pins
        const pins: ActivityMarker[] = [];

        for (let i = 0; i < (activities?.length ?? 0); i++) {
          const a = activities[i];
          const name = a?.activity || a?.location_name || `Stop ${i + 1}`;
          const locationName = (a?.location_name ?? '').trim();
          if (!locationName) continue;

          // Places strategy: try spot name alone first, then add destination context.
          let coords = await findPlaceLatLng(placesService, locationName);
          if (!coords) {
            coords = await findPlaceLatLng(placesService, `${locationName}, ${destinationQuery}`);
          }

          if (cancelled) return;

          if (coords) {
            pins.push({ index: i, name, position: coords });
            bounds.extend(coords);
          } else {
            console.warn('Location not found:', locationName);
          }
        }

        if (cancelled) return;

        setActivityPins(pins);

        // Step C: View fix
        if (!bounds.isEmpty()) {
          map.fitBounds(bounds);
          map.panToBounds(bounds);
        } else if (mainCoords) {
          map.setCenter(mainCoords);
          map.setZoom(12);
        } else {
          map.setCenter(defaultCenter);
          map.setZoom(4);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[TripResultMap] Places resolution failed:', err);

        if (msg.includes('403') || msg.includes('REQUEST_DENIED')) {
          toast.error('Map Error: Please check API Key restrictions in Google Cloud.');
        } else {
          toast.error('Map Error: Failed to load map locations.');
        }

        // Ensure map is still usable
        map.setCenter(mapCenter ?? defaultCenter);
        map.setZoom(mapCenter === defaultCenter ? 4 : 12);
      } finally {
        if (!cancelled) setIsResolvingPlaces(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [activities, destination, destinationQuery, findPlaceLatLng, isLoaded, mapCenter]);

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
    <div ref={forwardedRef} className="relative w-full h-full min-h-[400px]">
      <TooltipProvider delayDuration={150}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={mapCenter}
          zoom={mapCenter === defaultCenter ? 4 : 12}
          options={mapOptions}
          onLoad={onMapLoad}
        >
          {/* Main destination marker - large red pin */}
          {mainPin && <Marker position={mainPin} title={destination} icon={mainMarkerIcon} zIndex={1000} />}

          {/* Activity markers - HTML overlay so TooltipTrigger can safely attach refs */}
          {activityPins.map((pin) => (
            <OverlayView
              key={pin.index}
              position={pin.position}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  {/* CRITICAL: The div absorbs the ref from TooltipTrigger */}
                  <div
                    className="cursor-pointer rounded-full shadow-lg"
                    style={{
                      width: 14,
                      height: 14,
                      background: activityDotFill,
                      border: `2px solid ${activityDotStroke}`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    aria-label={pin.name}
                    role="button"
                  />
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  sideOffset={8}
                  style={{ background: cardBg, color: cardFg, borderColor: 'transparent' }}
                >
                  <span className="text-xs font-medium">{pin.name}</span>
                </TooltipContent>
              </Tooltip>
            </OverlayView>
          ))}
        </GoogleMap>
      </TooltipProvider>

      {/* Progress overlay */}
      {isResolvingPlaces && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Locating places...</p>
          </div>
        </div>
      )}
    </div>
  );
});

TripResultMap.displayName = 'TripResultMap';

export default TripResultMap;
