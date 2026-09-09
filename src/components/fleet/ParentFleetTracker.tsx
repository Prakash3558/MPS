import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MapPin, Clock, ShieldCheck, AlertCircle, Phone, Navigation,
  Bell, CheckCircle2, AlertTriangle, Compass, RefreshCw, Car,
  Sparkles, ExternalLink
} from 'lucide-react';
import L from 'leaflet';
import {
  supabaseFleetService, SupabaseLiveLocation, SupabaseStop,
  SupabaseStudentFleet, DEFAULT_ROUTES
} from '../../lib/supabaseFleetService';
import { calculateDynamicStopEta, DynamicEtaResult } from '../../lib/etaCalculator';
import { fetchRoadSnappedRoute } from '../../lib/roadRoutingService';

interface ParentFleetTrackerProps {
  studentId?: string;
  studentName?: string;
  busId?: string;
  stopId?: string;
  routeId?: string;
}

export const ParentFleetTracker: React.FC<ParentFleetTrackerProps> = ({
  studentId = 'stu-01',
  studentName = 'Aarav Sharma',
  busId = 'bus-01',
  stopId = 'stop-01',
  routeId = 'route-01'
}) => {
  // Realtime Live Location from Supabase
  const [liveLocation, setLiveLocation] = useState<SupabaseLiveLocation | null>(() =>
    supabaseFleetService.getLatestLiveLocation(busId)
  );

  const [stops, setStops] = useState<SupabaseStop[]>([]);
  const [studentInfo, setStudentInfo] = useState<SupabaseStudentFleet | null>(null);
  const [notifications, setNotifications] = useState<string[]>([]);

  // Route path (initialized from service)
  const currentRoute = useMemo(() => {
    return (
      supabaseFleetService.getRoutes().find((r) => r.id === routeId) ||
      DEFAULT_ROUTES.find((r) => r.id === routeId) ||
      DEFAULT_ROUTES[0]
    );
  }, [routeId]);

  const [routePolyline, setRoutePolyline] = useState<[number, number][]>(currentRoute.polyline_coords);

  // Leaflet Map Refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const busMarkerRef = useRef<L.Marker | null>(null);
  const childStopMarkerRef = useRef<L.Marker | null>(null);
  const casingPolylineRef = useRef<L.Polyline | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);

  // Load stops and student data
  useEffect(() => {
    const data = supabaseFleetService.getStopsAndStudents();
    const routeStops = data.stops.filter((s) => s.route_id === routeId);
    setStops(routeStops);

    const sInfo = data.students.find((s) => s.id === studentId);
    if (sInfo) setStudentInfo(sInfo);
  }, [routeId, studentId]);

  // Supabase Realtime Listener on live_locations
  useEffect(() => {
    const unsubscribeLocation = supabaseFleetService.subscribeToLiveLocation((loc) => {
      if (loc.bus_id === busId) {
        setLiveLocation(loc);
      }
    });

    const unsubscribeAttendance = supabaseFleetService.subscribeToAttendance((log) => {
      if (log.student_id === studentId) {
        setStudentInfo((prev) => (prev ? { ...prev, boarding_status: log.status } : prev));
        const alertMsg =
          log.status === 'Boarded'
            ? `🎒 ${studentName} safely boarded ${busId.toUpperCase()} at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : log.status === 'Dropped'
            ? `🏡 ${studentName} safely dropped off at destination!`
            : `Attendance updated: ${log.status}`;
        setNotifications((prev) => [alertMsg, ...prev.slice(0, 4)]);
      }
    });

    const unsubscribeIncidents = supabaseFleetService.subscribeToIncidents((inc) => {
      if (inc.bus_id === busId) {
        setNotifications((prev) => [
          `⚠️ Incident Alert: ${inc.description}`,
          ...prev.slice(0, 4)
        ]);
      }
    });

    const unsubscribeRoutes = supabaseFleetService.subscribeToRoutes((routes) => {
      const match = routes.find((r) => r.id === routeId);
      if (match?.polyline_coords) {
        setRoutePolyline(match.polyline_coords);
        if (casingPolylineRef.current) casingPolylineRef.current.setLatLngs(match.polyline_coords);
        if (polylineRef.current) polylineRef.current.setLatLngs(match.polyline_coords);
      }
    });

    return () => {
      unsubscribeLocation();
      unsubscribeAttendance();
      unsubscribeIncidents();
      unsubscribeRoutes();
    };
  }, [busId, studentId, studentName, routeId]);

  // Ensure road-snapped polyline is fetched if not present
  useEffect(() => {
    if (stops.length >= 2) {
      const waypoints = [...stops]
        .sort((a, b) => a.stop_order - b.stop_order)
        .map((s) => ({ lat: s.latitude, lng: s.longitude }));
      fetchRoadSnappedRoute(waypoints).then((res) => {
        if (res.coordinates && res.coordinates.length > 1) {
          setRoutePolyline(res.coordinates);
          if (casingPolylineRef.current) casingPolylineRef.current.setLatLngs(res.coordinates);
          if (polylineRef.current) polylineRef.current.setLatLngs(res.coordinates);
        }
      });
    }
  }, [stops]);

  // Find child's assigned stop
  const childStop = useMemo(() => {
    return stops.find((s) => s.id === stopId) || stops[0];
  }, [stops, stopId]);

  // Calculate Dynamic ETA specifically for the parent's child stop
  const childEta: DynamicEtaResult | null = useMemo(() => {
    if (!liveLocation || !childStop) return null;

    const scheduledTime =
      liveLocation.trip_type === 'Afternoon Drop'
        ? childStop.scheduled_drop_time
        : childStop.scheduled_pickup_time;

    return calculateDynamicStopEta(
      liveLocation.latitude,
      liveLocation.longitude,
      liveLocation.speed,
      childStop.latitude,
      childStop.longitude,
      scheduledTime,
      0
    );
  }, [liveLocation, childStop]);

  // Trigger Proximity Notifications (<= 500m & Arrived)
  useEffect(() => {
    if (!childEta) return;

    if (childEta.isArrived) {
      const arrivedMsg = `🚌 Bus has arrived at ${childStop?.stop_name}!`;
      setNotifications((prev) => (prev.includes(arrivedMsg) ? prev : [arrivedMsg, ...prev]));
    } else if (childEta.isNearAlert) {
      const nearMsg = `🔔 Bus is within 500 meters (${childEta.distanceFormatted}) of your stop! Please head to the pickup point.`;
      setNotifications((prev) => (prev.includes(nearMsg) ? prev : [nearMsg, ...prev]));
    }
  }, [childEta, childStop]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current || !childStop) return;

    const busPos = [liveLocation?.latitude || 27.0250, liveLocation?.longitude || 84.6812] as [number, number];

    const map = L.map(mapContainerRef.current, {
      center: busPos,
      zoom: 14,
      zoomControl: false
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    // 1. Street Polyline Casing (outer border for high-contrast road appearance)
    const casing = L.polyline(routePolyline, {
      color: '#0f172a',
      weight: 8,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);
    casingPolylineRef.current = casing;

    // 2. Active Road Polyline (snapped to real street network)
    const polyline = L.polyline(routePolyline, {
      color: '#3b82f6',
      weight: 5,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);
    polylineRef.current = polyline;

    // Child Stop Marker (Home Icon)
    const homeIcon = L.divIcon({
      className: 'child-stop-marker',
      html: `
        <div class="relative flex flex-col items-center">
          <div class="w-9 h-9 bg-emerald-500 rounded-2xl shadow-xl border-2 border-white flex items-center justify-center text-white font-black text-sm ring-4 ring-emerald-400/30">
            ★
          </div>
          <div class="bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow border border-slate-700 whitespace-nowrap mt-1">
            Your Child's Stop
          </div>
        </div>
      `,
      iconSize: [36, 48],
      iconAnchor: [18, 24]
    });

    const stopMarker = L.marker([childStop.latitude, childStop.longitude], { icon: homeIcon }).addTo(map);
    stopMarker.bindPopup(`<b>Your Child's Stop:</b> ${childStop.stop_name}`);
    childStopMarkerRef.current = stopMarker;

    // Bus Marker
    const busIcon = L.divIcon({
      className: 'parent-bus-marker',
      html: `
        <div style="transform: rotate(${liveLocation?.heading || 0}deg);" class="relative flex items-center justify-center">
          <div class="absolute -inset-2 bg-amber-500/40 rounded-full animate-ping"></div>
          <div class="w-10 h-10 bg-amber-500 rounded-2xl shadow-xl border-2 border-slate-900 flex items-center justify-center text-slate-950 font-black text-xs">
            🚌
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    const bMarker = L.marker(busPos, { icon: busIcon }).addTo(map);
    bMarker.bindPopup(`<b>${busId.toUpperCase()}</b><br/>Speed: ${liveLocation?.speed || 0} km/h`);
    busMarkerRef.current = bMarker;

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [childStop]);

  // Update Bus Marker Position
  useEffect(() => {
    if (!busMarkerRef.current || !mapInstanceRef.current || !liveLocation) return;

    busMarkerRef.current.setLatLng([liveLocation.latitude, liveLocation.longitude]);

    const busIcon = L.divIcon({
      className: 'parent-bus-marker',
      html: `
        <div style="transform: rotate(${liveLocation.heading || 0}deg); transition: transform 0.4s ease;" class="relative flex items-center justify-center">
          <div class="absolute -inset-2 bg-amber-500/40 rounded-full animate-ping"></div>
          <div class="w-10 h-10 bg-amber-500 rounded-2xl shadow-xl border-2 border-slate-900 flex items-center justify-center text-slate-950 font-black text-xs">
            🚌
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });
    busMarkerRef.current.setIcon(busIcon);

    mapInstanceRef.current.panTo([liveLocation.latitude, liveLocation.longitude], { animate: true, duration: 0.6 });
  }, [liveLocation]);

  // Boarding status styling
  const boardingStatus = studentInfo?.boarding_status || 'Not Boarded';
  const statusBadge =
    boardingStatus === 'Boarded'
      ? { label: 'In Transit (Safely on Bus)', color: 'bg-blue-500/20 text-blue-300 border-blue-500/50' }
      : boardingStatus === 'Dropped'
      ? { label: 'Safely Dropped Off', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' }
      : { label: 'Not Boarded (Waiting at Stop)', color: 'bg-slate-800 text-slate-300 border-slate-700' };

  return (
    <div className="bg-slate-950 text-slate-100 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl space-y-0">
      {/* Top Banner with Student & Live Status */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-5 sm:p-6 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-xl">
            🎒
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-white">{studentName}</h2>
              <span className="text-xs text-slate-400">({studentInfo?.class_grade || 'Class VIII'})</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Assigned: <span className="text-amber-400 font-bold">{busId.toUpperCase()}</span> • {currentRoute.route_name}
            </p>
          </div>
        </div>

        {/* Realtime Student Status Badge */}
        <div className="flex items-center gap-3">
          <div className={`px-3.5 py-1.5 rounded-full border text-xs font-bold flex items-center gap-2 shadow ${statusBadge.color}`}>
            <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
            <span>{statusBadge.label}</span>
          </div>

          <a
            href="tel:+919835012456"
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition"
            title="Call Driver"
          >
            <Phone className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Call Driver</span>
          </a>
        </div>
      </div>

      {/* Real-time Notification Alert Banner */}
      {notifications.length > 0 && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-5 py-3 flex items-center gap-3 text-xs text-amber-200 animate-in fade-in">
          <Bell className="w-4 h-4 text-amber-400 flex-shrink-0 animate-bounce" />
          <span className="font-semibold">{notifications[0]}</span>
        </div>
      )}

      {/* SOS Alert Banner if triggered */}
      {liveLocation?.sos_alert && (
        <div className="bg-rose-950 border-b-2 border-rose-500 px-5 py-3 flex items-center gap-3 text-xs text-rose-200 animate-pulse">
          <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <div>
            <span className="font-black text-white">EMERGENCY SOS ALERT: </span>
            <span>{liveLocation.sos_reason || 'Vehicle Delay Reported'}</span>
          </div>
        </div>
      )}

      {/* Main Grid: Map & ETA Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
        {/* Map View */}
        <div className="lg:col-span-8 relative h-[360px] lg:h-auto min-h-[420px] border-b lg:border-b-0 lg:border-r border-slate-800">
          <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: '100%' }} />

          {/* Floating Road & Speed HUD */}
          <div className="absolute top-4 left-4 z-[400] bg-slate-900/90 backdrop-blur-md p-3 rounded-2xl border border-slate-700 shadow-xl text-xs space-y-1.5">
            <div className="flex items-center gap-2">
              <Navigation className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-300 font-bold">{liveLocation?.current_road_name || 'Sikta Main Road'}</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-slate-400">
              <span>Speed: <b className="text-white">{liveLocation?.speed || 0} km/h</b></span>
              <span>Heading: <b className="text-white">{liveLocation?.heading || 0}°</b></span>
            </div>
          </div>
        </div>

        {/* Right Info: DUAL-TIME ETA Card & Stop Details */}
        <div className="lg:col-span-4 p-5 sm:p-6 flex flex-col justify-between space-y-5 bg-slate-900/30">
          {/* Child Stop & Dual-Time Display */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                Assigned Pickup / Drop
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                Stop #{childStop?.stop_order}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 shadow-inner">
              <h3 className="font-bold text-white text-base mb-1">{childStop?.stop_name}</h3>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-400" /> Landmark: {childStop?.landmark || 'Main Road'}
              </p>
            </div>

            {/* DUAL-TIME DISPLAY BOX (Core Deliverable) */}
            {childEta && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-500/30 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>Arrival Time Forecast</span>
                  </span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full border font-bold ${childEta.delayBadgeColor}`}>
                    {childEta.statusLabel}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block mb-0.5">
                      Scheduled Time
                    </span>
                    <span className="text-base font-bold text-slate-300">
                      {childEta.scheduledTimeString}
                    </span>
                  </div>

                  <div className="border-l border-slate-800 pl-3">
                    <span className="text-[10px] text-amber-400 uppercase font-black block mb-0.5">
                      Live Predicted ETA
                    </span>
                    <span className={`text-base font-black ${childEta.isDelayed ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {childEta.predictedTimeString}
                    </span>
                  </div>
                </div>

                {/* Distance & Proximity status */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Distance to Stop:</span>
                  <span className="font-bold text-white">{childEta.distanceFormatted}</span>
                </div>

                {childEta.isNearAlert && (
                  <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/50 text-[11px] text-amber-300 font-bold flex items-center gap-2 animate-pulse">
                    <Bell className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>Bus is within 500m! Please be ready.</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Contacts Footer */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs space-y-2">
            <span className="text-slate-400 font-bold block mb-1">School Transport Support Desk</span>
            <div className="flex items-center justify-between text-slate-300">
              <span>Driver: Rajesh Kumar</span>
              <a href="tel:+919835012456" className="text-amber-400 font-semibold hover:underline">
                +91 98350 12456
              </a>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>School Helpline</span>
              <a href="tel:+919431812345" className="text-amber-400 font-semibold hover:underline">
                +91 94318 12345
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentFleetTracker;
