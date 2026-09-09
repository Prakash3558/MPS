/**
 * Dynamic ETA & Auto-Delay Calculation Engine
 * 
 * Provides production-grade calculations for:
 * 1. Great-Circle Haversine distance between bus and stop coordinates.
 * 2. Real-time predicted arrival time factoring in current telemetry speed,
 *    traffic smoothing, and cumulative stop dwell buffering (doors open/close).
 * 3. Auto-calculated secondary time (Delay ETA) displayed alongside original scheduled time.
 * 4. Geofence proximity detection (500m proximity alert & 80m arrival detection).
 */

export interface DynamicEtaResult {
  distanceMeters: number;
  distanceFormatted: string; // e.g., "450 m" or "2.3 km"
  travelDurationMinutes: number; // e.g., 8 mins
  scheduledTimeString: string; // e.g., "07:30 AM"
  predictedTimeString: string; // e.g., "07:44 AM" (Secondary Time)
  delayMinutes: number; // Positive = late, negative = early
  status: 'on_schedule' | 'delayed' | 'early' | 'arrived';
  statusLabel: string; // e.g. "+14m Late", "On Schedule", "Arrived"
  isDelayed: boolean; // Delay >= 3 minutes
  isNearAlert: boolean; // Bus <= 500m (Instant Parent Alert trigger)
  isArrived: boolean; // Bus <= 80m of the stop
  delayBadgeColor: string; // Tailwind color classes for high contrast
}

/**
 * Calculates Great-Circle Haversine distance between two coordinates in meters.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Parses time string like "07:30 AM" or "14:45" into a Date object on reference date.
 */
export function parseTimeStringToDate(timeStr: string, referenceDate: Date = new Date()): Date {
  const date = new Date(referenceDate);
  if (!timeStr) return date;

  const clean = timeStr.trim();
  const is12Hour = /am|pm/i.test(clean);
  const parts = clean.replace(/am|pm/gi, '').trim().split(':');

  let hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;

  if (is12Hour) {
    const isPM = /pm/i.test(clean);
    if (isPM && hours < 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
  }

  date.setHours(hours, minutes, 0, 0);
  return date;
}

/**
 * Formats a Date object to "hh:mm A" string
 */
export function formatTimeToString(date: Date): string {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 hour is 12
  const minStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${hours < 10 ? `0${hours}` : hours}:${minStr} ${ampm}`;
}

/**
 * Calculates Dynamic ETA and delay offset.
 * 
 * @param busLat Bus current latitude
 * @param busLng Bus current longitude
 * @param busSpeedKmh Current reported speed in km/h from GPS
 * @param stopLat Stop latitude
 * @param stopLng Stop longitude
 * @param scheduledTimeStr Scheduled arrival time string (e.g. "07:30 AM")
 * @param stopsRemainingCount Number of intermediate stops before this stop
 * @param referenceTime Current time (defaults to Date.now())
 */
export function calculateDynamicStopEta(
  busLat: number,
  busLng: number,
  busSpeedKmh: number,
  stopLat: number,
  stopLng: number,
  scheduledTimeStr: string,
  stopsRemainingCount: number = 0,
  referenceTime: Date = new Date()
): DynamicEtaResult {
  const distanceMeters = calculateHaversineDistance(busLat, busLng, stopLat, stopLng);

  // Formatting distance
  const distanceFormatted =
    distanceMeters < 1000
      ? `${distanceMeters} m`
      : `${(distanceMeters / 1000).toFixed(1)} km`;

  // Realistic transit speed estimation:
  // If bus is stationary at a traffic light or stop (< 6 km/h), assume standard transit speed of 22 km/h
  // If moving, smooth with average urban transit speed (weighted 70% current speed, 30% 24 km/h baseline)
  const effectiveSpeedKmh =
    busSpeedKmh < 6
      ? 22
      : Math.min(60, Math.max(15, busSpeedKmh * 0.7 + 24 * 0.3));

  const distanceKm = distanceMeters / 1000;
  const transitTimeMinutes = (distanceKm / effectiveSpeedKmh) * 60;

  // Dwell buffer: assume 90 seconds (1.5 minutes) boarding dwell per intermediate stop
  const dwellBufferMinutes = Math.max(0, stopsRemainingCount) * 1.5;

  const totalDurationMinutes = Math.max(1, Math.round(transitTimeMinutes + dwellBufferMinutes));

  // Predicted arrival time
  const predictedArrivalDate = new Date(referenceTime.getTime() + totalDurationMinutes * 60000);
  const predictedTimeString = formatTimeToString(predictedArrivalDate);

  // Scheduled arrival time
  const scheduledDate = parseTimeStringToDate(scheduledTimeStr, referenceTime);
  const scheduledTimeString = formatTimeToString(scheduledDate);

  // Delay in minutes (positive = behind schedule / late)
  const delayMinutes = Math.round(
    (predictedArrivalDate.getTime() - scheduledDate.getTime()) / 60000
  );

  const isArrived = distanceMeters <= 80;
  const isNearAlert = distanceMeters <= 500 && !isArrived;
  const isDelayed = delayMinutes >= 3;
  const isEarly = delayMinutes <= -3;

  let status: 'on_schedule' | 'delayed' | 'early' | 'arrived' = 'on_schedule';
  let statusLabel = 'On Schedule';
  let delayBadgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';

  if (isArrived) {
    status = 'arrived';
    statusLabel = 'Arrived at Stop';
    delayBadgeColor = 'bg-blue-500/20 text-blue-300 border-blue-500/40';
  } else if (isDelayed) {
    status = 'delayed';
    statusLabel = `+${delayMinutes}m Delay`;
    delayBadgeColor =
      delayMinutes >= 10
        ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
        : 'bg-amber-500/20 text-amber-300 border-amber-500/50';
  } else if (isEarly) {
    status = 'early';
    statusLabel = `${Math.abs(delayMinutes)}m Early`;
    delayBadgeColor = 'bg-teal-500/20 text-teal-300 border-teal-500/40';
  }

  return {
    distanceMeters,
    distanceFormatted,
    travelDurationMinutes: totalDurationMinutes,
    scheduledTimeString,
    predictedTimeString,
    delayMinutes,
    status,
    statusLabel,
    isDelayed,
    isNearAlert,
    isArrived,
    delayBadgeColor
  };
}
