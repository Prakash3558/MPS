import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface SupabaseBus {
  id: string;
  bus_number: string;
  license_plate: string;
  model: string;
  capacity: number;
  status: 'active' | 'maintenance' | 'inactive';
  fuel_type: string;
  driver_id?: string;
  driver_name?: string;
  driver_phone?: string;
}

export interface SupabaseRoute {
  id: string;
  route_name: string;
  route_code: string;
  morning_start_time: string;
  afternoon_start_time: string;
  start_location: string;
  end_location: string;
  polyline_coords: [number, number][];
  status: string;
}

export interface SupabaseStop {
  id: string;
  route_id: string;
  stop_name: string;
  stop_order: number;
  scheduled_pickup_time: string;
  scheduled_drop_time: string;
  latitude: number;
  longitude: number;
  landmark?: string;
  radius_meters: number;
  fee_monthly?: number;
  assigned_student_ids?: string[];
  student_count?: number;
}

export interface SupabaseStudentFleet {
  id: string;
  student_id_code: string;
  full_name: string;
  class_grade: string;
  section: string;
  roll_no: string;
  parent_id?: string;
  parent_name?: string;
  parent_phone: string;
  address?: string;
  photo_url?: string;
  emergency_contact?: string;
  bus_id?: string;
  route_id?: string;
  stop_id?: string;
  boarding_status?: 'Not Boarded' | 'Boarded' | 'Dropped' | 'Absent';
}

export interface SupabaseLiveLocation {
  id?: string;
  bus_id: string;
  bus_number?: string;
  driver_id?: string;
  driver_name?: string;
  driver_phone?: string;
  route_id: string;
  route_name?: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  accuracy?: number;
  current_road_name?: string;
  next_stop_id?: string;
  next_stop_name?: string;
  next_stop_eta?: string;
  delay_minutes: number;
  is_active: boolean;
  trip_type: 'Morning Pickup' | 'Afternoon Drop' | 'Special Trip';
  sos_alert?: boolean;
  sos_reason?: string;
  updated_at: string;
}

export interface SupabaseAttendanceLog {
  id: string;
  student_id: string;
  student_name?: string;
  bus_id: string;
  route_id: string;
  stop_id?: string;
  stop_name?: string;
  driver_id?: string;
  trip_type: 'Morning Pickup' | 'Afternoon Drop' | 'Special Trip';
  status: 'Not Boarded' | 'Boarded' | 'Dropped' | 'Absent';
  latitude?: number;
  longitude?: number;
  notes?: string;
  timestamp: string;
}

export interface SupabaseFleetIncident {
  id: string;
  bus_id: string;
  bus_number?: string;
  driver_id?: string;
  driver_name?: string;
  route_id?: string;
  incident_type: 'sos' | 'traffic_delay' | 'breakdown' | 'skip_stop' | 'accident' | 'weather';
  severity: 'low' | 'medium' | 'high' | 'critical';
  latitude?: number;
  longitude?: number;
  description: string;
  resolved: boolean;
  created_at: string;
}

// ---------------------------------------------------------------------------
// SCHOOL ANCHOR DESTINATION: Model Public School, Bhawanipur, West Champaran, Bihar 845307
// ---------------------------------------------------------------------------
export const MODEL_PUBLIC_SCHOOL_HUB = {
  name: 'Model Public School',
  address: 'AT- Bhawanipur, P.O.- Kursi Barwa, Sikta, West Champaran, Bihar 845307',
  latitude: 27.035265,
  longitude: 84.660400,
  coords: [27.035265, 84.660400] as [number, number],
  mapboxCoords: [84.660400, 27.035265] as [number, number]
};

// ---------------------------------------------------------------------------
// DEFAULT / MOCK DATA FOR SEEDING & PREVIEW RESILIENCE
// ---------------------------------------------------------------------------
export const DEFAULT_BUSES: SupabaseBus[] = [
  {
    id: 'bus-01',
    bus_number: 'Bus #01',
    license_plate: 'BR-22-PA-1024',
    model: 'Tata Starbus Ultra 32S',
    capacity: 32,
    status: 'active',
    fuel_type: 'Diesel',
    driver_name: 'Rajesh Kumar Singh (राजेश कुमार)',
    driver_phone: '+91 98350 12456'
  },
  {
    id: 'bus-02',
    bus_number: 'Bus #02',
    license_plate: 'BR-22-PA-2048',
    model: 'Eicher Skyline Pro 28S',
    capacity: 28,
    status: 'active',
    fuel_type: 'Diesel',
    driver_name: 'Vikram Yadav (विक्रम यादव)',
    driver_phone: '+91 97712 34567'
  },
  {
    id: 'van-01',
    bus_number: 'Van #03',
    license_plate: 'BR-22-PB-0812',
    model: 'Force Traveller Mini 14S',
    capacity: 14,
    status: 'active',
    fuel_type: 'CNG',
    driver_name: 'Manoj Sharma (मनोज शर्मा)',
    driver_phone: '+91 99345 67890'
  }
];

export const DEFAULT_ROUTES: SupabaseRoute[] = [
  {
    id: 'route-01',
    route_name: 'Route 1: Sikta - Mainatand Express',
    route_code: 'RT-01',
    morning_start_time: '06:45 AM',
    afternoon_start_time: '02:15 PM',
    start_location: 'Sikta Station Bus Stand',
    end_location: 'Model Public School, Bhawanipur',
    polyline_coords: [
      [27.0250, 84.6812],
      [27.0270, 84.6826],
      [27.0295, 84.6850],
      [27.0320, 84.6880],
      [27.0345, 84.6915],
      [27.0380, 84.6950],
      [27.0310, 84.6650],
      [27.035265, 84.660400]
    ],
    status: 'Active'
  },
  {
    id: 'route-02',
    route_name: 'Route 2: Balthar - Inarwa Bypass',
    route_code: 'RT-02',
    morning_start_time: '07:00 AM',
    afternoon_start_time: '02:30 PM',
    start_location: 'Balthar Chowk',
    end_location: 'Model Public School, Bhawanipur',
    polyline_coords: [
      [27.0120, 84.6650],
      [27.0190, 84.6710],
      [27.0250, 84.6812],
      [27.0310, 84.6650],
      [27.035265, 84.660400]
    ],
    status: 'Active'
  }
];

export const DEFAULT_STOPS: SupabaseStop[] = [
  {
    id: 'stop-01',
    route_id: 'route-01',
    stop_name: 'Sikta Railway Station (सिकटा स्टेशन)',
    stop_order: 1,
    scheduled_pickup_time: '07:00 AM',
    scheduled_drop_time: '02:45 PM',
    latitude: 27.0250,
    longitude: 84.6812,
    landmark: 'Platform 1 Main Gate',
    radius_meters: 60,
    fee_monthly: 600,
    student_count: 8
  },
  {
    id: 'stop-02',
    route_id: 'route-01',
    stop_name: 'Sikta Market Chowk (बाजार चौक)',
    stop_order: 2,
    scheduled_pickup_time: '07:15 AM',
    scheduled_drop_time: '02:55 PM',
    latitude: 27.0295,
    longitude: 84.6850,
    landmark: 'State Bank of India ATM',
    radius_meters: 50,
    fee_monthly: 650,
    student_count: 10
  },
  {
    id: 'stop-03',
    route_id: 'route-01',
    stop_name: 'Purani Bazar Crossing (पुरानी बाजार)',
    stop_order: 3,
    scheduled_pickup_time: '07:28 AM',
    scheduled_drop_time: '03:08 PM',
    latitude: 27.0345,
    longitude: 84.6915,
    landmark: 'Hanuman Temple Corner',
    radius_meters: 60,
    fee_monthly: 700,
    student_count: 6
  },
  {
    id: 'stop-04',
    route_id: 'route-01',
    stop_name: 'Koirigawan Mor (कोइरीगांवा मोड़)',
    stop_order: 4,
    scheduled_pickup_time: '07:40 AM',
    scheduled_drop_time: '03:20 PM',
    latitude: 27.0380,
    longitude: 84.6950,
    landmark: 'High School Gate',
    radius_meters: 50,
    fee_monthly: 750,
    student_count: 5
  },
  {
    id: 'stop-05',
    route_id: 'route-01',
    stop_name: 'Model Public School Campus',
    stop_order: 5,
    scheduled_pickup_time: '07:55 AM',
    scheduled_drop_time: '02:30 PM',
    latitude: 27.035265,
    longitude: 84.660400,
    landmark: 'AT- Bhawanipur, P.O.- Kursi Barwa, Sikta - Main Campus Gate',
    radius_meters: 100,
    fee_monthly: 0,
    student_count: 29
  }
];

export const DEFAULT_STUDENTS_FLEET: SupabaseStudentFleet[] = [
  {
    id: 'stu-01',
    student_id_code: 'MPS-2026-042',
    full_name: 'Aarav Sharma',
    class_grade: 'Class VIII',
    section: 'A',
    roll_no: '12',
    parent_phone: '+91 94318 12345',
    parent_name: 'Ramesh Sharma',
    address: 'Near Sikta Station, Ward 4',
    bus_id: 'bus-01',
    route_id: 'route-01',
    stop_id: 'stop-01',
    boarding_status: 'Not Boarded'
  },
  {
    id: 'stu-02',
    student_id_code: 'MPS-2026-056',
    full_name: 'Priya Kumari',
    class_grade: 'Class IX',
    section: 'B',
    roll_no: '08',
    parent_phone: '+91 98351 23456',
    parent_name: 'Sunil Kumar',
    address: 'Sikta Market Chowk',
    bus_id: 'bus-01',
    route_id: 'route-01',
    stop_id: 'stop-02',
    boarding_status: 'Not Boarded'
  },
  {
    id: 'stu-03',
    student_id_code: 'MPS-2026-089',
    full_name: 'Aditya Raj',
    class_grade: 'Class VII',
    section: 'A',
    roll_no: '04',
    parent_phone: '+91 94702 34567',
    parent_name: 'Manoj Singh',
    address: 'Purani Bazar, House 12',
    bus_id: 'bus-01',
    route_id: 'route-01',
    stop_id: 'stop-03',
    boarding_status: 'Not Boarded'
  },
  {
    id: 'stu-04',
    student_id_code: 'MPS-2026-102',
    full_name: 'Ananya Verma',
    class_grade: 'Class X',
    section: 'A',
    roll_no: '15',
    parent_phone: '+91 99312 45678',
    parent_name: 'Dinesh Verma',
    address: 'Koirigawan Main Road',
    bus_id: 'bus-01',
    route_id: 'route-01',
    stop_id: 'stop-04',
    boarding_status: 'Not Boarded'
  },
  {
    id: 'stu-05',
    student_id_code: 'MPS-2026-118',
    full_name: 'Rohan Gupta',
    class_grade: 'Class VI',
    section: 'B',
    roll_no: '21',
    parent_phone: '+91 91234 56789',
    parent_name: 'Ajay Gupta',
    address: 'Sikta Station Colony',
    bus_id: 'bus-01',
    route_id: 'route-01',
    stop_id: 'stop-01',
    boarding_status: 'Not Boarded'
  }
];

// Helper to get cached or initial state
const FLEET_STORAGE_KEYS = {
  LIVE_LOCATIONS: 'mps_fleet_live_locations',
  STOPS: 'mps_fleet_stops',
  ROUTES: 'mps_fleet_routes',
  STUDENTS: 'mps_fleet_students',
  ATTENDANCE: 'mps_fleet_attendance',
  INCIDENTS: 'mps_fleet_incidents'
};

function getStored<T>(key: string, fallback: T): T {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}

function setStored<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
}

/**
 * Service class handling both Supabase Realtime remote syncing
 * and client-side reactive broadcasting for offline/demo reliability.
 */
class SupabaseFleetService {
  private realtimeChannel: RealtimeChannel | null = null;
  private listeners: Set<(loc: SupabaseLiveLocation) => void> = new Set();
  private attendanceListeners: Set<(log: SupabaseAttendanceLog) => void> = new Set();
  private incidentListeners: Set<(incident: SupabaseFleetIncident) => void> = new Set();
  private routeListeners: Set<(routes: SupabaseRoute[]) => void> = new Set();

  constructor() {
    this.initRealtime();
  }

  private initRealtime() {
    try {
      const channelId = 'mps-fleet-realtime-global';
      this.realtimeChannel = supabase.channel(channelId);

      // Listen for database table changes (when configured in Supabase)
      this.realtimeChannel
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'live_locations' },
          (payload) => {
            if (payload.new) {
              const loc = payload.new as SupabaseLiveLocation;
              this.notifyLocationListeners(loc);
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'attendance_logs' },
          (payload) => {
            if (payload.new) {
              const log = payload.new as SupabaseAttendanceLog;
              this.notifyAttendanceListeners(log);
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'fleet_incidents' },
          (payload) => {
            if (payload.new) {
              const inc = payload.new as SupabaseFleetIncident;
              this.notifyIncidentListeners(inc);
            }
          }
        )
        // Also listen for broadcast events (ensures instant peer-to-peer updates)
        .on('broadcast', { event: 'live_location_update' }, ({ payload }) => {
          if (payload) this.notifyLocationListeners(payload as SupabaseLiveLocation);
        })
        .on('broadcast', { event: 'attendance_update' }, ({ payload }) => {
          if (payload) this.notifyAttendanceListeners(payload as SupabaseAttendanceLog);
        })
        .on('broadcast', { event: 'incident_report' }, ({ payload }) => {
          if (payload) this.notifyIncidentListeners(payload as SupabaseFleetIncident);
        })
        .on('broadcast', { event: 'route_update' }, ({ payload }) => {
          if (payload) this.notifyRouteListeners(payload as SupabaseRoute[]);
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            // Connected to Supabase Realtime channel
          }
        });
    } catch (e) {
      console.warn('Supabase realtime setup note:', e);
    }
  }

  // Subscribe to live vehicle telemetry
  public subscribeToLiveLocation(callback: (loc: SupabaseLiveLocation) => void): () => void {
    this.listeners.add(callback);
    // Immediately emit current cached location if any
    const cached = this.getLatestLiveLocation('bus-01');
    if (cached) callback(cached);

    return () => {
      this.listeners.delete(callback);
    };
  }

  // Subscribe to student attendance logs
  public subscribeToAttendance(callback: (log: SupabaseAttendanceLog) => void): () => void {
    this.attendanceListeners.add(callback);
    return () => {
      this.attendanceListeners.delete(callback);
    };
  }

  // Subscribe to fleet incidents / SOS alerts
  public subscribeToIncidents(callback: (inc: SupabaseFleetIncident) => void): () => void {
    this.incidentListeners.add(callback);
    return () => {
      this.incidentListeners.delete(callback);
    };
  }

  private notifyLocationListeners(loc: SupabaseLiveLocation) {
    // Cache to localStorage
    const map = getStored<Record<string, SupabaseLiveLocation>>(
      FLEET_STORAGE_KEYS.LIVE_LOCATIONS,
      {}
    );
    map[loc.bus_id] = loc;
    setStored(FLEET_STORAGE_KEYS.LIVE_LOCATIONS, map);

    this.listeners.forEach((cb) => {
      try {
        cb(loc);
      } catch (err) {
        console.error(err);
      }
    });
  }

  private notifyAttendanceListeners(log: SupabaseAttendanceLog) {
    this.attendanceListeners.forEach((cb) => {
      try {
        cb(log);
      } catch (err) {
        console.error(err);
      }
    });
  }

  private notifyIncidentListeners(inc: SupabaseFleetIncident) {
    this.incidentListeners.forEach((cb) => {
      try {
        cb(inc);
      } catch (err) {
        console.error(err);
      }
    });
  }

  private notifyRouteListeners(routes: SupabaseRoute[]) {
    setStored(FLEET_STORAGE_KEYS.ROUTES, routes);
    this.routeListeners.forEach((cb) => {
      try {
        cb(routes);
      } catch (err) {
        console.error(err);
      }
    });
  }

  public getRoutes(): SupabaseRoute[] {
    return getStored<SupabaseRoute[]>(FLEET_STORAGE_KEYS.ROUTES, DEFAULT_ROUTES);
  }

  public subscribeToRoutes(callback: (routes: SupabaseRoute[]) => void): () => void {
    this.routeListeners.add(callback);
    callback(this.getRoutes());
    return () => {
      this.routeListeners.delete(callback);
    };
  }

  // Broadcast & persist live vehicle telemetry
  public async publishLiveLocation(loc: SupabaseLiveLocation): Promise<void> {
    // 1. Update local storage & notify immediately
    this.notifyLocationListeners(loc);

    // 2. Broadcast across Realtime channel
    if (this.realtimeChannel) {
      try {
        await this.realtimeChannel.send({
          type: 'broadcast',
          event: 'live_location_update',
          payload: loc
        });
      } catch (e) {}
    }

    // 3. Attempt Supabase Table upsert
    try {
      await supabase.from('live_locations').upsert(
        {
          bus_id: loc.bus_id,
          driver_id: loc.driver_id || null,
          route_id: loc.route_id,
          latitude: loc.latitude,
          longitude: loc.longitude,
          speed: loc.speed,
          heading: loc.heading,
          accuracy: loc.accuracy || 10,
          current_road_name: loc.current_road_name || 'En Route',
          next_stop_id: loc.next_stop_id || null,
          next_stop_eta: loc.next_stop_eta || null,
          delay_minutes: loc.delay_minutes || 0,
          is_active: loc.is_active,
          trip_type: loc.trip_type,
          sos_alert: loc.sos_alert || false,
          sos_reason: loc.sos_reason || null,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'bus_id' }
      );
    } catch (e) {
      // Offline or demo table non-blocking
    }
  }

  // Record Attendance (Boarded, Dropped, Absent)
  public async recordAttendance(log: Omit<SupabaseAttendanceLog, 'id' | 'timestamp'>): Promise<SupabaseAttendanceLog> {
    const fullLog: SupabaseAttendanceLog = {
      ...log,
      id: 'att-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString()
    };

    // Update student boarding status in local state
    const students = this.getStopsAndStudents().students;
    const studentIndex = students.findIndex((s) => s.id === log.student_id);
    if (studentIndex >= 0) {
      students[studentIndex].boarding_status = log.status;
      setStored(FLEET_STORAGE_KEYS.STUDENTS, students);
    }

    // Cache log
    const existingLogs = getStored<SupabaseAttendanceLog[]>(FLEET_STORAGE_KEYS.ATTENDANCE, []);
    existingLogs.unshift(fullLog);
    setStored(FLEET_STORAGE_KEYS.ATTENDANCE, existingLogs.slice(0, 100));

    this.notifyAttendanceListeners(fullLog);

    if (this.realtimeChannel) {
      try {
        await this.realtimeChannel.send({
          type: 'broadcast',
          event: 'attendance_update',
          payload: fullLog
        });
      } catch (e) {}
    }

    try {
      await supabase.from('attendance_logs').insert([
        {
          student_id: log.student_id,
          bus_id: log.bus_id,
          route_id: log.route_id,
          stop_id: log.stop_id || null,
          driver_id: log.driver_id || null,
          trip_type: log.trip_type,
          status: log.status,
          latitude: log.latitude || null,
          longitude: log.longitude || null,
          notes: log.notes || null,
          timestamp: fullLog.timestamp
        }
      ]);
    } catch (e) {}

    return fullLog;
  }

  // Add Dynamic Stop to Route
  public async addStop(newStop: Omit<SupabaseStop, 'id'>): Promise<SupabaseStop> {
    const stops = this.getStops(newStop.route_id);
    const createdStop: SupabaseStop = {
      ...newStop,
      id: 'stop-' + Date.now()
    };
    stops.push(createdStop);
    stops.sort((a, b) => a.stop_order - b.stop_order);
    setStored(FLEET_STORAGE_KEYS.STOPS, stops);

    try {
      await supabase.from('stops').insert([
        {
          route_id: newStop.route_id,
          stop_name: newStop.stop_name,
          stop_order: newStop.stop_order,
          scheduled_pickup_time: newStop.scheduled_pickup_time,
          scheduled_drop_time: newStop.scheduled_drop_time,
          latitude: newStop.latitude,
          longitude: newStop.longitude,
          landmark: newStop.landmark,
          radius_meters: newStop.radius_meters || 60,
          fee_monthly: newStop.fee_monthly || 600
        }
      ]);
    } catch (e) {}

    return createdStop;
  }

  // Delete Stop from Route and re-index stop orders
  public async deleteStop(stopId: string, routeId: string): Promise<SupabaseStop[]> {
    const stops = this.getStops(routeId).filter((s) => s.id !== stopId);
    stops.forEach((s, idx) => {
      s.stop_order = idx + 1;
    });
    setStored(FLEET_STORAGE_KEYS.STOPS, stops);

    try {
      await supabase.from('stops').delete().eq('id', stopId);
    } catch (e) {}

    return stops;
  }

  // Reorder Stops on Route
  public async reorderStops(routeId: string, newOrderedStops: SupabaseStop[]): Promise<SupabaseStop[]> {
    const updated = newOrderedStops.map((s, idx) => ({ ...s, stop_order: idx + 1 }));
    setStored(FLEET_STORAGE_KEYS.STOPS, updated);

    try {
      for (const s of updated) {
        await supabase.from('stops').update({ stop_order: s.stop_order }).eq('id', s.id);
      }
    } catch (e) {}

    return updated;
  }

  // Update Route Geometry with real road-snapped polyline
  public async updateRouteGeometry(routeId: string, polyline_coords: [number, number][]): Promise<void> {
    const routes = this.getRoutes();
    const route = routes.find((r) => r.id === routeId);
    if (route) {
      route.polyline_coords = polyline_coords;
      this.notifyRouteListeners(routes);

      if (this.realtimeChannel) {
        try {
          await this.realtimeChannel.send({
            type: 'broadcast',
            event: 'route_update',
            payload: routes
          });
        } catch (e) {}
      }

      try {
        await supabase.from('routes').update({ polyline_coords }).eq('id', routeId);
      } catch (e) {}
    }
  }

  // Assign Unscheduled Student On-The-Fly
  public async assignStudent(studentId: string, busId: string, routeId: string, stopId: string): Promise<void> {
    const students = this.getStopsAndStudents().students;
    const s = students.find((item) => item.id === studentId);
    if (s) {
      s.bus_id = busId;
      s.route_id = routeId;
      s.stop_id = stopId;
      setStored(FLEET_STORAGE_KEYS.STUDENTS, students);
    }

    try {
      await supabase.from('bus_assignments').upsert({
        student_id: studentId,
        bus_id: busId,
        route_id: routeId,
        stop_id: stopId,
        active: true
      });
    } catch (e) {}
  }

  // Report Fleet Incident or SOS Alert
  public async reportIncident(incident: Omit<SupabaseFleetIncident, 'id' | 'created_at' | 'resolved'>): Promise<SupabaseFleetIncident> {
    const fullInc: SupabaseFleetIncident = {
      ...incident,
      id: 'inc-' + Date.now(),
      created_at: new Date().toISOString(),
      resolved: false
    };

    const incidents = getStored<SupabaseFleetIncident[]>(FLEET_STORAGE_KEYS.INCIDENTS, []);
    incidents.unshift(fullInc);
    setStored(FLEET_STORAGE_KEYS.INCIDENTS, incidents);

    this.notifyIncidentListeners(fullInc);

    if (this.realtimeChannel) {
      try {
        await this.realtimeChannel.send({
          type: 'broadcast',
          event: 'incident_report',
          payload: fullInc
        });
      } catch (e) {}
    }

    try {
      await supabase.from('fleet_incidents').insert([
        {
          bus_id: incident.bus_id,
          driver_id: incident.driver_id || null,
          route_id: incident.route_id || null,
          incident_type: incident.incident_type,
          severity: incident.severity,
          latitude: incident.latitude || null,
          longitude: incident.longitude || null,
          description: incident.description,
          resolved: false
        }
      ]);
    } catch (e) {}

    return fullInc;
  }

  public getStops(routeId: string = 'route-01'): SupabaseStop[] {
    const all = getStored<SupabaseStop[]>(FLEET_STORAGE_KEYS.STOPS, DEFAULT_STOPS);
    return all.filter((s) => !routeId || s.route_id === routeId);
  }

  public getStopsAndStudents() {
    const stops = getStored<SupabaseStop[]>(FLEET_STORAGE_KEYS.STOPS, DEFAULT_STOPS);
    const students = getStored<SupabaseStudentFleet[]>(
      FLEET_STORAGE_KEYS.STUDENTS,
      DEFAULT_STUDENTS_FLEET
    );
    return { stops, students };
  }

  public getLatestLiveLocation(busId: string = 'bus-01'): SupabaseLiveLocation | null {
    const map = getStored<Record<string, SupabaseLiveLocation>>(
      FLEET_STORAGE_KEYS.LIVE_LOCATIONS,
      {}
    );
    if (map[busId]) return map[busId];

    // Seed realistic initial live location
    const initial: SupabaseLiveLocation = {
      bus_id: busId,
      bus_number: 'Bus #01',
      driver_name: 'Rajesh Kumar Singh (राजेश कुमार)',
      driver_phone: '+91 98350 12456',
      route_id: 'route-01',
      route_name: 'Route 1: Sikta - Mainatand Express',
      latitude: 27.0250,
      longitude: 84.6812,
      speed: 28.5,
      heading: 68,
      accuracy: 8,
      current_road_name: 'Sikta Main Railway Road',
      next_stop_id: 'stop-02',
      next_stop_name: 'Sikta Market Chowk (बाजार चौक)',
      next_stop_eta: '07:15 AM',
      delay_minutes: 0,
      is_active: true,
      trip_type: 'Morning Pickup',
      sos_alert: false,
      updated_at: new Date().toISOString()
    };
    return initial;
  }

  // Convenience aliases for RoadRoutingMap and controllers
  public async createStop(stopData: Omit<SupabaseStop, 'id'>): Promise<SupabaseStop> {
    return this.addStop(stopData);
  }

  public async updateStudentBoardingStatus(
    studentId: string,
    status: 'Not Boarded' | 'Boarded' | 'Dropped' | 'Absent',
    busId: string = 'bus-01',
    routeId: string = 'route-01'
  ): Promise<void> {
    await this.recordAttendance({
      student_id: studentId,
      bus_id: busId,
      route_id: routeId,
      status,
      trip_type: 'Morning Pickup'
    });
  }

  public async triggerSos(busId: string, reason: string): Promise<void> {
    await this.reportIncident({
      bus_id: busId,
      incident_type: 'sos',
      severity: 'critical',
      description: reason
    });
  }

  public getAllActiveLocations(): SupabaseLiveLocation[] {
    const map = getStored<Record<string, SupabaseLiveLocation>>(
      FLEET_STORAGE_KEYS.LIVE_LOCATIONS,
      {}
    );
    const values = Object.values(map);
    if (values.length > 0) return values;

    // Seed 2 active vehicles for fleet view
    const b1 = this.getLatestLiveLocation('bus-01')!;
    const b2: SupabaseLiveLocation = {
      bus_id: 'bus-02',
      bus_number: 'Bus #02',
      driver_name: 'Vikram Yadav (विक्रम यादव)',
      driver_phone: '+91 97712 34567',
      route_id: 'route-02',
      route_name: 'Route 2: Balthar - Inarwa Bypass',
      latitude: 27.0190,
      longitude: 84.6710,
      speed: 34.0,
      heading: 42,
      accuracy: 12,
      current_road_name: 'Balthar State Highway 54',
      next_stop_id: 'stop-b2-01',
      next_stop_name: 'Inarwa Crossing',
      next_stop_eta: '07:22 AM',
      delay_minutes: 8,
      is_active: true,
      trip_type: 'Morning Pickup',
      sos_alert: false,
      updated_at: new Date().toISOString()
    };
    return [b1, b2];
  }
}

export const supabaseFleetService = new SupabaseFleetService();
