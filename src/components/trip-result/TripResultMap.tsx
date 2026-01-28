import { useEffect, useState } from 'react';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { MapPin, Navigation } from 'lucide-react';
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
  const [selectedActivity, setSelectedActivity] = useState<TripActivity | null>(null);
  
  const { isLoaded, loadError } = useGoogleMaps();

  useEffect(() => {
    // Geocode the destination to center the map
    if (isLoaded && destination) {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address: destination }, (results, status) => {
        if (status === 'OK' && results?.[0]) {
          setCenter({
            lat: results[0].geometry.location.lat(),
            lng: results[0].geometry.location.lng(),
          });
        }
      });
    }
  }, [isLoaded, destination]);

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

  const getMarkerIcon = (type: string, index: number) => {
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

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={12}
      options={mapOptions}
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

      {/* Activity markers - these would need geocoding for real coordinates */}
      {activities.map((activity, index) => {
        // For demo, offset markers around center
        const offset = {
          lat: center.lat + (Math.random() - 0.5) * 0.05,
          lng: center.lng + (Math.random() - 0.5) * 0.05,
        };

        return (
          <Marker
            key={index}
            position={offset}
            icon={getMarkerIcon(activity.type, index)}
            onClick={() => setSelectedActivity(activity)}
            label={{
              text: String(index + 1),
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: 'bold',
            }}
          />
        );
      })}

      {/* Info Window */}
      {selectedActivity && (
        <InfoWindow
          position={center}
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
  );
};

export default TripResultMap;
