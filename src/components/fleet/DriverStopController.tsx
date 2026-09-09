import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MapPin, Navigation, Clock, AlertTriangle, UserCheck, UserX,
  Plus, Radio, ShieldAlert, CheckCircle2, ChevronRight, X, Phone,
  Users, Play, Square, Compass, RefreshCw, Layers, Bell, ArrowRight,
  ArrowUp, ArrowDown, Trash2, Smartphone, Satellite, Route as RouteIcon
} from 'lucide-react';
import L from 'leaflet';
import {
  supabaseFleetService, SupabaseStop, SupabaseStudentFleet,
  SupabaseLiveLocation, DEFAULT_ROUTES
} from '../../lib/supabaseFleetService';
import { calculateDynamicStopEta, DynamicEtaResult } from '../../lib/etaCalculator';
import { fetchRoadSnappedRoute, SnappedRouteResult } from '../../lib/roadRoutingService';
import { useDriverGpsTracker } from '../../lib/useDriverGpsTracker';
import { RoadRoutingMap } from './RoadRoutingMap';

interface DriverStopControllerProps {
  busId?: string;
  routeId?: string;
  driverName?: string;
}

export const DriverStopController: React.FC<DriverStopControllerProps> = ({
  busId = 'bus-01',
  routeId = 'route-01',
  driverName = 'Rajesh Kumar Singh (राजेश कुमार)'
}) => {
  // Data State
  const [stops, setStops] = useState<SupabaseStop[]>([]);
  const [students, setStudents] = useState<SupabaseStudentFleet[]>([]);
  const [activeStopIndex, setActiveStopIndex] = useState(0);

  // Selected route data
  const currentRoute = useMemo(() => {
    return DEFAULT_ROUTES.find((r) => r.id === routeId) || DEFAULT_ROUTES[0];
  }, [routeId]);

  // Road Routing Engine State (Zero Straight-Line Vectors)
  const [roadPolyline, setRoadPolyline] = useState<[number, number][]>(currentRoute.polyline_coords);
  const [routingProvider, setRoutingProvider] = useState<'osrm' | 'osrm-mirror' | 'mapbox' | 'interpolated-corridor'>('osrm');
  const [isRoutingLoading, setIsRoutingLoading] = useState(false);
  const [useDeviceGps, setUseDeviceGps] = useState(true);
  const [mapEngine, setMapEngine] = useState<'mapbox' | 'leaflet'>('mapbox');

  // Live Telemetry
  const [isTripActive, setIsTripActive] = useState(true);
  const [tripType, setTripType] = useState<'Morning Pickup' | 'Afternoon Drop'>('Morning Pickup');
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 27.0250, lng: 84.6812 });
  const [speed, setSpeed] = useState<number>(28); // km/h
  const [heading, setHeading] = useState<number>(68); // degrees
  const [currentRoad, setCurrentRoad] = useState<string>('Sikta Main Railway Road');

  // Continuous Mobile GPS Tracker Hook
  const { telemetry } = useDriverGpsTracker({
    enabled: isTripActive,
    isSimulating: !useDeviceGps,
    roadPolyline,
    snapToRoadThresholdMeters: 40,
    onPositionUpdate: (fix) => {
      setCoords(fix.snappedCoords);
      setSpeed(fix.speed);
      setHeading(fix.heading);
    }
  });

  // Modals
  const [showAddStopModal, setShowAddStopModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showSkipStopModal, setShowSkipStopModal] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);

  // Forms
  const [newStopForm, setNewStopForm] = useState({
    stop_name: '',
    scheduled_pickup_time: '07:20 AM',
    scheduled_drop_time: '02:50 PM',
    landmark: '',
    latitude: 27.0310,
    longitude: 84.6870,
    radius_meters: 60,
    fee_monthly: 650
  });

  const [unscheduledForm, setUnscheduledForm] = useState({
    full_name: '',
    class_grade: 'Class VIII',
    section: 'A',
    parent_phone: '',
    stop_id: ''
  });

  const [skipReason, setSkipReason] = useState('Heavy Traffic / Road Construction');
  const [sosReason, setSosReason] = useState('Traffic Gridlock / Railway Crossing Closed');

  // Leaflet Map Refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const vehicleMarkerRef = useRef<L.Marker | null>(null);
  const stopMarkersRef = useRef<L.LayerGroup | null>(null);
  const casingPolylineRef = useRef<L.Polyline | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);

  // Load initial data
  useEffect(() => {
    const data = supabaseFleetService.getStopsAndStudents();
    setStops(data.stops.filter((s) => s.route_id === routeId));
    setStudents(data.students.filter((s) => s.route_id === routeId));
  }, [routeId]);

  // Calculate dynamic ETA for all stops
  const stopsWithEta = useMemo(() => {
    return stops.map((stop, idx) => {
      const scheduledTime = tripType === 'Morning Pickup' ? stop.scheduled_pickup_time : stop.scheduled_drop_time;
      const intermediateCount = Math.max(0, idx - activeStopIndex);
      const etaResult: DynamicEtaResult = calculateDynamicStopEta(
        coords.lat,
        coords.lng,
        speed,
        stop.latitude,
        stop.longitude,
        scheduledTime,
        intermediateCount
      );
      return {
        ...stop,
        eta: etaResult
      };
    });
  }, [stops, coords, speed, tripType, activeStopIndex]);

  const nextStop = stopsWithEta[activeStopIndex] || stopsWithEta[0];

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [coords.lat, coords.lng],
      zoom: 14,
      zoomControl: false
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    // 1. Street Polyline Casing (outer border for high-contrast road appearance)
    const casing = L.polyline(roadPolyline, {
      color: '#0f172a',
      weight: 9,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);
    casingPolylineRef.current = casing;

    // 2. Active Road Polyline (snapped to real street network)
    const polyline = L.polyline(roadPolyline, {
      color: '#f59e0b',
      weight: 5,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);
    polylineRef.current = polyline;

    // Layer Group for stops
    const stopsGroup = L.layerGroup().addTo(map);
    stopMarkersRef.current = stopsGroup;

    // Vehicle Marker with Heading icon
    const busIcon = L.divIcon({
      className: 'vehicle-marker',
      html: `
        <div style="transform: rotate(${heading}deg); transition: transform 0.4s ease;" class="relative flex items-center justify-center">
          <div class="absolute -inset-2 bg-amber-500/30 rounded-full animate-ping"></div>
          <div class="w-10 h-10 bg-gradient-to-tr from-amber-500 to-amber-600 rounded-2xl shadow-xl border-2 border-slate-900 flex items-center justify-center text-slate-950 font-black text-xs">
            🚌
          </div>
          <div class="absolute -top-1 w-2.5 h-2.5 bg-amber-300 rounded-full shadow border border-slate-900"></div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    const marker = L.marker([coords.lat, coords.lng], { icon: busIcon }).addTo(map);
    marker.bindPopup(`<b>${busId.toUpperCase()}</b><br/>Driver: ${driverName}<br/>Speed: ${speed} km/h`);
    vehicleMarkerRef.current = marker;

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update stop markers whenever stops list changes
  useEffect(() => {
    if (!mapInstanceRef.current || !stopMarkersRef.current) return;
    stopMarkersRef.current.clearLayers();

    stopsWithEta.forEach((stop, idx) => {
      const isNext = idx === activeStopIndex;
      const isPast = idx < activeStopIndex;

      const stopIcon = L.divIcon({
        className: 'stop-pin',
        html: `
          <div class="flex flex-col items-center">
            <div class="w-8 h-8 rounded-xl shadow-lg border-2 flex items-center justify-center font-bold text-xs ${
              isNext
                ? 'bg-amber-500 border-white text-slate-950 ring-4 ring-amber-400/40 animate-bounce'
                : isPast
                ? 'bg-emerald-600 border-emerald-300 text-white opacity-80'
                : 'bg-slate-800 border-slate-600 text-slate-200'
            }">
              ${stop.stop_order}
            </div>
            <div class="bg-slate-900/90 text-white text-[10px] px-2 py-0.5 rounded-full font-medium shadow border border-slate-700 whitespace-nowrap mt-1">
              ${stop.stop_name.split(' ')[0]}
            </div>
          </div>
        `,
        iconSize: [32, 48],
        iconAnchor: [16, 24]
      });

      const m = L.marker([stop.latitude, stop.longitude], { icon: stopIcon }).addTo(stopMarkersRef.current!);
      m.bindPopup(`
        <div style="font-family: sans-serif; min-width: 180px;">
          <h4 style="margin:0 0 4px; font-weight:bold; color:#1e293b;">Stop #${stop.stop_order}: ${stop.stop_name}</h4>
          <p style="margin:0 0 4px; font-size:12px; color:#64748b;">Scheduled: <b>${stop.eta.scheduledTimeString}</b></p>
          <p style="margin:0; font-size:12px; color:${stop.eta.isDelayed ? '#e11d48' : '#059669'}; font-weight:bold;">
            Live ETA: ${stop.eta.predictedTimeString} (${stop.eta.statusLabel})
          </p>
        </div>
      `);
    });
  }, [stopsWithEta, activeStopIndex]);

  // Update vehicle position on map and broadcast to Supabase
  useEffect(() => {
    if (!vehicleMarkerRef.current || !mapInstanceRef.current) return;

    vehicleMarkerRef.current.setLatLng([coords.lat, coords.lng]);

    const busIcon = L.divIcon({
      className: 'vehicle-marker',
      html: `
        <div style="transform: rotate(${heading}deg); transition: transform 0.4s ease;" class="relative flex items-center justify-center">
          <div class="absolute -inset-2 bg-amber-500/30 rounded-full animate-ping"></div>
          <div class="w-10 h-10 bg-gradient-to-tr from-amber-500 to-amber-600 rounded-2xl shadow-xl border-2 border-slate-900 flex items-center justify-center text-slate-950 font-black text-xs">
            🚌
          </div>
          <div class="absolute -top-1 w-2.5 h-2.5 bg-amber-300 rounded-full shadow border border-slate-900"></div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });
    vehicleMarkerRef.current.setIcon(busIcon);

    // Pan map smoothly to bus
    mapInstanceRef.current.panTo([coords.lat, coords.lng], { animate: true, duration: 0.8 });

    // Publish to Supabase Realtime
    const currentEta = nextStop?.eta;
    const telemetry: SupabaseLiveLocation = {
      bus_id: busId,
      bus_number: 'Bus #01',
      driver_name: driverName,
      route_id: routeId,
      latitude: coords.lat,
      longitude: coords.lng,
      speed,
      heading,
      current_road_name: currentRoad,
      next_stop_id: nextStop?.id,
      next_stop_name: nextStop?.stop_name,
      next_stop_eta: currentEta?.predictedTimeString,
      delay_minutes: currentEta?.delayMinutes || 0,
      is_active: isTripActive,
      trip_type: tripType,
      updated_at: new Date().toISOString()
    };
    supabaseFleetService.publishLiveLocation(telemetry);
  }, [coords, heading, speed, currentRoad, nextStop, isTripActive, tripType, busId, driverName, routeId]);

  // Fetch real road geometry (OSRM / Mapbox) whenever stops change or are reordered
  useEffect(() => {
    if (!stops || stops.length < 2) return;

    let isMounted = true;
    const fetchRoadGeometry = async () => {
      setIsRoutingLoading(true);
      const orderedWaypoints = [...stops]
        .sort((a, b) => a.stop_order - b.stop_order)
        .map((s) => ({ lat: s.latitude, lng: s.longitude }));

      try {
        const result = await fetchRoadSnappedRoute(orderedWaypoints);
        if (isMounted && result.coordinates && result.coordinates.length > 1) {
          setRoadPolyline(result.coordinates);
          setRoutingProvider(result.provider);

          // Update Leaflet layers
          if (casingPolylineRef.current) {
            casingPolylineRef.current.setLatLngs(result.coordinates);
          }
          if (polylineRef.current) {
            polylineRef.current.setLatLngs(result.coordinates);
          }

          // Persist to Supabase so Parents & Admins receive snapped road network
          supabaseFleetService.updateRouteGeometry(routeId, result.coordinates);
        }
      } catch (err) {
        console.warn('Failed to fetch snapped road geometry:', err);
      } finally {
        if (isMounted) setIsRoutingLoading(false);
      }
    };

    fetchRoadGeometry();

    return () => {
      isMounted = false;
    };
  }, [stops, routeId]);

  // Auto-advance stop when bus approaches stop within 80 meters
  useEffect(() => {
    if (!nextStop) return;
    const dist = nextStop.eta.distanceMeters;
    if (dist <= 80 && activeStopIndex < stops.length - 1) {
      setActiveStopIndex((prev) => prev + 1);
    }
  }, [coords, nextStop, activeStopIndex, stops.length]);

  // Stop Reordering / Deletion actions for dynamic re-routing
  const handleMoveStopUp = async (e: React.MouseEvent, stopIndex: number) => {
    e.stopPropagation();
    if (stopIndex <= 0) return;
    const newStops = [...stops];
    const temp = newStops[stopIndex];
    newStops[stopIndex] = newStops[stopIndex - 1];
    newStops[stopIndex - 1] = temp;
    const updated = await supabaseFleetService.reorderStops(routeId, newStops);
    setStops(updated);
  };

  const handleMoveStopDown = async (e: React.MouseEvent, stopIndex: number) => {
    e.stopPropagation();
    if (stopIndex >= stops.length - 1) return;
    const newStops = [...stops];
    const temp = newStops[stopIndex];
    newStops[stopIndex] = newStops[stopIndex + 1];
    newStops[stopIndex + 1] = temp;
    const updated = await supabaseFleetService.reorderStops(routeId, newStops);
    setStops(updated);
  };

  const handleDeleteStop = async (e: React.MouseEvent, stopId: string) => {
    e.stopPropagation();
    if (stops.length <= 2) {
      alert('Route requires at least 2 stops for valid road network geometry.');
      return;
    }
    const updated = await supabaseFleetService.deleteStop(stopId, routeId);
    setStops(updated);
    if (activeStopIndex >= updated.length) {
      setActiveStopIndex(Math.max(0, updated.length - 1));
    }
  };

  // Mark Boarding Status
  const handleMarkStudent = async (student: SupabaseStudentFleet, status: 'Boarded' | 'Dropped' | 'Absent') => {
    await supabaseFleetService.recordAttendance({
      student_id: student.id,
      student_name: student.full_name,
      bus_id: busId,
      route_id: routeId,
      stop_id: student.stop_id,
      stop_name: nextStop?.stop_name,
      trip_type: tripType,
      status,
      latitude: coords.lat,
      longitude: coords.lng
    });

    setStudents((prev) =>
      prev.map((s) => (s.id === student.id ? { ...s, boarding_status: status } : s))
    );
  };

  // Add Dynamic Stop
  const handleCreateStop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStopForm.stop_name) return;

    const newStop = await supabaseFleetService.addStop({
      route_id: routeId,
      stop_name: newStopForm.stop_name,
      stop_order: stops.length + 1,
      scheduled_pickup_time: newStopForm.scheduled_pickup_time,
      scheduled_drop_time: newStopForm.scheduled_drop_time,
      latitude: Number(newStopForm.latitude),
      longitude: Number(newStopForm.longitude),
      landmark: newStopForm.landmark,
      radius_meters: newStopForm.radius_meters,
      fee_monthly: newStopForm.fee_monthly
    });

    setStops((prev) => [...prev, newStop].sort((a, b) => a.stop_order - b.stop_order));
    setShowAddStopModal(false);
  };

  // Add Unscheduled Student
  const handleAddUnscheduled = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unscheduledForm.full_name) return;

    const newStudent: SupabaseStudentFleet = {
      id: 'stu-unsched-' + Date.now(),
      student_id_code: 'MPS-EXTRA-' + Math.floor(100 + Math.random() * 900),
      full_name: unscheduledForm.full_name,
      class_grade: unscheduledForm.class_grade,
      section: unscheduledForm.section,
      roll_no: 'EX',
      parent_phone: unscheduledForm.parent_phone || '+91 98000 00000',
      bus_id: busId,
      route_id: routeId,
      stop_id: unscheduledForm.stop_id || nextStop?.id,
      boarding_status: 'Boarded'
    };

    await supabaseFleetService.assignStudent(
      newStudent.id,
      busId,
      routeId,
      newStudent.stop_id!
    );

    // Record boarding immediately
    await supabaseFleetService.recordAttendance({
      student_id: newStudent.id,
      student_name: newStudent.full_name,
      bus_id: busId,
      route_id: routeId,
      stop_id: newStudent.stop_id,
      stop_name: nextStop?.stop_name,
      trip_type: tripType,
      status: 'Boarded',
      notes: 'Unscheduled passenger added on-the-fly'
    });

    setStudents((prev) => [...prev, newStudent]);
    setShowAddStudentModal(false);
  };

  // Skip Stop action
  const handleSkipStop = async () => {
    if (!nextStop) return;

    await supabaseFleetService.reportIncident({
      bus_id: busId,
      driver_name: driverName,
      route_id: routeId,
      incident_type: 'skip_stop',
      severity: 'medium',
      latitude: coords.lat,
      longitude: coords.lng,
      description: `Stop #${nextStop.stop_order} (${nextStop.stop_name}) skipped by driver. Reason: ${skipReason}`
    });

    if (activeStopIndex < stops.length - 1) {
      setActiveStopIndex((prev) => prev + 1);
    }
    setShowSkipStopModal(false);
  };

  // Emergency SOS Broadcast
  const handleSendSos = async () => {
    await supabaseFleetService.reportIncident({
      bus_id: busId,
      driver_name: driverName,
      route_id: routeId,
      incident_type: 'sos',
      severity: 'critical',
      latitude: coords.lat,
      longitude: coords.lng,
      description: `EMERGENCY SOS ALERT from Bus #01 (${driverName}): ${sosReason}`
    });

    // Update location with SOS flag
    await supabaseFleetService.publishLiveLocation({
      bus_id: busId,
      driver_name: driverName,
      route_id: routeId,
      latitude: coords.lat,
      longitude: coords.lng,
      speed: 0,
      heading,
      current_road_name: currentRoad,
      delay_minutes: 30,
      is_active: true,
      trip_type: tripType,
      sos_alert: true,
      sos_reason: sosReason,
      updated_at: new Date().toISOString()
    });

    setShowSosModal(false);
  };

  // Filter students for the active stop
  const studentsAtNextStop = useMemo(() => {
    return students.filter((s) => s.stop_id === nextStop?.id);
  }, [students, nextStop]);

  return (
    <div className="bg-slate-950 text-slate-100 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Header Bar */}
      <div className="bg-slate-900/90 border-b border-slate-800 p-4 sm:p-6 backdrop-blur flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500 text-slate-950 rounded-2xl font-black shadow-lg shadow-amber-500/20">
            <Navigation className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-white">Driver Portal & Stop Controller</h2>
              <span className="bg-amber-500/20 text-amber-300 text-xs px-2.5 py-0.5 rounded-full border border-amber-500/40 font-bold">
                Supabase Realtime
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {currentRoute.route_name} • Vehicle: <span className="text-amber-400 font-semibold">{busId.toUpperCase()}</span> • Driver: {driverName}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Trip Type Selector */}
          <button
            onClick={() => setTripType(tripType === 'Morning Pickup' ? 'Afternoon Drop' : 'Morning Pickup')}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            {tripType}
          </button>

          {/* GPS Tracking Mode Toggle */}
          <button
            onClick={() => setUseDeviceGps(!useDeviceGps)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              useDeviceGps
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30'
            }`}
            title="Toggle between Mobile Hardware GPS and Turn-by-Turn Road Simulation"
          >
            {useDeviceGps ? (
              <>
                <Smartphone className="w-3.5 h-3.5 text-white" />
                <span>Mobile GPS Active</span>
              </>
            ) : (
              <>
                <RouteIcon className="w-3.5 h-3.5 text-amber-400" />
                <span>Road Simulator (Click for Mobile GPS)</span>
              </>
            )}
          </button>

          {/* Emergency SOS */}
          <button
            onClick={() => setShowSosModal(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/30 flex items-center gap-1.5 transition animate-pulse"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Emergency SOS</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Map (60%), Right Stop/Student Manager (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        {/* Map Container */}
        <div className="lg:col-span-7 relative h-[380px] lg:h-auto min-h-[400px] border-b lg:border-b-0 lg:border-r border-slate-800">
          <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: '100%' }} />

          {/* Floating Telemetry HUD with GPS Satellite Status & Snap-to-Roads Indicator */}
          <div className="absolute top-4 left-4 z-[400] bg-slate-900/90 backdrop-blur-md p-3.5 rounded-2xl border border-slate-700 shadow-xl max-w-xs text-xs space-y-2.5">
            {/* GPS Signal Status */}
            <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-800">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <Satellite className="w-3.5 h-3.5 text-indigo-400" />
                <span>GPS Signal</span>
              </span>
              <span className={`font-bold px-2 py-0.5 rounded-md text-[11px] flex items-center gap-1 ${
                useDeviceGps
                  ? telemetry.status === 'locked'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : telemetry.status === 'searching'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : telemetry.status === 'poor_signal'
                    ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  useDeviceGps
                    ? telemetry.status === 'locked'
                      ? 'bg-emerald-400'
                      : telemetry.status === 'searching'
                      ? 'bg-amber-400 animate-ping'
                      : 'bg-rose-400'
                    : 'bg-emerald-400'
                }`}></span>
                {useDeviceGps
                  ? telemetry.status === 'locked'
                    ? `Locked (±${telemetry.accuracy}m)`
                    : telemetry.status === 'searching'
                    ? 'Searching...'
                    : telemetry.status === 'poor_signal'
                    ? `Weak (±${telemetry.accuracy}m)`
                    : 'Permission Denied'
                  : 'Turn-by-Turn Road Sim'}
              </span>
            </div>

            {/* Speed & Heading */}
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400 font-medium">Telemetry Speed</span>
              <span className="text-amber-400 font-black text-sm">{speed} km/h</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400 font-medium">Heading</span>
              <span className="text-slate-200 font-semibold flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-amber-400" /> {heading}°
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400 font-medium">Current Road</span>
              <span className="text-slate-200 font-semibold truncate max-w-[140px]">{currentRoad}</span>
            </div>

            {/* Snap to Road Status */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px]">
              <span className="text-slate-400">Road Snapping:</span>
              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                {isRoutingLoading ? (
                  <span className="text-amber-400 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Routing...
                  </span>
                ) : (
                  <span>🛣️ Snapped ({routingProvider.toUpperCase()})</span>
                )}
              </span>
            </div>
          </div>

          {/* Map Controls Floating in Bottom */}
          <div className="absolute bottom-4 left-4 right-4 z-[400] flex items-center justify-between gap-2 pointer-events-none">
            <div className="bg-slate-950/90 backdrop-blur px-3 py-1.5 rounded-xl border border-slate-700 text-[11px] text-slate-300 pointer-events-auto flex items-center gap-2">
              <span>📍 <span className="font-semibold text-amber-400">{stops.length} Numbered Stops</span> along street route</span>
              <span className="text-slate-500">•</span>
              <span className="text-emerald-400 font-medium">Zero Straight-Line Vectors</span>
            </div>

            <div className="flex items-center gap-2 pointer-events-auto">
              <button
                onClick={() => setShowAddStopModal(true)}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 text-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Stop</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Controller: Next Stop, Dynamic ETA, Students, Quick Actions */}
        <div className="lg:col-span-5 p-4 sm:p-6 flex flex-col space-y-5 bg-slate-900/40 overflow-y-auto max-h-[750px]">
          {/* Active / Next Stop Focus Card with DUAL-TIME ETA */}
          {nextStop && (
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-amber-500/40 p-5 rounded-3xl shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="bg-amber-500 text-slate-950 font-black text-xs px-2.5 py-1 rounded-xl">
                    STOP #{nextStop.stop_order}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">Target Stop</span>
                </div>

                {/* Delay Pill */}
                <span className={`text-xs px-3 py-1 rounded-full border font-bold ${nextStop.eta.delayBadgeColor}`}>
                  {nextStop.eta.statusLabel}
                </span>
              </div>

              <h3 className="text-lg font-black text-white mb-1">{nextStop.stop_name}</h3>
              <p className="text-xs text-slate-400 mb-4 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-400" /> Landmark: {nextStop.landmark || 'Main Road'}
              </p>

              {/* DUAL-TIME DISPLAY (Core Requirement) */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 mb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                    Original Schedule
                  </span>
                  <span className="text-base font-black text-slate-300">
                    {nextStop.eta.scheduledTimeString}
                  </span>
                </div>

                <div className="border-l border-slate-800 pl-3">
                  <span className="text-[10px] uppercase font-bold text-amber-400 block mb-0.5">
                    Live Predicted ETA (Secondary)
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-base font-black ${nextStop.eta.isDelayed ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {nextStop.eta.predictedTimeString}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      ({nextStop.eta.distanceFormatted})
                    </span>
                  </div>
                </div>
              </div>

              {/* One-Tap Stop Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSkipStopModal(true)}
                  className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition"
                >
                  Skip Stop
                </button>
                <button
                  onClick={() => {
                    if (activeStopIndex < stops.length - 1) {
                      setActiveStopIndex((prev) => prev + 1);
                    }
                  }}
                  className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-1"
                >
                  <span>Next Stop</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Stop Student Roster & Quick Boarding */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-bold text-white">Students at this Stop ({studentsAtNextStop.length})</h4>
              </div>

              <button
                onClick={() => setShowAddStudentModal(true)}
                className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Unscheduled</span>
              </button>
            </div>

            {studentsAtNextStop.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400">
                No students scheduled at this stop.
              </div>
            ) : (
              <div className="space-y-2">
                {studentsAtNextStop.map((student) => {
                  const isBoarded = student.boarding_status === 'Boarded';
                  const isDropped = student.boarding_status === 'Dropped';
                  const isAbsent = student.boarding_status === 'Absent';

                  return (
                    <div
                      key={student.id}
                      className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{student.full_name}</span>
                          <span className="text-[10px] text-slate-400">({student.class_grade} - {student.section})</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">Parent: {student.parent_phone}</p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleMarkStudent(student, 'Boarded')}
                          className={`px-2.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1 ${
                            isBoarded
                              ? 'bg-emerald-500 text-slate-950'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          }`}
                          title="Mark Boarded"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Boarded</span>
                        </button>

                        <button
                          onClick={() => handleMarkStudent(student, 'Dropped')}
                          className={`px-2.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1 ${
                            isDropped
                              ? 'bg-blue-500 text-white'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          }`}
                          title="Mark Dropped"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Dropped</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upcoming Stops List with Schedule vs Live ETA */}
          <div className="space-y-3 pt-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Full Route Schedule & Live Delay Offsets</span>
            </h4>

            <div className="space-y-2">
              {stopsWithEta.map((stop, idx) => {
                const isSelected = idx === activeStopIndex;
                const isPast = idx < activeStopIndex;

                return (
                  <div
                    key={stop.id}
                    onClick={() => setActiveStopIndex(idx)}
                    className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 text-xs ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/50 shadow-md'
                        : isPast
                        ? 'bg-slate-900/40 border-slate-800 opacity-60'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {/* Stop Reordering Arrows */}
                      <div className="flex flex-col items-center -my-1">
                        <button
                          type="button"
                          onClick={(e) => handleMoveStopUp(e, idx)}
                          disabled={idx === 0}
                          className="p-0.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20 disabled:pointer-events-none"
                          title="Move Stop Up (Re-routes street polyline)"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleMoveStopDown(e, idx)}
                          disabled={idx === stopsWithEta.length - 1}
                          className="p-0.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20 disabled:pointer-events-none"
                          title="Move Stop Down (Re-routes street polyline)"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>

                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
                        isSelected ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {stop.stop_order}
                      </div>
                      <div>
                        <p className="font-bold text-slate-200">{stop.stop_name}</p>
                        <p className="text-[11px] text-slate-400">{stop.landmark || 'Stop'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-[10px] text-slate-500 line-through">
                          Sched: {stop.eta.scheduledTimeString}
                        </div>
                        <div className={`font-black ${stop.eta.isDelayed ? 'text-rose-400' : 'text-emerald-400'}`}>
                          ETA: {stop.eta.predictedTimeString}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteStop(e, stop.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        title="Remove Stop & Re-route road geometry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ----------------- MODALS ----------------- */}

      {/* Add New Stop Modal */}
      {showAddStopModal && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-400" />
                <span>Add New Route Stop</span>
              </h3>
              <button onClick={() => setShowAddStopModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStop} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Stop Name / Village Crossing</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Inarwa Station Mor"
                  value={newStopForm.stop_name}
                  onChange={(e) => setNewStopForm({ ...newStopForm, stop_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-amber-400 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Scheduled Morning Pickup</label>
                  <input
                    type="text"
                    value={newStopForm.scheduled_pickup_time}
                    onChange={(e) => setNewStopForm({ ...newStopForm, scheduled_pickup_time: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Scheduled Afternoon Drop</label>
                  <input
                    type="text"
                    value={newStopForm.scheduled_drop_time}
                    onChange={(e) => setNewStopForm({ ...newStopForm, scheduled_drop_time: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={newStopForm.latitude}
                    onChange={(e) => setNewStopForm({ ...newStopForm, latitude: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={newStopForm.longitude}
                    onChange={(e) => setNewStopForm({ ...newStopForm, longitude: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Prominent Landmark</label>
                <input
                  type="text"
                  placeholder="e.g. Near Primary School Gate"
                  value={newStopForm.landmark}
                  onChange={(e) => setNewStopForm({ ...newStopForm, landmark: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddStopModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-lg"
                >
                  Save Stop to Supabase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Unscheduled Student Modal */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                <span>Add Unscheduled Student</span>
              </h3>
              <button onClick={() => setShowAddStudentModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUnscheduled} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Student Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alok Verma"
                  value={unscheduledForm.full_name}
                  onChange={(e) => setUnscheduledForm({ ...unscheduledForm, full_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Class / Grade</label>
                  <input
                    type="text"
                    value={unscheduledForm.class_grade}
                    onChange={(e) => setUnscheduledForm({ ...unscheduledForm, class_grade: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Section</label>
                  <input
                    type="text"
                    value={unscheduledForm.section}
                    onChange={(e) => setUnscheduledForm({ ...unscheduledForm, section: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Parent Phone Number</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={unscheduledForm.parent_phone}
                  onChange={(e) => setUnscheduledForm({ ...unscheduledForm, parent_phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow"
                >
                  Board Student Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Skip Stop Modal */}
      {showSkipStopModal && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span>Skip Stop #{nextStop?.stop_order}</span>
            </h3>
            <p className="text-xs text-slate-400">
              Skipping {nextStop?.stop_name}. Please specify a reason to broadcast to the Admin Center and parents:
            </p>

            <select
              value={skipReason}
              onChange={(e) => setSkipReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs outline-none"
            >
              <option>Heavy Traffic / Road Construction</option>
              <option>Road Blocked due to Festival / Procession</option>
              <option>All Scheduled Students Reported Absent</option>
              <option>Vehicle Route Detour Authorized</option>
            </select>

            <div className="pt-3 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowSkipStopModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSkipStop}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow"
              >
                Confirm Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Emergency SOS Modal */}
      {showSosModal && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-rose-950/90 border-2 border-rose-500 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-white">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-600 rounded-2xl">
                <ShieldAlert className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight">Broadcast Emergency SOS</h3>
                <p className="text-xs text-rose-200">Instant alert to School Principal, Transport Desk & Parents</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-semibold text-rose-200">Incident Classification</label>
              <select
                value={sosReason}
                onChange={(e) => setSosReason(e.target.value)}
                className="w-full bg-slate-900 border border-rose-500/60 rounded-xl px-3 py-2 text-white outline-none"
              >
                <option>Traffic Gridlock / Railway Crossing Closed</option>
                <option>Vehicle Breakdown / Flat Tyre</option>
                <option>Minor Road Accident / Collision</option>
                <option>Medical Emergency on Board</option>
                <option>Extreme Weather / Flooding</option>
              </select>
            </div>

            <div className="p-3 bg-rose-900/50 rounded-xl border border-rose-700/50 text-[11px] text-rose-200">
              ⚠️ Live coordinates ({coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}) will be broadcast to all connected parent devices.
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowSosModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-slate-300 font-bold text-xs hover:bg-slate-800"
              >
                Dismiss
              </button>
              <button
                onClick={handleSendSos}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-lg shadow-rose-600/50"
              >
                Trigger SOS Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverStopController;
