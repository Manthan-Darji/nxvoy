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
  type: string;
};

const TripResultMap = React.forwardRef<HTMLDivElement, TripResultMapProps>(
  ({ activities, destination }, forwardedRef) => {
    const { isLoaded, loadError } = useGoogleMaps();

    const mapRef = useRef<google.maps.Map | null>(null);

    const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral>(defaultCenter);
    const [mainPin, setMainPin] = useState<google.maps.LatLngLiteral | null>(null);
    const [activityPins, setActivityPins] = useState<ActivityMarker[]>([]);
    const [isResolvingPlaces, setIsResolvingPlaces] = useState(false);

    const getHslToken = useCallback((token: string, fallback: string) => {
      try {
        const raw = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
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
      return trimmed.includes(',') ? trimmed : `${trimmed}, India`;
    }, [destination]);

    const onMapLoad = useCallback((map: google.maps.Map) => {
      mapRef.current = map;
    }, []);

    // Helper: Find place using Places API
    const findPlaceLatLng = useCallback(
      async (
        placesService: google.maps.places.PlacesService,
        query: string
      ): Promise<google.maps.LatLngLiteral | null> => {
        const address = query.trim();
        if (!address) return null;

        return new Promise((resolve) => {
          try {
            placesService.findPlaceFromQuery(
              {
                query: address,
                fields: ['geometry', 'name'],
              },
              (results, status) => {
                if (
                  status === google.maps.places.PlacesServiceStatus.OK &&
                  results?.[0]?.geometry?.location
                ) {
                  const loc = results[0].geometry.location;
                  resolve({ lat: loc.lat(), lng: loc.lng() });
                  return;
                }

                // Log but don't crash on REQUEST_DENIED
                if (status === google.maps.places.PlacesServiceStatus.REQUEST_DENIED) {
                  console.warn('[TripResultMap] Places API request denied for:', address);
                }

                resolve(null);
              }
            );
          } catch (err) {
            console.error('[TripResultMap] findPlaceFromQuery error:', err);
            resolve(null);
          }
        });
      },
      []
    );

    // Core logic: Resolve destination & activities via Places when props change
    useEffect(() => {
      if (!isLoaded) return;
      if (!mapRef.current) return;

      const trimmedDestination = destination?.trim() ?? '';
      if (!trimmedDestination) return;

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

          mainCoords = await findPlaceLatLng(placesService, destinationQuery);

          // Fallback to raw destination string if enhanced query fails
          if (!mainCoords && destinationQuery !== trimmedDestination) {
            mainCoords = await findPlaceLatLng(placesService, trimmedDestination);
          }

          if (cancelled) return;

          if (mainCoords) {
            setMainPin(mainCoords);
            setMapCenter(mainCoords);
            bounds.extend(mainCoords);
          } else {
            console.warn('[TripResultMap] Could not find destination:', trimmedDestination);
            toast.warning('Could not find destination on map');
            setMapCenter(defaultCenter);
          }

          // Step B: Activity pins using Promise.allSettled
          const activityPromises = (activities ?? []).map(async (a, index) => {
            const name = a?.activity || a?.location_name || `Stop ${index + 1}`;
            const locationName = (a?.location_name ?? '').trim();
            if (!locationName) return null;

            // Try location name alone first
            let coords = await findPlaceLatLng(placesService, locationName);
            
            // Fallback: add destination context
            if (!coords) {
              coords = await findPlaceLatLng(placesService, `${locationName}, ${destinationQuery}`);
            }

            if (coords) {
              return { index, name, position: coords, type: a.type };
            }
            
            console.warn('[TripResultMap] Location not found:', locationName);
            return null;
          });

          const results = await Promise.allSettled(activityPromises);

          if (cancelled) return;

          const pins: ActivityMarker[] = [];
          results.forEach((result) => {
            if (result.status === 'fulfilled' && result.value) {
              pins.push(result.value);
              bounds.extend(result.value.position);
            }
          });

          setActivityPins(pins);

          // Step C: Auto-zoom with fitBounds
          if (!bounds.isEmpty()) {
            map.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
          } else if (mainCoords) {
            map.setCenter(mainCoords);
            map.setZoom(12);
          } else {
            map.setCenter(defaultCenter);
            map.setZoom(5);
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error('[TripResultMap] Places resolution failed:', err);

          if (msg.includes('403') || msg.includes('REQUEST_DENIED')) {
            toast.error('Map Error: Please check API Key restrictions.');
          } else {
            toast.error('Map Error: Failed to load locations.');
          }

          // Fallback: still show map at default location
          map.setCenter(defaultCenter);
          map.setZoom(5);
        } finally {
          if (!cancelled) setIsResolvingPlaces(false);
        }
      };

      run();

      return () => {
        cancelled = true;
      };
    }, [activities, destination, destinationQuery, findPlaceLatLng, isLoaded]);

    if (loadError) {
      return (
        <div className="w-full h-full bg-card/50 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Unable to load map</p>
            <p className="text-xs mt-1">Check API key configuration</p>
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
      <div ref={forwardedRef} className="relative w-full h-full">
        <TooltipProvider delayDuration={150}>
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={mapCenter}
            zoom={12}
            options={mapOptions}
            onLoad={onMapLoad}
          >
            {/* Main destination marker */}
            {mainPin && (
              <Marker
                position={mainPin}
                title={destination}
                icon={mainMarkerIcon}
                zIndex={1000}
              />
            )}

            {/* Activity markers with proper div wrapper for TooltipTrigger */}
            {activityPins.map((pin) => (
              <OverlayView
                key={pin.index}
                position={pin.position}
                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    {/* CRITICAL: Wrap in div to accept ref from TooltipTrigger */}
                    <div
                      className="cursor-pointer rounded-full shadow-lg hover:scale-110 transition-transform"
                      style={{
                        width: 16,
                        height: 16,
                        background: activityDotFill,
                        border: `2px solid ${activityDotStroke}`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      aria-label={pin.name}
                      role="button"
                      tabIndex={0}
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

        {/* Loading overlay */}
        {isResolvingPlaces && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Locating places...</p>
            </div>
          </div>
        )}

        {/* Pin count indicator */}
        {activityPins.length > 0 && !isResolvingPlaces && (
          <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-full bg-background/90 backdrop-blur-sm border border-border text-xs font-medium text-foreground">
            {activityPins.length} location{activityPins.length !== 1 ? 's' : ''} pinned
          </div>
        )}
      </div>
    );
  }
);

TripResultMap.displayName = 'TripResultMap';

export default TripResultMap;
