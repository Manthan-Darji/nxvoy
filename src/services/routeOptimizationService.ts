import { Activity } from '@/components/itinerary/ActivityCard';

interface Location {
  lat: number;
  lng: number;
  index: number;
  activity: Activity;
}

interface DistanceMatrixResult {
  distances: number[][]; // in meters
  durations: number[][]; // in seconds
}

interface OptimizationResult {
  originalOrder: Activity[];
  optimizedOrder: Activity[];
  originalTotalTime: number; // in minutes
  optimizedTotalTime: number; // in minutes
  timeSaved: number; // in minutes
  segmentDetails: {
    from: string;
    to: string;
    duration: number; // in minutes
    distance: number; // in km
  }[];
}

// Calculate distance between two points using Haversine formula (fallback)
const haversineDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Estimate travel time based on distance (assume 30 km/h average urban speed)
const estimateTravelTime = (distanceKm: number): number => {
  return (distanceKm / 30) * 60; // minutes
};

// Fetch distance matrix from Google Maps API
export const fetchDistanceMatrix = async (
  locations: Location[],
  apiKey: string
): Promise<DistanceMatrixResult> => {
  if (locations.length < 2) {
    return { distances: [], durations: [] };
  }

  const origins = locations.map(l => `${l.lat},${l.lng}`).join('|');
  const destinations = origins;

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?` +
      `origins=${encodeURIComponent(origins)}` +
      `&destinations=${encodeURIComponent(destinations)}` +
      `&mode=driving` +
      `&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error('Distance Matrix API request failed');
    }

    const data = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`Distance Matrix API error: ${data.status}`);
    }

    const n = locations.length;
    const distances: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
    const durations: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));

    data.rows.forEach((row: any, i: number) => {
      row.elements.forEach((element: any, j: number) => {
        if (element.status === 'OK') {
          distances[i][j] = element.distance.value;
          durations[i][j] = element.duration.value;
        }
      });
    });

    return { distances, durations };
  } catch (error) {
    console.warn('Distance Matrix API failed, using fallback calculation:', error);
    // Fallback to Haversine calculation
    return calculateFallbackMatrix(locations);
  }
};

// Fallback calculation using Haversine formula
const calculateFallbackMatrix = (locations: Location[]): DistanceMatrixResult => {
  const n = locations.length;
  const distances: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
  const durations: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        const distKm = haversineDistance(
          locations[i].lat, locations[i].lng,
          locations[j].lat, locations[j].lng
        );
        distances[i][j] = distKm * 1000; // Convert to meters
        durations[i][j] = estimateTravelTime(distKm) * 60; // Convert to seconds
      }
    }
  }

  return { distances, durations };
};

// Nearest Neighbor TSP Algorithm
const nearestNeighborTSP = (
  durations: number[][],
  startIndex: number = 0
): number[] => {
  const n = durations.length;
  if (n === 0) return [];
  if (n === 1) return [0];

  const visited = new Set<number>();
  const path: number[] = [startIndex];
  visited.add(startIndex);

  let current = startIndex;

  while (visited.size < n) {
    let nearestIndex = -1;
    let nearestDuration = Infinity;

    for (let i = 0; i < n; i++) {
      if (!visited.has(i) && durations[current][i] < nearestDuration) {
        nearestDuration = durations[current][i];
        nearestIndex = i;
      }
    }

    if (nearestIndex !== -1) {
      path.push(nearestIndex);
      visited.add(nearestIndex);
      current = nearestIndex;
    }
  }

  return path;
};

// 2-opt improvement for TSP
const twoOptImprovement = (
  path: number[],
  durations: number[][]
): number[] => {
  let improved = true;
  let bestPath = [...path];

  while (improved) {
    improved = false;
    for (let i = 0; i < bestPath.length - 2; i++) {
      for (let j = i + 2; j < bestPath.length; j++) {
        const newPath = twoOptSwap(bestPath, i, j);
        if (calculatePathDuration(newPath, durations) < calculatePathDuration(bestPath, durations)) {
          bestPath = newPath;
          improved = true;
        }
      }
    }
  }

  return bestPath;
};

const twoOptSwap = (path: number[], i: number, j: number): number[] => {
  const newPath = path.slice(0, i + 1);
  for (let k = j; k > i; k--) {
    newPath.push(path[k]);
  }
  for (let k = j + 1; k < path.length; k++) {
    newPath.push(path[k]);
  }
  return newPath;
};

const calculatePathDuration = (path: number[], durations: number[][]): number => {
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    total += durations[path[i]][path[i + 1]];
  }
  return total;
};

// Main optimization function
export const optimizeRoute = async (
  activities: Activity[],
  apiKey?: string
): Promise<OptimizationResult> => {
  // Filter activities with valid coordinates
  const locationsWithCoords: Location[] = activities
    .map((activity, index) => ({
      lat: activity.latitude ?? 0,
      lng: activity.longitude ?? 0,
      index,
      activity,
    }))
    .filter(loc => loc.lat !== 0 && loc.lng !== 0);

  if (locationsWithCoords.length < 2) {
    return {
      originalOrder: activities,
      optimizedOrder: activities,
      originalTotalTime: 0,
      optimizedTotalTime: 0,
      timeSaved: 0,
      segmentDetails: [],
    };
  }

  // Get distance matrix
  let matrixResult: DistanceMatrixResult;
  
  if (apiKey) {
    matrixResult = await fetchDistanceMatrix(locationsWithCoords, apiKey);
  } else {
    matrixResult = calculateFallbackMatrix(locationsWithCoords);
  }

  const { distances, durations } = matrixResult;

  // Calculate original route duration
  const originalPath = locationsWithCoords.map((_, i) => i);
  const originalDuration = calculatePathDuration(originalPath, durations);

  // Run TSP optimization
  let optimizedPath = nearestNeighborTSP(durations);
  optimizedPath = twoOptImprovement(optimizedPath, durations);
  const optimizedDuration = calculatePathDuration(optimizedPath, durations);

  // Build optimized activities list
  const optimizedActivities = optimizedPath.map(i => locationsWithCoords[i].activity);

  // Add activities without coordinates at their original positions
  const activitiesWithoutCoords = activities.filter(
    a => !a.latitude || !a.longitude || (a.latitude === 0 && a.longitude === 0)
  );

  // Calculate segment details for optimized route
  const segmentDetails = [];
  for (let i = 0; i < optimizedPath.length - 1; i++) {
    const fromIdx = optimizedPath[i];
    const toIdx = optimizedPath[i + 1];
    segmentDetails.push({
      from: locationsWithCoords[fromIdx].activity.title,
      to: locationsWithCoords[toIdx].activity.title,
      duration: Math.round(durations[fromIdx][toIdx] / 60), // Convert to minutes
      distance: Math.round(distances[fromIdx][toIdx] / 100) / 10, // Convert to km with 1 decimal
    });
  }

  return {
    originalOrder: activities,
    optimizedOrder: [...optimizedActivities, ...activitiesWithoutCoords],
    originalTotalTime: Math.round(originalDuration / 60),
    optimizedTotalTime: Math.round(optimizedDuration / 60),
    timeSaved: Math.round((originalDuration - optimizedDuration) / 60),
    segmentDetails,
  };
};

// Calculate total travel time for a set of activities
export const calculateTotalTravelTime = (activities: Activity[]): number => {
  const locationsWithCoords = activities
    .filter(a => a.latitude && a.longitude)
    .map(a => ({ lat: a.latitude!, lng: a.longitude! }));

  if (locationsWithCoords.length < 2) return 0;

  let totalMinutes = 0;
  for (let i = 0; i < locationsWithCoords.length - 1; i++) {
    const distKm = haversineDistance(
      locationsWithCoords[i].lat, locationsWithCoords[i].lng,
      locationsWithCoords[i + 1].lat, locationsWithCoords[i + 1].lng
    );
    totalMinutes += estimateTravelTime(distKm);
  }

  return Math.round(totalMinutes);
};
