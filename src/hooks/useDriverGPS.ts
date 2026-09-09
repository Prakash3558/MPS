import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { haversineDistanceMeters, snapPointToPolyline, LatLng } from '../lib/roadRoutingService';

export interface DriverGpsTelemetry {
  latitude: number;
  longitude: number;
  snappedLatitude: number;
  snappedLongitude: number;
  speed: number; // km/h
  heading: number; // 0..360 degrees
  accuracy: number; // meters
  altitude: number | null;
  status: 'idle' | 'searching' | 'locked' | 'poor_signal' | 'denied' | 'simulating';
  errorMessage: string | null;
  lastUpdated: number; // epoch timestamp
  isStationary: boolean;
  wakeLockActive: boolean;
  broadcastCount: number;
}

export interface UseDriverGpsOptions {
  busId: string;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  routeId: string;
  routeName?: string;
  tripType?: 'Morning Pickup' | 'Afternoon Drop' | 'Special Trip';
  enabled?: boolean;
  isSimulating?: boolean;
  roadPolyline?: [number, number][]; // Optional [lat, lng] array to snap fixes to real road geometry
  snapThresholdMeters?: number; // default 45m
  streamIntervalMs?: number; // DB throttle interval (3000ms = 3s)
  onTelemetry?: (telemetry: DriverGpsTelemetry) => void;
}

/**
 * Enterprise Driver GPS Tracking Hook for Mobile Drivers
 * - High-accuracy continuous watchPosition
 * - Screen WakeLock API to keep device screen awake while driving
 * - Low-latency Supabase Realtime broadcast (channel: 'bus-tracking')
 * - Throttled Database update every 3-5 seconds to live_locations table
 * - Road-snapping & heading bearing smoothing filter
 */
export function useDriverGPS({
  busId,
  driverId = 'driver-01',
  driverName = 'Rajesh Kumar Singh',
  driverPhone = '+91 98350 12456',
  routeId,
  routeName = 'Route 1: Sikta - Mainatand Express',
  tripType = 'Morning Pickup',
  enabled = true,
  isSimulating = false,
  roadPolyline = [],
  snapThresholdMeters = 45,
  streamIntervalMs = 3500,
  onTelemetry
}: UseDriverGpsOptions) {
  const [telemetry, setTelemetry] = useState<DriverGpsTelemetry>({
    latitude: 27.0250,
    longitude: 84.6812,
    snappedLatitude: 27.0250,
    snappedLongitude: 84.6812,
    speed: 0,
    heading: 45,
    accuracy: 5,
    altitude: null,
    status: 'idle',
    errorMessage: null,
    lastUpdated: Date.now(),
    isStationary: true,
    wakeLockActive: false,
    broadcastCount: 0
  });

  // Internal references
  const watchIdRef = useRef<number | null>(null);
  const wakeLockSentinelRef = useRef<any>(null);
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null);
  const lastDbPushTimeRef = useRef<number>(0);
  const lastAcceptedPosRef = useRef<{ lat: number; lng: number } | null>(null);
  const smoothedHeadingRef = useRef<number>(45);
  const speedFilterRef = useRef<number[]>([]);
  const simStepRef = useRef<number>(0);

  // --------------------------------------------------------------------------
  // 1. SCREEN WAKE LOCK API (Prevents screen auto-locking during trip)
  // --------------------------------------------------------------------------
  useEffect(() => {
    let released = false;

    const requestWakeLock = async () => {
      if (!enabled) return;
      try {
        if ('wakeLock' in navigator && (navigator as any).wakeLock) {
          const sentinel = await (navigator as any).wakeLock.request('screen');
          if (!released) {
            wakeLockSentinelRef.current = sentinel;
            setTelemetry((prev) => ({ ...prev, wakeLockActive: true }));
            sentinel.addEventListener('release', () => {
              if (!released) setTelemetry((prev) => ({ ...prev, wakeLockActive: false }));
            });
          }
        }
      } catch (err: any) {
        console.warn('Wake Lock request failed:', err?.message || err);
      }
    };

    requestWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && enabled) {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      released = true;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockSentinelRef.current) {
        wakeLockSentinelRef.current.release().catch(() => {});
        wakeLockSentinelRef.current = null;
      }
    };
  }, [enabled]);

  // --------------------------------------------------------------------------
  // 2. SUPABASE REALTIME CHANNEL INITIALIZATION
  // --------------------------------------------------------------------------
  useEffect(() => {
    const channel = supabase.channel('bus-tracking', {
      config: { broadcast: { self: false } }
    });

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        realtimeChannelRef.current = channel;
      }
    });

    return () => {
      channel.unsubscribe();
      realtimeChannelRef.current = null;
    };
  }, [busId]);

  // --------------------------------------------------------------------------
  // 3. BROADCAST & DATABASE PUSH HELPER
  // --------------------------------------------------------------------------
  const streamLocation = useCallback(
    async (lat: number, lng: number, speedKmH: number, headingDeg: number, accuracyM: number) => {
      const now = Date.now();
      const payload = {
        bus_id: busId,
        driver_id: driverId,
        driver_name: driverName,
        driver_phone: driverPhone,
        route_id: routeId,
        route_name: routeName,
        latitude: lat,
        longitude: lng,
        speed: Math.round(speedKmH),
        heading: Math.round(headingDeg),
        accuracy: Math.round(accuracyM),
        trip_type: tripType,
        is_active: true,
        updated_at: new Date(now).toISOString()
      };

      // 1. Instant WebSocket broadcast (< 50ms latency)
      if (realtimeChannelRef.current) {
        realtimeChannelRef.current
          .send({
            type: 'broadcast',
            event: 'location_update',
            payload
          })
          .catch(() => {});
      }

      // 2. Throttled Database Sync (every 3-5s to prevent write-locking DB)
      if (now - lastDbPushTimeRef.current >= streamIntervalMs) {
        lastDbPushTimeRef.current = now;
        try {
          await supabase.from('live_locations').upsert(payload, { onConflict: 'bus_id' });
        } catch (dbErr) {
          console.warn('Database live_locations sync deferred:', dbErr);
        }
      }
    },
    [busId, driverId, driverName, driverPhone, routeId, routeName, tripType, streamIntervalMs]
  );

  // --------------------------------------------------------------------------
  // 4. GPS FIX PROCESSING & SMOOTHING ENGINE
  // --------------------------------------------------------------------------
  const processFix = useCallback(
    (
      rawLat: number,
      rawLng: number,
      rawSpeed: number | null,
      rawHeading: number | null,
      accuracy: number,
      altitude: number | null
    ) => {
      // 1. Extreme Jitter Filter
      if (accuracy > 60 && lastAcceptedPosRef.current) {
        setTelemetry((prev) => ({
          ...prev,
          status: 'poor_signal',
          accuracy,
          errorMessage: `Weak GPS Signal (±${Math.round(accuracy)}m). Holding position.`
        }));
        return;
      }

      // 2. Stationary Deadzone Filter
      let distMoved = 0;
      if (lastAcceptedPosRef.current) {
        distMoved = haversineDistanceMeters(
          lastAcceptedPosRef.current.lat,
          lastAcceptedPosRef.current.lng,
          rawLat,
          rawLng
        );
      }

      // If moved < 2.5 meters and speed is near zero, treat as stationary drift
      const isStationary = distMoved < 2.5 && (rawSpeed === null || rawSpeed < 1.0);
      let effectiveLat = isStationary && lastAcceptedPosRef.current ? lastAcceptedPosRef.current.lat : rawLat;
      let effectiveLng = isStationary && lastAcceptedPosRef.current ? lastAcceptedPosRef.current.lng : rawLng;

      // 3. Snap-to-Roads (Strictly zero straight line deviation)
      let snappedLat = effectiveLat;
      let snappedLng = effectiveLng;
      if (roadPolyline && roadPolyline.length >= 2) {
        const snapped = snapPointToPolyline({ lat: effectiveLat, lng: effectiveLng }, roadPolyline);
        if (snapped.distanceToRoadMeters <= snapThresholdMeters) {
          snappedLat = snapped.snappedPoint.lat;
          snappedLng = snapped.snappedPoint.lng;
        }
      }

      // 4. Heading & Velocity Smoothing
      let calculatedSpeed = rawSpeed !== null && rawSpeed >= 0 ? rawSpeed * 3.6 : 0; // m/s -> km/h
      speedFilterRef.current.push(calculatedSpeed);
      if (speedFilterRef.current.length > 4) speedFilterRef.current.shift();
      const avgSpeed = speedFilterRef.current.reduce((a, b) => a + b, 0) / speedFilterRef.current.length;

      let targetHeading = smoothedHeadingRef.current;
      if (rawHeading !== null && !isNaN(rawHeading) && rawHeading >= 0 && avgSpeed > 4) {
        targetHeading = rawHeading;
      } else if (lastAcceptedPosRef.current && distMoved >= 3) {
        const dLat = effectiveLat - lastAcceptedPosRef.current.lat;
        const dLng = effectiveLng - lastAcceptedPosRef.current.lng;
        targetHeading = (Math.atan2(dLng, dLat) * 180) / Math.PI;
        if (targetHeading < 0) targetHeading += 360;
      }

      // Angular smoothing
      let angleDiff = (targetHeading - smoothedHeadingRef.current) % 360;
      if (angleDiff < -180) angleDiff += 360;
      if (angleDiff > 180) angleDiff -= 360;
      smoothedHeadingRef.current = (smoothedHeadingRef.current + angleDiff * 0.4 + 360) % 360;

      lastAcceptedPosRef.current = { lat: effectiveLat, lng: effectiveLng };

      const updatedTelemetry: DriverGpsTelemetry = {
        latitude: effectiveLat,
        longitude: effectiveLng,
        snappedLatitude: snappedLat,
        snappedLongitude: snappedLng,
        speed: Math.round(avgSpeed),
        heading: Math.round(smoothedHeadingRef.current),
        accuracy: Math.round(accuracy),
        altitude,
        status: accuracy <= 20 ? 'locked' : 'poor_signal',
        errorMessage: null,
        lastUpdated: Date.now(),
        isStationary,
        wakeLockActive: !!wakeLockSentinelRef.current,
        broadcastCount: telemetry.broadcastCount + 1
      };

      setTelemetry(updatedTelemetry);
      if (onTelemetry) onTelemetry(updatedTelemetry);

      // Stream to Supabase
      streamLocation(snappedLat, snappedLng, avgSpeed, smoothedHeadingRef.current, accuracy);
    },
    [roadPolyline, snapThresholdMeters, onTelemetry, streamLocation, telemetry.broadcastCount]
  );

  // --------------------------------------------------------------------------
  // 5. HARDWARE GPS WATCHER (Strict Mobile Configuration)
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!enabled || isSimulating) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
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

    setTelemetry((prev) => ({ ...prev, status: 'searching', errorMessage: null }));

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    };

    const handleSuccess = (pos: GeolocationPosition) => {
      processFix(
        pos.coords.latitude,
        pos.coords.longitude,
        pos.coords.speed,
        pos.coords.heading,
        pos.coords.accuracy,
        pos.coords.altitude
      );
    };

    const handleError = (error: GeolocationPositionError) => {
      let msg = 'Unable to acquire GPS fix.';
      let status: DriverGpsTelemetry['status'] = 'poor_signal';

      switch (error.code) {
        case error.PERMISSION_DENIED:
          msg = 'Location permission was denied. Please allow GPS access in mobile settings.';
          status = 'denied';
          break;
        case error.POSITION_UNAVAILABLE:
          msg = 'GPS signal lost or unavailable. Searching for satellites...';
          status = 'searching';
          break;
        case error.TIMEOUT:
          msg = 'GPS request timed out. Retrying high-accuracy positioning...';
          status = 'searching';
          break;
      }

      setTelemetry((prev) => ({
        ...prev,
        status,
        errorMessage: msg
      }));
    };

    watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, options);

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [enabled, isSimulating, processFix]);

  // --------------------------------------------------------------------------
  // 6. TURN-BY-TURN ROAD SIMULATION (Fallback for Testing & Demos)
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!enabled || !isSimulating || !roadPolyline || roadPolyline.length < 2) return;

    setTelemetry((prev) => ({ ...prev, status: 'simulating', errorMessage: null }));

    const interval = setInterval(() => {
      simStepRef.current = (simStepRef.current + 1) % roadPolyline.length;
      const cur = roadPolyline[simStepRef.current];
      const prev = roadPolyline[(simStepRef.current - 1 + roadPolyline.length) % roadPolyline.length];

      const dLat = cur[0] - prev[0];
      const dLng = cur[1] - prev[1];
      let calcHeading = (Math.atan2(dLng, dLat) * 180) / Math.PI;
      if (calcHeading < 0) calcHeading += 360;

      const simSpeed = 24 + Math.random() * 12; // 24-36 km/h realistic school bus speed
      processFix(cur[0], cur[1], simSpeed / 3.6, calcHeading, 4, 65);
    }, 3500);

    return () => clearInterval(interval);
  }, [enabled, isSimulating, roadPolyline, processFix]);

  return {
    telemetry,
    streamLocation
  };
}
