-- ==============================================================================
-- MODEL PUBLIC SCHOOL FLEET & GPS TRACKING DATABASE SCHEMA
-- School Destination Hub: Model Public School, Bhawanipur, West Champaran, Bihar 845307
-- Coordinates: Latitude 27.0248, Longitude 84.5936
-- Copy and paste this script entirely into Supabase SQL Editor and click RUN
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Drop existing tables if re-running (Clean Migration)
DROP TABLE IF EXISTS public.attendance_logs CASCADE;
DROP TABLE IF EXISTS public.live_locations CASCADE;
DROP TABLE IF EXISTS public.fleet_incidents CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.stops CASCADE;
DROP TABLE IF EXISTS public.routes CASCADE;
DROP TABLE IF EXISTS public.buses CASCADE;

-- ==============================================================================
-- 3. CREATE TABLES
-- ==============================================================================

-- Table: buses
CREATE TABLE public.buses (
  id TEXT PRIMARY KEY,
  bus_number TEXT NOT NULL UNIQUE,
  license_plate TEXT NOT NULL UNIQUE,
  model TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 32,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'inactive')),
  fuel_type TEXT NOT NULL DEFAULT 'Diesel',
  driver_id TEXT,
  driver_name TEXT,
  driver_phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: routes
CREATE TABLE public.routes (
  id TEXT PRIMARY KEY,
  route_name TEXT NOT NULL,
  route_code TEXT NOT NULL UNIQUE,
  morning_start_time TEXT NOT NULL DEFAULT '07:00 AM',
  afternoon_start_time TEXT NOT NULL DEFAULT '02:00 PM',
  start_location TEXT NOT NULL,
  end_location TEXT NOT NULL DEFAULT 'Model Public School, Bhawanipur',
  polyline_coords JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of [lat, lng]
  status TEXT NOT NULL DEFAULT 'Active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: stops
CREATE TABLE public.stops (
  id TEXT PRIMARY KEY,
  route_id TEXT NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  stop_name TEXT NOT NULL,
  stop_order INTEGER NOT NULL DEFAULT 1,
  scheduled_pickup_time TEXT NOT NULL,
  scheduled_drop_time TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  landmark TEXT,
  radius_meters INTEGER NOT NULL DEFAULT 50,
  fee_monthly NUMERIC(10, 2) DEFAULT 0,
  student_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stops_route_order ON public.stops(route_id, stop_order);

-- Table: students
CREATE TABLE public.students (
  id TEXT PRIMARY KEY,
  student_id_code TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  class_grade TEXT NOT NULL,
  section TEXT NOT NULL DEFAULT 'A',
  roll_no TEXT,
  parent_id TEXT,
  parent_name TEXT,
  parent_phone TEXT NOT NULL,
  address TEXT,
  photo_url TEXT,
  emergency_contact TEXT,
  bus_id TEXT REFERENCES public.buses(id) ON DELETE SET NULL,
  route_id TEXT REFERENCES public.routes(id) ON DELETE SET NULL,
  stop_id TEXT REFERENCES public.stops(id) ON DELETE SET NULL,
  boarding_status TEXT NOT NULL DEFAULT 'Not Boarded' CHECK (boarding_status IN ('Not Boarded', 'Boarded', 'Dropped', 'Absent')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_students_bus ON public.students(bus_id);
CREATE INDEX idx_students_route_stop ON public.students(route_id, stop_id);

-- Table: live_locations (Real-Time GPS Telemetry Stream)
CREATE TABLE public.live_locations (
  bus_id TEXT PRIMARY KEY REFERENCES public.buses(id) ON DELETE CASCADE,
  bus_number TEXT,
  driver_id TEXT,
  driver_name TEXT,
  driver_phone TEXT,
  route_id TEXT REFERENCES public.routes(id) ON DELETE SET NULL,
  route_name TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  speed DOUBLE PRECISION NOT NULL DEFAULT 0,
  heading DOUBLE PRECISION NOT NULL DEFAULT 0,
  accuracy DOUBLE PRECISION NOT NULL DEFAULT 5,
  current_road_name TEXT DEFAULT 'School Route Corridor',
  next_stop_id TEXT,
  next_stop_name TEXT,
  next_stop_eta TEXT,
  delay_minutes INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  trip_type TEXT NOT NULL DEFAULT 'Morning Pickup' CHECK (trip_type IN ('Morning Pickup', 'Afternoon Drop', 'Special Trip')),
  sos_alert BOOLEAN NOT NULL DEFAULT FALSE,
  sos_reason TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: attendance_logs (Daily Bus Tap / Checkin Records)
CREATE TABLE public.attendance_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  student_name TEXT,
  bus_id TEXT NOT NULL REFERENCES public.buses(id) ON DELETE CASCADE,
  route_id TEXT NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  stop_id TEXT REFERENCES public.stops(id) ON DELETE SET NULL,
  stop_name TEXT,
  driver_id TEXT,
  trip_type TEXT NOT NULL DEFAULT 'Morning Pickup',
  status TEXT NOT NULL CHECK (status IN ('Not Boarded', 'Boarded', 'Dropped', 'Absent')),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  notes TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_attendance_student_time ON public.attendance_logs(student_id, timestamp DESC);

-- Table: fleet_incidents
CREATE TABLE public.fleet_incidents (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  bus_id TEXT NOT NULL REFERENCES public.buses(id) ON DELETE CASCADE,
  bus_number TEXT,
  driver_id TEXT,
  driver_name TEXT,
  route_id TEXT REFERENCES public.routes(id) ON DELETE SET NULL,
  incident_type TEXT NOT NULL CHECK (incident_type IN ('sos', 'traffic_delay', 'breakdown', 'skip_stop', 'accident', 'weather')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  description TEXT NOT NULL,
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 4. AUTOMATIC TIMESTAMP TRIGGER
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_buses_updated_at BEFORE UPDATE ON public.buses FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_routes_updated_at BEFORE UPDATE ON public.routes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_stops_updated_at BEFORE UPDATE ON public.stops FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 5. ENABLE ROW LEVEL SECURITY (RLS)
-- ==============================================================================

ALTER TABLE public.buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fleet_incidents ENABLE ROW LEVEL SECURITY;

-- Policy: Admin full access
CREATE POLICY "Admin Full Access Buses" ON public.buses FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access Routes" ON public.routes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access Stops" ON public.stops FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access Students" ON public.students FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access Live Locations" ON public.live_locations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access Attendance" ON public.attendance_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access Incidents" ON public.fleet_incidents FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Policy: Public & Anon Read/Write for Fleet Portals (Driver Mobile & Parent App)
CREATE POLICY "Public Read Access Buses" ON public.buses FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public Read Access Routes" ON public.routes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public Update Route Geometry" ON public.routes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public Read Access Stops" ON public.stops FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public Manage Stops" ON public.stops FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public Read Access Students" ON public.students FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public Update Student Boarding" ON public.students FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public Live Locations Broadcast" ON public.live_locations FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public Attendance Logging" ON public.attendance_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public Incident Reporting" ON public.fleet_incidents FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ==============================================================================
-- 6. ENABLE SUPABASE REALTIME REPLICATION
-- ==============================================================================

BEGIN;
  -- Drop publication if exists or alter existing
  DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
      CREATE PUBLICATION supabase_realtime;
    END IF;
  END
  $$;

  ALTER PUBLICATION supabase_realtime ADD TABLE public.live_locations;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_logs;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.stops;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.routes;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.students;
COMMIT;

-- Set replica identity to FULL so realtime updates send complete row state
ALTER TABLE public.live_locations REPLICA IDENTITY FULL;
ALTER TABLE public.attendance_logs REPLICA IDENTITY FULL;
ALTER TABLE public.stops REPLICA IDENTITY FULL;
ALTER TABLE public.students REPLICA IDENTITY FULL;

-- ==============================================================================
-- 7. INITIAL SEED DATA WITH MODEL PUBLIC SCHOOL ANCHOR
-- School Hub: Model Public School (Bhawanipur, West Champaran, Bihar 845307)
-- Latitude: 27.0248, Longitude: 84.5936
-- ==============================================================================

-- 7.1 Buses
INSERT INTO public.buses (id, bus_number, license_plate, model, capacity, status, fuel_type, driver_name, driver_phone)
VALUES
  ('bus-01', 'Bus #01', 'BR-22-PA-1024', 'Tata Starbus Ultra 32S', 32, 'active', 'Diesel', 'Rajesh Kumar Singh (राजेश कुमार)', '+91 98350 12456'),
  ('bus-02', 'Bus #02', 'BR-22-PA-2048', 'Eicher Skyline Pro 28S', 28, 'active', 'Diesel', 'Vikram Yadav (विक्रम यादव)', '+91 97712 34567'),
  ('van-01', 'Van #03', 'BR-22-PB-0812', 'Force Traveller Mini 14S', 14, 'active', 'CNG', 'Manoj Sharma (मनोज शर्मा)', '+91 99345 67890')
ON CONFLICT (id) DO UPDATE SET
  driver_name = EXCLUDED.driver_name,
  driver_phone = EXCLUDED.driver_phone;

-- 7.2 Routes (Morning routes terminate at 27.0248, 84.5936; Afternoon routes originate here)
INSERT INTO public.routes (id, route_name, route_code, morning_start_time, afternoon_start_time, start_location, end_location, polyline_coords, status)
VALUES
  (
    'route-01',
    'Route 1: Sikta - Mainatand Express',
    'RT-01',
    '06:45 AM',
    '02:15 PM',
    'Sikta Station Bus Stand',
    'Model Public School, Bhawanipur',
    '[[27.0250, 84.6812], [27.0270, 84.6826], [27.0295, 84.6850], [27.0320, 84.6880], [27.0345, 84.6915], [27.0380, 84.6950], [27.0310, 84.6420], [27.0248, 84.5936]]'::jsonb,
    'Active'
  ),
  (
    'route-02',
    'Route 2: Balthar - Inarwa Bypass',
    'RT-02',
    '07:00 AM',
    '02:30 PM',
    'Balthar Chowk',
    'Model Public School, Bhawanipur',
    '[[27.0120, 84.6650], [27.0180, 84.6710], [27.0250, 84.6812], [27.0280, 84.6350], [27.0248, 84.5936]]'::jsonb,
    'Active'
  )
ON CONFLICT (id) DO UPDATE SET
  end_location = EXCLUDED.end_location,
  polyline_coords = EXCLUDED.polyline_coords;

-- 7.3 Stops (Ending at Model Public School Campus)
INSERT INTO public.stops (id, route_id, stop_name, stop_order, scheduled_pickup_time, scheduled_drop_time, latitude, longitude, landmark, radius_meters, fee_monthly, student_count)
VALUES
  ('stop-01', 'route-01', 'Sikta Railway Station (सिकटा स्टेशन)', 1, '07:00 AM', '02:45 PM', 27.0250, 84.6812, 'Platform 1 Main Gate', 60, 600.00, 8),
  ('stop-02', 'route-01', 'Sikta Market Chowk (बाजार चौक)', 2, '07:15 AM', '02:55 PM', 27.0295, 84.6850, 'State Bank of India ATM', 50, 650.00, 10),
  ('stop-03', 'route-01', 'Purani Bazar Crossing (पुरानी बाजार)', 3, '07:28 AM', '03:08 PM', 27.0345, 84.6915, 'Hanuman Temple Corner', 60, 700.00, 6),
  ('stop-04', 'route-01', 'Koirigawan Mor (कोइरीगांवा मोड़)', 4, '07:40 AM', '03:20 PM', 27.0380, 84.6950, 'High School Gate', 50, 750.00, 5),
  ('stop-05', 'route-01', 'Model Public School Campus (मॉडल पब्लिक स्कूल)', 5, '07:55 AM', '02:30 PM', 27.0248, 84.5936, 'Bhawanipur, West Champaran - Main Gate Bus Bay', 100, 0.00, 29)
ON CONFLICT (id) DO UPDATE SET
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  landmark = EXCLUDED.landmark;

-- 7.4 Students
INSERT INTO public.students (id, student_id_code, full_name, class_grade, section, roll_no, parent_name, parent_phone, address, bus_id, route_id, stop_id, boarding_status)
VALUES
  ('stu-01', 'MPS-2026-042', 'Aarav Sharma', 'Class VIII', 'A', '14', 'Ramesh Sharma', '+91 98350 44210', 'Near Station Road, Sikta', 'bus-01', 'route-01', 'stop-01', 'Not Boarded'),
  ('stu-02', 'MPS-2026-089', 'Priya Patel', 'Class VI', 'B', '08', 'Dinesh Patel', '+91 98351 88320', 'Market Chowk, Sikta', 'bus-01', 'route-01', 'stop-02', 'Not Boarded'),
  ('stu-03', 'MPS-2026-112', 'Mohammad Zaid', 'Class X', 'A', '22', 'Altaf Hussain', '+91 94314 55219', 'Purani Bazar, Sikta', 'bus-01', 'route-01', 'stop-03', 'Not Boarded'),
  ('stu-04', 'MPS-2026-156', 'Ananya Gupta', 'Class IV', 'C', '03', 'Sunil Gupta', '+91 91223 77410', 'Koirigawan Village', 'bus-01', 'route-01', 'stop-04', 'Not Boarded'),
  ('stu-05', 'MPS-2026-204', 'Rohan Verma', 'Class IX', 'B', '19', 'Mahesh Verma', '+91 99342 66102', 'Bhawanipur Campus Gate', 'bus-01', 'route-01', 'stop-05', 'Not Boarded')
ON CONFLICT (id) DO UPDATE SET
  stop_id = EXCLUDED.stop_id;

-- 7.5 Initial Live Location (Stationed at Sikta ready for Morning Pickup)
INSERT INTO public.live_locations (
  bus_id, bus_number, driver_name, driver_phone, route_id, route_name,
  latitude, longitude, speed, heading, accuracy, current_road_name,
  next_stop_id, next_stop_name, next_stop_eta, delay_minutes, is_active, trip_type
)
VALUES (
  'bus-01', 'Bus #01', 'Rajesh Kumar Singh (राजेश कुमार)', '+91 98350 12456',
  'route-01', 'Route 1: Sikta - Mainatand Express',
  27.0250, 84.6812, 0, 45, 5, 'Sikta Station Bus Stand',
  'stop-01', 'Sikta Railway Station (सिकटा स्टेशन)', '07:00 AM', 0, true, 'Morning Pickup'
)
ON CONFLICT (bus_id) DO UPDATE SET
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  updated_at = NOW();

-- Confirmation message
SELECT 'Model Public School Fleet Database Schema successfully provisioned!' AS status;
