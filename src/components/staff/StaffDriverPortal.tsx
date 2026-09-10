import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bus, MapPin, Navigation, Users, CheckCircle, Clock, Phone, AlertCircle,
  Plus, Trash2, Edit3, Shield, Power, Play, Square, RefreshCw, LogOut,
  ChevronRight, Compass, Check, X, Search, Calendar, UserCheck, UserMinus, Award,
  AlertTriangle, Key, Radio, Fuel, Wrench, ShieldAlert, Sparkles, Share2,
  Send, Zap, Home, Gauge, Layers, Eye, Activity, Smartphone, BellRing,
  Maximize2, Minimize2, LocateFixed, Lock, Unlock, ArrowUpRight, TrendingUp,
  Crosshair, Satellite, ExternalLink, Volume2, VolumeX, Sun, Moon, ArrowRight, CheckCheck, MessageSquare
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

// Web Audio Synthesizer for tactile audio cues in the driver portal
export const playDriverSound = (type: 'tap' | 'arrive' | 'board' | 'trip_start' | 'trip_finish' | 'alert') => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'tap') {
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } else if (type === 'board') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.07);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else if (type === 'arrive') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.09);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.32);
      osc.start();
      osc.stop(ctx.currentTime + 0.32);
    } else if (type === 'trip_start') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.14, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
      osc.start();
      osc.stop(ctx.currentTime + 0.28);
    } else if (type === 'trip_finish') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.28);
      gain.gain.setValueAtTime(0.14, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'alert') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch {
    // Autoplay or audio context permission fallback
  }
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

  // 7. Bhawanipur Village Approach to Model Public School Campus
  [27.022000, 84.670000],
  [27.026000, 84.667000],
  [27.031000, 84.663500],
  [27.033500, 84.661800],
  // 8. Model Public School Main Gate (स्कूल गेट) - Stop 5 (27.035265° N, 84.660400° E)
  [27.035265, 84.660400]
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
  const routeCasingPolylineRef = useRef<L.Polyline | null>(null);
  const lastRoutedCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
  const [routeDistanceKm, setRouteDistanceKm] = useState<string | null>(null);
  const [routeDurationMins, setRouteDurationMins] = useState<number | null>(null);
  const [isRoutingLoading, setIsRoutingLoading] = useState<boolean>(false);
  const geoWatchIdRef = useRef<number | null>(null);
  const simulationTimerRef = useRef<any>(null);
  const lastFixRef = useRef<{ lat: number; lng: number; time: number } | null>(null);
  const stationaryAnchorRef = useRef<{ lat: number; lng: number } | null>(null);
  const [mapLayerType, setMapLayerType] = useState<MapLayerOption>('google_streets');
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [autoFollowVehicle, setAutoFollowVehicle] = useState(true);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);

  // Driver Experience & Accessibility States
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [manifestFilter, setManifestFilter] = useState<'All' | 'Waiting' | 'Boarded' | 'Dropped' | 'Absent'>('All');
  const [selectedTimelineStopId, setSelectedTimelineStopId] = useState<string | null>(null);

  // Navigation Tabs
  type TabType = 'live_trip' | 'supabase_controller' | 'students' | 'stops' | 'inspection' | 'fuel' | 'logs';
  const [activeTab, setActiveTab] = useState<TabType>('live_trip');

  // Modals
  const [showAddStopModal, setShowAddStopModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);

  // Map state tracker for guaranteed sync
  const [mapReady, setMapReady] = useState(0);

  // Add Stop with Student Selection States
  const [isSubmittingStop, setIsSubmittingStop] = useState(false);
  const [selectedStudentIdsForStop, setSelectedStudentIdsForStop] = useState<string[]>([]);
  const [studentSearchInStopModal, setStudentSearchInStopModal] = useState<string>('');
  const [filterClassInStopModal, setFilterClassInStopModal] = useState<string>('All');

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

  // Open Add Stop modal helper with optional coordinates pre-fill
  const openAddStopModal = (initialCoords?: { lat: number; lng: number }) => {
    const defaultLat = initialCoords?.lat ? Number(initialCoords.lat.toFixed(6)) : (currentCoords.lat ? Number(currentCoords.lat.toFixed(6)) : 27.0270);
    const defaultLng = initialCoords?.lng ? Number(initialCoords.lng.toFixed(6)) : (currentCoords.lng ? Number(currentCoords.lng.toFixed(6)) : 84.6826);
    setStopForm({
      stopName: '',
      stopNumber: stops.length + 1,
      pickupTime: '07:30 AM',
      dropTime: '02:45 PM',
      landmark: '',
      latitude: defaultLat,
      longitude: defaultLng,
      feeMonthly: 600,
      selectedStudentIds: []
    });
    setSelectedStudentIdsForStop([]);
    setStudentSearchInStopModal('');
    setFilterClassInStopModal('All');
    setShowAddStopModal(true);
    if (isSoundEnabled) playDriverSound('tap');
  };

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

  // 3. Leaflet Map Initialization with Rock-Solid Lifecycle & Auto Invalidation
  useEffect(() => {
    // If not in live trip tab or not in leaflet mode or still loading, cleanup and exit
    if (activeTab !== 'live_trip' || mapViewMode !== 'leaflet' || loading) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      return;
    }

    if (!mapContainerRef.current) return;

    // Clean up any stale leaflet instance attached to this container
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
    if ((mapContainerRef.current as any)._leaflet_id) {
      delete (mapContainerRef.current as any)._leaflet_id;
    }

    // Anchor coordinates: Sikta Center (27.0270° N, 84.6826° E)
    const initialLat = currentCoords.lat || 27.0270;
    const initialLng = currentCoords.lng || 84.6826;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 15,
      zoomControl: true,
      fadeAnimation: true
    });

    // Primary High-Definition Map Layer
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
    L.marker([27.035265, 84.660400], { icon: schoolIcon })
      .bindPopup(`
        <div class="p-2 space-y-1 font-sans text-xs">
          <div class="font-black text-sm text-blue-900 flex items-center gap-1">
            🏫 Model Public School (MPS)
          </div>
          <div class="text-slate-600 font-medium">AT- Bhawanipur, P.O.- Kursi Barwa, Sikta, West Champaran (845307)</div>
          <div class="text-[11px] text-emerald-600 font-bold">Central Transport Depot & Bus Bay A</div>
          <div class="text-slate-500 font-mono text-[10px]">27.0353° N, 84.6604° E (27.035265, 84.660400)</div>
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
            <!-- Floating Upright Telemetry Badge -->
            <div class="mb-1 px-2.5 py-0.5 rounded-full ${badgeColor} text-[10px] font-mono font-black shadow-2xl border flex items-center gap-1.5 whitespace-nowrap">
              <span class="w-1.5 h-1.5 rounded-full ${isStopped ? 'bg-amber-200' : 'bg-white animate-ping'}"></span>
              <span>${speedLabel}</span>
              ${!isStopped && speed >= 2 ? `<span class="opacity-80 text-[9px] border-l border-white/40 pl-1">${heading}°</span>` : ''}
            </div>

            <!-- Vehicle Body + Direction Pointer (Rotates to Bearing) -->
            <div class="relative flex items-center justify-center w-12 h-12" style="transform: rotate(${heading}deg); transition: transform 0.4s cubic-bezier(0.2, 0.9, 0.3, 1);">
              <div class="absolute inset-0 rounded-full bg-amber-400/30 ${isStopped ? 'animate-pulse' : 'animate-ping'}"></div>
              
              <div class="absolute -top-3 flex flex-col items-center">
                <div class="w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-b-[12px] border-b-amber-500 drop-shadow-md"></div>
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

    // Interactive Click on Map to Add Stop at Clicked Location!
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      L.popup()
        .setLatLng([lat, lng])
        .setContent(`
          <div style="font-family: sans-serif; font-size: 12px; padding: 4px; line-height: 1.4; color: #1e293b;">
            <div style="font-weight: 800; font-size: 13px; color: #0f172a; display: flex; align-items: center; gap: 4px;">
              <span>📍</span> <span>नया स्टॉप पॉइंट</span>
            </div>
            <div style="color: #64748b; font-size: 11px; margin: 3px 0 8px 0; font-family: monospace;">
              ${lat.toFixed(5)}, ${lng.toFixed(5)}
            </div>
            <button id="leaflet-map-click-add-stop" style="background: #e11d48; color: white; border: none; padding: 6px 12px; border-radius: 8px; font-weight: 800; font-size: 11px; cursor: pointer; width: 100%; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
              + यहाँ नया स्टॉप जोड़ें (+ Add Stop)
            </button>
          </div>
        `)
        .openOn(map);

      setTimeout(() => {
        const btn = document.getElementById('leaflet-map-click-add-stop');
        if (btn) {
          btn.onclick = () => {
            map.closePopup();
            openAddStopModal({ lat, lng });
          };
        }
      }, 100);
    });

    // Handle container resizing smoothly
    const handleResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };
    window.addEventListener('resize', handleResize);

    // Staggered invalidateSize calls to guarantee sharp, non-grey tiles
    const t1 = setTimeout(() => { if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize(); }, 100);
    const t2 = setTimeout(() => { if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize(); }, 350);
    const t3 = setTimeout(() => { if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize(); }, 900);

    mapInstanceRef.current = map;
    setMapReady(prev => prev + 1);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('resize', handleResize);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [activeTab, mapViewMode, loading, mapLayerType]);

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

  // Real Google-grade road routing engine from driver's current coordinates
  const fetchAndDrawRealRoadRoute = useCallback(async (
    origin: { lat: number; lng: number },
    targetStops: TransportStop[]
  ) => {
    if (!mapInstanceRef.current) return;

    setIsRoutingLoading(true);
    try {
      // 1. Waypoints sequence: Driver live GPS position -> scheduled stops -> school campus
      const waypoints: { lng: number; lat: number }[] = [
        { lng: origin.lng, lat: origin.lat }
      ];

      // Add scheduled stops in sequence
      const sortedStops = [...targetStops].sort((a, b) => (a.stopNumber || 0) - (b.stopNumber || 0));
      sortedStops.slice(0, 6).forEach(s => {
        if (s.latitude && s.longitude) {
          waypoints.push({ lng: s.longitude, lat: s.latitude });
        }
      });

      // Destination: School Campus Gate (Model Public School Bhawanipur)
      waypoints.push({ lng: 84.660400, lat: 27.035265 });

      const coordsString = waypoints.map(w => `${w.lng.toFixed(6)},${w.lat.toFixed(6)}`).join(';');
      const url = `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      let latLngs: [number, number][] | null = null;
      let distMeters = 0;
      let durSecs = 0;

      try {
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
            const r = data.routes[0];
            latLngs = r.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
            distMeters = r.distance;
            durSecs = r.duration;
          }
        }
      } catch (fetchErr) {
        console.warn('Real driving route network fetch fallback:', fetchErr);
      }

      // Smooth fallback if network or OSRM unavailable: Connect driver origin smoothly to paved road network
      if (!latLngs || latLngs.length < 2) {
        latLngs = [
          [origin.lat, origin.lng],
          ...SIKTA_ROAD_NETWORK_COORDS
        ];
        distMeters = 3800;
        durSecs = 600;
      }

      setRouteDistanceKm((distMeters / 1000).toFixed(1));
      setRouteDurationMins(Math.max(1, Math.round(durSecs / 60)));

      // Remove existing polylines
      if (routeCasingPolylineRef.current && mapInstanceRef.current.hasLayer(routeCasingPolylineRef.current)) {
        mapInstanceRef.current.removeLayer(routeCasingPolylineRef.current);
      }
      if (routePolylineRef.current && mapInstanceRef.current.hasLayer(routePolylineRef.current)) {
        mapInstanceRef.current.removeLayer(routePolylineRef.current);
      }

      // 1. Google Maps Royal Blue Casing (Dark border outline for authentic Google Maps look)
      routeCasingPolylineRef.current = L.polyline(latLngs, {
        color: '#1e3a8a',
        weight: 9,
        opacity: 0.7,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(mapInstanceRef.current);

      // 2. Google Maps Vibrant Navigation Blue Line
      routePolylineRef.current = L.polyline(latLngs, {
        color: '#2563eb',
        weight: 5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(mapInstanceRef.current);

    } catch (err) {
      console.warn('Route draw error:', err);
    } finally {
      setIsRoutingLoading(false);
    }
  }, []);

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

    // Add School Campus destination marker
    const schoolIcon = L.divIcon({
      className: 'custom-school-icon',
      html: `
        <div class="bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-black px-3 py-1.5 rounded-2xl text-xs shadow-2xl border-2 border-white flex items-center gap-1.5 whitespace-nowrap ring-4 ring-emerald-500/30">
          <span class="text-sm">🏫</span>
          <span>मॉडल पब्लिक स्कूल (मुख्य कैंपस)</span>
        </div>
      `,
      iconSize: [210, 32],
      iconAnchor: [105, 16]
    });
    const schoolMarker = L.marker([27.035265, 84.660400], { icon: schoolIcon });
    schoolMarker.bindPopup(`
      <div class="p-2 space-y-1 font-sans text-xs">
        <div class="font-black text-emerald-800 text-sm">🏫 Model Public School, Sikta</div>
        <div class="text-slate-600">अंतिम गंतव्य (Final Destination / Campus Gate)</div>
        <div class="text-[11px] text-slate-500 font-mono">27.0353° N, 84.6604° E (27.035265, 84.660400)</div>
      </div>
    `);
    stopMarkersRef.current?.addLayer(schoolMarker);

    // Fetch and draw real Google-grade road route from driver's current coordinates
    lastRoutedCoordsRef.current = { lat: currentCoords.lat, lng: currentCoords.lng };
    fetchAndDrawRealRoadRoute(currentCoords, stops);
  }, [mapReady, stops, fetchAndDrawRealRoadRoute]);

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

    // Dynamic real road route calculation from driver current position
    if (
      !lastRoutedCoordsRef.current ||
      haversineDistanceMeters(lat, lng, lastRoutedCoordsRef.current.lat, lastRoutedCoordsRef.current.lng) > 35
    ) {
      lastRoutedCoordsRef.current = { lat, lng };
      fetchAndDrawRealRoadRoute({ lat, lng }, stops);
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

  // Launch Google Maps Driving Navigation (Turn-by-turn to School Campus from Current Location)
  const openGoogleMapsNavigation = (targetStop?: TransportStop) => {
    const destLat = targetStop ? targetStop.latitude : 27.035265;
    const destLng = targetStop ? targetStop.longitude : 84.660400;
    let url = `https://www.google.com/maps/dir/?api=1&origin=${currentCoords.lat},${currentCoords.lng}&destination=${destLat},${destLng}&travelmode=driving`;
    if (!targetStop && stops.length > 0) {
      const waypoints = stops
        .slice(0, 6)
        .filter(s => s.latitude && s.longitude)
        .map(s => `${s.latitude},${s.longitude}`)
        .join('|');
      if (waypoints) {
        url += `&waypoints=${encodeURIComponent(waypoints)}`;
      }
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Open Current Location Pin on Google Maps
  const openGoogleMapsPin = () => {
    const url = `https://www.google.com/maps?q=${currentCoords.lat},${currentCoords.lng}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Open School Campus on Google Maps (Direct to User-provided verified listing)
  const openSchoolGoogleMaps = () => {
    const url = `https://maps.app.goo.gl/wjptsD9GwK8ucjie7`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // 5. Start Trip Handler with High-Precision Continuous GPS Tracking
  const startTrip = () => {
    if (isSoundEnabled) playDriverSound('trip_start');
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

    if (isSoundEnabled) playDriverSound('trip_finish');
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
    const nextStatus = boardedStatus[studentId] === status ? 'Pending' : status;
    setBoardedStatus(prev => ({
      ...prev,
      [studentId]: nextStatus
    }));

    if (isSoundEnabled) {
      if (nextStatus === 'Boarded') playDriverSound('board');
      else if (nextStatus === 'Absent') playDriverSound('alert');
      else playDriverSound('tap');
    }
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
    if (isSoundEnabled) playDriverSound('board');
    showToast(`Boarded all ${studentsAtStop.length} students for this stop.`, 'success');
  };

  // Driver 1-Tap: Arrived at Next Stop
  const handleArriveAtNextStop = (targetStopParam?: TransportStop) => {
    if (!stops.length) return;
    let targetStop: TransportStop;
    if (targetStopParam) {
      targetStop = targetStopParam;
    } else {
      const currentIdx = stops.findIndex(s => s.stopName === currentStopName);
      const nextIdx = currentIdx >= 0 && currentIdx < stops.length - 1 ? currentIdx + 1 : 0;
      targetStop = stops[nextIdx];
    }
    setCurrentStopName(targetStop.stopName);

    const d = haversineDistanceMeters(currentCoords.lat, currentCoords.lng, targetStop.latitude, targetStop.longitude);
    setNextStopDistMeters(Math.round(d));
    setNextStopEtaMinutes(Math.max(1, Math.round(d / ((25 * 1000) / 60))));

    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([targetStop.latitude, targetStop.longitude], 16, { animate: true });
    }

    if (isSoundEnabled) playDriverSound('arrive');
    showToast(`✅ ${targetStop.stopName} पर पहुंच गए! बच्चों को चढ़ाएं।`, 'success');
  };

  // 1-Tap WhatsApp Alert to all parents waiting at a stop
  const sendStopWhatsAppAlert = (stop: TransportStop) => {
    const stopStudents = students.filter(s => s.stopId === stop.id);
    const names = stopStudents.map(s => s.studentName).join(', ') || 'छात्र';
    const msg = `नमस्ते! मॉडल पब्लिक स्कूल की बस (${assignedRoute?.busNumber || 'Bus #01'}) लगभग 5 मिनट में ${stop.stopName} पहुंच रही है। कृपया बच्चे (${names}) को बस स्टॉप पर तैयार रखें। - चालक: ${driverStaff?.name || 'विक्रम सिंह'}`;
    const targetPhone = stopStudents[0]?.phone || '';
    const cleanPhone = targetPhone.replace(/\D/g, '');
    const url = cleanPhone
      ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    if (isSoundEnabled) playDriverSound('tap');
    showToast(`📢 ${stop.stopName} के अभिभावकों को WhatsApp सूचना तैयार!`, 'info');
  };

  // Driver 1-Tap: Quick Passenger Count +/-
  const handleQuickPassengerCount = (delta: number) => {
    const unboarded = students.filter(s => (boardedStatus[s.studentId] || 'Pending') !== 'Boarded');
    const boarded = students.filter(s => boardedStatus[s.studentId] === 'Boarded');

    if (delta > 0 && unboarded.length > 0) {
      setBoardedStatus(prev => ({ ...prev, [unboarded[0].studentId]: 'Boarded' }));
      if (isSoundEnabled) playDriverSound('board');
      showToast(`➕ 1 बच्चा चढ़ा (${unboarded[0].studentName})`, 'info');
    } else if (delta < 0 && boarded.length > 0) {
      setBoardedStatus(prev => ({ ...prev, [boarded[boarded.length - 1].studentId]: 'Dropped' }));
      if (isSoundEnabled) playDriverSound('tap');
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

  // 12. Add new stop handler with complete student assignment support
  const handleAddStop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignedRoute) {
      showToast('चालक के लिए कोई सक्रिय रूट उपलब्ध नहीं है (No route assigned)', 'alert');
      return;
    }
    if (!stopForm.stopName.trim()) {
      showToast('कृपया स्टॉप का नाम दर्ज करें (Please enter stop name)', 'alert');
      return;
    }

    try {
      setIsSubmittingStop(true);
      const res = await api.createTransportStop({
        routeId: assignedRoute.id,
        stopName: stopForm.stopName.trim(),
        stopNumber: Number(stopForm.stopNumber) || (stops.length + 1),
        pickupTime: stopForm.pickupTime.trim() || '07:30 AM',
        dropTime: stopForm.dropTime.trim() || '02:45 PM',
        landmark: stopForm.landmark.trim(),
        latitude: Number(stopForm.latitude) || 27.0270,
        longitude: Number(stopForm.longitude) || 84.6826,
        feeMonthly: Number(stopForm.feeMonthly) || 600,
        assignedStudentIds: selectedStudentIdsForStop
      });

      const newStopId = (res as any)?.stop?.id || (res as any)?.id || `stp-${Date.now()}`;

      // Assign all selected students to this stop in the transport roster
      for (const stId of selectedStudentIdsForStop) {
        const studentObj = allStudents.find(s => s.id === stId);
        if (studentObj) {
          await api.addTransportStudent({
            routeId: assignedRoute.id,
            routeName: assignedRoute.routeName,
            studentId: studentObj.id,
            studentName: studentObj.name,
            rollNo: studentObj.rollNo,
            class: studentObj.class,
            section: studentObj.section,
            stopId: newStopId,
            stopName: stopForm.stopName.trim(),
            pickupTime: stopForm.pickupTime.trim() || '07:30 AM',
            dropTime: stopForm.dropTime.trim() || '02:45 PM'
          });
        }
      }

      setShowAddStopModal(false);
      showToast(`✅ नया स्टॉप "${stopForm.stopName}" जोड़ा गया और ${selectedStudentIdsForStop.length} छात्र असाइन किए गए!`, 'success');
      if (isSoundEnabled) playDriverSound('arrive');
      await loadPortalData();
    } catch (err: any) {
      showToast(err.message || 'Error adding stop', 'alert');
    } finally {
      setIsSubmittingStop(false);
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

            {/* Quick 1-Tap Demo Driver Sign-In */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <p className="text-[11px] font-bold text-slate-400 text-center uppercase tracking-wider">
                त्वरित लॉगिन (One-Tap Driver Access)
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLoginForm({ username: 'driver1', password: 'driver123' });
                    setTimeout(() => {
                      const fakeEvt = { preventDefault: () => {} } as any;
                      handleDriverLogin(fakeEvt);
                    }, 50);
                  }}
                  className="p-2 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-xl text-left transition group cursor-pointer"
                >
                  <div className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                    <Bus className="w-3 h-3" /> Bus #01
                  </div>
                  <div className="text-xs font-black text-white group-hover:text-amber-300 truncate">
                    राजेश कुमार
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">सिकटा रूट</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLoginForm({ username: 'driver2', password: 'driver123' });
                    setTimeout(() => {
                      const fakeEvt = { preventDefault: () => {} } as any;
                      handleDriverLogin(fakeEvt);
                    }, 50);
                  }}
                  className="p-2 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-xl text-left transition group cursor-pointer"
                >
                  <div className="text-[10px] text-blue-400 font-bold flex items-center gap-1">
                    <Bus className="w-3 h-3" /> Bus #02
                  </div>
                  <div className="text-xs font-black text-white group-hover:text-blue-300 truncate">
                    विक्रम सिंह
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">बेतिया रूट</div>
                </button>
              </div>
            </div>

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
  // Filtered Students for the Add Stop Modal
  // -------------------------------------------------------------
  const availableStudentsForModal = allStudents.length > 0 ? allStudents : [
    { id: 'st-demo-1', name: 'Aarav Sharma', class: 'Class 5', section: 'A', rollNo: '12', fatherName: 'Rajesh Sharma', phone: '9801234561' },
    { id: 'st-demo-2', name: 'Priya Kumari', class: 'Class 4', section: 'B', rollNo: '08', fatherName: 'Manoj Kumar', phone: '9801234562' },
    { id: 'st-demo-3', name: 'Rohit Verma', class: 'Class 6', section: 'A', rollNo: '15', fatherName: 'Vikash Verma', phone: '9801234563' },
    { id: 'st-demo-4', name: 'Ananya Singh', class: 'Class 3', section: 'A', rollNo: '04', fatherName: 'Ramesh Singh', phone: '9801234564' },
    { id: 'st-demo-5', name: 'Aryan Patel', class: 'Class 7', section: 'A', rollNo: '21', fatherName: 'Deepak Patel', phone: '9801234565' },
    { id: 'st-demo-6', name: 'Sneha Pandey', class: 'Class 5', section: 'B', rollNo: '19', fatherName: 'Sanjay Pandey', phone: '9801234566' },
  ];

  const filteredStudentsInModal = availableStudentsForModal.filter(s => {
    const q = studentSearchInStopModal.toLowerCase().trim();
    const matchesSearch = !q ||
      s.name.toLowerCase().includes(q) ||
      (s.rollNo && s.rollNo.toString().includes(q)) ||
      (s.class && s.class.toLowerCase().includes(q));
    const matchesClass = filterClassInStopModal === 'All' || s.class === filterClassInStopModal || (s.class && s.class.includes(filterClassInStopModal));
    return matchesSearch && matchesClass;
  });

  const toggleStudentSelectionForStop = (studentId: string) => {
    setSelectedStudentIdsForStop(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  // -------------------------------------------------------------
  // AUTHENTICATED DRIVER PORTAL UI
  // -------------------------------------------------------------
  return (
    <div className={`min-h-screen text-slate-100 font-sans pb-24 sm:pb-16 transition-colors duration-200 ${
      isHighContrast ? 'bg-black contrast-125' : 'bg-slate-950'
    }`}>
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
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800/90 px-3 sm:px-6 py-3 shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Driver & Bus Identity */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20 flex-shrink-0 ring-2 ring-amber-400/30">
              <Bus className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-black text-white tracking-tight font-heading flex items-center gap-1.5">
                  <span>{assignedRoute?.busNumber || 'Bus #01'}</span>
                  <span className="text-xs font-medium text-slate-400 font-sans hidden sm:inline">({assignedRoute?.routeName || 'सिकटा रूट'})</span>
                </h1>
                <span className="px-2.5 py-0.5 bg-slate-800 text-amber-400 border border-slate-700 font-mono text-[11px] font-bold rounded-lg shadow-sm">
                  {assignedRoute?.numberPlate || 'BR-22-PA-8757'}
                </span>
                {/* Clickable On/Off Duty Interactive Switch */}
                <button
                  type="button"
                  onClick={() => {
                    setIsOnDuty(!isOnDuty);
                    if (isSoundEnabled) playDriverSound('tap');
                    showToast(isOnDuty ? 'चालक ड्यूटी बंद (Off Duty)' : 'चालक ड्यूटी चालू (On Duty)', 'info');
                  }}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5 transition cursor-pointer border ${
                    isOnDuty
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                  }`}
                  title="Click to toggle driver duty status"
                >
                  <span className={`w-2 h-2 rounded-full ${isOnDuty ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
                  <span>{isOnDuty ? 'On Duty (ड्यूटी पर)' : 'Off Duty (छुट्टी)'}</span>
                </button>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span>चालक (Driver): <strong className="text-white font-semibold">{driverStaff?.name || 'राजेश कुमार'}</strong></span>
                <span className="text-slate-600">•</span>
                <span>स्कूल: <strong className="text-slate-300">Model Public School</strong></span>
              </p>
            </div>
          </div>

          {/* Quick Action Buttons & Emergency SOS */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Live GPS Broadcast Indicator */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition ${
              isTripActive
                ? 'bg-emerald-950/90 border-emerald-500/60 text-emerald-300 shadow-md shadow-emerald-900/30'
                : 'bg-slate-800/90 border-slate-700 text-slate-400'
            }`}>
              <Radio className={`w-3.5 h-3.5 ${isTripActive ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">{isTripActive ? 'लाइव GPS ऑन' : 'GPS तैयार'}</span>
            </div>

            {/* Sound Mute / Unmute Toggle */}
            <button
              onClick={() => {
                setIsSoundEnabled(!isSoundEnabled);
                if (!isSoundEnabled) playDriverSound('tap');
              }}
              className={`p-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                isSoundEnabled
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/40 hover:bg-amber-500/20'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
              }`}
              title={isSoundEnabled ? 'ध्वनि संकेत चालू (Sound ON)' : 'ध्वनि संकेत बंद (Muted)'}
            >
              {isSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* High Contrast Mode Toggle */}
            <button
              onClick={() => setIsHighContrast(!isHighContrast)}
              className={`p-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                isHighContrast
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
              title={isHighContrast ? 'हाई कॉन्ट्रास्ट मोड चालू' : 'नॉर्मल नाइट मोड'}
            >
              {isHighContrast ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Emergency SOS Button */}
            <button
              onClick={() => {
                if (isSoundEnabled) playDriverSound('alert');
                setShowSosModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black shadow-lg shadow-rose-600/30 transition transform active:scale-95 cursor-pointer animate-pulse"
              title="Send Immediate Emergency SOS Alert to School Dispatch"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>SOS आपातकाल</span>
            </button>

            {/* Daily Safety Checklist Button */}
            <button
              onClick={() => setShowInspectionModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              title="Complete Pre-Trip Vehicle Checklist"
            >
              <Wrench className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden md:inline">जांच</span>
            </button>

            {/* Fuel Log Button */}
            <button
              onClick={() => setShowFuelModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              title="Record Diesel Expense"
            >
              <Fuel className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">डीजल</span>
            </button>

            {/* Logout */}
            <button
              onClick={() => logout()}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-rose-600 hover:text-white border border-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              title="लॉगआउट (Sign Out)"
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
            { id: 'live_trip', label: '🧭 ड्राइवर कॉकपिट (Cockpit & Map)', icon: Navigation },
            { id: 'students', label: `👥 छात्र हाजिरी (${students.length})`, icon: Users },
            { id: 'stops', label: `📍 स्टॉप व समय (${stops.length})`, icon: MapPin },
            { id: 'fuel', label: '⛽ डीजल व खर्च (Fuel)', icon: Fuel },
            { id: 'inspection', label: '🛡️ गाड़ी जांच (Safety)', icon: Shield },
            { id: 'logs', label: '📜 सफ़र रिकॉर्ड (Trip Logs)', icon: Calendar },
            { id: 'supabase_controller', label: '⚡ क्लाउड स्टॉप कंट्रोलर', icon: Radio }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 min-w-[130px] inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
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
        {/* TAB: CLOUD SUPABASE CONTROLLER (OPTIONAL TOOL) */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'supabase_controller' && (
          <DriverStopController
            busId={driverStaff?.vehicleNumber ? driverStaff.vehicleNumber.toLowerCase().replace(/\s+/g, '-').replace(/#/g, '') : 'bus-01'}
            routeId="route-01"
            driverName={driverStaff?.name || 'Rajesh Kumar Singh (राजेश कुमार)'}
          />
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB: CLEAN DRIVER COCKPIT & GOOGLE ROAD ROUTE MAP */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'live_trip' && (
          <div className="space-y-3.5">
            {/* 1. Streamlined Driver Cockpit HUD (4 Key Focus Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Card 1: Trip Control & Active State */}
              <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-lg flex flex-col justify-between gap-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-400 flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-amber-400" />
                    यात्रा नियंत्रण
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    isTripActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {isTripActive ? '● यात्रा चालू' : '○ यात्रा तैयार'}
                  </span>
                </div>

                <div>
                  {!isTripActive ? (
                    <div className="space-y-2">
                      <select
                        value={tripType}
                        onChange={e => setTripType(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white focus:ring-1 focus:ring-amber-500"
                      >
                        <option value="Morning Pickup">🌅 सुबह की पिकअप (Morning)</option>
                        <option value="Afternoon Drop">🏫 दोपहर की ड्रॉप (Afternoon)</option>
                        <option value="Special Event">🚌 स्कूल टूर / इवेंट (Tour)</option>
                      </select>
                      <button
                        onClick={startTrip}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        <span>▶️ यात्रा शुरू करें (Start Trip)</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-lg">
                        <span>सफ़र समय:</span>
                        <strong className="font-mono text-amber-300 font-bold">{formatTime(tripElapsedSeconds)}</strong>
                      </div>
                      <button
                        onClick={finishTrip}
                        className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer animate-pulse"
                      >
                        <Square className="w-4 h-4 fill-current" />
                        <span>⏹️ यात्रा समाप्त (Finish Trip)</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Card 2: Speedometer & Heading */}
              <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-lg flex flex-col justify-between gap-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-400 flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-blue-400" />
                    गाड़ी की रफ़्तार
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    currentSpeed === 0
                      ? 'bg-slate-800 text-slate-300'
                      : currentSpeed > 40
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    {currentSpeed === 0 ? '🛑 रुकी हुई' : currentSpeed > 40 ? '⚠️ तेज़' : '🚍 सामान्य'}
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-4xl font-black font-mono tracking-tight ${
                      currentSpeed === 0 ? 'text-white' : currentSpeed > 40 ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      {currentSpeed}
                    </span>
                    <span className="text-xs font-bold text-slate-400">km/h</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    Max: {maxTripSpeed} km/h
                  </span>
                </div>

                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${currentSpeed > 40 ? 'bg-rose-500' : 'bg-emerald-400'}`}
                    style={{ width: `${Math.min(100, (currentSpeed / 40) * 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                  <span className="flex items-center gap-1">
                    <Compass className="w-3 h-3 text-blue-400" />
                    दिशा: <strong className="text-slate-200">{getCompassCardinal(currentHeading).label}</strong>
                  </span>
                  <span>{currentHeading}°</span>
                </div>
              </div>

              {/* Card 3: Next Stop Navigator with 1-Tap Arrived */}
              <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-lg flex flex-col justify-between gap-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-rose-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    अगला स्टॉप
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400 font-bold">
                    ~{nextStopEtaMinutes || 1} min ETA
                  </span>
                </div>

                <div>
                  <div className="font-black text-sm text-white truncate" title={currentStopName || stops[0]?.stopName}>
                    {currentStopName || stops[0]?.stopName || 'Model Public School'}
                  </div>
                  <div className="text-[11px] text-amber-400 font-bold mt-0.5">
                    दूरी: {nextStopDistMeters !== null ? (nextStopDistMeters >= 1000 ? `${(nextStopDistMeters / 1000).toFixed(1)} km` : `${nextStopDistMeters} m`) : '--'}
                  </div>
                </div>

                <button
                  onClick={() => handleArriveAtNextStop()}
                  className="w-full py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs rounded-xl shadow flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>✅ स्टॉप पर पहुंचे (Arrived)</span>
                </button>
              </div>

              {/* Card 4: Students On Board & Quick Adjusters */}
              <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-lg flex flex-col justify-between gap-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-400 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5" />
                    सवार छात्र (Manifest)
                  </span>
                  <span className="text-[11px] font-bold text-amber-300 font-mono">
                    {boardingPercentage}%
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-white font-mono">
                      {totalBoardedCount}
                    </span>
                    <span className="text-xs text-slate-400">/ {students.length} बच्चे</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('students')}
                    className="text-[11px] font-bold text-amber-400 hover:underline cursor-pointer"
                  >
                    पूरी सूची →
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => handleQuickPassengerCount(1)}
                    className="py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white font-black text-[11px] rounded-lg shadow transition active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> 1 चढ़ा
                  </button>
                  <button
                    onClick={() => handleQuickPassengerCount(-1)}
                    className="py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-black text-[11px] rounded-lg border border-slate-700 shadow transition active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <UserMinus className="w-3 h-3" /> 1 उतरा
                  </button>
                </div>
              </div>
            </div>

            {/* 1.5. Interactive Live Route Progression Stepper & Stop Timeline */}
            <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-4 border border-slate-800 shadow-xl space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black">
                    <Navigation className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <span>लाइव रूट टाइमलाइन व स्टॉप क्रम (Route Timeline & Stops)</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 font-mono font-bold">
                        {stops.length} स्टॉप्स
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      स्टॉप चुनें, मैप पर फोकस करें, अभिभावकों को WhatsApp अलर्ट भेजें या एक-क्लिक में बच्चों को चढ़ाएं।
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => openAddStopModal()}
                    className="flex-1 sm:flex-none px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                    title="नया रूट स्टॉप जोड़ें और छात्र असाइन करें"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ नया स्टॉप जोड़ें</span>
                  </button>
                  <button
                    onClick={() => handleArriveAtNextStop()}
                    className="flex-1 sm:flex-none px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                    title="अगले स्टॉप पर बस पहुंचने का संकेत दें"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>अगले स्टॉप पर पहुंचे</span>
                  </button>
                  <button
                    onClick={openSchoolGoogleMaps}
                    className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer"
                    title="मॉडल पब्लिक स्कूल लोकेशन गूगल मैप्स पर खोलें"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">स्कूल कैम्पस मैप</span>
                  </button>
                </div>
              </div>

              {/* Horizontal Scrollable Timeline Cards */}
              <div className="flex items-stretch gap-3 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-slate-700">
                {stops.map((stop, idx) => {
                  const currentIdx = stops.findIndex(s => s.stopName === currentStopName);
                  const isCurrent = stop.stopName === currentStopName;
                  const isPassed = currentIdx > -1 && idx < currentIdx;
                  const isUpcoming = currentIdx > -1 ? idx > currentIdx : idx > 0;
                  const stopStudents = students.filter(s => s.stopId === stop.id);
                  const boardedCount = stopStudents.filter(s => boardedStatus[s.studentId] === 'Boarded').length;
                  const isSelected = selectedTimelineStopId === stop.id;

                  return (
                    <div
                      key={stop.id}
                      onClick={() => {
                        setSelectedTimelineStopId(stop.id);
                        if (mapInstanceRef.current && stop.latitude && stop.longitude) {
                          mapInstanceRef.current.setView([stop.latitude, stop.longitude], 16, { animate: true });
                        }
                        if (isSoundEnabled) playDriverSound('tap');
                      }}
                      className={`min-w-[240px] sm:min-w-[260px] max-w-[280px] p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                        isCurrent
                          ? 'bg-amber-950/40 border-amber-500/80 shadow-lg shadow-amber-500/10 ring-2 ring-amber-400/40'
                          : isPassed
                          ? 'bg-slate-900/60 border-slate-800 text-slate-400'
                          : isSelected
                          ? 'bg-blue-950/40 border-blue-500/80 ring-1 ring-blue-400/30'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Top Header of Card */}
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black font-mono ${
                            isCurrent
                              ? 'bg-amber-400 text-slate-950 animate-pulse'
                              : isPassed
                              ? 'bg-emerald-500 text-slate-950'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}>
                            {isPassed ? '✓' : idx + 1}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 font-bold">
                            स्टॉप #{idx + 1}
                          </span>
                        </div>

                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          isCurrent
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : isPassed
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {isCurrent ? '👉 वर्तमान / NEXT' : isPassed ? '✓ पार हुआ' : '⏳ आगामी'}
                        </span>
                      </div>

                      {/* Stop Info */}
                      <div>
                        <h4 className={`text-xs font-black truncate ${isCurrent ? 'text-amber-200' : 'text-white'}`} title={stop.stopName}>
                          {stop.stopName}
                        </h4>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                          <span className="truncate">{stop.landmark || 'सिकटा, प. चंपारण'}</span>
                        </p>
                      </div>

                      {/* Time & Student Tally */}
                      <div className="flex items-center justify-between text-[11px] bg-slate-950/60 px-2.5 py-1.5 rounded-xl border border-slate-800/80">
                        <span className="text-slate-300 font-mono font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-400" />
                          {stop.pickupTime || '07:30 AM'}
                        </span>
                        <span className="text-amber-300 font-bold">
                          {boardedCount}/{stopStudents.length} बच्चे
                        </span>
                      </div>

                      {/* Quick Stop Action Buttons */}
                      <div className="grid grid-cols-3 gap-1 pt-1 border-t border-slate-800/80 text-[10px]">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            sendStopWhatsAppAlert(stop);
                          }}
                          className="py-1 px-1.5 bg-emerald-700/80 hover:bg-emerald-600 text-white font-bold rounded-lg transition flex items-center justify-center gap-1 cursor-pointer"
                          title="अभिभावकों को WhatsApp संदेश भेजें"
                        >
                          <Send className="w-2.5 h-2.5" />
                          <span>WhatsApp</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBoardAllAtStop(stop.id);
                          }}
                          className="py-1 px-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-bold rounded-lg transition flex items-center justify-center gap-1 cursor-pointer"
                          title="इस स्टॉप के सभी बच्चों को चढ़ाएं"
                        >
                          <CheckCheck className="w-2.5 h-2.5" />
                          <span>बोर्ड ऑल</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArriveAtNextStop(stop);
                          }}
                          className="py-1 px-1.5 bg-blue-600/80 hover:bg-blue-600 text-white font-bold rounded-lg transition flex items-center justify-center gap-1 cursor-pointer"
                          title="इस स्टॉप पर पहुंच गए"
                        >
                          <Check className="w-2.5 h-2.5" />
                          <span>पहुंचे</span>
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Final Destination Card: Model Public School */}
                <div
                  onClick={openSchoolGoogleMaps}
                  className="min-w-[240px] sm:min-w-[260px] max-w-[280px] p-3 rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/40 to-slate-900 shadow-xl flex flex-col justify-between gap-2.5 cursor-pointer hover:border-emerald-400 transition group"
                >
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center text-xs font-black">
                      🏁
                    </span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      गंतव्य (Final Destination)
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-black text-white group-hover:text-emerald-300 truncate">
                      Model Public School, Sikta
                    </h4>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      कक्षा प्ले से 10वीं • मुख्य परिसर, सिकटा
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] bg-slate-950/80 px-2.5 py-1.5 rounded-xl border border-slate-800">
                    <span className="text-emerald-400 font-mono font-bold">27.0352°, 84.6604°</span>
                    <span className="text-[10px] text-slate-300 font-bold">स्कूल गेट</span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openSchoolGoogleMaps();
                    }}
                    className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] rounded-lg shadow transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Navigation className="w-3 h-3 text-amber-300" />
                    <span>स्कूल गेट नेविगेशन (Google Maps)</span>
                  </button>
                </div>

                {/* Add Stop Card in Stepper Timeline */}
                <div
                  onClick={() => openAddStopModal()}
                  className="min-w-[200px] p-3 rounded-2xl border-2 border-dashed border-slate-700 hover:border-rose-500 bg-slate-900/40 hover:bg-rose-950/20 shadow-lg flex flex-col items-center justify-center gap-2 cursor-pointer transition text-center group"
                  title="रूट में नया स्टॉप जोड़ें"
                >
                  <div className="w-10 h-10 rounded-2xl bg-rose-600/20 group-hover:bg-rose-600 text-rose-400 group-hover:text-white flex items-center justify-center transition shadow">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-white group-hover:text-rose-300">+ नया स्टॉप जोड़ें</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">छात्र असाइन करें</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Map Status & Google Road Navigation Ribbon */}
            <div className="bg-slate-900 rounded-2xl p-3 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-2.5">
              {/* Left: Dynamic Real Road Route Info */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-950/80 border border-blue-500/40 rounded-xl">
                  <span className={`w-2.5 h-2.5 rounded-full ${isRoutingLoading ? 'bg-amber-400 animate-spin' : 'bg-blue-400 animate-ping'}`} />
                  <span className="text-xs font-black text-blue-200 flex items-center gap-1.5">
                    <span>🛣️ गूगल सड़क मार्ग:</span>
                    <strong className="text-white font-mono">{routeDistanceKm || '4.2'} km</strong>
                    <span className="text-blue-300">• ~{routeDurationMins || '11'} min</span>
                  </span>
                  <span className="text-[10px] text-blue-400 hidden md:inline font-medium">
                    (वर्तमान जगह ➔ स्कूल गेट)
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
                  <span className={`w-1.5 h-1.5 rounded-full ${isUsingDeviceGps ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  <span>📍 {currentCoords.lat.toFixed(5)}°, {currentCoords.lng.toFixed(5)}°</span>
                  <span className="text-slate-500">(±{gpsAccuracy || 5}m)</span>
                </div>
              </div>

              {/* Right: Controls, Map Toggle & Navigation Launcher */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Search / Pin Location Button */}
                <button
                  onClick={() => setShowLocationSearch(!showLocationSearch)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    showLocationSearch
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                  title="Search any location or coordinate on map"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>खोजें / पिन</span>
                </button>

                {/* Map Layer Option (Streets vs Satellite) */}
                {mapViewMode === 'leaflet' && (
                  <button
                    onClick={() => toggleMapLayer(mapLayerType === 'google_streets' ? 'google_hybrid' : 'google_streets')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                    title="Toggle Streets or Satellite View"
                  >
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    <span>{mapLayerType === 'google_streets' ? '🛰️ सैटेलाइट' : '🗺️ सड़क नक्शा'}</span>
                  </button>
                )}

                {/* Switch between Interactive Map & Live Google Embed */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setMapViewMode('leaflet')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                      mapViewMode === 'leaflet'
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🗺️ नक्शा
                  </button>
                  <button
                    onClick={() => setMapViewMode('google_embed')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                      mapViewMode === 'google_embed'
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🌐 गूगल रूट
                  </button>
                </div>

                {/* Launch Google Maps Native Driving Navigation */}
                <button
                  onClick={() => openGoogleMapsNavigation()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl shadow-lg transition active:scale-95 cursor-pointer"
                  title="Open Google Maps App with Turn-by-Turn driving directions from current location"
                >
                  <Navigation className="w-3.5 h-3.5 text-amber-300" />
                  <span>गूगल मैप्स नेविगेशन</span>
                </button>

                {/* Add Stop Button on Map Ribbon */}
                <button
                  onClick={() => openAddStopModal()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-lg transition active:scale-95 cursor-pointer"
                  title="नक्शे पर नया स्टॉप जोड़ें और छात्र असाइन करें"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ स्टॉप जोड़ें</span>
                </button>
              </div>
            </div>

            {/* 3. Search Bar & Quick Stop Presets (Expandable) */}
            {showLocationSearch && (
              <div className="p-3 bg-slate-900 rounded-2xl border border-amber-500/40 space-y-2.5 shadow-xl animate-in fade-in slide-in-from-top-2">
                <form onSubmit={handleSearchLocation} className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={manualLocationQuery}
                      onChange={(e) => setManualLocationQuery(e.target.value)}
                      placeholder="पता, चौक, सड़क या Lat, Lng लिखें (उदा: Bettiah, Sikta Bazar, या 27.025, 84.681)"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
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

                {/* Quick Accurate Presets */}
                <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] pt-1">
                  <span className="text-slate-400 font-bold whitespace-nowrap">त्वरित स्टॉप:</span>
                  <button
                    onClick={() => snapToPresetLocation('Sikta Railway Station (सिकटा स्टेशन)', 27.0249, 84.6812)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg whitespace-nowrap border border-slate-700 transition cursor-pointer"
                  >
                    🚉 सिकटा स्टेशन
                  </button>
                  <button
                    onClick={() => snapToPresetLocation('Sikta Main Market Chowk (बाज़ार चौक)', 27.0268, 84.6818)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg whitespace-nowrap border border-slate-700 transition cursor-pointer"
                  >
                    🏪 बाज़ार चौक
                  </button>
                  <button
                    onClick={() => snapToPresetLocation('Sikta Hospital Mod (अस्पताल मोड़)', 27.0235, 84.6782)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg whitespace-nowrap border border-slate-700 transition cursor-pointer"
                  >
                    🏥 अस्पताल मोड़
                  </button>
                  <button
                    onClick={() => snapToPresetLocation('Bhawanipur Chowk (भवानीपुर चौक)', 27.0195, 84.6738)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg whitespace-nowrap border border-slate-700 transition cursor-pointer"
                  >
                    🏘️ भवानीपुर चौक
                  </button>
                  <button
                    onClick={() => snapToPresetLocation('Model Public School Main Campus (स्कूल गेट)', 27.035265, 84.660400)}
                    className="px-2.5 py-1 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 rounded-lg whitespace-nowrap border border-emerald-600 transition font-bold cursor-pointer"
                  >
                    🏫 स्कूल गेट (कैंपस)
                  </button>
                </div>

                {locationSearchResults.length > 0 && (
                  <div className="bg-slate-950 rounded-xl border border-slate-800 divide-y divide-slate-800 max-h-44 overflow-y-auto">
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

            {/* Permission Denied Notice */}
            {locationPermissionDenied && (
              <div className="p-3 bg-rose-950/80 border border-rose-500/50 rounded-2xl flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-rose-200">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>ब्राउज़र में लोकेशन अनुमति ब्लॉक है। कृपया एड्रेस बार में लोकेशन चालू करें।</span>
                </div>
                <button
                  onClick={() => acquireDeviceLocation(true, false)}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg whitespace-nowrap transition cursor-pointer"
                >
                  पुनः प्रयास करें
                </button>
              </div>
            )}

            {/* 4. Full Featured Map Canvas with Real Google Road Routing */}
            <div className={`bg-slate-900 rounded-3xl p-2.5 sm:p-3 border border-slate-800 shadow-2xl relative transition-all ${
              isMapFullscreen ? 'fixed inset-3 z-50 flex flex-col' : ''
            }`}>
              {mapViewMode === 'google_embed' ? (
                <div className={`w-full rounded-2xl overflow-hidden border border-slate-800 relative z-10 shadow-inner bg-slate-950 ${
                  isMapFullscreen ? 'flex-1 min-h-[500px]' : 'h-[500px]'
                }`}>
                  <iframe
                    src={`https://maps.google.com/maps?saddr=${currentCoords.lat},${currentCoords.lng}&daddr=27.035265,84.660400&t=m&z=15&output=embed`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen={false}
                    loading="lazy"
                    title="Live Google Road Route from Driver Location to School"
                    className="w-full h-full"
                  />
                  <div className="absolute bottom-3 right-3 z-20">
                    <button
                      onClick={() => openGoogleMapsNavigation()}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>गूगल मैप्स ऐप में खोलें</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative w-full">
                  <div
                    ref={mapContainerRef}
                    className={`w-full rounded-2xl overflow-hidden border border-slate-800 relative z-10 shadow-inner ${
                      isMapFullscreen ? 'flex-1 min-h-[500px]' : 'h-[500px]'
                    }`}
                  />

                  {/* Top-Right Map Controls (Center Bus, Add Stop, Auto-Follow, Fullscreen) */}
                  <div className="absolute top-4 right-4 z-[450] flex items-center gap-1.5 pointer-events-auto">
                    <button
                      onClick={() => openAddStopModal({ lat: currentCoords.lat, lng: currentCoords.lng })}
                      className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white border border-rose-400 rounded-xl text-xs font-bold shadow-lg backdrop-blur transition cursor-pointer flex items-center gap-1"
                      title="वर्तमान लोकेशन पर स्टॉप जोड़ें (+ Add Stop)"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ स्टॉप</span>
                    </button>

                    <button
                      onClick={centerMapOnVehicle}
                      className="px-2.5 py-1.5 bg-slate-900/90 hover:bg-slate-900 text-amber-400 border border-slate-700 rounded-xl text-xs font-bold shadow-lg backdrop-blur transition cursor-pointer flex items-center gap-1"
                      title="बस पर लाएं"
                    >
                      <LocateFixed className="w-3.5 h-3.5" />
                      <span>बस पर लाएं</span>
                    </button>

                    <button
                      onClick={() => setAutoFollowVehicle(!autoFollowVehicle)}
                      className={`px-2 py-1.5 rounded-xl text-xs font-bold border shadow-lg backdrop-blur transition cursor-pointer flex items-center gap-1 ${
                        autoFollowVehicle
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                          : 'bg-slate-900/90 text-slate-400 border-slate-700'
                      }`}
                      title={autoFollowVehicle ? 'ऑटो फॉलो चालू' : 'ऑटो फॉलो बंद'}
                    >
                      {autoFollowVehicle ? <Lock className="w-3 h-3 text-amber-400" /> : <Unlock className="w-3 h-3" />}
                    </button>

                    <button
                      onClick={() => setIsMapFullscreen(!isMapFullscreen)}
                      className="p-1.5 bg-slate-900/90 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-700 rounded-xl shadow-lg backdrop-blur transition cursor-pointer"
                      title={isMapFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                    >
                      {isMapFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Floating Google Maps Style Locate Me Action Button */}
                  <div className="absolute bottom-6 right-4 z-[450] flex flex-col items-end gap-2.5 pointer-events-auto">
                    <button
                      onClick={() => openGoogleMapsNavigation()}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-2xl border border-blue-400/50 backdrop-blur-md flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                      title="Turn-by-turn driving directions in Google Maps app"
                    >
                      <Navigation className="w-3.5 h-3.5 text-amber-300" />
                      <span>नेविगेशन शुरू करें</span>
                    </button>

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
                  <div className="absolute bottom-6 left-4 z-[450] max-w-[70%] sm:max-w-md pointer-events-auto">
                    <div className="bg-slate-950/90 backdrop-blur-md px-3 py-2 rounded-2xl border border-slate-700 shadow-2xl space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isUsingDeviceGps ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                        <span className="text-[11px] font-mono font-bold text-white">
                          {currentCoords.lat.toFixed(5)}° N, {currentCoords.lng.toFixed(5)}° E
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          {isUsingDeviceGps ? 'Live GPS' : 'Sikta Route'}
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
            <div className="bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-800 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-amber-400" />
                    <span>लाइव यात्री हाजिरी व बोर्डिंग (Live Passenger Manifest)</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    हर स्टॉप पर पहुंचते ही बच्चों को एक टैप में सवार (Boarded) या उतरा (Dropped) दर्ज करें।
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-60">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={studentSearch}
                      onChange={e => setStudentSearch(e.target.value)}
                      placeholder="नाम, क्लास या रोल # खोजें..."
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                    />
                  </div>
                  <button
                    onClick={() => openAddStopModal()}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition cursor-pointer shrink-0"
                    title="नया रूट स्टॉप जोड़ें और छात्र असाइन करें"
                  >
                    <Plus className="w-3.5 h-3.5" /> <span>+ स्टॉप जोड़ें</span>
                  </button>
                  <button
                    onClick={() => setShowAddStudentModal(true)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" /> <span>छात्र जोड़ें</span>
                  </button>
                </div>
              </div>

              {/* Status Filter Bar & Board All Shortcut */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {[
                    { id: 'All' as const, label: 'सभी', count: students.length },
                    { id: 'Waiting' as const, label: 'प्रतीक्षारत', count: students.filter(st => !boardedStatus[st.studentId] || boardedStatus[st.studentId] === 'Pending').length },
                    { id: 'Boarded' as const, label: 'सवार (Boarded)', count: students.filter(st => boardedStatus[st.studentId] === 'Boarded').length },
                    { id: 'Dropped' as const, label: 'ड्रॉप (Dropped)', count: students.filter(st => boardedStatus[st.studentId] === 'Dropped').length },
                    { id: 'Absent' as const, label: 'अनुपस्थित', count: students.filter(st => boardedStatus[st.studentId] === 'Absent').length }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setManifestFilter(tab.id);
                        if (isSoundEnabled) playDriverSound('tap');
                      }}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 border ${
                        manifestFilter === tab.id
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono font-black ${
                        manifestFilter === tab.id ? 'bg-slate-950 text-amber-300' : 'bg-slate-900 text-slate-300'
                      }`}>
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Quick Board All Button */}
                <button
                  type="button"
                  onClick={() => {
                    const unboarded = filteredStudents.filter(st => (!boardedStatus[st.studentId] || boardedStatus[st.studentId] === 'Pending'));
                    if (unboarded.length === 0) {
                      showToast('सभी छात्र पहले से ही बोर्ड हो चुके हैं', 'info');
                      return;
                    }
                    const nextStatus = { ...boardedStatus };
                    unboarded.forEach(st => {
                      nextStatus[st.studentId] = 'Boarded';
                    });
                    setBoardedStatus(nextStatus);
                    if (isSoundEnabled) playDriverSound('board');
                    showToast(`${unboarded.length} छात्रों को बोर्ड चिह्नित किया गया!`, 'success');
                  }}
                  className="px-3 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  title="सभी शेष प्रतीक्षारत छात्रों को एक साथ चढ़ाएं"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>सभी प्रतीक्षारत चढ़ाएं</span>
                </button>
              </div>

              {/* Student Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredStudents
                  .filter(st => {
                    const status = boardedStatus[st.studentId] || 'Pending';
                    if (manifestFilter === 'Waiting') return status === 'Pending';
                    if (manifestFilter === 'Boarded') return status === 'Boarded';
                    if (manifestFilter === 'Dropped') return status === 'Dropped';
                    if (manifestFilter === 'Absent') return status === 'Absent';
                    return true;
                  })
                  .map(st => {
                    const status = boardedStatus[st.studentId] || 'Pending';
                    const initials = st.studentName.split(' ').map(n => n[0]).join('').slice(0, 2);

                    return (
                      <div
                        key={st.id}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          status === 'Boarded'
                            ? 'bg-emerald-950/30 border-emerald-500/50 shadow-md shadow-emerald-950/20'
                            : status === 'Dropped'
                            ? 'bg-blue-950/30 border-blue-500/50 shadow-md shadow-blue-950/20'
                            : status === 'Absent'
                            ? 'bg-rose-950/30 border-rose-500/50 opacity-80'
                            : 'bg-slate-800/80 border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                              status === 'Boarded'
                                ? 'bg-emerald-500 text-slate-950'
                                : status === 'Dropped'
                                ? 'bg-blue-500 text-white'
                                : status === 'Absent'
                                ? 'bg-rose-500 text-white'
                                : 'bg-slate-700 text-amber-400'
                            }`}>
                              {initials || 'ST'}
                            </div>

                            <div>
                              <div className="font-bold text-white text-sm flex items-center gap-1.5">
                                <span className="truncate">{st.studentName}</span>
                                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black uppercase ${
                                  status === 'Boarded'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : status === 'Dropped'
                                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                    : status === 'Absent'
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                    : 'bg-slate-700 text-slate-300'
                                }`}>
                                  {status === 'Boarded' ? 'सवार' : status === 'Dropped' ? 'ड्रॉप' : status === 'Absent' ? 'अनुपस्थित' : 'बाकी'}
                                </span>
                              </div>
                              <div className="text-xs text-slate-400">
                                कक्षा {st.class}-{st.section} • रोल #{st.rollNo}
                              </div>
                              <div className="text-[11px] text-amber-400 font-bold mt-1 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                                <span className="truncate">{st.stopName}</span>
                              </div>
                            </div>
                          </div>

                          {/* Quick Parent Contact Actions */}
                          <div className="flex items-center gap-1 shrink-0">
                            <a
                              href={`tel:${st.phone}`}
                              className="p-1.5 bg-slate-700 hover:bg-slate-600 text-blue-400 rounded-xl transition"
                              title={`अभिभावक को कॉल करें (${st.phone})`}
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                            <a
                              href={`https://wa.me/91${st.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                                `नमस्ते! मॉडल पब्लिक स्कूल ट्रांसपोर्ट अलर्ट: बस #${assignedRoute?.busNumber || '01'} वर्तमान में ${st.stopName} के समीप है। कृपया ${st.studentName} को तैयार रखें।`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl transition"
                              title="WhatsApp पर अभिभावक को सूचित करें"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="grid grid-cols-3 gap-1.5 mt-3 pt-2.5 border-t border-slate-700/60 text-xs font-bold">
                          <button
                            type="button"
                            onClick={() => handleToggleBoarding(st.studentId, 'Boarded')}
                            className={`py-1.5 rounded-xl flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer ${
                              status === 'Boarded'
                                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                                : 'bg-slate-700/60 hover:bg-emerald-600 text-slate-300 hover:text-white'
                            }`}
                          >
                            <Check className="w-3 h-3" />
                            <span>चढ़ा (Board)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleBoarding(st.studentId, 'Dropped')}
                            className={`py-1.5 rounded-xl flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer ${
                              status === 'Dropped'
                                ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                                : 'bg-slate-700/60 hover:bg-blue-600 text-slate-300 hover:text-white'
                            }`}
                          >
                            <CheckCircle className="w-3 h-3" />
                            <span>उतरा (Drop)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleBoarding(st.studentId, 'Absent')}
                            className={`py-1.5 rounded-xl flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer ${
                              status === 'Absent'
                                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                                : 'bg-slate-700/60 hover:bg-rose-600 text-slate-300 hover:text-white'
                            }`}
                          >
                            <X className="w-3 h-3" />
                            <span>अनुपस्थित</span>
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
                onClick={() => openAddStopModal()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition active:scale-95 cursor-pointer shadow-lg"
              >
                <Plus className="w-4 h-4" /> + नया स्टॉप जोड़ें (+ Add Route Stop)
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
      {/* MODAL: ADD ROUTE STOP & ASSIGN STUDENTS */}
      {/* ------------------------------------------------------------- */}
      {showAddStopModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-7 max-w-4xl w-full shadow-2xl space-y-5 my-auto max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-600/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-black shadow-inner">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <span>नया रूट स्टॉप जोड़ें व छात्र असाइन करें</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono font-bold border border-rose-500/30">
                      स्टॉप #{stopForm.stopNumber}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    रूट: <span className="text-white font-bold">{assignedRoute?.routeName || 'Main Route'}</span> • स्टॉप की जानकारी भरें और इस स्टॉप पर चढ़ने वाले छात्रों को चुनें
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowAddStopModal(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form with Two Columns (Details on Left, Student Picker on Right) */}
            <form onSubmit={handleAddStop} className="flex-1 overflow-y-auto space-y-5 pr-1 text-xs">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* LEFT COLUMN: STOP BASIC INFO & GPS (5 Columns on Desktop) */}
                <div className="lg:col-span-5 space-y-3.5 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between text-slate-300 font-bold border-b border-slate-800/80 pb-2">
                    <span className="flex items-center gap-1.5 text-white">
                      <Navigation className="w-3.5 h-3.5 text-rose-400" />
                      <span>1. स्टॉप की जानकारी (Stop Details)</span>
                    </span>
                    <span className="text-[10px] text-amber-400 font-mono">क्रम #{stopForm.stopNumber}</span>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      स्टॉप का नाम (Stop Name) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={stopForm.stopName}
                      onChange={e => setStopForm({ ...stopForm, stopName: e.target.value })}
                      placeholder="उदा. पुरानी बाजार चौक, सिकटा"
                      className="w-full p-2.5 bg-slate-800 border border-slate-700 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-xl text-white font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      लैंडमार्क / पहचान (Landmark)
                    </label>
                    <input
                      type="text"
                      value={stopForm.landmark}
                      onChange={e => setStopForm({ ...stopForm, landmark: e.target.value })}
                      placeholder="उदा. शिव मंदिर के पास / पेट्रोल पंप"
                      className="w-full p-2.5 bg-slate-800 border border-slate-700 focus:border-rose-500 rounded-xl text-white text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">
                        सुबह पिकअप (Pickup) <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={stopForm.pickupTime}
                        onChange={e => setStopForm({ ...stopForm, pickupTime: e.target.value })}
                        placeholder="07:30 AM"
                        className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">
                        दोपहर ड्रॉप (Drop) <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={stopForm.dropTime}
                        onChange={e => setStopForm({ ...stopForm, dropTime: e.target.value })}
                        placeholder="02:45 PM"
                        className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">क्रम संख्या (Seq #)</label>
                      <input
                        type="number"
                        min="1"
                        value={stopForm.stopNumber}
                        onChange={e => setStopForm({ ...stopForm, stopNumber: Number(e.target.value) })}
                        className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono font-bold text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">मासिक किराया (Fee ₹)</label>
                      <input
                        type="number"
                        value={stopForm.feeMonthly}
                        onChange={e => setStopForm({ ...stopForm, feeMonthly: Number(e.target.value) })}
                        className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-xs"
                      />
                    </div>
                  </div>

                  {/* GPS Coordinates & Quick Presets */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-300 font-bold flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-amber-400" />
                        <span>जीपीएस निर्देशांक (Coordinates)</span>
                      </label>
                      <span className="text-[10px] text-slate-500">Google Map Valid</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 font-mono">
                      <div>
                        <span className="text-[10px] text-slate-400">अक्षांश (Lat)</span>
                        <input
                          type="number"
                          step="0.000001"
                          value={stopForm.latitude}
                          onChange={e => setStopForm({ ...stopForm, latitude: Number(e.target.value) })}
                          className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-mono"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400">देशांतर (Lng)</span>
                        <input
                          type="number"
                          step="0.000001"
                          value={stopForm.longitude}
                          onChange={e => setStopForm({ ...stopForm, longitude: Number(e.target.value) })}
                          className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-mono"
                        />
                      </div>
                    </div>

                    {/* Fast Quick Buttons to Auto-fill Coordinates */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setStopForm(prev => ({
                            ...prev,
                            latitude: Number(currentCoords.lat.toFixed(6)),
                            longitude: Number(currentCoords.lng.toFixed(6))
                          }));
                          showToast('📍 वर्तमान बस लोकेशन निर्देशांक सेट किए गए', 'info');
                        }}
                        className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1"
                      >
                        <LocateFixed className="w-2.5 h-2.5" />
                        <span>वर्तमान बस GPS</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setStopForm(prev => ({
                            ...prev,
                            latitude: 27.035265,
                            longitude: 84.660400,
                            stopName: prev.stopName || 'MPS Sikta Campus Gate'
                          }));
                          showToast('🏫 स्कूल गेट निर्देशांक सेट किए गए', 'info');
                        }}
                        className="px-2.5 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1"
                      >
                        <span>🏫 स्कूल गेट</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setStopForm(prev => ({
                            ...prev,
                            latitude: 27.0249,
                            longitude: 84.6812,
                            stopName: prev.stopName || 'Sikta Railway Station'
                          }));
                          showToast('🚉 सिकटा रेलवे स्टेशन निर्देशांक सेट', 'info');
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-[10px] font-bold transition cursor-pointer"
                      >
                        🚉 सिकटा स्टेशन
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setStopForm(prev => ({
                            ...prev,
                            latitude: 27.0268,
                            longitude: 84.6818,
                            stopName: prev.stopName || 'Sikta Main Bazaar'
                          }));
                          showToast('🏪 बाजार चौक निर्देशांक सेट', 'info');
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-[10px] font-bold transition cursor-pointer"
                      >
                        🏪 बाजार चौक
                      </button>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: INTERACTIVE STUDENT SELECTOR (7 Columns on Desktop) */}
                <div className="lg:col-span-7 space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
                  <div>
                    {/* Header of Student Selection */}
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-400" />
                        <span className="font-bold text-white text-xs">
                          2. इस स्टॉप के छात्र चुनें (Select Students for this Stop)
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[11px] border border-emerald-500/30">
                        {selectedStudentIdsForStop.length} छात्र चुने गए
                      </span>
                    </div>

                    {/* Search & Bulk Select / Clear Actions */}
                    <div className="mt-3 flex flex-wrap items-center gap-2 justify-between">
                      <div className="relative flex-1 min-w-[180px]">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={studentSearchInStopModal}
                          onChange={e => setStudentSearchInStopModal(e.target.value)}
                          placeholder="नाम, रोल # या क्लास खोजें..."
                          className="w-full pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const ids = filteredStudentsInModal.map(s => s.id);
                            setSelectedStudentIdsForStop(prev => Array.from(new Set([...prev, ...ids])));
                          }}
                          className="px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-[11px] font-bold transition cursor-pointer"
                        >
                          सब चुनें ({filteredStudentsInModal.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedStudentIdsForStop([])}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 rounded-xl text-[11px] font-bold transition cursor-pointer"
                        >
                          साफ करें (Clear)
                        </button>
                      </div>
                    </div>

                    {/* Class Filter Badges */}
                    <div className="mt-2.5 flex items-center gap-1 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-800">
                      {['All', 'Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'].map(cls => (
                        <button
                          key={cls}
                          type="button"
                          onClick={() => setFilterClassInStopModal(cls)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition cursor-pointer ${
                            filterClassInStopModal === cls
                              ? 'bg-emerald-600 text-white shadow'
                              : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {cls}
                        </button>
                      ))}
                    </div>

                    {/* Scrollable Student Picker Cards List */}
                    <div className="mt-3 space-y-1.5 max-h-[260px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700">
                      {filteredStudentsInModal.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 text-xs">
                          कोई छात्र नहीं मिला (No students matched search)
                        </div>
                      ) : (
                        filteredStudentsInModal.map(st => {
                          const isSelected = selectedStudentIdsForStop.includes(st.id);
                          const existingAssigned = students.find(s => s.studentId === st.id);

                          return (
                            <div
                              key={st.id}
                              onClick={() => toggleStudentSelectionForStop(st.id)}
                              className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 select-none ${
                                isSelected
                                  ? 'bg-emerald-950/40 border-emerald-500/80 shadow-md ring-1 ring-emerald-500/30'
                                  : 'bg-slate-800/60 border-slate-700/60 hover:border-slate-600 hover:bg-slate-800'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`w-5 h-5 rounded-lg flex items-center justify-center font-black text-xs transition ${
                                  isSelected ? 'bg-emerald-500 text-slate-950' : 'border border-slate-600 bg-slate-900'
                                }`}>
                                  {isSelected ? '✓' : ''}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-white text-xs truncate flex items-center gap-1.5">
                                    <span>{st.name}</span>
                                    {st.rollNo && (
                                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 font-mono">
                                        Roll #{st.rollNo}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-400 flex items-center gap-2 truncate mt-0.5">
                                    <span>{st.class} {st.section ? `(${st.section})` : ''}</span>
                                    {st.phone && <span>• 📞 {st.phone}</span>}
                                  </div>
                                </div>
                              </div>

                              <div className="shrink-0 text-right">
                                {existingAssigned ? (
                                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
                                    वर्तमान: {existingAssigned.stopName || 'अन्य स्टॉप'}
                                  </span>
                                ) : (
                                  <span className={`text-[10px] font-bold ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`}>
                                    {isSelected ? 'चयनित (Selected)' : '+ जोड़ें'}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Summary Bar inside Right Column */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                    <span>कुल उपलब्ध छात्र: {availableStudentsForModal.length}</span>
                    <span className="text-emerald-400 font-bold">
                      {selectedStudentIdsForStop.length} छात्र इस स्टॉप पर चढ़ेंगे
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddStopModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition cursor-pointer text-xs"
                >
                  रद्द करें (Cancel)
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingStop || !stopForm.stopName.trim()}
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-black rounded-xl shadow-xl transition active:scale-95 flex items-center gap-2 cursor-pointer text-xs"
                >
                  {isSubmittingStop ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>स्टॉप जोड़ा जा रहा है...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>✓ स्टॉप सेव करें व {selectedStudentIdsForStop.length} छात्र असाइन करें</span>
                    </>
                  )}
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
      {/* Sticky Mobile Driver Bottom Quick Dock */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/90 px-3 py-2 sm:hidden flex items-center justify-around shadow-2xl">
        <button
          onClick={() => {
            if (!isTripActive) startTrip();
            else finishTrip();
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition shadow-lg active:scale-95 cursor-pointer ${
            isTripActive
              ? 'bg-rose-600 text-white animate-pulse'
              : 'bg-emerald-600 text-white'
          }`}
        >
          {isTripActive ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          <span>{isTripActive ? 'यात्रा समाप्त' : 'यात्रा शुरू'}</span>
        </button>

        <button
          onClick={() => openAddStopModal()}
          className="px-2.5 py-2 bg-rose-600/30 hover:bg-rose-600/40 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-black flex items-center gap-1 active:scale-95 cursor-pointer"
          title="नया स्टॉप जोड़ें"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ स्टॉप</span>
        </button>

        <button
          onClick={() => handleArriveAtNextStop()}
          className="px-3 py-2 bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-black flex items-center gap-1.5 active:scale-95 cursor-pointer"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>अगला स्टॉप</span>
        </button>

        <button
          onClick={() => openGoogleMapsNavigation()}
          className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold active:scale-95 transition cursor-pointer"
          title="Google Maps"
        >
          <Navigation className="w-4 h-4 text-amber-300" />
        </button>

        <button
          onClick={() => {
            if (isSoundEnabled) playDriverSound('alert');
            setShowSosModal(true);
          }}
          className="p-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold active:scale-95 animate-pulse transition cursor-pointer"
          title="SOS Panic"
        >
          <AlertTriangle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default StaffDriverPortal;
