import { useState, useEffect, useRef, useCallback } from 'react';
import { GpsTelemetry, TripStatus, GpsSignalQuality, TripSession } from '../types/instrument';

// Haversine distance in km
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate true compass bearing between two GPS points
function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);
  return ((θ * 180) / Math.PI + 360) % 360;
}

// Calculate dynamic satellite constellation lock based on real GPS accuracy
function estimateSatellites(accuracy: number | null): number {
  if (accuracy == null || accuracy <= 0) return 0;
  if (accuracy <= 3) return 16;
  if (accuracy <= 5) return 14;
  if (accuracy <= 8) return 12;
  if (accuracy <= 12) return 10;
  if (accuracy <= 20) return 8;
  if (accuracy <= 35) return 6;
  if (accuracy <= 60) return 4;
  return 3;
}

const STORAGE_KEY_SESSIONS = 'clio_gps_trip_history_v1';

const INITIAL_SESSIONS: TripSession[] = [
  {
    id: 'trip-1725103400',
    startTime: Date.now() - 86400000 * 2 - 3600000,
    endTime: Date.now() - 86400000 * 2,
    distanceKm: 42.7,
    maxSpeedKmh: 128,
    durationSec: 2912, // ~48m 32s
    avgSpeedKmh: 52.8,
  },
  {
    id: 'trip-1725189800',
    startTime: Date.now() - 86400000 - 1800000,
    endTime: Date.now() - 86400000,
    distanceKm: 19.4,
    maxSpeedKmh: 94,
    durationSec: 1420,
    avgSpeedKmh: 49.2,
  },
];

export function useGpsTracker() {
  const [isSimulated, setIsSimulated] = useState<boolean>(false);
  const [tripStatus, setTripStatus] = useState<TripStatus>('IDLE');
  const [signalQuality, setSignalQuality] = useState<GpsSignalQuality>('SEARCHING');
  
  const [telemetry, setTelemetry] = useState<GpsTelemetry>({
    speed: 0,
    rawSpeed: 0,
    maxSpeed: 0,
    distanceKm: 0,
    tripSeconds: 0,
    altitude: null,
    heading: null,
    accuracy: null,
    latitude: null,
    longitude: null,
    satellites: 0,
    batteryLevel: null,
    isCharging: false,
  });

  const [history, setHistory] = useState<TripSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SESSIONS);
      if (saved !== null) return JSON.parse(saved);
    } catch {
      // Ignored
    }
    return [];
  });

  // Inertia and smoothing refs
  const targetSpeedRef = useRef<number>(0);
  const smoothedSpeedRef = useRef<number>(0);
  const prevPositionRef = useRef<{ lat: number; lng: number; time: number } | null>(null);
  const tripStartTimeRef = useRef<number | null>(null);
  const tripAccumulatedDistanceRef = useRef<number>(0);
  const tripMaxSpeedRef = useRef<number>(0);
  const lastCompletedTripRef = useRef<TripSession | null>(null);

  // Simulation physics state
  const simPhaseRef = useRef<{
    t: number;
    baseSpeed: number;
    targetSpeed: number;
    heading: number;
    altitude: number;
  }>({
    t: 0,
    baseSpeed: 0,
    targetSpeed: 0,
    heading: 248,
    altitude: 742,
  });

  // Battery status tracking
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'getBattery' in (navigator as any)) {
      (navigator as any).getBattery().then((battery: any) => {
        const updateBattery = () => {
          setTelemetry((prev) => ({
            ...prev,
            batteryLevel: Math.round(battery.level * 100),
            isCharging: battery.charging,
          }));
        };
        updateBattery();
        battery.addEventListener('levelchange', updateBattery);
        battery.addEventListener('chargingchange', updateBattery);
      }).catch(() => {});
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(history));
    } catch {
      // Ignored
    }
  }, [history]);

  // Trip timer when active
  useEffect(() => {
    if (tripStatus !== 'ACTIVE') return;

    const timer = setInterval(() => {
      setTelemetry((prev) => ({
        ...prev,
        tripSeconds: prev.tripSeconds + 1,
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, [tripStatus]);

  // Animation frame for smooth needle & speed readout with automotive physical inertia
  useEffect(() => {
    let animationFrameId: number;

    const updatePhysics = () => {
      const target = targetSpeedRef.current;
      const current = smoothedSpeedRef.current;
      
      // Automotive mechanical gauge damping: lerp factor ~0.12 gives smooth, responsive needle response without overshoot
      const diff = target - current;
      if (Math.abs(diff) < 0.05) {
        smoothedSpeedRef.current = target;
      } else {
        smoothedSpeedRef.current += diff * 0.12;
      }

      setTelemetry((prev) => {
        // Avoid re-renders if unchanged
        if (Math.abs(prev.speed - smoothedSpeedRef.current) < 0.05) {
          return prev;
        }
        return {
          ...prev,
          speed: smoothedSpeedRef.current,
        };
      });

      animationFrameId = requestAnimationFrame(updatePhysics);
    };

    animationFrameId = requestAnimationFrame(updatePhysics);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Hardware Compass / DeviceOrientation for real-time heading when stationary or on iOS
  useEffect(() => {
    if (isSimulated) return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      let compassHeading: number | null = null;
      // iOS WebKit compass heading (iPhone SE 3)
      if ('webkitCompassHeading' in e && typeof (e as any).webkitCompassHeading === 'number') {
        compassHeading = (e as any).webkitCompassHeading;
      } else if (e.alpha != null) {
        compassHeading = (360 - e.alpha) % 360;
      }

      if (compassHeading != null && !isNaN(compassHeading)) {
        const rounded = Math.round(compassHeading);
        setTelemetry((prev) => {
          // If moving very slowly or GPS heading is not locked, update with hardware compass
          if (prev.rawSpeed < 3 || prev.heading == null) {
            return { ...prev, heading: rounded };
          }
          return prev;
        });
      }
    };

    window.addEventListener('deviceorientation', handleOrientation, true);
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, [isSimulated]);

  // Real GPS Geolocation Watcher
  useEffect(() => {
    if (isSimulated) return;

    if (!('geolocation' in navigator)) {
      setSignalQuality('UNAVAILABLE');
      return;
    }

    setSignalQuality('SEARCHING');

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, speed, altitude, heading, accuracy } = pos.coords;
        const now = pos.timestamp || Date.now();

        // Convert speed (m/s) to km/h, default to 0 if negative/null
        let calculatedSpeedKmh = speed != null && speed >= 0 ? speed * 3.6 : 0;

        // If speed is not provided by GPS hardware, estimate from coordinate delta
        if (speed == null && prevPositionRef.current) {
          const deltaDistanceKm = calculateDistanceKm(
            prevPositionRef.current.lat,
            prevPositionRef.current.lng,
            latitude,
            longitude
          );
          const deltaTimeHours = (now - prevPositionRef.current.time) / 3600000;
          if (deltaTimeHours > 0 && deltaTimeHours < 0.01) {
            calculatedSpeedKmh = Math.min(220, deltaDistanceKm / deltaTimeHours);
          }
        }

        // Apply speed deadband under 1.5 km/h to prevent GPS jitter while stationary
        if (calculatedSpeedKmh < 1.5) {
          calculatedSpeedKmh = 0;
        }

        targetSpeedRef.current = Math.min(200, Math.max(0, calculatedSpeedKmh));

        // Signal classification
        if (accuracy <= 10) {
          setSignalQuality('LOCKED_HIGH');
        } else if (accuracy <= 30) {
          setSignalQuality('LOCKED_MED');
        } else {
          setSignalQuality('SEARCHING');
        }

        // Distance accumulation during active trip
        if (tripStatus === 'ACTIVE') {
          if (prevPositionRef.current) {
            const distIncrement = calculateDistanceKm(
              prevPositionRef.current.lat,
              prevPositionRef.current.lng,
              latitude,
              longitude
            );
            // Ignore crazy GPS jumps > 0.5 km in < 2 sec
            if (distIncrement < 0.5) {
              tripAccumulatedDistanceRef.current += distIncrement;
            }
          }

          if (calculatedSpeedKmh > tripMaxSpeedRef.current) {
            tripMaxSpeedRef.current = calculatedSpeedKmh;
          }
        }

        // Calculate dynamic real-time heading from GPS bearing if heading is null
        let resolvedHeading: number | null = null;
        if (heading != null && !isNaN(heading)) {
          resolvedHeading = Math.round(heading);
        } else if (prevPositionRef.current && calculatedSpeedKmh > 2) {
          resolvedHeading = Math.round(
            calculateBearing(
              prevPositionRef.current.lat,
              prevPositionRef.current.lng,
              latitude,
              longitude
            )
          );
        }

        const resolvedAltitude = altitude != null && !isNaN(altitude) ? Math.round(altitude) : null;
        const resolvedAccuracy = accuracy != null && !isNaN(accuracy) ? Math.round(accuracy) : null;
        const resolvedSatellites = estimateSatellites(resolvedAccuracy);

        prevPositionRef.current = { lat: latitude, lng: longitude, time: now };

        setTelemetry((prev) => ({
          ...prev,
          rawSpeed: calculatedSpeedKmh,
          maxSpeed: tripStatus === 'ACTIVE' ? tripMaxSpeedRef.current : prev.maxSpeed,
          distanceKm: tripStatus === 'ACTIVE' ? tripAccumulatedDistanceRef.current : prev.distanceKm,
          altitude: resolvedAltitude !== null ? resolvedAltitude : prev.altitude,
          heading: resolvedHeading !== null ? resolvedHeading : prev.heading,
          accuracy: resolvedAccuracy,
          latitude,
          longitude,
          satellites: resolvedSatellites,
        }));
      },
      (_err) => {
        setSignalQuality('UNAVAILABLE');
        setTelemetry((prev) => ({
          ...prev,
          accuracy: null,
          satellites: 0,
        }));
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 10000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [isSimulated, tripStatus]);

  // Dynamic Drive Simulation Engine for testing & immediate desktop/mobile showcase
  useEffect(() => {
    if (!isSimulated) return;

    setSignalQuality('SIMULATED');

    const interval = setInterval(() => {
      const sim = simPhaseRef.current;
      sim.t += 0.5;

      // Realistic highway drive profile: launch -> acceleration -> highway cruise at 90-135 km/h -> slowing down -> turns
      const cycle = sim.t % 90; // 90 seconds loop
      let target = 0;

      if (cycle < 10) {
        // Smooth launch 0 to 45 km/h
        target = (cycle / 10) * 45;
      } else if (cycle < 25) {
        // Accelerate up to 97 km/h
        target = 45 + ((cycle - 10) / 15) * 52;
      } else if (cycle < 45) {
        // Highway cruise 97 km/h to 128 km/h with subtle road variations
        target = 105 + Math.sin(sim.t * 0.3) * 12 + Math.cos(sim.t * 0.1) * 6;
      } else if (cycle < 55) {
        // Overtake / peak speed up to 138 km/h
        target = 125 + ((cycle - 45) / 10) * 13;
      } else if (cycle < 70) {
        // Deceleration down to 50 km/h (curve / roundabout)
        target = 138 - ((cycle - 55) / 15) * 88;
      } else if (cycle < 85) {
        // City driving 40-60 km/h
        target = 50 + Math.sin(sim.t * 0.4) * 10;
      } else {
        // Slow to stop
        target = Math.max(0, 40 - ((cycle - 85) / 5) * 40);
      }

      targetSpeedRef.current = Math.min(140, Math.max(0, target));

      // Dynamic heading and altitude changes in real-time
      sim.heading = (sim.heading + (target > 30 ? 0.8 : 0.2)) % 360;
      sim.altitude = 650 + Math.sin(sim.t * 0.08) * 60 + Math.cos(sim.t * 0.02) * 30;

      // Realistic accuracy & satellite fluctuation in real-time
      const simAccuracy = Math.round(3 + Math.sin(sim.t * 0.2) * 2 + 1); // 3m to 6m
      const simSatellites = Math.round(14 + Math.cos(sim.t * 0.15) * 2); // 12 to 16 satellites

      // Distance increment (speed * time in hours)
      const currentSpeed = targetSpeedRef.current;
      const speedInKmh = currentSpeed;
      const hoursPassed = 0.5 / 3600;
      const distDelta = speedInKmh * hoursPassed;

      if (tripStatus === 'ACTIVE') {
        tripAccumulatedDistanceRef.current += distDelta;
        if (currentSpeed > tripMaxSpeedRef.current) {
          tripMaxSpeedRef.current = currentSpeed;
        }
      }

      setTelemetry((prev) => ({
        ...prev,
        rawSpeed: currentSpeed,
        maxSpeed: tripStatus === 'ACTIVE' ? tripMaxSpeedRef.current : prev.maxSpeed,
        distanceKm: tripStatus === 'ACTIVE' ? tripAccumulatedDistanceRef.current : prev.distanceKm,
        altitude: Math.round(sim.altitude),
        heading: Math.round(sim.heading),
        accuracy: simAccuracy,
        satellites: simSatellites,
      }));
    }, 500);

    return () => clearInterval(interval);
  }, [isSimulated, tripStatus]);

  // Trip Start
  const startTrip = useCallback(() => {
    tripStartTimeRef.current = Date.now();
    tripAccumulatedDistanceRef.current = 0;
    tripMaxSpeedRef.current = targetSpeedRef.current || 0;

    setTelemetry((prev) => ({
      ...prev,
      distanceKm: 0,
      tripSeconds: 0,
      maxSpeed: targetSpeedRef.current || 0,
    }));

    setTripStatus('ACTIVE');
  }, []);

  // Trip Finalize
  const endTrip = useCallback(() => {
    if (tripStatus !== 'ACTIVE') return null;

    const endTime = Date.now();
    const startTime = tripStartTimeRef.current || (endTime - telemetry.tripSeconds * 1000);
    const duration = telemetry.tripSeconds;
    const distance = Number(tripAccumulatedDistanceRef.current.toFixed(2));
    const maxSpeed = Number(tripMaxSpeedRef.current.toFixed(1));
    const avgSpeed = duration > 0 ? Number(((distance / (duration / 3600))).toFixed(1)) : 0;

    const newSession: TripSession = {
      id: `trip-${Date.now()}`,
      startTime,
      endTime,
      distanceKm: distance,
      maxSpeedKmh: maxSpeed,
      durationSec: duration,
      avgSpeedKmh: avgSpeed,
      startCoords: telemetry.latitude && telemetry.longitude ? { lat: telemetry.latitude, lng: telemetry.longitude } : undefined,
    };

    lastCompletedTripRef.current = newSession;

    setHistory((prev) => {
      const updated = [newSession, ...prev];
      try {
        localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(updated));
      } catch {
        // Ignored
      }
      return updated;
    });
    setTripStatus('IDLE');

    return newSession;
  }, [tripStatus, telemetry.tripSeconds, telemetry.latitude, telemetry.longitude]);

  // Delete individual session
  const deleteTripSession = useCallback((sessionId: string) => {
    setHistory((prev) => {
      const updated = prev.filter((s) => s.id !== sessionId);
      try {
        localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(updated));
      } catch {
        // Ignored
      }
      return updated;
    });
  }, []);

  // Clear trip history permanently
  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify([]));
    } catch {
      // Ignored
    }
  }, []);

  return {
    telemetry,
    tripStatus,
    signalQuality,
    isSimulated,
    setIsSimulated,
    history,
    startTrip,
    endTrip,
    deleteTripSession,
    clearHistory,
  };
}
