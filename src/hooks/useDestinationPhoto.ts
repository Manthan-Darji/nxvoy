import { useState, useEffect, useRef } from 'react';
import { useGoogleMaps } from '@/context/GoogleMapsContext';

export const useDestinationPhoto = (destination: string | null | undefined) => {
  const { isLoaded } = useGoogleMaps();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // CRITICAL: Return immediately if destination is missing
    const destinationStr = destination?.trim() || '';
    if (!destinationStr) {
      setIsLoading(false);
      setPhotoUrl(null);
      return;
    }

    // CRITICAL: Return immediately if Google Maps is not loaded
    if (!isLoaded) {
      setIsLoading(false);
      return;
    }

    // Initialize PlacesService only once
    if (!placesServiceRef.current) {
      try {
        const div = document.createElement('div');
        placesServiceRef.current = new google.maps.places.PlacesService(div);
      } catch (error) {
        console.error('[useDestinationPhoto] Failed to initialize PlacesService:', error);
        setIsLoading(false);
        return;
      }
    }

    const service = placesServiceRef.current;
    setIsLoading(true);
    setPhotoUrl(null);

    // Safety timeout: Stop trying after 3 seconds
    timeoutRef.current = setTimeout(() => {
      console.warn('[useDestinationPhoto] Timeout after 3 seconds for:', destinationStr);
      setIsLoading(false);
    }, 3000);

    try {
      // Search for the destination place
      const request: google.maps.places.FindPlaceFromQueryRequest = {
        query: destinationStr,
        fields: ['photos', 'name', 'place_id'],
      };

      service.findPlaceFromQuery(request, (results, status) => {
        // Clear timeout since we got a response
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        setIsLoading(false);

        // Handle errors gracefully
        if (status !== google.maps.places.PlacesServiceStatus.OK) {
          console.warn(`[useDestinationPhoto] API error for "${destinationStr}":`, status);
          return;
        }

        if (!results || results.length === 0) {
          console.warn(`[useDestinationPhoto] No results found for "${destinationStr}"`);
          return;
        }

        const place = results[0];
        
        // Get the first photo if available
        if (place.photos && place.photos.length > 0) {
          try {
            const photo = place.photos[0];
            const url = photo.getUrl({
              maxWidth: 1920,
              maxHeight: 1080,
            });
            setPhotoUrl(url);
          } catch (error) {
            console.error('[useDestinationPhoto] Failed to get photo URL:', error);
          }
        }
      });
    } catch (error) {
      // CRITICAL: Catch any errors and ensure loading state is cleared
      console.error('[useDestinationPhoto] Error in API call:', error);
      setIsLoading(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isLoaded, destination]);

  return { photoUrl, isLoading };
};
