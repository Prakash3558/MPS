import { useState, useEffect, useRef, useCallback } from 'react';
import {
  LatLng,
  haversineDistanceMeters,
  calculateBearing,
  snapPointToPolyline
} from './roadRoutingService';

export interface GpsTelemetryState {
  coords: LatLng;
  snappedCoords: LatLng;
  speed: number; // km/h
  heading: number; // 0..360 degrees
  accuracy: number; // meters
  altitude: number | null;
  status: 'idle' | 'searching' | 'locked' | 'poor_signal' | 'denied' | 'simulating';
  errorMessage: string | null;
  lastUpdated: number; // timestamp
  isStationary: boolean;
  distanceTraveledMeters: number;
}

interface UseDriverGpsTrackerOptions {
  enabled: boolean;
  isSimulating: boolean;
  roadPolyline: [number, number][]; // Snap-to-road polyline
  snapToRoadThresholdMeters?: number; // default 40m
  onPositionUpdate?: (telemetry: GpsTelemetryState) => void;
}

export function useDriverGpsTracker({
  enabled,
  isSimulating,
  roadPolyline,
  snapToRoadThresholdMeters = 40,
  onPositionUpdate
}: UseDriverGpsTrackerOptions) {
  // Primary Telemetry State
  const [telemetry, setTelemetry] = useState<GpsTelemetryState>({
    coords: { lat: 27.0250, lng: 84.6812 },
    snappedCoords: { lat: 27.0250, lng: 84.6812 },
    speed: 0,
    heading: 45,
    accuracy: 5,
    altitude: null,
    status: 'idle',
    errorMessage: null,
    lastUpdated: Date.now(),
    isStationary: true,
    distanceTraveledMeters: 0
  });

  // Smoothing & Jitter Filter Refs
  const watchIdRef = useRef<number | null>(null);
  const lastRawPosRef = useRef<LatLng | null>(null);
  const lastAcceptedPosRef = useRef<LatLng | null>(null);
  const lastTimestampRef = useRef<number>(Date.now());
  const smoothedHeadingRef = useRef<number>(45);
  const speedHistoryRef = useRef<number[]>([]);
  const simIndexRef = useRef<number>(0);
  const totalDistanceRef = useRef<number>(0);

  // Angular difference helper for smooth heading rotation (prevents 359 -> 1 jitter)
  const smoothAngle = (current: number, target: number, weight = 0.35): number => {
    let diff = (target - current) % 360;
    if (diff < -180) diff += 360;
    if (diff > 180) diff -= 360;
    return (current + diff * weight + 360) % 360;
  };

  // Process a raw GPS coordinate with jitter filtering and road snapping
  const processGpsFix = useCallback(
    (rawLat: number, rawLng: number, rawSpeed: number | null, rawHeading: number | null, accuracy: number, altitude: number | null) => {
      const now = Date.now();
      const timeDeltaSeconds = Math.max(0.5, (now - lastTimestampRef.current) / 1000);
      lastTimestampRef.current = now;

      const rawPoint: LatLng = { lat: rawLat, lng: rawLng };

      // 1. Accuracy Spike Filter
      // Accept network and GPS fixes (up to 2500m for cellular/Wi-Fi positioning)
      if (accuracy > 2500 && lastAcceptedPosRef.current !== null) {
        setTelemetry((prev) => ({
          ...prev,
          status: 'poor_signal',
          accuracy,
          errorMessage: `GPS Signal Degraded (±${Math.round(accuracy)}m accuracy)`
        }));
        return;
      }

      // 2. Stationary Jitter Filter
      let distMoved = 0;
      if (lastAcceptedPosRef.current) {
        distMoved = haversineDistanceMeters(
          lastAcceptedPosRef.current.lat,
          lastAcceptedPosRef.current.lng,
          rawLat,
          rawLng
        );
      }

      // If moved less than 4.5 meters in stationary state, ignore micro-drift
      const isStationary = distMoved < 4.5 && (rawSpeed === null || rawSpeed < 1.0);
      let targetHeading = smoothedHeadingRef.current;
      let calculatedSpeed = 0;

      if (!isStationary && distMoved >= 4.5 && lastAcceptedPosRef.current) {
        // Calculate bearing between fixes if device heading is not provided
        if (rawHeading !== null && !isNaN(rawHeading) && rawHeading >= 0) {
          targetHeading = rawHeading;
        } else {
          targetHeading = calculateBearing(
            lastAcceptedPosRef.current.lat,
            lastAcceptedPosRef.current.lng,
            rawLat,
            rawLng
          );
        }

        // Calculate speed (km/h)
        if (rawSpeed !== null && !isNaN(rawSpeed) && rawSpeed >= 0) {
          calculatedSpeed = Math.round(rawSpeed * 3.6); // m/s to km/h
        } else {
          calculatedSpeed = Math.round((distMoved / timeDeltaSeconds) * 3.6);
        }

        // Cap unrealistically high spikes (> 80 km/h in school zone)
        calculatedSpeed = Math.min(65, Math.max(0, calculatedSpeed));

        // Update total distance
        totalDistanceRef.current += distMoved;
        lastAcceptedPosRef.current = rawPoint;
      } else if (lastAcceptedPosRef.current === null) {
        lastAcceptedPosRef.current = rawPoint;
      }

      // Smooth heading
      smoothedHeadingRef.current = smoothAngle(smoothedHeadingRef.current, targetHeading, 0.4);

      // Smooth speed with rolling window
      speedHistoryRef.current.push(calculatedSpeed);
      if (speedHistoryRef.current.length > 4) speedHistoryRef.current.shift();
      const avgSpeed = Math.round(
        speedHistoryRef.current.reduce((a, b) => a + b, 0) / speedHistoryRef.current.length
      );

      // 3. Snap to Road Polyline
      let snappedPoint = rawPoint;
      if (roadPolyline && roadPolyline.length >= 2) {
        const snap = snapPointToPolyline(rawPoint, roadPolyline);
        if (snap.distanceToRoadMeters <= snapToRoadThresholdMeters) {
          snappedPoint = snap.snappedPoint;
        }
      }

      const nextTelemetry: GpsTelemetryState = {
        coords: rawPoint,
        snappedCoords: snappedPoint,
        speed: avgSpeed,
        heading: Math.round(smoothedHeadingRef.current),
        accuracy: Math.round(accuracy),
        altitude,
        status: accuracy <= 25 ? 'locked' : 'poor_signal',
        errorMessage: null,
        lastUpdated: now,
        isStationary,
        distanceTraveledMeters: Math.round(totalDistanceRef.current)
      };

      setTelemetry(nextTelemetry);
      onPositionUpdate?.(nextTelemetry);
    },
    [roadPolyline, snapToRoadThresholdMeters, onPositionUpdate]
  );

  // Setup Continuous Mobile Geolocation Watcher
  useEffect(() => {
    if (!enabled || isSimulating) {
      if (watchIdRef.current !== null) {
        navigator.geolocation?.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    if (!('geolocation' in navigator)) {
      setTelemetry((prev) => ({
        ...prev,
        status: 'denied',
        errorMessage: 'Geolocation is not supported by this browser.'
      }));
      return;
    }

    setTelemetry((prev) => ({ ...prev, status: 'searching' }));

    const successCallback: PositionCallback = (pos) => {
      processGpsFix(
        pos.coords.latitude,
        pos.coords.longitude,
        pos.coords.speed,
        pos.coords.heading,
        pos.coords.accuracy,
        pos.coords.altitude
      );
    };

    const startWatcher = (highAccuracy: boolean) => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }

      watchIdRef.current = navigator.geolocation.watchPosition(
        successCallback,
        (err) => {
          if (highAccuracy && (err.code === err.TIMEOUT || err.code === err.POSITION_UNAVAILABLE)) {
            // High accuracy GPS unavailable or timed out; fall back to standard/network positioning
            startWatcher(false);
            return;
          }

          let msg = 'Failed to acquire GPS signal';
          if (err.code === err.PERMISSION_DENIED) {
            msg = 'Location permission denied. Please allow location in browser settings.';
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            msg = 'GPS signal unavailable. Please ensure device location is turned ON.';
          } else if (err.code === err.TIMEOUT) {
            msg = 'GPS acquisition timed out. Re-acquiring lock...';
          }

          setTelemetry((prev) => ({
            ...prev,
            status: err.code === err.PERMISSION_DENIED ? 'denied' : 'poor_signal',
            errorMessage: msg
          }));
        },
        {
          enableHighAccuracy: highAccuracy,
          timeout: highAccuracy ? 8000 : 15000,
          maximumAge: highAccuracy ? 1000 : 30000
        }
      );
    };

    // Immediate initial fix with fallback
    navigator.geolocation.getCurrentPosition(
      successCallback,
      () => {
        navigator.geolocation.getCurrentPosition(
          successCallback,
          () => startWatcher(false),
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
    );

    startWatcher(true);

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [enabled, isSimulating, processGpsFix]);

  // Road Network Simulator (Follows real road coordinates point-by-point, NO direct cuts)
  useEffect(() => {
    if (!enabled || !isSimulating || !roadPolyline || roadPolyline.length < 2) return;

    setTelemetry((prev) => ({ ...prev, status: 'simulating', errorMessage: null }));

    const interval = setInterval(() => {
      simIndexRef.current = (simIndexRef.current + 1) % roadPolyline.length;
      const curr = roadPolyline[simIndexRef.current];
      const prev = roadPolyline[(simIndexRef.current - 1 + roadPolyline.length) % roadPolyline.length];

      // Calculate bearing along road segment
      const bearing = calculateBearing(prev[0], prev[1], curr[0], curr[1]);
      smoothedHeadingRef.current = smoothAngle(smoothedHeadingRef.current, bearing, 0.5);

      const simSpeed = Math.floor(24 + Math.random() * 12);
      const point: LatLng = { lat: curr[0], lng: curr[1] };

      const nextTelemetry: GpsTelemetryState = {
        coords: point,
        snappedCoords: point,
        speed: simSpeed,
        heading: Math.round(smoothedHeadingRef.current),
        accuracy: 3,
        altitude: 82,
        status: 'simulating',
        errorMessage: null,
        lastUpdated: Date.now(),
        isStationary: false,
        distanceTraveledMeters: totalDistanceRef.current += 30
      };

      setTelemetry(nextTelemetry);
      onPositionUpdate?.(nextTelemetry);
    }, 2800);

    return () => clearInterval(interval);
  }, [enabled, isSimulating, roadPolyline, onPositionUpdate]);

  return {
    telemetry,
    resetDistance: () => {
      totalDistanceRef.current = 0;
      setTelemetry((prev) => ({ ...prev, distanceTraveledMeters: 0 }));
    }
  };
}
