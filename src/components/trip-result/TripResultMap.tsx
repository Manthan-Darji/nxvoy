import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GoogleMap } from '@react-google-maps/api';
import { Loader2, MapPin, Navigation } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
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

const defaultCenter = { lat: 20.5937, lng: 78.9629 };

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
  fullscreenControl: false,
  styles: darkModeStyles,
};

const TripResultMap = React.forwardRef<HTMLDivElement, TripResultMapProps>(
  ({ activities, destination }, forwardedRef) => {
    const { isLoaded, loadError } = useGoogleMaps();
    const mapRef = useRef<google.maps.Map | null>(null);
    const markersRef = useRef<google.maps.Marker[]>([]);
    
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [geocodeError, setGeocodeError] = useState<string | null>(null);

    const onMapLoad = useCallback((map: google.maps.Map) => {
      mapRef.current = map;
      console.log('🗺️ Map loaded successfully');
    }, []);

    // Clear all existing markers
    const clearMarkers = useCallback(() => {
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    }, []);

    // Main geocoding effect - runs when map or destination changes
    useEffect(() => {
      const map = mapRef.current;
      if (!map || !destination || !isLoaded) return;

      const trimmedDestination = destination.trim();
      if (!trimmedDestination) return;

      console.log('🔍 Starting geocode for:', trimmedDestination);
      setIsGeocoding(true);
      setGeocodeError(null);
      clearMarkers();

      const geocoder = new google.maps.Geocoder();
      const bounds = new google.maps.LatLngBounds();

      // Step 1: Geocode the main destination
      const searchQuery = trimmedDestination.includes(',') 
        ? trimmedDestination 
        : `${trimmedDestination}, India`;

      geocoder.geocode({ address: searchQuery }, (results, status) => {
        console.log('📍 Geocode result:', status, results?.[0]?.formatted_address);

        if (status === 'OK' && results?.[0]) {
          const location = results[0].geometry.location;
          
          // 1. Center and zoom the map
          map.setCenter(location);
          map.setZoom(12); // FORCE ZOOM IN
          
          // 2. Drop the main destination pin with animation
          const mainMarker = new google.maps.Marker({
            position: location,
            map: map,
            title: trimmedDestination,
            animation: google.maps.Animation.DROP,
            icon: {
              url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
              scaledSize: new google.maps.Size(40, 40),
            },
            zIndex: 1000,
          });
          
          markersRef.current.push(mainMarker);
          bounds.extend(location);
          
          console.log('📍 Main pin dropped at:', location.toString());
          toast.success(`Found: ${results[0].formatted_address}`);

          // Step 2: Geocode activity locations
          if (activities && activities.length > 0) {
            let completedCount = 0;
            const totalActivities = activities.length;

            activities.forEach((activity, index) => {
              const locationName = activity.location_name?.trim();
              if (!locationName) {
                completedCount++;
                return;
              }

              // Add destination context for better results
              const activityQuery = `${locationName}, ${searchQuery}`;
              
              geocoder.geocode({ address: activityQuery }, (actResults, actStatus) => {
                completedCount++;

                if (actStatus === 'OK' && actResults?.[0]) {
                  const actLocation = actResults[0].geometry.location;
                  
                  // Create activity marker (blue dot)
                  const activityMarker = new google.maps.Marker({
                    position: actLocation,
                    map: map,
                    title: activity.activity || locationName,
                    icon: {
                      path: google.maps.SymbolPath.CIRCLE,
                      scale: 8,
                      fillColor: '#3b82f6',
                      fillOpacity: 1,
                      strokeColor: '#ffffff',
                      strokeWeight: 2,
                    },
                    zIndex: 500 + index,
                  });
                  
                  markersRef.current.push(activityMarker);
                  bounds.extend(actLocation);
                  
                  console.log(`✓ Activity ${index + 1} pinned:`, locationName);
                } else {
                  console.warn(`✗ Activity ${index + 1} not found:`, locationName, actStatus);
                }

                // When all activities are processed, fit bounds
                if (completedCount === totalActivities) {
                  if (markersRef.current.length > 1) {
                    map.fitBounds(bounds, { top: 30, bottom: 30, left: 30, right: 30 });
                    console.log('🗺️ Fitted bounds for', markersRef.current.length, 'markers');
                  }
                  setIsGeocoding(false);
                }
              });
            });

            // Fallback if no activities have locations
            if (totalActivities === 0) {
              setIsGeocoding(false);
            }
          } else {
            setIsGeocoding(false);
          }
          
        } else {
          // LOUD ERROR - This is critical feedback
          const errorMsg = `Map Error: Google returned ${status}. Check API Key restrictions.`;
          console.error('❌ Geocode failed:', status);
          toast.error(errorMsg);
          setGeocodeError(status);
          setIsGeocoding(false);
          
          // Still show map at default location
          map.setCenter(defaultCenter);
          map.setZoom(5);
        }
      });

      // Cleanup
      return () => {
        clearMarkers();
      };
    }, [isLoaded, destination, activities, clearMarkers]);

    if (loadError) {
      return (
        <div className="w-full h-full bg-card flex items-center justify-center">
          <div className="text-center text-muted-foreground p-6">
            <MapPin className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Unable to load map</p>
            <p className="text-xs mt-1">Check your internet connection</p>
          </div>
        </div>
      );
    }

    if (!isLoaded) {
      return (
        <div className="w-full h-full bg-card flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Navigation className="w-8 h-8 mx-auto mb-2 animate-pulse" />
            <p>Loading map...</p>
          </div>
        </div>
      );
    }

    return (
      <div ref={forwardedRef} className="relative w-full h-full">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={defaultCenter}
          zoom={5}
          options={mapOptions}
          onLoad={onMapLoad}
        />

        {/* Loading overlay */}
        {isGeocoding && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Finding locations...</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {geocodeError && !isGeocoding && (
          <div className="absolute bottom-3 left-3 right-3 p-2 rounded-lg bg-destructive/10 border border-destructive/30 text-xs text-destructive">
            ⚠️ Could not find "{destination}" - Status: {geocodeError}
          </div>
        )}

        {/* Success indicator */}
        {!isGeocoding && !geocodeError && markersRef.current.length > 0 && (
          <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-full bg-background/90 backdrop-blur-sm border border-border text-xs font-medium text-foreground">
            📍 {markersRef.current.length} location{markersRef.current.length !== 1 ? 's' : ''} found
          </div>
        )}
      </div>
    );
  }
);

TripResultMap.displayName = 'TripResultMap';

export default TripResultMap;
