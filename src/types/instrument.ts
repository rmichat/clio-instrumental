export interface GpsTelemetry {
  speed: number;          // km/h (current smoothed)
  rawSpeed: number;       // km/h (from GPS or sim)
  maxSpeed: number;       // km/h
  distanceKm: number;     // km
  tripSeconds: number;    // seconds
  altitude: number | null; // meters
  heading: number | null;  // degrees (0-360)
  accuracy: number | null; // meters
  latitude: number | null;
  longitude: number | null;
  satellites: number;
  batteryLevel: number | null; // 0 to 100
  isCharging: boolean;
}

export type TripStatus = 'IDLE' | 'ACTIVE' | 'PAUSED';

export type GpsSignalQuality = 'SEARCHING' | 'LOCKED_HIGH' | 'LOCKED_MED' | 'UNAVAILABLE' | 'SIMULATED';

export interface TripSession {
  id: string;
  startTime: number;
  endTime: number;
  distanceKm: number;
  maxSpeedKmh: number;
  durationSec: number;
  avgSpeedKmh: number;
  startCoords?: { lat: number; lng: number };
  endCoords?: { lat: number; lng: number };
}
