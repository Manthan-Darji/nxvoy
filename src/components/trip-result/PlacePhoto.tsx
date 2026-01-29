import { useState, useEffect, useRef } from 'react';
import { useGoogleMaps } from '@/context/GoogleMapsContext';
import { Camera, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlacePhotoProps {
  locationName: string;
  className?: string;
  fallbackType?: 'transport' | 'food' | 'sightseeing' | 'stay' | 'activity';
}

const PlacePhoto = ({ locationName, className, fallbackType = 'sightseeing' }: PlacePhotoProps) => {
  const { isLoaded } = useGoogleMaps();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);

  useEffect(() => {
    if (!isLoaded || !locationName?.trim()) {
      setIsLoading(false);
      setHasError(true);
      return;
    }

    // Initialize PlacesService
    if (!placesServiceRef.current) {
      const div = document.createElement('div');
      placesServiceRef.current = new google.maps.places.PlacesService(div);
    }

    const service = placesServiceRef.current;
    setIsLoading(true);
    setHasError(false);
    setPhotoUrl(null);

    // Search for the place
    const request: google.maps.places.FindPlaceFromQueryRequest = {
      query: locationName,
      fields: ['photos', 'name', 'place_id'],
    };

    service.findPlaceFromQuery(request, (results, status) => {
      setIsLoading(false);

      if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
        const place = results[0];
        
        // Get the first photo if available
        if (place.photos && place.photos.length > 0) {
          const photo = place.photos[0];
          const url = photo.getUrl({
            maxWidth: 400,
            maxHeight: 300,
          });
          setPhotoUrl(url);
          setHasError(false);
        } else {
          setHasError(true);
        }
      } else {
        console.warn(`[PlacePhoto] Place not found for "${locationName}":`, status);
        setHasError(true);
      }
    });
  }, [isLoaded, locationName]);

  // Fallback gradient colors based on type
  const getFallbackGradient = () => {
    switch (fallbackType) {
      case 'transport':
        return 'bg-gradient-to-br from-blue-500/20 to-blue-600/30';
      case 'food':
        return 'bg-gradient-to-br from-orange-500/20 to-orange-600/30';
      case 'sightseeing':
        return 'bg-gradient-to-br from-purple-500/20 to-purple-600/30';
      case 'stay':
        return 'bg-gradient-to-br from-green-500/20 to-green-600/30';
      case 'activity':
        return 'bg-gradient-to-br from-pink-500/20 to-pink-600/30';
      default:
        return 'bg-gradient-to-br from-primary/20 to-primary/30';
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div
        className={cn(
          'w-full h-32 bg-muted animate-pulse',
          className
        )}
      />
    );
  }

  // Error/fallback state
  if (hasError || !photoUrl) {
    return (
      <div
        className={cn(
          'w-full h-32 flex items-center justify-center',
          getFallbackGradient(),
          className
        )}
      >
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          {fallbackType === 'sightseeing' ? (
            <Camera className="w-8 h-8 opacity-50" />
          ) : (
            <MapPin className="w-8 h-8 opacity-50" />
          )}
          <span className="text-xs opacity-70">No photo available</span>
        </div>
      </div>
    );
  }

  // Success state - show photo
  return (
    <img
      src={photoUrl}
      alt={locationName}
      className={cn(
        'w-full h-32 object-cover',
        className
      )}
      onError={() => {
        setHasError(true);
        setPhotoUrl(null);
      }}
    />
  );
};

export default PlacePhoto;
