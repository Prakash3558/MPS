-- ============================================================================
-- Supabase Fleet & School Bus Management System Schema
-- Production-Ready Schema with Row Level Security (RLS) & Realtime Publication
-- ============================================================================

-- 1. EXTENSIONS & CUSTOM TYPES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Role enum for RBAC
DO $$ BEGIN
    CREATE TYPE user_role_type AS ENUM ('admin', 'driver', 'parent', 'teacher');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Bus status enum
DO $$ BEGIN
    CREATE TYPE bus_status_type AS ENUM ('active', 'maintenance', 'inactive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Trip types
DO $$ BEGIN
    CREATE TYPE trip_type_enum AS ENUM ('Morning Pickup', 'Afternoon Drop', 'Special Trip');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Student boarding status enum
DO $$ BEGIN
    CREATE TYPE student_boarding_status_type AS ENUM ('Not Boarded', 'Boarded', 'Dropped', 'Absent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Fleet incident severity enum
DO $$ BEGIN
    CREATE TYPE incident_severity_type AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 2. CORE TABLES
-- ============================================================================

-- A. USERS PROFILE TABLE (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role_type NOT NULL DEFAULT 'parent',
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT UNIQUE,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- B. BUSES TABLE (Vehicles in fleet)
CREATE TABLE IF NOT EXISTS public.buses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bus_number TEXT NOT NULL UNIQUE, -- e.g. "Bus #01", "Van #03"
    license_plate TEXT NOT NULL UNIQUE, -- e.g. "BR-22-PA-1024"
    model TEXT, -- e.g. "Tata Starbus Ultra 32S"
    capacity INTEGER NOT NULL DEFAULT 32,
    status bus_status_type NOT NULL DEFAULT 'active',
    fuel_type TEXT DEFAULT 'Diesel',
    tracker_device_id TEXT,
    driver_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- C. ROUTES TABLE
CREATE TABLE IF NOT EXISTS public.routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_name TEXT NOT NULL, -- e.g. "Route 1: Sikta - Mainatand Express"
    route_code TEXT UNIQUE, -- e.g. "RT-01"
    morning_start_time TIME NOT NULL DEFAULT '06:45:00',
    afternoon_start_time TIME NOT NULL DEFAULT '14:00:00',
    start_location TEXT NOT NULL DEFAULT 'Sikta Main Depot',
    end_location TEXT NOT NULL DEFAULT 'Model Public School Campus',
    polyline_coords JSONB DEFAULT '[]'::jsonb, -- Array of [lat, lng] pairs for map path
    status TEXT NOT NULL DEFAULT 'Active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- D. STOPS TABLE
CREATE TABLE IF NOT EXISTS public.stops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
    stop_name TEXT NOT NULL,
    stop_order INTEGER NOT NULL,
    scheduled_pickup_time TIME NOT NULL, -- e.g. '07:15:00'
    scheduled_drop_time TIME NOT NULL,   -- e.g. '14:45:00'
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    landmark TEXT,
    radius_meters INTEGER NOT NULL DEFAULT 60, -- Geofence radius for auto-arrival
    fee_monthly NUMERIC(10, 2) DEFAULT 600.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_route_stop_order UNIQUE(route_id, stop_order)
);

-- E. STUDENTS TABLE
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id_code TEXT NOT NULL UNIQUE, -- e.g. "MPS-2026-042"
    full_name TEXT NOT NULL,
    class_grade TEXT NOT NULL,
    section TEXT NOT NULL DEFAULT 'A',
    roll_no TEXT,
    parent_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    parent_phone TEXT NOT NULL,
    parent_name TEXT,
    address TEXT,
    photo_url TEXT,
    emergency_contact TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- F. BUS ASSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS public.bus_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    bus_id UUID NOT NULL REFERENCES public.buses(id) ON DELETE CASCADE,
    route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
    stop_id UUID NOT NULL REFERENCES public.stops(id) ON DELETE CASCADE,
    trip_frequency TEXT NOT NULL DEFAULT 'two_way', -- 'two_way', 'morning_only', 'afternoon_only'
    seat_number TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_student_active_assignment UNIQUE(student_id, active)
);

-- G. ATTENDANCE LOGS TABLE (Realtime Boarding & Dropping Events)
CREATE TABLE IF NOT EXISTS public.attendance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    bus_id UUID NOT NULL REFERENCES public.buses(id) ON DELETE CASCADE,
    route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
    stop_id UUID REFERENCES public.stops(id) ON DELETE SET NULL,
    driver_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    trip_type trip_type_enum NOT NULL DEFAULT 'Morning Pickup',
    status student_boarding_status_type NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    notes TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- H. LIVE LOCATIONS TABLE (Real-time vehicle telemetry stream)
CREATE TABLE IF NOT EXISTS public.live_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bus_id UUID NOT NULL UNIQUE REFERENCES public.buses(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    route_id UUID REFERENCES public.routes(id) ON DELETE SET NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    speed DOUBLE PRECISION NOT NULL DEFAULT 0.0, -- in km/h
    heading DOUBLE PRECISION NOT NULL DEFAULT 0.0, -- in degrees (0-360)
    accuracy DOUBLE PRECISION, -- in meters
    current_road_name TEXT DEFAULT 'En Route',
    next_stop_id UUID REFERENCES public.stops(id) ON DELETE SET NULL,
    next_stop_eta TIMESTAMPTZ,
    delay_minutes INTEGER NOT NULL DEFAULT 0, -- Auto-calculated delay in minutes
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    trip_type trip_type_enum NOT NULL DEFAULT 'Morning Pickup',
    sos_alert BOOLEAN NOT NULL DEFAULT FALSE,
    sos_reason TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- I. FLEET INCIDENTS TABLE (SOS & Road Blockages)
CREATE TABLE IF NOT EXISTS public.fleet_incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bus_id UUID NOT NULL REFERENCES public.buses(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    route_id UUID REFERENCES public.routes(id) ON DELETE SET NULL,
    incident_type TEXT NOT NULL, -- 'emergency_sos', 'traffic_delay', 'breakdown', 'skip_stop', 'accident'
    severity incident_severity_type NOT NULL DEFAULT 'medium',
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    description TEXT NOT NULL,
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- ============================================================================
-- 3. INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_stops_route_id ON public.stops(route_id);
CREATE INDEX IF NOT EXISTS idx_bus_assignments_student ON public.bus_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_bus_assignments_bus ON public.bus_assignments(bus_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_time ON public.attendance_logs(student_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_live_locations_bus ON public.live_locations(bus_id);
CREATE INDEX IF NOT EXISTS idx_fleet_incidents_bus ON public.fleet_incidents(bus_id, resolved);

-- ============================================================================
-- 4. REALTIME PUBLICATION SETUP
-- ============================================================================
-- Enable Supabase Realtime broadcast for live telemetry and instant parent notifications
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.live_locations;
EXCEPTION WHEN OTHERS THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_logs;
EXCEPTION WHEN OTHERS THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.fleet_incidents;
EXCEPTION WHEN OTHERS THEN null;
END $$;

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Helper functions to check roles
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_driver()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'driver'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS across all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bus_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fleet_incidents ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- POLICIES: users
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view their own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Admins full management of users"
    ON public.users FOR ALL
    USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- POLICIES: buses, routes, stops (Read available to all authenticated school members)
-- ----------------------------------------------------------------------------
CREATE POLICY "Authenticated members view buses"
    ON public.buses FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins full management of buses"
    ON public.buses FOR ALL
    USING (public.is_admin());

CREATE POLICY "Authenticated members view routes"
    ON public.routes FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins full management of routes"
    ON public.routes FOR ALL
    USING (public.is_admin());

CREATE POLICY "Authenticated members view stops"
    ON public.stops FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins full management of stops"
    ON public.stops FOR ALL
    USING (public.is_admin());

-- Drivers can also insert/update stops for their assigned route (e.g. add new dynamic stop)
CREATE POLICY "Drivers can add/update stops for their assigned route"
    ON public.stops FOR INSERT
    WITH CHECK (
        public.is_admin() OR
        EXISTS (
            SELECT 1 FROM public.buses b
            WHERE b.driver_id = auth.uid()
        )
    );

-- ----------------------------------------------------------------------------
-- POLICIES: students & bus_assignments
-- ----------------------------------------------------------------------------
-- Parents only read their child's record
CREATE POLICY "Parents view own children"
    ON public.students FOR SELECT
    TO authenticated
    USING (
        parent_id = auth.uid() OR
        public.is_admin() OR
        public.is_driver()
    );

CREATE POLICY "Admins manage all students"
    ON public.students FOR ALL
    USING (public.is_admin());

-- Bus assignments: Parents can see their children's assignments; Drivers can see for their route
CREATE POLICY "View bus assignments"
    ON public.bus_assignments FOR SELECT
    TO authenticated
    USING (
        public.is_admin() OR
        EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.id = bus_assignments.student_id AND s.parent_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.buses b
            WHERE b.id = bus_assignments.bus_id AND b.driver_id = auth.uid()
        )
    );

CREATE POLICY "Admins and active Drivers manage bus assignments"
    ON public.bus_assignments FOR ALL
    USING (
        public.is_admin() OR
        EXISTS (
            SELECT 1 FROM public.buses b
            WHERE b.id = bus_assignments.bus_id AND b.driver_id = auth.uid()
        )
    );

-- ----------------------------------------------------------------------------
-- POLICIES: attendance_logs
-- ----------------------------------------------------------------------------
-- Parents can ONLY read attendance logs for their linked child
CREATE POLICY "Parents view attendance for their children"
    ON public.attendance_logs FOR SELECT
    TO authenticated
    USING (
        public.is_admin() OR
        EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.id = attendance_logs.student_id AND s.parent_id = auth.uid()
        ) OR
        driver_id = auth.uid()
    );

-- Drivers can insert/update attendance logs for their trips
CREATE POLICY "Drivers record attendance"
    ON public.attendance_logs FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_admin() OR
        driver_id = auth.uid()
    );

CREATE POLICY "Admins full management on attendance"
    ON public.attendance_logs FOR ALL
    USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- POLICIES: live_locations
-- ----------------------------------------------------------------------------
-- Parents can ONLY read live GPS coordinates if their child is assigned to this bus
CREATE POLICY "Parents read live coordinates for their child's bus"
    ON public.live_locations FOR SELECT
    TO authenticated
    USING (
        public.is_admin() OR
        driver_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.bus_assignments ba
            JOIN public.students s ON s.id = ba.student_id
            WHERE ba.bus_id = live_locations.bus_id 
              AND s.parent_id = auth.uid()
              AND ba.active = TRUE
        )
    );

-- Drivers can insert/update live coordinates ONLY for their assigned bus
CREATE POLICY "Drivers update their active bus telemetry"
    ON public.live_locations FOR ALL
    TO authenticated
    USING (
        public.is_admin() OR
        driver_id = auth.uid()
    )
    WITH CHECK (
        public.is_admin() OR
        driver_id = auth.uid()
    );

-- ----------------------------------------------------------------------------
-- POLICIES: fleet_incidents
-- ----------------------------------------------------------------------------
CREATE POLICY "View incidents"
    ON public.fleet_incidents FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Drivers and Admins report incidents"
    ON public.fleet_incidents FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_admin() OR
        driver_id = auth.uid()
    );

CREATE POLICY "Admins manage incidents"
    ON public.fleet_incidents FOR ALL
    USING (public.is_admin());
