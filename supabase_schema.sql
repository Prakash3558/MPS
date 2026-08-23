-- =====================================================================
-- MODEL PUBLIC SCHOOL (MPS SIKTA) - SUPABASE REALTIME & RLS SCHEMA
-- =====================================================================

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Role Mapping Tables (mapping auth.users.id to roles)
CREATE TABLE IF NOT EXISTS public.admins (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL UNIQUE,
    email TEXT,
    phone TEXT,
    permissions JSONB DEFAULT '["all"]'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.teachers (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
    teacher_id TEXT UNIQUE,
    name TEXT NOT NULL,
    full_name TEXT,
    username TEXT UNIQUE,
    phone TEXT,
    email TEXT,
    subject TEXT,
    assigned_class TEXT,
    assigned_section TEXT,
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.students (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
    student_id TEXT UNIQUE,
    name TEXT NOT NULL,
    full_name TEXT,
    roll_no TEXT,
    class TEXT,
    section TEXT,
    parent_name TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Core Operational Tables
CREATE TABLE IF NOT EXISTS public.notice_board (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    title TEXT NOT NULL,
    content TEXT,
    category TEXT DEFAULT 'Urgent',
    target_class TEXT DEFAULT 'All',
    is_urgent_ticker BOOLEAN DEFAULT FALSE,
    date TEXT,
    posted_by TEXT DEFAULT 'Administration',
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.homework (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    class TEXT NOT NULL,
    section TEXT DEFAULT 'All',
    subject TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_date TEXT,
    priority TEXT DEFAULT 'Medium',
    teacher_name TEXT,
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.online_classes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    class TEXT NOT NULL,
    section TEXT DEFAULT 'A',
    subject TEXT NOT NULL,
    title TEXT NOT NULL,
    start_time TEXT,
    end_time TEXT,
    zoom_url TEXT,
    passcode TEXT,
    meeting_id TEXT,
    status TEXT DEFAULT 'Scheduled',
    teacher_name TEXT,
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.attendance (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    student_id TEXT NOT NULL,
    student_name TEXT,
    class TEXT,
    section TEXT,
    date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Present',
    remarks TEXT,
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.exam_results (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    student_id TEXT NOT NULL,
    student_name TEXT,
    class TEXT,
    section TEXT,
    exam_type TEXT NOT NULL,
    subjects JSONB,
    total_marks NUMERIC,
    percentage NUMERIC,
    grade TEXT,
    remarks TEXT,
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.study_material (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    class TEXT NOT NULL,
    section TEXT DEFAULT 'All',
    subject TEXT NOT NULL,
    title TEXT NOT NULL,
    file_url TEXT,
    description TEXT,
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.school_diary (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    class TEXT NOT NULL,
    section TEXT DEFAULT 'All',
    subject TEXT,
    title TEXT NOT NULL,
    content TEXT,
    date TEXT,
    is_important BOOLEAN DEFAULT FALSE,
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.syllabus (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    class TEXT NOT NULL,
    section TEXT DEFAULT 'All',
    subject TEXT NOT NULL,
    chapter_name TEXT NOT NULL,
    status TEXT DEFAULT 'In Progress',
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.time_table (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    class TEXT NOT NULL,
    section TEXT NOT NULL,
    day TEXT NOT NULL,
    period_no INTEGER NOT NULL,
    subject TEXT NOT NULL,
    start_time TEXT,
    end_time TEXT,
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.media_gallery (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    category TEXT DEFAULT 'Campus',
    caption TEXT,
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.site_settings (
    id BIGINT PRIMARY KEY DEFAULT 1,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admissions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    student_name TEXT NOT NULL,
    parent_name TEXT NOT NULL,
    class_applying TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    status TEXT DEFAULT 'Pending',
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- 4. ROLE DETECTION HELPER FUNCTIONS (FOR SECURE RLS EXECUTION)
-- =====================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()) OR
    (COALESCE(auth.jwt() ->> 'user_role', '') = 'admin') OR
    (COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin') OR
    (COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    public.is_admin() OR
    EXISTS (SELECT 1 FROM public.teachers WHERE user_id = auth.uid()) OR
    (COALESCE(auth.jwt() ->> 'user_role', '') = 'teacher') OR
    (COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'teacher') OR
    (COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'teacher')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_student()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    EXISTS (SELECT 1 FROM public.students WHERE user_id = auth.uid()) OR
    (COALESCE(auth.jwt() ->> 'user_role', '') = 'student') OR
    (COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'student') OR
    (COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'student')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to get current authenticated student record identifier
CREATE OR REPLACE FUNCTION public.get_current_student_id()
RETURNS TEXT AS $$
DECLARE
  st_id TEXT;
BEGIN
  SELECT COALESCE(student_id, id) INTO st_id FROM public.students WHERE user_id = auth.uid() LIMIT 1;
  RETURN st_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================

-- Enable RLS on all tables
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notice_board ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.online_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_material ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_diary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.syllabus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_table ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admissions ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------
-- ADMINS TABLE POLICIES
-- -------------------------------------------------------------
CREATE POLICY "Admins full access" ON public.admins
    FOR ALL USING (public.is_admin());

-- -------------------------------------------------------------
-- TEACHERS TABLE POLICIES
-- -------------------------------------------------------------
CREATE POLICY "Teachers readable by authenticated and public" ON public.teachers
    FOR SELECT USING (true);

CREATE POLICY "Teachers CRUD by admin" ON public.teachers
    FOR ALL USING (public.is_admin());

-- -------------------------------------------------------------
-- STUDENTS TABLE POLICIES
-- -------------------------------------------------------------
-- Admin and Teacher: full CRUD on all student records
CREATE POLICY "Admin and Teacher full CRUD on students" ON public.students
    FOR ALL USING (public.is_admin() OR public.is_teacher());

-- Student: read-only access to their own profile
CREATE POLICY "Student read own profile" ON public.students
    FOR SELECT USING (
        user_id = auth.uid() OR
        student_id = auth.uid()::TEXT OR
        id = auth.uid()::TEXT
    );

-- -------------------------------------------------------------
-- NOTICE BOARD TABLE POLICIES
-- -------------------------------------------------------------
-- Anyone (public, students, teachers, admins) can view notices
CREATE POLICY "Notice Board readable by all" ON public.notice_board
    FOR SELECT USING (true);

-- Admin and Teacher: full CRUD (INSERT, UPDATE, DELETE)
CREATE POLICY "Admin and Teacher write notice board" ON public.notice_board
    FOR INSERT WITH CHECK (public.is_admin() OR public.is_teacher());

CREATE POLICY "Admin and Teacher update notice board" ON public.notice_board
    FOR UPDATE USING (public.is_admin() OR public.is_teacher());

CREATE POLICY "Admin and Teacher delete notice board" ON public.notice_board
    FOR DELETE USING (public.is_admin() OR public.is_teacher());

-- -------------------------------------------------------------
-- HOMEWORK TABLE POLICIES
-- -------------------------------------------------------------
-- Students and public can view homework
CREATE POLICY "Homework readable by all" ON public.homework
    FOR SELECT USING (true);

-- Admin and Teacher: full CRUD (INSERT, UPDATE, DELETE)
CREATE POLICY "Admin and Teacher write homework" ON public.homework
    FOR INSERT WITH CHECK (public.is_admin() OR public.is_teacher());

CREATE POLICY "Admin and Teacher update homework" ON public.homework
    FOR UPDATE USING (public.is_admin() OR public.is_teacher());

CREATE POLICY "Admin and Teacher delete homework" ON public.homework
    FOR DELETE USING (public.is_admin() OR public.is_teacher());

-- -------------------------------------------------------------
-- ONLINE CLASSES TABLE POLICIES
-- -------------------------------------------------------------
-- Read-only for students & general viewers
CREATE POLICY "Online classes readable by all" ON public.online_classes
    FOR SELECT USING (true);

-- Admin and Teacher: full CRUD (INSERT, UPDATE, DELETE)
CREATE POLICY "Admin and Teacher write online classes" ON public.online_classes
    FOR INSERT WITH CHECK (public.is_admin() OR public.is_teacher());

CREATE POLICY "Admin and Teacher update online classes" ON public.online_classes
    FOR UPDATE USING (public.is_admin() OR public.is_teacher());

CREATE POLICY "Admin and Teacher delete online classes" ON public.online_classes
    FOR DELETE USING (public.is_admin() OR public.is_teacher());

-- -------------------------------------------------------------
-- ATTENDANCE TABLE POLICIES
-- -------------------------------------------------------------
-- Admin and Teacher: full CRUD on attendance
CREATE POLICY "Admin and Teacher full access to attendance" ON public.attendance
    FOR ALL USING (public.is_admin() OR public.is_teacher());

-- Student: read-only access to their own attendance
CREATE POLICY "Student read own attendance" ON public.attendance
    FOR SELECT USING (
        student_id = auth.uid()::TEXT OR
        student_id = public.get_current_student_id() OR
        EXISTS (SELECT 1 FROM public.students WHERE user_id = auth.uid() AND (student_id = attendance.student_id OR id = attendance.student_id))
    );

-- -------------------------------------------------------------
-- EXAM RESULTS TABLE POLICIES
-- -------------------------------------------------------------
CREATE POLICY "Admin and Teacher full access to exam results" ON public.exam_results
    FOR ALL USING (public.is_admin() OR public.is_teacher());

CREATE POLICY "Student read own exam results" ON public.exam_results
    FOR SELECT USING (
        student_id = auth.uid()::TEXT OR
        student_id = public.get_current_student_id() OR
        EXISTS (SELECT 1 FROM public.students WHERE user_id = auth.uid() AND (student_id = exam_results.student_id OR id = exam_results.student_id))
    );

-- -------------------------------------------------------------
-- STUDY MATERIAL, DIARY, SYLLABUS, TIMETABLE POLICIES
-- -------------------------------------------------------------
CREATE POLICY "Academic content readable by all" ON public.study_material FOR SELECT USING (true);
CREATE POLICY "Academic content write by staff" ON public.study_material FOR ALL USING (public.is_admin() OR public.is_teacher());

CREATE POLICY "School diary readable by all" ON public.school_diary FOR SELECT USING (true);
CREATE POLICY "School diary write by staff" ON public.school_diary FOR ALL USING (public.is_admin() OR public.is_teacher());

CREATE POLICY "Syllabus readable by all" ON public.syllabus FOR SELECT USING (true);
CREATE POLICY "Syllabus write by staff" ON public.syllabus FOR ALL USING (public.is_admin() OR public.is_teacher());

CREATE POLICY "Time table readable by all" ON public.time_table FOR SELECT USING (true);
CREATE POLICY "Time table write by staff" ON public.time_table FOR ALL USING (public.is_admin() OR public.is_teacher());

-- -------------------------------------------------------------
-- MEDIA GALLERY & SITE SETTINGS POLICIES
-- -------------------------------------------------------------
CREATE POLICY "Media gallery readable by all" ON public.media_gallery FOR SELECT USING (true);
CREATE POLICY "Media gallery write by staff" ON public.media_gallery FOR ALL USING (public.is_admin() OR public.is_teacher());

CREATE POLICY "Site settings readable by all" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Site settings write by admin" ON public.site_settings FOR ALL USING (public.is_admin());

-- -------------------------------------------------------------
-- ADMISSIONS TABLE POLICIES
-- -------------------------------------------------------------
CREATE POLICY "Admissions readable and manageable by admin" ON public.admissions
    FOR ALL USING (public.is_admin());

CREATE POLICY "Admissions public insert" ON public.admissions
    FOR INSERT WITH CHECK (true);

-- =====================================================================
-- 6. ENABLE SUPABASE REALTIME PUBLICATION
-- =====================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE 
    public.notice_board,
    public.homework,
    public.online_classes,
    public.attendance,
    public.students,
    public.teachers,
    public.site_settings,
    public.media_gallery,
    public.exam_results,
    public.study_material,
    public.school_diary,
    public.syllabus,
    public.time_table;

-- =====================================================================
-- 7. STORAGE BUCKET & RLS CONFIGURATION
-- =====================================================================
-- Ensure bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('school-uploads', 'school-uploads', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage policies
CREATE POLICY "Public media access" ON storage.objects
    FOR SELECT USING (bucket_id = 'school-uploads');

CREATE POLICY "Staff upload access" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'school-uploads' AND 
        (public.is_admin() OR public.is_teacher() OR auth.role() = 'authenticated')
    );

CREATE POLICY "Staff modify access" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'school-uploads' AND 
        (public.is_admin() OR public.is_teacher())
    );

CREATE POLICY "Staff delete access" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'school-uploads' AND 
        (public.is_admin() OR public.is_teacher())
    );
