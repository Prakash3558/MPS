import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bus, MapPin, Navigation, Users, CheckCircle, Clock, Phone, AlertCircle,
  Plus, Trash2, Edit3, Shield, Power, Play, Square, RefreshCw, LogOut,
  ChevronRight, Compass, Check, X, Search, Calendar, UserCheck, UserMinus, Award,
  AlertTriangle, Key, Radio, Fuel, Wrench, ShieldAlert, Sparkles, Share2,
  Send, Zap, Home, Gauge, Layers, Eye, Activity, Smartphone, BellRing,
  Maximize2, Minimize2, LocateFixed, Lock, Unlock, ArrowUpRight, TrendingUp,
  Crosshair, Satellite, ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCMS } from '../../context/CMSContext';
import { StaffMember, TransportRoute, TransportStop, TransportStudentRosterItem, Student } from '../../types';
import { api } from '../../lib/api';
import L from 'leaflet';
import { DriverStopController } from '../fleet/DriverStopController';

// Accurate Math & Geodesic Telemetry Utilities
export const haversineDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371000; // Earth's mean radius in meters
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Accurate forward spherical bearing (0° = North, 90° = East, 180° = South, 270° = West)
export const computeBearing = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaLon = toRad(lon2 - lon1);
  const y = Math.sin(deltaLon) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLon);
  const bearing = (toDeg(Math.atan2(y, x)) + 360) % 360;
  return Math.round(bearing);
};

// 16-point cardinal compass directions
export const getCompassCardinal = (deg: number): { label: string; abbr: string } => {
  const normalized = ((deg % 360) + 360) % 360;
  const points = [
    { label: 'North', abbr: 'N' },
    { label: 'North-Northeast', abbr: 'NNE' },
    { label: 'Northeast', abbr: 'NE' },
    { label: 'East-Northeast', abbr: 'ENE' },
    { label: 'East', abbr: 'E' },
    { label: 'East-Southeast', abbr: 'ESE' },
    { label: 'Southeast', abbr: 'SE' },
    { label: 'South-Southeast', abbr: 'SSE' },
    { label: 'South', abbr: 'S' },
    { label: 'South-Southwest', abbr: 'SSW' },
    { label: 'Southwest', abbr: 'SW' },
    { label: 'West-Southwest', abbr: 'WSW' },
    { label: 'West', abbr: 'W' },
    { label: 'West-Northwest', abbr: 'WNW' },
    { label: 'Northwest', abbr: 'NW' },
    { label: 'North-Northwest', abbr: 'NNW' },
  ];
  const index = Math.round(normalized / 22.5) % 16;
  return points[index];
};

export type MapLayerOption = 'google_streets' | 'google_hybrid' | 'google_terrain' | 'carto_dark' | 'carto_voyager' | 'osm';

export const MAP_LAYERS: { id: MapLayerOption; label: string; icon: string; description: string }[] = [
  { id: 'google_streets', label: 'Google Roads', icon: '🗺️', description: 'Google Maps Streets & Highways' },
  { id: 'google_hybrid', label: 'Google Satellite', icon: '🛰️', description: 'Photographic Satellite with Roads' },
  { id: 'google_terrain', label: 'Google Terrain', icon: '🌄', description: 'Topographic Elevation & Contours' },
  { id: 'carto_dark', label: 'Night Drive', icon: '🌙', description: 'Dark Mode Map for Night Driving' },
  { id: 'carto_voyager', label: 'Carto Clean', icon: '🧭', description: 'High-DPI Clean Vector Cartography' },
  { id: 'osm', label: 'OpenStreetMap', icon: '🌐', description: 'Standard OpenStreetMap Grid' },
];

export const createTileLayer = (layerType: MapLayerOption): L.TileLayer => {
  switch (layerType) {
    case 'google_streets':
      return L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        subdomains: ['0', '1', '2', '3'],
        maxZoom: 20,
        attribution: '&copy; Google Maps'
      });
    case 'google_hybrid':
      return L.tileLayer('https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
        subdomains: ['0', '1', '2', '3'],
        maxZoom: 20,
        attribution: '&copy; Google Maps Satellite'
      });
    case 'google_terrain':
      return L.tileLayer('https://mt{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}', {
        subdomains: ['0', '1', '2', '3'],
        maxZoom: 20,
        attribution: '&copy; Google Maps Terrain'
      });
    case 'carto_dark':
      return L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 20,
        attribution: '&copy; CARTO Dark Matter'
      });
    case 'carto_voyager':
      return L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 20,
        attribution: '&copy; CARTO Voyager'
      });
    case 'osm':
    default:
      return L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      });
  }
};

// Accurate Paved Road Network of Sikta: Station -> Sikta Bazar -> Hospital Mod -> Bhawanipur Chowk -> Model Public School Gate
export const SIKTA_ROAD_NETWORK_COORDS: [number, number][] = [
  // 1. Sikta Railway Station Area (स्टेशन रोड) - Stop 1
  [27.024900, 84.681200],
  [27.025200, 84.681320],
  [27.025550, 84.681450],
  [27.025900, 84.681600],
  [27.026300, 84.681710],
  [27.026600, 84.681780],
  // 2. Sikta Main Market Chowk (बाज़ार चौक) - Stop 2
  [27.026800, 84.681800],

  // 3. Main Market towards Hospital Mod (अस्पताल मोड़ रोड)
  [27.026650, 84.681500],
  [27.026300, 84.681100],
  [27.025900, 84.680600],
  [27.025400, 84.680100],
  [27.024900, 84.679600],
  [27.024400, 84.679100],
  [27.023900, 84.678600],
  // 4. Sikta Hospital Mod (अस्पताल मोड़) - Stop 3
  [27.023500, 84.678200],

  // 5. Paved South-West Road towards Bhawanipur (भवानीपुर पक्की सड़क)
  [27.023100, 84.677800],
  [27.022700, 84.677400],
  [27.022300, 84.677000],
  [27.021900, 84.676600],
  [27.021500, 84.676100],
  [27.021100, 84.675600],
  [27.020700, 84.675100],
  [27.020300, 84.674600],
  [27.019900, 84.674200],
  // 6. Bhawanipur Tola Chowk (भवानीपुर चौक) - Stop 4
  [27.019500, 84.673800],

  // 7. Bhawanipur Village Paved Approach to School Campus
  [27.019200, 84.673500],
  [27.018900, 84.673200],
  [27.018600, 84.672900],
  [27.018300, 84.672700],
  [27.018100, 84.672550],
  // 8. Model Public School Main Gate (स्कूल गेट) - Stop 5
  [27.018000, 84.672500]
];

export const StaffDriverPortal: React.FC = () => {
  const { user, staff, loginUser, logout } = useAuth();
  const { settings } = useCMS();

  // Authentication State for Driver / Staff
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [rememberMeDevice, setRememberMeDevice] = useState(true);

  // Driver & Vehicle State
  const [driverStaff, setDriverStaff] = useState<StaffMember | null>(null);
  const [assignedRoute, setAssignedRoute] = useState<TransportRoute | null>(null);
  const [stops, setStops] = useState<TransportStop[]>([]);
  const [students, setStudents] = useState<TransportStudentRosterItem[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnDuty, setIsOnDuty] = useState(true);

  // Active Live Trip State & Telemetry
  const [isTripActive, setIsTripActive] = useState(false);
  const [tripType, setTripType] = useState<'Morning Pickup' | 'Afternoon Drop' | 'Special Event'>('Morning Pickup');
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [maxTripSpeed, setMaxTripSpeed] = useState(0);
  const [currentHeading, setCurrentHeading] = useState(65); // degrees
  const [compassSensorHeading, setCompassSensorHeading] = useState<number | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>({
    lat: 27.0250,
    lng: 84.6812
  });
  const [tripStartTime, setTripStartTime] = useState<string | null>(null);
  const [tripElapsedSeconds, setTripElapsedSeconds] = useState(0);
  const [boardedStatus, setBoardedStatus] = useState<Record<string, 'Boarded' | 'Dropped' | 'Absent' | 'Pending'>>({});
  const [isSimulatingDrive, setIsSimulatingDrive] = useState(false);
  const [isDwellActive, setIsDwellActive] = useState(false);
  const [nextStopDistMeters, setNextStopDistMeters] = useState<number | null>(null);
  const [nextStopEtaMinutes, setNextStopEtaMinutes] = useState<number | null>(null);
  const [currentStopName, setCurrentStopName] = useState<string | null>('Sikta Railway Station (सिकटा स्टेशन)');
  const [isUsingDeviceGps, setIsUsingDeviceGps] = useState(false);
  const [isGpsAcquiring, setIsGpsAcquiring] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'searching' | 'locked' | 'error' | 'idle'>('idle');
  const [gpsSource, setGpsSource] = useState<'satellite' | 'network' | 'manual' | 'preset'>('preset');
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  const [manualLocationQuery, setManualLocationQuery] = useState('');
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [locationSearchResults, setLocationSearchResults] = useState<any[]>([]);
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<string>('Sikta Main Road, West Champaran, Bihar');
  const [mapViewMode, setMapViewMode] = useState<'leaflet' | 'google_embed'>('leaflet');

  // Map Controls & Layers
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const vehicleMarkerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const stopMarkersRef = useRef<L.LayerGroup | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const geoWatchIdRef = useRef<number | null>(null);
  const simulationTimerRef = useRef<any>(null);
  const lastFixRef = useRef<{ lat: number; lng: number; time: number } | null>(null);
  const stationaryAnchorRef = useRef<{ lat: number; lng: number } | null>(null);
  const [mapLayerType, setMapLayerType] = useState<MapLayerOption>('google_streets');
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [autoFollowVehicle, setAutoFollowVehicle] = useState(true);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);

  // Navigation Tabs
  type TabType = 'live_trip' | 'supabase_controller' | 'students' | 'stops' | 'inspection' | 'fuel' | 'logs';
  const [activeTab, setActiveTab] = useState<TabType>('live_trip');

  // Modals
  const [showAddStopModal, setShowAddStopModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);

  // Fuel & Inspection historical lists
  const [inspectionLogs, setInspectionLogs] = useState<any[]>([]);
  const [fuelLogs, setFuelLogs] = useState<any[]>([]);
  const [completedTripLogs, setCompletedTripLogs] = useState<any[]>([]);

  // Stop Form
  const [stopForm, setStopForm] = useState({
    stopName: '',
    stopNumber: 1,
    pickupTime: '07:30 AM',
    dropTime: '02:45 PM',
    landmark: '',
    latitude: 27.0270,
    longitude: 84.6826,
    feeMonthly: 600,
    selectedStudentIds: [] as string[]
  });

  // Fast Add Student Form
  const [studentForm, setStudentForm] = useState({
    class: '10',
    section: 'A',
    rollNo: '',
    stopId: ''
  });

  // Vehicle Inspection Form
  const [inspectionForm, setInspectionForm] = useState({
    odometer: 42850,
    brakesOk: true,
    steeringOk: true,
    tiresOk: true,
    emergencyDoorOk: true,
    firstAidOk: true,
    fireExtinguisherOk: true,
    gpsTrackerOk: true,
    headlightsOk: true,
    hornOk: true,
    notes: ''
  });

  // Fuel Form
  const [fuelForm, setFuelForm] = useState({
    odometer: 42850,
    fuelLitres: 40,
    totalCost: 3800,
    stationName: 'Indian Oil Dealer, Sikta Highway',
    notes: 'Regular Diesel Refill'
  });

  // SOS Form
  const [sosReason, setSosReason] = useState('Vehicle Engine Breakdown');
  const [sosNotes, setSosNotes] = useState('');
  const [sosSending, setSosSending] = useState(false);

  // Student Search filter
  const [studentSearch, setStudentSearch] = useState('');
  const [stopFilter, setStopFilter] = useState('All');

  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'alert' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'alert' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // 1. Driver Login Handler
  const handleDriverLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const cleanUser = loginForm.username.trim();
    const cleanPass = loginForm.password.trim();

    if (!cleanUser || !cleanPass) {
      setLoginError('Both Username / Phone and Password are required.');
      return;
    }

    setLoginLoading(true);
    try {
      const res = await api.login({
        role: 'staff',
        username: cleanUser,
        password: cleanPass
      });

      if (res.success && res.staff) {
        loginUser({
          user: res.user,
          staff: res.staff,
          rememberMe: rememberMeDevice
        });
        showToast(`Welcome back, ${res.staff.name}! Driver Portal ready.`, 'success');
      } else {
        setLoginError(res.message || 'Invalid username or password. Please verify credentials.');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Failed to authenticate driver. Please check connection.');
    } finally {
      setLoginLoading(false);
    }
  };

  // 2. Load Driver Profile & Assigned Route Data
  const loadPortalData = useCallback(async () => {
    setLoading(true);
    try {
      const [staffList, routesList, allStp, allStd, fullStudentDb, inspList, fList, tripLogs] = await Promise.all([
        api.getStaff(),
        api.getTransport(),
        api.getTransportStops(),
        api.getTransportStudents(),
        api.getStudents(),
        api.getVehicleInspections(),
        api.getFuelLogs(),
        api.getDriverTrips()
      ]);

      // Match current logged-in user to staff member
      const activeStaffId = staff?.id || user?.id;
      const currentStaff = staffList.find(s => s.id === activeStaffId || s.username === user?.username) ||
        staffList.find(s => s.role === 'Driver') || staffList[0];

      setDriverStaff(currentStaff || null);
      setAllStudents(fullStudentDb || []);
      setInspectionLogs(inspList || []);
      setFuelLogs(fList || []);
      setCompletedTripLogs(tripLogs || []);

      // Match route assigned to this driver
      const route = routesList.find(r => r.id === currentStaff?.assignedRouteId || r.driverId === currentStaff?.id) || routesList[0];
      setAssignedRoute(route || null);

      const routeStops = allStp.filter(s => !route || s.routeId === route.id);
      setStops(routeStops);

      const routeStudents = allStd.filter(s => !route || s.routeId === route.id);
      setStudents(routeStudents);

      // Initialize stop form
      setStopForm(prev => ({
        ...prev,
        stopNumber: routeStops.length + 1,
        stopId: routeStops[0]?.id || ''
      }));

      // Check if vehicle has existing active live location on server
      if (route) {
        const liveLoc = await api.getVehicleLiveLocation(route.id);
        if (liveLoc && liveLoc.isActive) {
          setIsTripActive(true);
          setTripType(liveLoc.tripType as any || 'Morning Pickup');
          setCurrentCoords({ lat: liveLoc.latitude, lng: liveLoc.longitude });
          setCurrentSpeed(liveLoc.speed || 0);
          setTripStartTime(new Date(liveLoc.lastUpdated).toLocaleTimeString());
        }
      }
    } catch (e) {
      console.error('Error loading driver portal data:', e);
    } finally {
      setLoading(false);
    }
  }, [staff?.id, user?.id, user?.username]);

  useEffect(() => {
    if (staff || user?.role === 'admin') {
      loadPortalData();
    }
  }, [staff, user, loadPortalData]);

  // Trip Elapsed Timer
  useEffect(() => {
    let interval: any = null;
    if (isTripActive) {
      interval = setInterval(() => {
        setTripElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setTripElapsedSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTripActive]);

  // Format Elapsed Seconds
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours > 0 ? `${hours}:` : ''}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // 3. Leaflet Map Initialization
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Anchor coordinates: Sikta Center (27.0270° N, 84.6826° E)
    const initialLat = currentCoords.lat || 27.0270;
    const initialLng = currentCoords.lng || 84.6826;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 15,
      zoomControl: true
    });

    // Primary High-Definition Map Layer (Google Maps Roads by default)
    const initialLayer = createTileLayer(mapLayerType).addTo(map);
    tileLayerRef.current = initialLayer;

    const stopGroup = L.layerGroup().addTo(map);
    stopMarkersRef.current = stopGroup;

    // School Marker (Destination & Central Campus Depot at Bhawanipur, Kursi Barwa, Sikta)
    const schoolIcon = L.divIcon({
      className: 'custom-school-icon',
      html: `
        <div class="bg-gradient-to-r from-blue-700 to-indigo-700 text-white px-3 py-1.5 rounded-2xl shadow-2xl flex items-center gap-1.5 font-black text-xs border-2 border-white ring-4 ring-blue-500/30 whitespace-nowrap">
          <span>🏫</span>
          <span>MPS Sikta Campus</span>
        </div>
      `,
      iconSize: [140, 36],
      iconAnchor: [70, 18]
    });
    L.marker([27.0180, 84.6725], { icon: schoolIcon })
      .bindPopup(`
        <div class="p-2 space-y-1 font-sans text-xs">
          <div class="font-black text-sm text-blue-900 flex items-center gap-1">
            🏫 Model Public School (MPS)
          </div>
          <div class="text-slate-600 font-medium">AT- Bhawanipur, P.O.- Kursi Barwa, Sikta, West Champaran (845307)</div>
          <div class="text-[11px] text-emerald-600 font-bold">Central Transport Depot & Bus Bay A</div>
          <div class="text-slate-500 font-mono text-[10px]">27.0180° N, 84.6725° E</div>
        </div>
      `)
      .addTo(map);

    // Live Vehicle Marker with Directional Pointer and Non-Inverting Speed Badge
    const createBusIcon = (heading: number, speed: number, isStopped: boolean, vehicleNumber = 'Bus #01') => {
      const speedLabel = isStopped || speed < 2 ? 'STOPPED (0 km/h)' : `${speed} km/h`;
      const badgeColor = isStopped || speed < 2 
        ? 'bg-amber-600 text-amber-50 border-amber-300' 
        : speed > 40 
          ? 'bg-rose-600 text-white border-rose-300 animate-pulse' 
          : 'bg-emerald-600 text-white border-emerald-300';

      return L.divIcon({
        className: 'custom-bus-icon-container',
        html: `
          <div class="relative flex flex-col items-center select-none pointer-events-none" style="width: 140px; margin-left: -70px; margin-top: -62px;">
            <!-- Floating Upright Telemetry Badge (DOES NOT ROTATE - stays horizontal) -->
            <div class="mb-1 px-2.5 py-0.5 rounded-full ${badgeColor} text-[10px] font-mono font-black shadow-2xl border flex items-center gap-1.5 whitespace-nowrap">
              <span class="w-1.5 h-1.5 rounded-full ${isStopped ? 'bg-amber-200' : 'bg-white animate-ping'}"></span>
              <span>${speedLabel}</span>
              ${!isStopped && speed >= 2 ? `<span class="opacity-80 text-[9px] border-l border-white/40 pl-1">${heading}°</span>` : ''}
            </div>

            <!-- Vehicle Body + Direction Pointer (Rotates to Bearing) -->
            <div class="relative flex items-center justify-center w-12 h-12" style="transform: rotate(${heading}deg); transition: transform 0.4s cubic-bezier(0.2, 0.9, 0.3, 1);">
              <!-- Dynamic Pulse Wave -->
              <div class="absolute inset-0 rounded-full bg-amber-400/30 ${isStopped ? 'animate-pulse' : 'animate-ping'}"></div>
              
              <!-- Directional Arrow Head pointing forward (UP = 0deg = North) -->
              <div class="absolute -top-3 flex flex-col items-center">
                <div class="w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-b-[12px] border-b-amber-500 drop-shadow-md"></div>
              </div>

              <!-- Bus Vehicle Disk -->
              <div class="relative w-11 h-11 rounded-2xl bg-gradient-to-b from-amber-400 to-amber-500 text-slate-950 border-2 border-white shadow-2xl flex items-center justify-center font-black text-xl ring-4 ring-amber-400/40">
                🚌
              </div>
            </div>

            <!-- Vehicle Label -->
            <div class="mt-1 px-2 py-0.5 rounded bg-slate-900/90 text-amber-300 text-[9px] font-bold border border-slate-700 shadow whitespace-nowrap">
              ${vehicleNumber}
            </div>
          </div>
        `,
        iconSize: [140, 90],
        iconAnchor: [70, 62]
      });
    };

    const vehicleMarker = L.marker([initialLat, initialLng], {
      icon: createBusIcon(currentHeading, currentSpeed, currentSpeed < 2, assignedRoute?.busNumber || 'Bus #01')
    }).addTo(map);
    vehicleMarkerRef.current = vehicleMarker;

    // GPS Accuracy Circle
    const accuracyCircle = L.circle([initialLat, initialLng], {
      radius: 15,
      color: '#f59e0b',
      fillColor: '#fbbf24',
      fillOpacity: 0.15,
      weight: 1.5,
      dashArray: '4, 4'
    }).addTo(map);
    accuracyCircleRef.current = accuracyCircle;

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapContainerRef.current]);

  // Switch Tile Layer (Google Roads, Satellite Hybrid, Terrain, Night Drive, Carto Clean, OSM)
  const toggleMapLayer = (type: MapLayerOption) => {
    if (!mapInstanceRef.current) return;
    setMapLayerType(type);

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    const newLayer = createTileLayer(type).addTo(mapInstanceRef.current);
    tileLayerRef.current = newLayer;

    const matchedConfig = MAP_LAYERS.find(l => l.id === type);
    showToast(`🗺️ Map layer updated: ${matchedConfig?.label || type}`, 'info');
  };

  // Device orientation / magnetometer compass sensor
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      const heading = (e as any).webkitCompassHeading ?? (e.alpha !== null ? (360 - e.alpha) % 360 : null);
      if (heading !== null && !isNaN(heading)) {
        setCompassSensorHeading(Math.round(heading));
        // If vehicle is stationary (speed < 2), use the phone's physical compass heading!
        if (currentSpeed < 2) {
          setCurrentHeading(Math.round(heading));
        }
      }
    };

    if (typeof window !== 'undefined' && window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('deviceorientation', handleOrientation, true);
      }
    };
  }, [currentSpeed]);

  // Update stops and polyline on map whenever stops state updates
  useEffect(() => {
    if (!mapInstanceRef.current || !stopMarkersRef.current) return;
    stopMarkersRef.current.clearLayers();

    stops.forEach((st, idx) => {
      const lat = st.latitude;
      const lng = st.longitude;

      const stopIcon = L.divIcon({
        className: 'custom-stop-icon',
        html: `
          <div class="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-black px-3 py-1 rounded-full text-xs shadow-xl border-2 border-white flex items-center gap-1.5 cursor-pointer transform hover:scale-110 transition-transform whitespace-nowrap">
            <span class="w-4 h-4 rounded-full bg-white text-rose-600 flex items-center justify-center text-[10px] font-black">${st.stopNumber || idx + 1}</span>
            <span>${st.stopName}</span>
            <span class="bg-rose-900/80 text-[10px] px-1.5 py-0.5 rounded font-mono font-normal">${st.pickupTime}</span>
          </div>
        `,
        iconSize: [130, 28],
        iconAnchor: [65, 14]
      });

      const marker = L.marker([lat, lng], { icon: stopIcon });
      marker.bindPopup(`
        <div class="p-2 space-y-1.5 font-sans text-xs min-w-[200px]">
          <div class="font-black text-sm text-slate-900 flex items-center justify-between gap-1">
            <span class="flex items-center gap-1">
              <span class="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs">#${st.stopNumber || idx + 1}</span>
              ${st.stopName}
            </span>
          </div>
          <div class="text-slate-600 text-xs">Morning Pickup: <b class="text-emerald-700">${st.pickupTime}</b> | Drop: <b class="text-blue-700">${st.dropTime}</b></div>
          <div class="text-blue-600 font-bold">Assigned Students: ${st.studentCount || (st.assignedStudentIds || []).length}</div>
          ${st.landmark ? `<div class="text-slate-500 italic text-[11px]">Landmark: ${st.landmark}</div>` : ''}
          <div class="pt-1.5 border-t border-slate-200 text-[11px] flex items-center justify-between font-mono">
            <span class="text-slate-400">${lat.toFixed(4)}, ${lng.toFixed(4)}</span>
            <span class="text-emerald-700 font-bold">₹${st.feeMonthly || 600}/mo</span>
          </div>
        </div>
      `);
      stopMarkersRef.current?.addLayer(marker);
    });

    if (routePolylineRef.current && mapInstanceRef.current.hasLayer(routePolylineRef.current)) {
      mapInstanceRef.current.removeLayer(routePolylineRef.current);
    }

    // Always follow the real paved asphalt road of Sikta (Station -> Bazar -> Puraina -> Kursi Barwa -> School)
    routePolylineRef.current = L.polyline(SIKTA_ROAD_NETWORK_COORDS, {
      color: '#f59e0b',
      weight: 6,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(mapInstanceRef.current);
  }, [stops]);

  // Center map on vehicle
  const centerMapOnVehicle = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView([currentCoords.lat, currentCoords.lng], 16, { animate: true });
  };

  // 4. Accurate GPS Real-time Telemetry & Map Update Engine
  const updateVehiclePosition = (lat: number, lng: number, speed: number, heading = 0, accuracy = 5) => {
    setCurrentCoords({ lat, lng });
    setCurrentSpeed(speed);
    setCurrentHeading(heading);
    setGpsAccuracy(accuracy);
    setMaxTripSpeed(prev => Math.max(prev, speed));

    // Calculate distance and dynamic ETA to nearest or upcoming stop
    if (stops.length > 0) {
      let nearestStop = stops[0];
      let minDistance = Infinity;
      for (const st of stops) {
        const d = haversineDistanceMeters(lat, lng, st.latitude, st.longitude);
        if (d < minDistance) {
          minDistance = d;
          nearestStop = st;
        }
      }
      setNextStopDistMeters(Math.round(minDistance));
      
      const effectiveSpeedKmh = speed > 5 ? speed : 25;
      const etaMins = Math.max(1, Math.round((minDistance / ((effectiveSpeedKmh * 1000) / 60))));
      setNextStopEtaMinutes(etaMins);
      setCurrentStopName(nearestStop.stopName);
    }

    // Auto-pan map if auto-follow is active
    if (autoFollowVehicle && mapInstanceRef.current) {
      mapInstanceRef.current.panTo([lat, lng], { animate: true, duration: 0.5 });
    }

    if (vehicleMarkerRef.current) {
      vehicleMarkerRef.current.setLatLng([lat, lng]);
      
      const createBusIcon = (h: number, s: number, isStopped: boolean, vehicleNumber = 'Bus #01') => {
        const speedLabel = isStopped || s < 2 ? 'STOPPED (0 km/h)' : `${s} km/h`;
        const badgeColor = isStopped || s < 2 
          ? 'bg-amber-600 text-amber-50 border-amber-300' 
          : s > 40 
            ? 'bg-rose-600 text-white border-rose-300 animate-pulse' 
            : 'bg-emerald-600 text-white border-emerald-300';

        return L.divIcon({
          className: 'custom-bus-icon-container',
          html: `
            <div class="relative flex flex-col items-center select-none pointer-events-none" style="width: 140px; margin-left: -70px; margin-top: -62px;">
              <div class="mb-1 px-2.5 py-0.5 rounded-full ${badgeColor} text-[10px] font-mono font-black shadow-2xl border flex items-center gap-1.5 whitespace-nowrap">
                <span class="w-1.5 h-1.5 rounded-full ${isStopped ? 'bg-amber-200' : 'bg-white animate-ping'}"></span>
                <span>${speedLabel}</span>
                ${!isStopped && s >= 2 ? `<span class="opacity-80 text-[9px] border-l border-white/40 pl-1">${h}°</span>` : ''}
              </div>

              <div class="relative flex items-center justify-center w-12 h-12" style="transform: rotate(${h}deg); transition: transform 0.4s cubic-bezier(0.2, 0.9, 0.3, 1);">
                <div class="absolute inset-0 rounded-full bg-blue-500/30 ${isStopped ? 'animate-pulse' : 'animate-ping'}"></div>
                <div class="absolute -top-3 flex flex-col items-center">
                  <div class="w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-b-[12px] border-b-blue-600 drop-shadow-md"></div>
                </div>
                <div class="relative w-11 h-11 rounded-2xl bg-gradient-to-b from-amber-400 to-amber-500 text-slate-950 border-2 border-white shadow-2xl flex items-center justify-center font-black text-xl ring-4 ring-amber-400/40">
                  🚌
                </div>
              </div>

              <div class="mt-1 px-2 py-0.5 rounded bg-slate-900/90 text-amber-300 text-[9px] font-bold border border-slate-700 shadow whitespace-nowrap">
                ${vehicleNumber}
              </div>
            </div>
          `,
          iconSize: [140, 90],
          iconAnchor: [70, 62]
        });
      };

      vehicleMarkerRef.current.setIcon(
        createBusIcon(heading, speed, speed < 2, assignedRoute?.busNumber || 'Bus #01')
      );
    }

    if (accuracyCircleRef.current) {
      accuracyCircleRef.current.setLatLng([lat, lng]);
      accuracyCircleRef.current.setRadius(Math.max(6, accuracy));
    }

    // Broadcast live telemetry to backend API when trip is active
    if (assignedRoute && isTripActive) {
      const nextStop = stops.find(s => s.stopNumber === 1) || stops[0];
      const boardedCount = Object.values(boardedStatus).filter(s => s === 'Boarded').length;

      api.updateVehicleLiveLocation({
        routeId: assignedRoute.id,
        staffId: driverStaff?.id,
        latitude: lat,
        longitude: lng,
        speed,
        heading,
        accuracy,
        tripType,
        nextStopName: nextStop ? nextStop.stopName : 'School Campus',
        studentsBoardedCount: boardedCount
      });
    }
  };

  // Continuous Mobile Geolocation Watcher (Google Maps Grade)
  const startContinuousWatcher = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;

    if (geoWatchIdRef.current !== null) {
      navigator.geolocation.clearWatch(geoWatchIdRef.current);
      geoWatchIdRef.current = null;
    }

    const onPos = (pos: GeolocationPosition) => {
      const { latitude, longitude, speed, heading, accuracy } = pos.coords;
      const now = Date.now();
      let resolvedSpeed = 0;
      let resolvedHeading = currentHeading;

      setIsUsingDeviceGps(true);
      setGpsStatus('locked');
      setGpsAccuracy(Math.round(accuracy || 5));

      if (!stationaryAnchorRef.current) {
        stationaryAnchorRef.current = { lat: latitude, lng: longitude };
      }

      const distFromAnchor = haversineDistanceMeters(
        stationaryAnchorRef.current.lat,
        stationaryAnchorRef.current.lng,
        latitude,
        longitude
      );

      // Speed resolution
      if (speed !== null && speed !== undefined && !isNaN(speed) && speed >= 0.8) {
        resolvedSpeed = Math.min(65, Math.round(speed * 3.6));
        stationaryAnchorRef.current = { lat: latitude, lng: longitude };
        if (heading !== null && heading !== undefined && !isNaN(heading) && heading >= 0) {
          resolvedHeading = Math.round(heading);
        } else if (lastFixRef.current) {
          resolvedHeading = computeBearing(lastFixRef.current.lat, lastFixRef.current.lng, latitude, longitude);
        }
      } else if (distFromAnchor < 4) {
        // Micro-jitter suppression under 4m
        resolvedSpeed = 0;
        updateVehiclePosition(
          stationaryAnchorRef.current.lat,
          stationaryAnchorRef.current.lng,
          0,
          currentHeading,
          Math.round(accuracy || 5)
        );
        return;
      } else {
        const dt = (now - (lastFixRef.current?.time || now - 1000)) / 1000;
        const rawKmh = (distFromAnchor / Math.max(1, dt)) * 3.6;
        if (rawKmh < 2.5) {
          resolvedSpeed = 0;
        } else {
          resolvedSpeed = Math.min(65, Math.round(rawKmh));
          stationaryAnchorRef.current = { lat: latitude, lng: longitude };
          if (lastFixRef.current) {
            resolvedHeading = computeBearing(lastFixRef.current.lat, lastFixRef.current.lng, latitude, longitude);
          }
        }
      }

      lastFixRef.current = { lat: latitude, lng: longitude, time: now };
      updateVehiclePosition(latitude, longitude, resolvedSpeed, resolvedHeading, Math.round(accuracy || 5));
    };

    const onError = (err: GeolocationPositionError) => {
      console.warn('GPS continuous watcher notice:', err.message);
      if (err.code === err.PERMISSION_DENIED) {
        setLocationPermissionDenied(true);
        if (geoWatchIdRef.current !== null) {
          navigator.geolocation.clearWatch(geoWatchIdRef.current);
          geoWatchIdRef.current = null;
        }
      }
    };

    geoWatchIdRef.current = navigator.geolocation.watchPosition(
      onPos,
      onError,
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
    );
  }, [currentHeading, isTripActive, assignedRoute, driverStaff, stops, boardedStatus, tripType]);

  // Acquire Real High-Precision GPS Location from Browser/Device with Multi-Tier Fallback
  const acquireDeviceLocation = useCallback((centerMap = true, silent = false) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      if (!silent) showToast('Geolocation is not supported by your current browser.', 'alert');
      return;
    }

    setIsGpsAcquiring(true);
    setGpsStatus('searching');
    setLocationPermissionDenied(false);

    if (!silent) {
      showToast('📡 Connecting to device GPS & satellite sensors...', 'info');
    }

    const applyFix = async (pos: GeolocationPosition, source: 'satellite' | 'network') => {
      setIsGpsAcquiring(false);
      setIsUsingDeviceGps(true);
      setGpsStatus('locked');
      setGpsSource(source);
      setLocationPermissionDenied(false);

      const { latitude, longitude, speed, heading, accuracy } = pos.coords;
      const resolvedSpeed = speed && !isNaN(speed) && speed > 0 ? Math.round(speed * 3.6) : 0;
      const resolvedHeading = heading && !isNaN(heading) && heading >= 0 ? Math.round(heading) : currentHeading;
      const resolvedAccuracy = Math.round(accuracy || (source === 'satellite' ? 5 : 25));

      stationaryAnchorRef.current = { lat: latitude, lng: longitude };
      lastFixRef.current = { lat: latitude, lng: longitude, time: Date.now() };

      updateVehiclePosition(latitude, longitude, resolvedSpeed, resolvedHeading, resolvedAccuracy);

      if (mapInstanceRef.current && centerMap) {
        mapInstanceRef.current.setView([latitude, longitude], 16, { animate: true });
      }

      // Reverse geocoding to retrieve readable physical address
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.display_name) {
            const addr = data.address;
            const shortName = [
              addr?.road || addr?.suburb || addr?.neighbourhood,
              addr?.city || addr?.town || addr?.village || addr?.county,
              addr?.state
            ].filter(Boolean).join(', ') || data.display_name;
            setCurrentAddress(shortName);
            setCurrentStopName(shortName);
          }
        }
      } catch (e) {
        // fallback
      }

      if (!silent) {
        showToast(
          `🎯 Real Location Locked: ${latitude.toFixed(5)}° N, ${longitude.toFixed(5)}° E (±${resolvedAccuracy}m ${source === 'satellite' ? 'GPS' : 'Network'})`,
          'success'
        );
      }

      startContinuousWatcher();
    };

    // Strategy: First try high-accuracy satellite GPS. If timeout or unavailable, fallback to network/wifi
    navigator.geolocation.getCurrentPosition(
      pos => applyFix(pos, 'satellite'),
      () => {
        // Fallback to standard network location
        navigator.geolocation.getCurrentPosition(
          pos => applyFix(pos, 'network'),
          (fallbackErr) => {
            setIsGpsAcquiring(false);
            setGpsStatus('idle');
            if (fallbackErr.code === fallbackErr.PERMISSION_DENIED) {
              setLocationPermissionDenied(true);
              if (!silent) {
                showToast('Location permission is disabled in browser. Please enable location or use search below.', 'info');
              }
            } else if (!silent) {
              showToast('Could not acquire device GPS. You can pin or search any location manually below.', 'info');
            }
          },
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  }, [currentHeading, startContinuousWatcher]);

  // Search Address / Coordinates
  const handleSearchLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualLocationQuery.trim()) return;

    setIsSearchingLocation(true);
    try {
      // Check if user entered Lat, Lng directly
      const latLngMatch = manualLocationQuery.match(/^([-+]?[0-9]*\.?[0-9]+)\s*,\s*([-+]?[0-9]*\.?[0-9]+)$/);
      if (latLngMatch) {
        const lat = parseFloat(latLngMatch[1]);
        const lng = parseFloat(latLngMatch[2]);
        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          applyManualCoordinates(lat, lng, `Pin Coordinates (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
          setIsSearchingLocation(false);
          return;
        }
      }

      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(manualLocationQuery)}&limit=5`);
      if (res.ok) {
        const data = await res.json();
        setLocationSearchResults(data || []);
        if (data && data.length === 0) {
          showToast('No location found for this search. Try entering city name or Lat, Lng coordinates.', 'info');
        }
      }
    } catch (err) {
      console.warn('Location search notice:', err);
      showToast('Location search failed. Check your internet connection.', 'alert');
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const applyManualCoordinates = (lat: number, lng: number, label: string) => {
    setIsUsingDeviceGps(true);
    setGpsSource('manual');
    setGpsStatus('locked');
    setGpsAccuracy(5);
    stationaryAnchorRef.current = { lat, lng };
    lastFixRef.current = { lat, lng, time: Date.now() };

    updateVehiclePosition(lat, lng, 0, currentHeading, 5);
    setCurrentStopName(label);
    setCurrentAddress(label);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], 16, { animate: true });
    }

    setLocationSearchResults([]);
    setShowLocationSearch(false);
    showToast(`📍 Location updated to: ${label}`, 'success');
  };

  // Quick Landmark / Preset Snapper for testing or when GPS is restricted
  const snapToPresetLocation = (name: string, lat: number, lng: number) => {
    updateVehiclePosition(lat, lng, 0, currentHeading, 3);
    stationaryAnchorRef.current = { lat, lng };
    setCurrentStopName(name);
    setCurrentAddress(`${name}, Sikta, West Champaran (845307)`);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], 16, { animate: true });
    }
    showToast(`📍 Bus location set to ${name}`, 'info');
  };

  // Launch Google Maps Driving Navigation (Turn-by-turn to School Campus)
  const openGoogleMapsNavigation = () => {
    const destLat = 27.0180;
    const destLng = 84.6725;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${currentCoords.lat},${currentCoords.lng}&destination=${destLat},${destLng}&travelmode=driving`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Open Current Location Pin on Google Maps
  const openGoogleMapsPin = () => {
    const url = `https://www.google.com/maps?q=${currentCoords.lat},${currentCoords.lng}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Open School Campus on Google Maps
  const openSchoolGoogleMaps = () => {
    const url = `https://www.google.com/maps?q=27.0180,84.6725+(Model+Public+School+Sikta+West+Champaran)`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // 5. Start Trip Handler with High-Precision Continuous GPS Tracking
  const startTrip = () => {
    setIsTripActive(true);
    const startStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setTripStartTime(startStr);
    showToast(`🚀 ${tripType} चालू हुआ! GPS लाइव लोकेशन स्कूल व अभिभावकों को जा रहा है।`, 'success');

    // Acquire real high-accuracy GPS fix from device & start continuous watcher
    acquireDeviceLocation(true, false);
    startContinuousWatcher();
  };

  // Check geolocation permissions on portal mount; acquire only if already granted
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((res) => {
          if (res.state === 'granted') {
            acquireDeviceLocation(true, true);
          } else if (res.state === 'denied') {
            setLocationPermissionDenied(true);
          }
        }).catch(() => {
          // If query fails or is not allowed in iframe, avoid uninvited prompt
        });
      }
    }
  }, [acquireDeviceLocation]);

  // 6. Test Route Simulation (Strictly along Sikta Paved Road Network, never across fields or houses)
  const toggleRouteSimulation = () => {
    if (isSimulatingDrive) {
      if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);
      simulationTimerRef.current = null;
      setIsSimulatingDrive(false);
      setIsDwellActive(false);
      showToast('सिमुलेशन रोक दिया गया (Simulation Paused)', 'info');
      return;
    }

    setIsSimulatingDrive(true);
    if (!isTripActive) {
      setIsTripActive(true);
      const startStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setTripStartTime(startStr);
    }
    showToast('🚗 पक्की सड़क पर टेस्ट ड्राइव शुरू (Driving along Sikta paved roads)...', 'success');

    const roadPoints = SIKTA_ROAD_NETWORK_COORDS;
    const stopMatchPoints = stops.map(s => {
      let closestIdx = 0;
      let minD = Infinity;
      roadPoints.forEach((pt, idx) => {
        const d = haversineDistanceMeters(pt[0], pt[1], s.latitude, s.longitude);
        if (d < minD) {
          minD = d;
          closestIdx = idx;
        }
      });
      return { stop: s, roadIdx: closestIdx };
    });

    let currentRoadIdx = 0;
    let dwellTicksRemaining = 0;

    simulationTimerRef.current = setInterval(() => {
      if (dwellTicksRemaining > 0) {
        dwellTicksRemaining--;
        const currentPt = roadPoints[currentRoadIdx];
        // While dwelling at a stop, speed is strictly 0 km/h
        updateVehiclePosition(currentPt[0], currentPt[1], 0, currentHeading, 3);
        if (dwellTicksRemaining === 0) {
          setIsDwellActive(false);
          currentRoadIdx++;
          if (currentRoadIdx >= roadPoints.length) {
            currentRoadIdx = 0;
            showToast('🏁 मॉडल पब्लिक स्कूल पहुंचे! यात्रा पूरी हुई (Reached Model Public School)', 'success');
          } else {
            showToast('🚍 बस आगे रवाना हो रही है (Bus departing)...', 'info');
          }
        }
        return;
      }

      if (currentRoadIdx >= roadPoints.length - 1) {
        const lastPt = roadPoints[roadPoints.length - 1];
        updateVehiclePosition(lastPt[0], lastPt[1], 0, currentHeading, 3);
        showToast('🏁 मॉडल पब्लिक स्कूल पहुंचे! सफ़र पूरा हुआ (0 km/h)', 'success');
        dwellTicksRemaining = 5;
        currentRoadIdx = 0;
        return;
      }

      const p1 = roadPoints[currentRoadIdx];
      const p2 = roadPoints[currentRoadIdx + 1];
      const bearing = computeBearing(p1[0], p1[1], p2[0], p2[1]);

      // Check if current point is near a stop
      const matchedStop = stopMatchPoints.find(sp => Math.abs(sp.roadIdx - currentRoadIdx) <= 1);
      if (matchedStop && !isDwellActive && dwellTicksRemaining === 0) {
        setIsDwellActive(true);
        dwellTicksRemaining = 4; // Stop 4s for student boarding
        setCurrentStopName(matchedStop.stop.stopName);
        updateVehiclePosition(p1[0], p1[1], 0, bearing, 3);
        showToast(`📍 स्टॉप: ${matchedStop.stop.stopName} पहुंचे! (0 km/h) बच्चे चढ़ रहे हैं`, 'info');
        return;
      }

      // Normal road cruising speed (28-34 km/h)
      const simSpeed = 30 + Math.floor(Math.sin(currentRoadIdx) * 4);
      updateVehiclePosition(p1[0], p1[1], simSpeed, bearing, 3);
      currentRoadIdx++;
    }, 1000);
  };

  // 7. Finish Trip Handler
  const finishTrip = async () => {
    if (!assignedRoute) return;

    if (geoWatchIdRef.current !== null) {
      navigator.geolocation.clearWatch(geoWatchIdRef.current);
      geoWatchIdRef.current = null;
    }

    if (simulationTimerRef.current) {
      clearInterval(simulationTimerRef.current);
      simulationTimerRef.current = null;
      setIsSimulatingDrive(false);
    }

    const totalBoarded = Object.values(boardedStatus).filter(s => s === 'Boarded').length;

    await api.finishDriverTrip({
      routeId: assignedRoute.id,
      staffId: driverStaff?.id,
      tripType,
      startTime: tripStartTime || new Date().toLocaleTimeString(),
      totalBoarded,
      totalStudents: students.length,
      notes: 'Trip completed safely. All students transported.'
    });

    setIsTripActive(false);
    setCurrentSpeed(0);
    showToast('✅ Trip completed! GPS transmission turned off and log archived.', 'success');
    loadPortalData();
  };

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (geoWatchIdRef.current !== null) navigator.geolocation.clearWatch(geoWatchIdRef.current);
      if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);
    };
  }, []);

  // 8. Toggle student boarding status & send WhatsApp notification to parent
  const handleToggleBoarding = (studentId: string, status: 'Boarded' | 'Dropped' | 'Absent') => {
    setBoardedStatus(prev => ({
      ...prev,
      [studentId]: prev[studentId] === status ? 'Pending' : status
    }));
  };

  // Quick Board All at a specific Stop
  const handleBoardAllAtStop = (stopId: string) => {
    const studentsAtStop = students.filter(s => s.stopId === stopId);
    setBoardedStatus(prev => {
      const next = { ...prev };
      studentsAtStop.forEach(s => {
        next[s.studentId] = 'Boarded';
      });
      return next;
    });
    showToast(`Boarded all ${studentsAtStop.length} students for this stop.`, 'success');
  };

  // Driver 1-Tap: Arrived at Next Stop
  const handleArriveAtNextStop = () => {
    if (!stops.length) return;
    const currentIdx = stops.findIndex(s => s.stopName === currentStopName);
    const nextIdx = currentIdx >= 0 && currentIdx < stops.length - 1 ? currentIdx + 1 : 0;
    const targetStop = stops[nextIdx];
    setCurrentStopName(targetStop.stopName);

    const d = haversineDistanceMeters(currentCoords.lat, currentCoords.lng, targetStop.latitude, targetStop.longitude);
    setNextStopDistMeters(Math.round(d));
    setNextStopEtaMinutes(Math.max(1, Math.round(d / ((25 * 1000) / 60))));

    showToast(`✅ ${targetStop.stopName} पर पहुंच गए! बच्चों को चढ़ाएं।`, 'success');
  };

  // Driver 1-Tap: Quick Passenger Count +/-
  const handleQuickPassengerCount = (delta: number) => {
    const unboarded = students.filter(s => (boardedStatus[s.studentId] || 'Pending') !== 'Boarded');
    const boarded = students.filter(s => boardedStatus[s.studentId] === 'Boarded');

    if (delta > 0 && unboarded.length > 0) {
      setBoardedStatus(prev => ({ ...prev, [unboarded[0].studentId]: 'Boarded' }));
      showToast(`➕ 1 बच्चा चढ़ा (${unboarded[0].studentName})`, 'info');
    } else if (delta < 0 && boarded.length > 0) {
      setBoardedStatus(prev => ({ ...prev, [boarded[boarded.length - 1].studentId]: 'Dropped' }));
      showToast(`➖ 1 बच्चा उतरा (${boarded[boarded.length - 1].studentName})`, 'info');
    }
  };

  // 9. Submit Emergency SOS Alert
  const handleSendSOS = async (e: React.FormEvent) => {
    e.preventDefault();
    setSosSending(true);
    try {
      await api.sendTransportSOS({
        routeId: assignedRoute?.id || 'tr-1',
        vehicleNumber: assignedRoute?.busNumber || 'Bus #01',
        driverName: driverStaff?.name || 'Vikram Singh',
        reason: sosReason,
        location: { lat: currentCoords.lat, lng: currentCoords.lng }
      });
      setShowSosModal(false);
      setSosNotes('');
      showToast('🚨 EMERGENCY SOS DISPATCHED TO SCHOOL DISPATCH & ALL PARENTS!', 'alert');
    } catch (err: any) {
      showToast(err.message || 'Failed to dispatch SOS alert.', 'alert');
    } finally {
      setSosSending(false);
    }
  };

  // 10. Submit Vehicle Inspection
  const handleSubmitInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.submitVehicleInspection({
        routeId: assignedRoute?.id || 'route_1',
        busNumber: assignedRoute?.busNumber || 'Bus #01',
        driverName: driverStaff?.name || 'Vikram Singh',
        odometer: Number(inspectionForm.odometer),
        checklist: {
          brakes: inspectionForm.brakesOk,
          steering: inspectionForm.steeringOk,
          tires: inspectionForm.tiresOk,
          emergencyDoor: inspectionForm.emergencyDoorOk,
          firstAid: inspectionForm.firstAidOk,
          fireExtinguisher: inspectionForm.fireExtinguisherOk,
          gpsTracker: inspectionForm.gpsTrackerOk,
          headlights: inspectionForm.headlightsOk,
          horn: inspectionForm.hornOk
        },
        notes: inspectionForm.notes
      });
      setShowInspectionModal(false);
      showToast('✅ Pre-trip vehicle inspection checklist verified and logged!', 'success');
      loadPortalData();
    } catch (err: any) {
      showToast(err.message || 'Error submitting inspection', 'alert');
    }
  };

  // 11. Submit Fuel Refill Log
  const handleSubmitFuel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.submitFuelLog({
        routeId: assignedRoute?.id || 'route_1',
        busNumber: assignedRoute?.busNumber || 'Bus #01',
        driverName: driverStaff?.name || 'Vikram Singh',
        odometer: Number(fuelForm.odometer),
        fuelLitres: Number(fuelForm.fuelLitres),
        totalCost: Number(fuelForm.totalCost),
        stationName: fuelForm.stationName,
        notes: fuelForm.notes
      });
      setShowFuelModal(false);
      showToast(`⛽ Fuel refill entry logged: ${fuelForm.fuelLitres}L (₹${fuelForm.totalCost})`, 'success');
      loadPortalData();
    } catch (err: any) {
      showToast(err.message || 'Error submitting fuel log', 'alert');
    }
  };

  // 12. Add new stop handler
  const handleAddStop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignedRoute) return;
    try {
      await api.createTransportStop({
        routeId: assignedRoute.id,
        stopName: stopForm.stopName,
        stopNumber: Number(stopForm.stopNumber),
        pickupTime: stopForm.pickupTime,
        dropTime: stopForm.dropTime,
        landmark: stopForm.landmark,
        latitude: Number(stopForm.latitude),
        longitude: Number(stopForm.longitude),
        feeMonthly: Number(stopForm.feeMonthly),
        assignedStudentIds: []
      });
      setShowAddStopModal(false);
      showToast(`Stop "${stopForm.stopName}" added successfully.`, 'success');
      loadPortalData();
    } catch (err: any) {
      showToast(err.message || 'Error adding stop', 'alert');
    }
  };

  // 13. Fast Add Student to Bus
  const handleAddStudentToBus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignedRoute || !studentForm.rollNo || !studentForm.stopId) return;

    const matched = allStudents.find(s =>
      s.rollNo === studentForm.rollNo.trim() &&
      s.class === studentForm.class &&
      s.section === studentForm.section
    );

    if (!matched) {
      showToast(`Student with Roll #${studentForm.rollNo} in Class ${studentForm.class}-${studentForm.section} not found in database.`, 'alert');
      return;
    }

    const matchedStop = stops.find(s => s.id === studentForm.stopId);

    try {
      await api.addTransportStudent({
        routeId: assignedRoute.id,
        studentId: matched.id,
        studentName: matched.name,
        rollNo: matched.rollNo,
        class: matched.class,
        section: matched.section,
        stopId: studentForm.stopId,
        stopName: matchedStop?.stopName || 'Designated Stop',
        pickupTime: matchedStop?.pickupTime || '07:30 AM',
        dropTime: matchedStop?.dropTime || '02:45 PM'
      });
      setShowAddStudentModal(false);
      showToast(`Added ${matched.name} to bus roster!`, 'success');
      loadPortalData();
    } catch (err: any) {
      showToast(err.message || 'Error adding student', 'alert');
    }
  };

  // Roster Filtered Students
  const filteredStudents = students.filter(st => {
    const matchesSearch = studentSearch === '' ||
      st.studentName.toLowerCase().includes(studentSearch.toLowerCase()) ||
      st.rollNo.includes(studentSearch) ||
      st.stopName.toLowerCase().includes(studentSearch.toLowerCase());
    const matchesStop = stopFilter === 'All' || st.stopId === stopFilter;
    return matchesSearch && matchesStop;
  });

  const totalBoardedCount = Object.values(boardedStatus).filter(s => s === 'Boarded').length;
  const boardingPercentage = students.length > 0 ? Math.round((totalBoardedCount / students.length) * 100) : 0;

  // -------------------------------------------------------------
  // GUARD: If user is not logged in as Staff or Admin, show dedicated Staff / Driver Login Screen!
  // -------------------------------------------------------------
  if (!staff && user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-3xl bg-amber-500 text-slate-950 p-2 flex items-center justify-center mx-auto shadow-2xl ring-4 ring-amber-500/20">
              <Bus className="w-9 h-9" />
            </div>
            <h2 className="text-2xl font-black text-white font-heading tracking-tight">
              MPS Driver & Staff Portal
            </h2>
            <p className="text-xs text-slate-400">
              Fleet Tracking, Student Boarding & Real-time Phone GPS
            </p>
          </div>

          <div className="bg-slate-900 p-6 sm:p-8 rounded-3xl shadow-2xl border border-slate-800 space-y-4">
            {loginError && (
              <div className="p-3 bg-rose-950/80 text-rose-300 text-xs rounded-xl border border-rose-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleDriverLogin} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Driver / Staff Username or Mobile
                </label>
                <div className="relative">
                  <Users className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={loginForm.username}
                    onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
                    placeholder="e.g. driver1, driver2, conductor1"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Driver Secret Password
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={loginForm.password}
                    onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                    placeholder="Enter password (default: driver123)"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-normal"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs py-0.5">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white select-none">
                  <input
                    type="checkbox"
                    checked={rememberMeDevice}
                    onChange={e => setRememberMeDevice(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-slate-800 border-slate-700 focus:ring-amber-500 accent-amber-500 cursor-pointer"
                  />
                  <span className="font-semibold text-slate-200">Remember this vehicle device</span>
                </label>
                <span className="text-[11px] text-emerald-400 font-bold hidden sm:inline">Saved session ✓</span>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl shadow-lg transition-transform hover:scale-[1.01] cursor-pointer"
              >
                {loginLoading ? 'Verifying Driver Credentials...' : 'Sign In To Driver Portal'}
              </button>
            </form>

            <div className="pt-3 border-t border-slate-800 text-center flex items-center justify-between text-xs text-slate-400">
              <a href="/" className="inline-flex items-center gap-1.5 hover:text-white transition-colors">
                <Home className="w-3.5 h-3.5" /> School Home
              </a>
              <a href="/portal" className="inline-flex items-center gap-1.5 hover:text-amber-400 transition-colors">
                Student Portal &rarr;
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // AUTHENTICATED DRIVER PORTAL UI
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-3 border ${
          toastMessage.type === 'alert'
            ? 'bg-rose-600 text-white border-rose-400'
            : toastMessage.type === 'info'
            ? 'bg-blue-600 text-white border-blue-400'
            : 'bg-emerald-600 text-white border-emerald-400'
        }`}>
          {toastMessage.type === 'alert' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
          <span className="font-bold text-xs sm:text-sm">{toastMessage.text}</span>
        </div>
      )}

      {/* Top Cockpit Header */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-3 sm:px-6 py-3 shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Driver & Bus Identity */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20 flex-shrink-0">
              <Bus className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-black text-white tracking-tight font-heading">
                  {assignedRoute?.busNumber || 'Bus #01'}
                </h1>
                <span className="px-2 py-0.5 bg-slate-800 text-amber-400 border border-slate-700 font-mono text-[10px] font-bold rounded-md">
                  {assignedRoute?.numberPlate || 'BR-22-PA-8757'}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1 ${
                  isOnDuty ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isOnDuty ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                  {isOnDuty ? 'On Duty' : 'Off Duty'}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span>Driver: <strong className="text-white">{driverStaff?.name || 'Vikram Singh'}</strong></span>
                <span className="hidden md:inline">• Route: <strong className="text-slate-300">{assignedRoute?.routeName || 'Sikta Route'}</strong></span>
              </p>
            </div>
          </div>

          {/* Quick Action Buttons & Emergency SOS */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Live GPS Broadcast Indicator */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition ${
              isTripActive
                ? 'bg-emerald-950/90 border-emerald-500/60 text-emerald-300 shadow-md shadow-emerald-900/30'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}>
              <Radio className={`w-3.5 h-3.5 ${isTripActive ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">{isTripActive ? 'BROADCASTING PHONE GPS' : 'GPS STANDBY'}</span>
            </div>

            {/* Emergency SOS Button */}
            <button
              onClick={() => setShowSosModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black shadow-lg shadow-rose-600/30 transition transform active:scale-95 cursor-pointer animate-pulse"
              title="Send Immediate Emergency SOS Alert to School Dispatch"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>SOS PANIC</span>
            </button>

            {/* Daily Safety Checklist Button */}
            <button
              onClick={() => setShowInspectionModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              title="Complete Pre-Trip Vehicle Checklist"
            >
              <Wrench className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden md:inline">Inspection</span>
            </button>

            {/* Fuel Log Button */}
            <button
              onClick={() => setShowFuelModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              title="Record Diesel Expense"
            >
              <Fuel className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Fuel</span>
            </button>

            {/* Logout */}
            <button
              onClick={() => logout()}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-rose-600 hover:text-white border border-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 mt-4 space-y-4">
        {/* Navigation Tabs Bar */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-900 rounded-2xl border border-slate-800">
          {[
            { id: 'supabase_controller', label: '⚡ Supabase Live Map & Stop Controller', icon: Radio },
            { id: 'live_trip', label: '🧭 ड्राइवर कॉकपिट (Cockpit & Map)', icon: Navigation },
            { id: 'students', label: `👥 छात्र हाजिरी (${students.length})`, icon: Users },
            { id: 'stops', label: `📍 स्टॉप व समय (${stops.length})`, icon: MapPin },
            { id: 'fuel', label: '⛽ डीजल व खर्च (Fuel)', icon: Fuel },
            { id: 'inspection', label: '🛡️ गाड़ी जांच (Safety)', icon: Shield },
            { id: 'logs', label: '📜 सफ़र रिकॉर्ड (Trip Logs)', icon: Calendar }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* TAB 0: SUPABASE REALTIME MAP & DYNAMIC STOP CONTROLLER */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'supabase_controller' && (
          <DriverStopController
            busId={driverStaff?.vehicleNumber ? driverStaff.vehicleNumber.toLowerCase().replace(/\s+/g, '-').replace(/#/g, '') : 'bus-01'}
            routeId="route-01"
            driverName={driverStaff?.name || 'Rajesh Kumar Singh (राजेश कुमार)'}
          />
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: LIVE COCKPIT & MAP */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'live_trip' && (
          <div className="space-y-4">
            {/* Top Driver Emergency Help Banner */}
            <div className="bg-gradient-to-r from-rose-950/90 via-slate-900 to-rose-950/90 border-2 border-rose-500/70 rounded-2xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <span className="w-11 h-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-black text-2xl shadow-lg animate-pulse shrink-0">
                  🚨
                </span>
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    आपातकालीन सहायता (Emergency SOS)
                    <span className="text-[10px] font-bold bg-rose-900 text-rose-200 px-2 py-0.5 rounded-full">24x7 Active</span>
                  </h4>
                  <p className="text-xs text-rose-200/90 font-medium">
                    गाड़ी में ख़राबी, टायर पंक्चर या भारी ट्रैफिक जाम होने पर तुरंत स्कूल को सूचित करें।
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <a
                  href="tel:9122334455"
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>मैनेजर को कॉल</span>
                </a>
                <button
                  onClick={() => setShowSosModal(true)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-rose-600/40 transition transform active:scale-95 cursor-pointer flex items-center gap-1.5 animate-pulse"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>इमरजेंसी SOS भेजें</span>
                </button>
              </div>
            </div>

            {/* Top Primary Controls: Speedometer & Trip Controller */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Card 1: Giant Driver Speedometer (5 cols) */}
              <div className="lg:col-span-5 bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-xl flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-2">
                  <span className="flex items-center gap-1.5 text-white">
                    <Gauge className="w-4 h-4 text-amber-400" />
                    गाड़ी की रफ़्तार (VEHICLE SPEED)
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    अधिकतम: {maxTripSpeed} km/h
                  </span>
                </div>

                <div className="my-2 flex items-baseline justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className={`text-6xl sm:text-7xl font-black font-mono tracking-tight ${
                      currentSpeed === 0 ? 'text-slate-300' :
                      currentSpeed > 40 ? 'text-rose-500 animate-pulse' :
                      'text-emerald-400'
                    }`}>
                      {currentSpeed}
                    </span>
                    <span className="text-xl font-black text-slate-400">km/h</span>
                  </div>

                  {/* Status Badge */}
                  <div className="text-right">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black shadow ${
                      currentSpeed === 0
                        ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/50'
                        : currentSpeed > 40
                        ? 'bg-rose-950/90 text-rose-300 border border-rose-500/50 animate-pulse'
                        : 'bg-blue-950/90 text-blue-300 border border-blue-500/50'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        currentSpeed === 0 ? 'bg-emerald-400' :
                        currentSpeed > 40 ? 'bg-rose-400 animate-ping' :
                        'bg-blue-400 animate-ping'
                      }`} />
                      {currentSpeed === 0 ? 'गाड़ी रुकी हुई है (STOPPED)' : currentSpeed > 40 ? '⚠️ रफ़्तार धीमी करें (OVERSPEED)' : '🚍 गाड़ी चल रही है (CRUISING)'}
                    </span>
                  </div>
                </div>

                {/* Speed Bar */}
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden my-2">
                  <div
                    className={`h-full transition-all duration-300 ${currentSpeed > 40 ? 'bg-rose-500' : 'bg-emerald-400'}`}
                    style={{ width: `${Math.min(100, (currentSpeed / 40) * 100)}%` }}
                  />
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    सफ़र समय: <strong className="text-white font-mono">{formatTime(tripElapsedSeconds)}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5 text-blue-400" />
                    दिशा: <strong className="text-white">{getCompassCardinal(currentHeading).label} ({currentHeading}°)</strong>
                  </span>
                </div>
              </div>

              {/* Card 2: Giant Trip Action Controller (7 cols) */}
              <div className="lg:col-span-7 bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-xl flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                      <Navigation className="w-4 h-4 text-amber-400" />
                      यात्रा नियंत्रण (TRIP CONTROLLER)
                    </h3>
                    <p className="text-xs text-slate-400">
                      गाड़ी चलाने से पहले ट्रिप शुरू करें, ताकि GPS लोकेशन अभिभावकों को दिखे।
                    </p>
                  </div>

                  <select
                    value={tripType}
                    disabled={isTripActive}
                    onChange={e => setTripType(e.target.value as any)}
                    className="px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value="Morning Pickup">🌅 सुबह की पिकअप (Morning Pickup)</option>
                    <option value="Afternoon Drop">🏫 दोपहर की ड्रॉप (Afternoon Drop)</option>
                    <option value="Special Event">🚌 स्पेशल टूर (School Event / Tour)</option>
                  </select>
                </div>

                {/* Giant Main Start / Finish Button */}
                {!isTripActive ? (
                  <button
                    onClick={startTrip}
                    className="w-full h-16 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-base sm:text-lg rounded-2xl shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-3 transition transform active:scale-[0.98] cursor-pointer"
                  >
                    <Play className="w-6 h-6 fill-current" />
                    <div className="text-left leading-tight">
                      <span className="block">▶️ गाड़ी शुरू करें (START TRIP)</span>
                      <span className="text-[11px] font-medium opacity-90 block">GPS लाइव लोकेशन चालू होगा</span>
                    </div>
                  </button>
                ) : (
                  <button
                    onClick={finishTrip}
                    className="w-full h-16 bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-base sm:text-lg rounded-2xl shadow-xl shadow-rose-600/30 flex items-center justify-center gap-3 transition transform active:scale-[0.98] cursor-pointer animate-pulse"
                  >
                    <Square className="w-6 h-6 fill-current" />
                    <div className="text-left leading-tight">
                      <span className="block">⏹️ यात्रा समाप्त करें (FINISH TRIP)</span>
                      <span className="text-[11px] font-medium opacity-90 block">सफ़र पूरा हुआ, GPS बंद करें</span>
                    </div>
                  </button>
                )}

                {/* Secondary simulation test button */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-slate-400 text-[11px]">
                      GPS सिग्नल: <strong className="text-emerald-300">सक्रिय (±{gpsAccuracy || 5}m)</strong>
                    </span>
                  </div>

                  <button
                    onClick={toggleRouteSimulation}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      isSimulatingDrive
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-md animate-pulse'
                        : 'bg-slate-800 hover:bg-slate-700 text-indigo-300 border-slate-700'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>{isSimulatingDrive ? 'सिमुलेशन रोकें (Pause)' : '🚗 पक्की सड़क टेस्ट ड्राइव (Road Sim)'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Next Stop & Passenger Quick Counter Row */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Card 3: Next Stop Navigator with 1-Tap Arrived Button (7 cols) */}
              <div className="md:col-span-7 bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-xl flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                  <span className="flex items-center gap-1.5 text-rose-400">
                    <MapPin className="w-4 h-4" />
                    अगला बस स्टॉप (NEXT BUS STOP)
                  </span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    isDwellActive ? 'bg-amber-500 text-slate-950 animate-pulse font-black' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {isDwellActive ? '🛑 बच्चे चढ़ रहे हैं' : 'आगामी स्टॉप'}
                  </span>
                </div>

                <div className="my-1">
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    {currentStopName || stops[0]?.stopName || 'Model Public School Campus'}
                  </h2>
                  <div className="flex items-center gap-4 text-xs font-bold mt-1.5 flex-wrap">
                    <span className="text-amber-400">
                      दूरी: {nextStopDistMeters !== null ? (nextStopDistMeters >= 1000 ? `${(nextStopDistMeters / 1000).toFixed(1)} km` : `${nextStopDistMeters} मीटर`) : 'प्रारंभिक बिंदु'}
                    </span>
                    <span className="text-emerald-400">
                      समय: ~{nextStopEtaMinutes || 1} मिनट
                    </span>
                    {stops[0]?.landmark && (
                      <span className="text-slate-400 font-normal">
                        ({stops[0].landmark})
                      </span>
                    )}
                  </div>
                </div>

                {/* 1-Tap Reached Stop Button */}
                <button
                  onClick={handleArriveAtNextStop}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition transform active:scale-98 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>✅ स्टॉप पर पहुंच गए (ARRIVED AT STOP)</span>
                </button>
              </div>

              {/* Card 4: Passenger Quick Counter (5 cols) */}
              <div className="md:col-span-5 bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-xl flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <UserCheck className="w-4 h-4" />
                    बस में कुल बच्चे (STUDENTS ON BOARD)
                  </span>
                  <span className="text-xs font-bold text-amber-400 font-mono">
                    {boardingPercentage}%
                  </span>
                </div>

                <div className="my-1 flex items-baseline justify-between">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl sm:text-5xl font-black text-white font-mono">
                      {totalBoardedCount}
                    </span>
                    <span className="text-base text-slate-400 font-bold">/ {students.length} बच्चे</span>
                  </div>

                  <button
                    onClick={() => setActiveTab('students')}
                    className="text-xs font-bold text-amber-400 hover:text-amber-300 underline cursor-pointer"
                  >
                    पूरी हाजिरी सूची →
                  </button>
                </div>

                {/* Quick 1-Tap Buttons: +1 / -1 */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleQuickPassengerCount(1)}
                    className="py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs rounded-xl shadow transition transform active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>➕ 1 बच्चा चढ़ा</span>
                  </button>
                  <button
                    onClick={() => handleQuickPassengerCount(-1)}
                    className="py-2.5 bg-blue-700 hover:bg-blue-600 text-white font-black text-xs rounded-xl shadow transition transform active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <UserMinus className="w-3.5 h-3.5" />
                    <span>➖ 1 बच्चा उतरा</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Interactive Road Map & Real Google Maps Integration */}
            <div className={`bg-slate-900 rounded-3xl p-3 sm:p-4 border border-slate-800 shadow-2xl relative transition-all ${
              isMapFullscreen ? 'fixed inset-3 z-50 flex flex-col' : ''
            }`}>
              {/* Google Maps & Real GPS Device Action Bar */}
              <div className="mb-3 p-3 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 rounded-2xl border border-amber-500/30 flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Acquire Real Phone GPS */}
                  <button
                    onClick={() => acquireDeviceLocation(true, false)}
                    disabled={isGpsAcquiring}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-black text-xs rounded-xl shadow-lg transition active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <LocateFixed className={`w-4 h-4 text-white ${isGpsAcquiring ? 'animate-spin' : ''}`} />
                    <span>{isGpsAcquiring ? '📡 जीपीएस खोज रहे हैं...' : '🎯 असली डिवाइस लोकेशन खोजें (Real GPS)'}</span>
                  </button>

                  {/* Search / Pin Location Toggle */}
                  <button
                    onClick={() => setShowLocationSearch(!showLocationSearch)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      showLocationSearch
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>🔍 लोकेशन खोजें / पिन करें</span>
                  </button>

                  {/* Launch Turn-by-Turn Google Maps Navigation */}
                  <button
                    onClick={openGoogleMapsNavigation}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-lg transition active:scale-95 cursor-pointer"
                    title="Open Google Maps app with turn-by-turn driving directions to School"
                  >
                    <Navigation className="w-4 h-4 text-amber-300" />
                    <span>🗺️ गूगल मैप्स नेविगेशन (Google Maps App)</span>
                  </button>

                  {/* Open School Pin on Google Maps */}
                  <button
                    onClick={openSchoolGoogleMaps}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs rounded-xl border border-slate-700 transition cursor-pointer"
                  >
                    <span>🏫 स्कूल गूगल मैप पर</span>
                  </button>
                </div>

                {/* View Mode Toggle: Leaflet vs Official Google Maps Embed */}
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline-block px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold bg-slate-800 border border-slate-700 text-emerald-400">
                    {isUsingDeviceGps ? `±${gpsAccuracy || 5}m (${gpsSource === 'satellite' ? 'Sat GPS' : gpsSource === 'network' ? 'Network' : 'Manual'})` : 'Sikta Route'}
                  </span>

                  <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
                    <button
                      onClick={() => setMapViewMode('leaflet')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                        mapViewMode === 'leaflet'
                          ? 'bg-amber-500 text-slate-950 shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      🗺️ इंटरैक्टिव नक्शा
                    </button>
                    <button
                      onClick={() => setMapViewMode('google_embed')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                        mapViewMode === 'google_embed'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      🌐 गूगल मैप्स लाइव
                    </button>
                  </div>
                </div>
              </div>

              {/* Location Search Bar Dropdown */}
              {showLocationSearch && (
                <div className="mb-3 p-3 bg-slate-950 rounded-2xl border border-amber-500/40 space-y-2">
                  <form onSubmit={handleSearchLocation} className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={manualLocationQuery}
                        onChange={(e) => setManualLocationQuery(e.target.value)}
                        placeholder="पता, सड़क, शहर या Lat, Lng लिखें (उदा: Bettiah, Patna, या 27.025, 84.681)"
                        className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSearchingLocation}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer disabled:opacity-50"
                    >
                      {isSearchingLocation ? 'खोज रहे हैं...' : 'खोजें (Search)'}
                    </button>
                  </form>

                  {locationSearchResults.length > 0 && (
                    <div className="bg-slate-900 rounded-xl border border-slate-800 divide-y divide-slate-800 max-h-48 overflow-y-auto">
                      {locationSearchResults.map((result, idx) => (
                        <button
                          key={idx}
                          onClick={() => applyManualCoordinates(parseFloat(result.lat), parseFloat(result.lon), result.display_name)}
                          className="w-full text-left p-2.5 hover:bg-slate-800 transition text-xs text-slate-200 flex items-start gap-2 cursor-pointer"
                        >
                          <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <div className="truncate">
                            <p className="font-semibold text-white truncate">{result.display_name.split(',')[0]}</p>
                            <p className="text-[11px] text-slate-400 truncate">{result.display_name}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Permission Denied Warning Card */}
              {locationPermissionDenied && (
                <div className="mb-3 p-3 bg-rose-950/80 border border-rose-500/50 rounded-2xl flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-rose-200">
                    <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                    <span>ब्राउज़र में लोकेशन अनुमति ब्लॉक है। कृपया एड्रेस बार में लोकेशन चालू करें ताकि गूगल मैप्स आपकी सही जगह दिखा सके।</span>
                  </div>
                  <button
                    onClick={() => acquireDeviceLocation(true, false)}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl whitespace-nowrap transition cursor-pointer"
                  >
                    पुनः प्रयास करें (Retry)
                  </button>
                </div>
              )}

              {/* Quick Accurate Landmark Presets */}
              <div className="mb-3 px-2 flex items-center gap-1.5 overflow-x-auto text-[11px] pb-1">
                <span className="text-slate-400 font-bold whitespace-nowrap">त्वरित स्टॉप पर सेट करें:</span>
                <button
                  onClick={() => snapToPresetLocation('Sikta Railway Station (सिकटा स्टेशन)', 27.0249, 84.6812)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg whitespace-nowrap border border-slate-700 transition font-medium cursor-pointer"
                >
                  🚉 1. सिकटा स्टेशन
                </button>
                <button
                  onClick={() => snapToPresetLocation('Sikta Main Market Chowk (बाज़ार चौक)', 27.0268, 84.6818)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg whitespace-nowrap border border-slate-700 transition font-medium cursor-pointer"
                >
                  🏪 2. बाज़ार चौक
                </button>
                <button
                  onClick={() => snapToPresetLocation('Sikta Hospital Mod (अस्पताल मोड़)', 27.0235, 84.6782)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg whitespace-nowrap border border-slate-700 transition font-medium cursor-pointer"
                >
                  🏥 3. अस्पताल मोड़
                </button>
                <button
                  onClick={() => snapToPresetLocation('Bhawanipur Chowk (भवानीपुर चौक)', 27.0195, 84.6738)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg whitespace-nowrap border border-slate-700 transition font-medium cursor-pointer"
                >
                  🏘️ 4. भवानीपुर चौक
                </button>
                <button
                  onClick={() => snapToPresetLocation('Model Public School Main Campus (स्कूल गेट)', 27.0180, 84.6725)}
                  className="px-2.5 py-1 bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 rounded-lg whitespace-nowrap border border-emerald-700 transition font-bold cursor-pointer"
                >
                  🏫 5. स्कूल गेट (कैंपस)
                </button>
              </div>

              {/* Map Layer Switcher & Controls */}
              {mapViewMode === 'leaflet' && (
                <div className="flex items-center justify-between gap-2 mb-2 px-1 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-white flex items-center gap-1">
                      <Layers className="w-4 h-4 text-amber-400" />
                      नक्शा स्टाइल (Map Style):
                    </span>
                    <div className="flex items-center gap-1 flex-wrap">
                      {MAP_LAYERS.slice(0, 3).map(layer => (
                        <button
                          key={layer.id}
                          onClick={() => toggleMapLayer(layer.id)}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                            mapLayerType === layer.id
                              ? 'bg-amber-500 text-slate-950 font-black shadow-md ring-2 ring-amber-400/40'
                              : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700'
                          }`}
                        >
                          <span>{layer.icon}</span>
                          <span>{layer.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Center Map on Bus */}
                    <button
                      onClick={centerMapOnVehicle}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      <LocateFixed className="w-3.5 h-3.5" />
                      <span>📍 बस पर लाएं</span>
                    </button>

                    {/* Auto Follow Toggle */}
                    <button
                      onClick={() => setAutoFollowVehicle(!autoFollowVehicle)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        autoFollowVehicle
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {autoFollowVehicle ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Unlock className="w-3.5 h-3.5" />}
                      <span>ऑटो-फॉलो {autoFollowVehicle ? 'चालू' : 'बंद'}</span>
                    </button>

                    {/* Fullscreen Toggle */}
                    <button
                      onClick={() => setIsMapFullscreen(!isMapFullscreen)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl transition cursor-pointer"
                      title={isMapFullscreen ? 'Exit Fullscreen' : 'Fullscreen Map'}
                    >
                      {isMapFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Subtitle Banner with Paved Road Note and Correct School Coordinates */}
              <div className="mb-2 px-3 py-1.5 bg-slate-800/80 rounded-xl border border-slate-700 flex items-center justify-between text-xs gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${isUsingDeviceGps ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                  <span className="text-slate-300 font-bold">
                    {isUsingDeviceGps ? '🛰️ असली डिवाइस जीपीएस लाइव सक्रिय' : 'पक्की सड़क मार्ग: सिकटा स्टेशन ➔ बाज़ार चौक ➔ अस्पताल मोड़ ➔ भवानीपुर ➔ मॉडल पब्लिक स्कूल'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-mono text-emerald-400 font-bold">
                  <span>📍 बस: {currentCoords.lat.toFixed(5)}° N, {currentCoords.lng.toFixed(5)}° E</span>
                  <span className="text-amber-300">🏫 MPS Sikta: 27.0180° N, 84.6725° E</span>
                </div>
              </div>

              {/* Next Stop Live Navigation Banner */}
              {assignedRoute && (
                <div className="mb-2 px-3 py-2 bg-gradient-to-r from-slate-800/90 via-slate-800/70 to-slate-800/90 rounded-xl border border-slate-700 flex items-center justify-between text-xs gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-slate-400">Next Destination:</span>
                    <strong className="text-white font-bold">{currentStopName || stops[0]?.stopName || 'MPS Main Campus'}</strong>
                  </div>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="text-amber-400 font-mono font-bold">
                      Distance: {nextStopDistMeters !== null ? (nextStopDistMeters >= 1000 ? `${(nextStopDistMeters / 1000).toFixed(1)} km` : `${nextStopDistMeters} m`) : '--'}
                    </span>
                    <span className="text-emerald-400 font-mono font-bold">
                      ETA: ~{nextStopEtaMinutes || 1} min
                    </span>
                    {isDwellActive && (
                      <span className="px-2 py-0.5 bg-amber-500 text-slate-950 font-black rounded-md animate-pulse">
                        🛑 BOARDING IN PROGRESS (0 km/h)
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Map Canvas: Interactive Leaflet vs Google Maps Live Embed */}
              {mapViewMode === 'google_embed' ? (
                <div className={`w-full rounded-2xl overflow-hidden border border-slate-800 relative z-10 shadow-inner bg-slate-950 ${
                  isMapFullscreen ? 'flex-1 min-h-[500px]' : 'h-[480px]'
                }`}>
                  <iframe
                    src={`https://maps.google.com/maps?q=${currentCoords.lat},${currentCoords.lng}&t=m&z=16&output=embed`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen={false}
                    loading="lazy"
                    title="Live Google Maps Bus Location"
                    className="w-full h-full"
                  />
                  <div className="absolute bottom-3 right-3 z-20">
                    <button
                      onClick={openGoogleMapsNavigation}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Open Full Google Maps</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative w-full">
                  <div
                    ref={mapContainerRef}
                    className={`w-full rounded-2xl overflow-hidden border border-slate-800 relative z-10 shadow-inner ${
                      isMapFullscreen ? 'flex-1 min-h-[500px]' : 'h-[480px]'
                    }`}
                  />

                  {/* Floating Google Maps Style Locate Me Button & Controls */}
                  <div className="absolute bottom-6 right-4 z-[450] flex flex-col items-end gap-2 pointer-events-auto">
                    {/* Open Current Coordinates directly in Google Maps */}
                    <button
                      onClick={openGoogleMapsPin}
                      className="bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-2xl border border-slate-700 backdrop-blur-md flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                      title="Open these exact coordinates in Google Maps app"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                      <span>गूगल मैप्स पर खोलें</span>
                    </button>

                    {/* Google Maps Style Crosshair Locate-Me Floating Action Button */}
                    <button
                      onClick={() => acquireDeviceLocation(true, false)}
                      disabled={isGpsAcquiring}
                      className="w-12 h-12 bg-white hover:bg-slate-100 text-slate-800 rounded-full shadow-2xl border-2 border-slate-200 flex items-center justify-center transition active:scale-90 cursor-pointer group"
                      title="मेरी लाइव लोकेशन (Google Maps High Accuracy GPS)"
                    >
                      <Crosshair
                        className={`w-6 h-6 transition ${
                          isGpsAcquiring
                            ? 'text-blue-600 animate-spin'
                            : isUsingDeviceGps
                            ? 'text-blue-600 fill-blue-50'
                            : 'text-slate-700 group-hover:text-blue-600'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Floating Live Location & Address Badge */}
                  <div className="absolute bottom-6 left-4 z-[450] max-w-[75%] sm:max-w-md pointer-events-auto">
                    <div className="bg-slate-950/90 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-slate-700 shadow-2xl space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${isUsingDeviceGps ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                        <span className="text-[11px] font-mono font-bold text-white">
                          {currentCoords.lat.toFixed(6)}° N, {currentCoords.lng.toFixed(6)}° E
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          {isUsingDeviceGps ? (gpsSource === 'satellite' ? '🛰️ Satellite GPS' : '📶 Network Fix') : '📍 Sikta Default'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 truncate font-medium flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                        <span className="truncate">{currentAddress || 'Sikta Main Road, West Champaran'}</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Live Passenger Boarding Checklist */}
            <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-amber-400" />
                    Live Passenger Manifest & One-Tap Boarding
                  </h3>
                  <p className="text-xs text-slate-400">
                    Tap to mark students boarded as you arrive at each stop along the route.
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-60">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={studentSearch}
                      onChange={e => setStudentSearch(e.target.value)}
                      placeholder="Search student or roll #..."
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <button
                    onClick={() => setShowAddStudentModal(true)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Student
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredStudents.map(st => {
                  const status = boardedStatus[st.studentId] || 'Pending';
                  return (
                    <div
                      key={st.id}
                      className={`p-3.5 rounded-2xl border transition ${
                        status === 'Boarded'
                          ? 'bg-emerald-950/40 border-emerald-500/50'
                          : status === 'Dropped'
                          ? 'bg-blue-950/40 border-blue-500/50'
                          : status === 'Absent'
                          ? 'bg-rose-950/40 border-rose-500/50'
                          : 'bg-slate-800/80 border-slate-700/80'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-white text-sm">{st.studentName}</div>
                          <div className="text-xs text-slate-400">Class {st.class}-{st.section} • Roll #{st.rollNo}</div>
                          <div className="text-[11px] text-amber-400 font-bold mt-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-rose-400" /> {st.stopName}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <a
                            href={`tel:${st.phone}`}
                            className="p-1.5 bg-slate-700 hover:bg-slate-600 text-blue-400 rounded-lg transition"
                            title="Call Parent"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={`https://wa.me/91${st.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                              `Hello, Model Public School Transport Alert: Bus #01 is currently approaching ${st.stopName}. Please have ${st.studentName} ready.`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg transition"
                            title="WhatsApp Parent Alert"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="grid grid-cols-3 gap-1.5 mt-3 pt-2.5 border-t border-slate-700/60 text-xs">
                        <button
                          onClick={() => handleToggleBoarding(st.studentId, 'Boarded')}
                          className={`py-1.5 rounded-xl font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
                            status === 'Boarded'
                              ? 'bg-emerald-500 text-slate-950 shadow-md'
                              : 'bg-slate-700/60 hover:bg-emerald-600 text-slate-300 hover:text-white'
                          }`}
                        >
                          <Check className="w-3 h-3" /> Boarded
                        </button>
                        <button
                          onClick={() => handleToggleBoarding(st.studentId, 'Dropped')}
                          className={`py-1.5 rounded-xl font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
                            status === 'Dropped'
                              ? 'bg-blue-500 text-white shadow-md'
                              : 'bg-slate-700/60 hover:bg-blue-600 text-slate-300 hover:text-white'
                          }`}
                        >
                          <CheckCircle className="w-3 h-3" /> Dropped
                        </button>
                        <button
                          onClick={() => handleToggleBoarding(st.studentId, 'Absent')}
                          className={`py-1.5 rounded-xl font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
                            status === 'Absent'
                              ? 'bg-rose-500 text-white shadow-md'
                              : 'bg-slate-700/60 hover:bg-rose-600 text-slate-300 hover:text-white'
                          }`}
                        >
                          <X className="w-3 h-3" /> Absent
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: PASSENGER ROSTER */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'students' && (
          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-400" />
                  Assigned Bus Passengers ({students.length})
                </h2>
                <p className="text-xs text-slate-400">
                  Complete student passenger manifest for {assignedRoute?.busNumber || 'Bus #01'}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                <select
                  value={stopFilter}
                  onChange={e => setStopFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                >
                  <option value="All">All Stops</option>
                  {stops.map(s => (
                    <option key={s.id} value={s.id}>{s.stopName}</option>
                  ))}
                </select>

                <button
                  onClick={() => setShowAddStudentModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Enroll Student
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                  <tr>
                    <th className="p-3">Student</th>
                    <th className="p-3">Class</th>
                    <th className="p-3">Roll #</th>
                    <th className="p-3">Designated Stop</th>
                    <th className="p-3">Parent Phone</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredStudents.map(st => (
                    <tr key={st.id} className="hover:bg-slate-800/50 transition">
                      <td className="p-3 font-bold text-white">{st.studentName}</td>
                      <td className="p-3 font-semibold text-slate-300">Class {st.class}-{st.section}</td>
                      <td className="p-3 font-mono text-amber-400 font-bold">{st.rollNo}</td>
                      <td className="p-3 font-medium text-slate-200">{st.stopName}</td>
                      <td className="p-3">
                        <a href={`tel:${st.phone}`} className="text-blue-400 hover:underline flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {st.phone}
                        </a>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={async () => {
                            if (confirm(`Remove ${st.studentName} from this bus route?`)) {
                              await api.removeTransportStudent(st.id);
                              loadPortalData();
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-400 transition"
                          title="Remove from roster"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: STOPS & TIMETABLE */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'stops' && (
          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-rose-400" />
                  Route Stops & Arrival Timetable ({stops.length})
                </h2>
                <p className="text-xs text-slate-400">
                  Sequence of stops along {assignedRoute?.routeName || 'Main Route'}
                </p>
              </div>

              <button
                onClick={() => setShowAddStopModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Route Stop
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stops.map(st => {
                const count = students.filter(s => s.stopId === st.id).length;
                return (
                  <div key={st.id} className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/80 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-rose-600 text-white font-black text-xs flex items-center justify-center">
                          #{st.stopNumber}
                        </span>
                        <div>
                          <div className="font-bold text-white text-sm">{st.stopName}</div>
                          {st.landmark && <div className="text-[11px] text-slate-400">{st.landmark}</div>}
                        </div>
                      </div>

                      <button
                        onClick={async () => {
                          if (confirm(`Delete stop ${st.stopName}?`)) {
                            await api.deleteTransportStop(st.id);
                            loadPortalData();
                          }
                        }}
                        className="text-slate-400 hover:text-rose-400 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-900/60 p-2.5 rounded-xl">
                      <div>
                        <span className="text-slate-400 text-[10px] block">Morning Pickup</span>
                        <span className="font-bold text-emerald-400">{st.pickupTime}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Afternoon Drop</span>
                        <span className="font-bold text-blue-400">{st.dropTime}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-700/50">
                      <span className="text-slate-400 font-bold">{count} Students Waiting</span>
                      <button
                        onClick={() => handleBoardAllAtStop(st.id)}
                        className="px-2.5 py-1 bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white font-bold rounded-lg transition text-[11px]"
                      >
                        Board All
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 4: SAFETY INSPECTION LOGS */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'inspection' && (
          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-400" />
                  Vehicle Safety Pre-Trip Inspections
                </h2>
                <p className="text-xs text-slate-400">
                  Official driver checklist logs required before transporting students.
                </p>
              </div>

              <button
                onClick={() => setShowInspectionModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" /> New Inspection Check
              </button>
            </div>

            <div className="space-y-3">
              {inspectionLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No inspection records submitted yet. Click "New Inspection Check" above to submit today's pre-trip safety log.
                </div>
              ) : (
                inspectionLogs.map((insp: any) => (
                  <div key={insp.id} className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{insp.busNumber || 'Bus #01'}</span>
                        <span className="text-xs text-slate-400">• Inspector: {insp.driverName}</span>
                        <span className="text-xs text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-md">
                          Verified Safe ✓
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Odometer: <strong className="text-amber-400">{insp.odometer} km</strong> • Date: {new Date(insp.timestamp).toLocaleString()}
                      </div>
                      {insp.notes && <div className="text-xs text-slate-300 italic mt-1">"{insp.notes}"</div>}
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                      {Object.entries(insp.checklist || {}).map(([key, val]) => (
                        <span
                          key={key}
                          className={`px-2 py-0.5 rounded-md font-bold ${
                            val ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800' : 'bg-rose-950/60 text-rose-300 border border-rose-800'
                          }`}
                        >
                          {key}: {val ? 'OK' : 'FAIL'}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 5: FUEL & EXPENSES */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'fuel' && (
          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Fuel className="w-5 h-5 text-amber-400" />
                  Fuel & Maintenance Refill Logs
                </h2>
                <p className="text-xs text-slate-400">
                  Track diesel expenses and odometer readings for school accounting.
                </p>
              </div>

              <button
                onClick={() => setShowFuelModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Log Fuel Refill
              </button>
            </div>

            <div className="space-y-3">
              {fuelLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No fuel entries found. Click "Log Fuel Refill" above to add diesel expense.
                </div>
              ) : (
                fuelLogs.map((fl: any) => (
                  <div key={fl.id} className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{fl.busNumber || 'Bus #01'}</span>
                        <span className="text-xs text-slate-400">• Driver: {fl.driverName}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Station: <strong className="text-slate-200">{fl.stationName}</strong> • Date: {new Date(fl.timestamp).toLocaleDateString()}
                      </div>
                      {fl.notes && <div className="text-xs text-slate-300 italic mt-0.5">"{fl.notes}"</div>}
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <div className="text-base font-black text-emerald-400">₹{fl.totalCost}</div>
                        <div className="text-[11px] text-slate-400">{fl.fuelLitres} Litres Diesel</div>
                      </div>
                      <div className="px-3 py-1 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-amber-400">
                        {fl.odometer} km
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 6: TRIP HISTORY */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'logs' && (
          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-2xl space-y-4">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-400" />
                Completed Trip Archive
              </h2>
              <p className="text-xs text-slate-400">
                Official records of completed student routes and driver timings.
              </p>
            </div>

            <div className="space-y-3">
              {completedTripLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No completed trips recorded yet today. Click "Finish Trip" after completing a route run.
                </div>
              ) : (
                completedTripLogs.map((log: any) => (
                  <div key={log.id} className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{log.tripType}</span>
                        <span className="text-xs text-slate-400">• Bus: {log.routeId}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Started: {log.startTime} • Completed: {log.endTime || new Date(log.completedAt).toLocaleTimeString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right text-xs">
                        <div className="font-bold text-emerald-400">{log.totalBoarded} of {log.totalStudents} Boarded</div>
                        <div className="text-[10px] text-slate-400">100% On-Time Safe Drop</div>
                      </div>
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: EMERGENCY SOS PANIC */}
      {/* ------------------------------------------------------------- */}
      {showSosModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-rose-500 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between text-rose-400">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 animate-bounce" />
                <h3 className="text-lg font-black tracking-tight font-heading">
                  EMERGENCY SOS BROADCAST
                </h3>
              </div>
              <button onClick={() => setShowSosModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              This will immediately send a high-priority push alert with your current GPS coordinates to the School Admin Control Center and parent WhatsApp broadcast.
            </p>

            <form onSubmit={handleSendSOS} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Emergency Category *</label>
                <select
                  value={sosReason}
                  onChange={e => setSosReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
                >
                  <option value="Vehicle Engine Breakdown">🚨 Vehicle Engine Breakdown</option>
                  <option value="Flat Tire or Mechanical Hazard">🛞 Flat Tire or Mechanical Hazard</option>
                  <option value="Traffic Jam Delay (20+ Minutes)">⏳ Heavy Traffic Jam (Delayed 20+ min)</option>
                  <option value="Student Medical Emergency">🚑 Student Medical Attention Required</option>
                  <option value="Road Accident or Collision">💥 Road Collision / Accident</option>
                  <option value="Severe Weather or Road Block">🚧 Road Block / Flooding / Inclement Weather</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Specific Situation Details</label>
                <textarea
                  rows={3}
                  value={sosNotes}
                  onChange={e => setSosNotes(e.target.value)}
                  placeholder="e.g. Near Bhawanipur Petrol Pump, replacement van needed immediately..."
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-[11px] text-slate-300 space-y-1">
                <div>Vehicle: <b>{assignedRoute?.busNumber || 'Bus #01'}</b></div>
                <div>Driver: <b>{driverStaff?.name || 'Vikram Singh'} ({driverStaff?.phone || '9162024642'})</b></div>
                <div>Live GPS: <b>{currentCoords.lat.toFixed(5)}, {currentCoords.lng.toFixed(5)}</b></div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSosModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sosSending}
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl shadow-xl shadow-rose-600/40 transition active:scale-95 cursor-pointer"
                >
                  {sosSending ? 'TRANSMITTING SOS...' : 'SEND IMMEDIATE SOS ALERT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: VEHICLE SAFETY INSPECTION */}
      {/* ------------------------------------------------------------- */}
      {showInspectionModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between text-white">
              <h3 className="text-lg font-black flex items-center gap-2">
                <Wrench className="w-5 h-5 text-blue-400" />
                Pre-Trip Vehicle Safety Inspection
              </h3>
              <button onClick={() => setShowInspectionModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitInspection} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Starting Odometer Reading (km) *</label>
                <input
                  type="number"
                  required
                  value={inspectionForm.odometer}
                  onChange={e => setInspectionForm({ ...inspectionForm, odometer: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono font-bold"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-slate-300 font-bold">10-Point Safety Check *</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'brakesOk', label: 'Brakes & Handbrake' },
                    { key: 'steeringOk', label: 'Steering Mechanism' },
                    { key: 'tiresOk', label: 'Tires & Pressure' },
                    { key: 'emergencyDoorOk', label: 'Emergency Exit Door' },
                    { key: 'firstAidOk', label: 'First Aid Kit Available' },
                    { key: 'fireExtinguisherOk', label: 'Fire Extinguisher Charged' },
                    { key: 'gpsTrackerOk', label: 'GPS Tracker Operational' },
                    { key: 'headlightsOk', label: 'Headlights & Turn Signals' },
                    { key: 'hornOk', label: 'Horn & Reverse Alarm' }
                  ].map(item => (
                    <label key={item.key} className="flex items-center gap-2 p-2 bg-slate-800 rounded-xl cursor-pointer hover:bg-slate-700/60">
                      <input
                        type="checkbox"
                        checked={(inspectionForm as any)[item.key]}
                        onChange={e => setInspectionForm({ ...inspectionForm, [item.key]: e.target.checked })}
                        className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700 accent-blue-600"
                      />
                      <span className="text-[11px] text-slate-200">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Inspection Remarks / Notes</label>
                <input
                  type="text"
                  value={inspectionForm.notes}
                  onChange={e => setInspectionForm({ ...inspectionForm, notes: e.target.value })}
                  placeholder="e.g. Bus washed and sanitized, tire pressure checked."
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInspectionModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30"
                >
                  Confirm & Submit Inspection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: FUEL REFILL */}
      {/* ------------------------------------------------------------- */}
      {showFuelModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between text-white">
              <h3 className="text-lg font-black flex items-center gap-2">
                <Fuel className="w-5 h-5 text-amber-400" />
                Log Vehicle Fuel Refill
              </h3>
              <button onClick={() => setShowFuelModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitFuel} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Litres of Diesel *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={fuelForm.fuelLitres}
                    onChange={e => setFuelForm({ ...fuelForm, fuelLitres: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Total Cost (₹) *</label>
                  <input
                    type="number"
                    required
                    value={fuelForm.totalCost}
                    onChange={e => setFuelForm({ ...fuelForm, totalCost: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Odometer (km) *</label>
                <input
                  type="number"
                  required
                  value={fuelForm.odometer}
                  onChange={e => setFuelForm({ ...fuelForm, odometer: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Filling Station Name</label>
                <input
                  type="text"
                  value={fuelForm.stationName}
                  onChange={e => setFuelForm({ ...fuelForm, stationName: e.target.value })}
                  placeholder="e.g. Indian Oil Sikta"
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Receipt Note</label>
                <input
                  type="text"
                  value={fuelForm.notes}
                  onChange={e => setFuelForm({ ...fuelForm, notes: e.target.value })}
                  placeholder="Receipt #..."
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFuelModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl shadow-lg"
                >
                  Record Fuel Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD ROUTE STOP */}
      {/* ------------------------------------------------------------- */}
      {showAddStopModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between text-white">
              <h3 className="text-lg font-black flex items-center gap-2">
                <MapPin className="w-5 h-5 text-rose-400" />
                Add New Route Stop
              </h3>
              <button onClick={() => setShowAddStopModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStop} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Stop Name *</label>
                <input
                  type="text"
                  required
                  value={stopForm.stopName}
                  onChange={e => setStopForm({ ...stopForm, stopName: e.target.value })}
                  placeholder="e.g. Purani Bazaar Chowk"
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Pickup Time *</label>
                  <input
                    type="text"
                    required
                    value={stopForm.pickupTime}
                    onChange={e => setStopForm({ ...stopForm, pickupTime: e.target.value })}
                    placeholder="07:30 AM"
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Drop Time *</label>
                  <input
                    type="text"
                    required
                    value={stopForm.dropTime}
                    onChange={e => setStopForm({ ...stopForm, dropTime: e.target.value })}
                    placeholder="02:30 PM"
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Landmark</label>
                <input
                  type="text"
                  value={stopForm.landmark}
                  onChange={e => setStopForm({ ...stopForm, landmark: e.target.value })}
                  placeholder="e.g. Near Shiv Mandir"
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={stopForm.latitude}
                    onChange={e => setStopForm({ ...stopForm, latitude: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={stopForm.longitude}
                    onChange={e => setStopForm({ ...stopForm, longitude: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddStopModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg"
                >
                  Save Stop
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD STUDENT TO BUS */}
      {/* ------------------------------------------------------------- */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between text-white">
              <h3 className="text-lg font-black flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                Assign Student to Bus Roster
              </h3>
              <button onClick={() => setShowAddStudentModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStudentToBus} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Class *</label>
                  <input
                    type="text"
                    required
                    value={studentForm.class}
                    onChange={e => setStudentForm({ ...studentForm, class: e.target.value })}
                    placeholder="10"
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Section *</label>
                  <input
                    type="text"
                    required
                    value={studentForm.section}
                    onChange={e => setStudentForm({ ...studentForm, section: e.target.value })}
                    placeholder="A"
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Roll Number *</label>
                <input
                  type="text"
                  required
                  value={studentForm.rollNo}
                  onChange={e => setStudentForm({ ...studentForm, rollNo: e.target.value })}
                  placeholder="e.g. 1001, 1002"
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Assigned Stop *</label>
                <select
                  value={studentForm.stopId}
                  onChange={e => setStudentForm({ ...studentForm, stopId: e.target.value })}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                >
                  <option value="">Select a stop...</option>
                  {stops.map(s => (
                    <option key={s.id} value={s.id}>#{s.stopNumber} - {s.stopName} (Pick: {s.pickupTime})</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl shadow-lg"
                >
                  Enroll to Roster
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDriverPortal;
