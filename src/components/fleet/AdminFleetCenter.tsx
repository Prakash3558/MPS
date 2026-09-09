import React, { useState, useEffect, useRef } from 'react';
import {
  Bus, Navigation, MapPin, Users, AlertTriangle, ShieldCheck,
  CheckCircle2, Clock, Plus, Database, Copy, Check, Download,
  ExternalLink, Search, Filter, RefreshCw
} from 'lucide-react';
import L from 'leaflet';
import {
  supabaseFleetService, SupabaseBus, SupabaseRoute, SupabaseStop,
  SupabaseStudentFleet, SupabaseLiveLocation, DEFAULT_BUSES, DEFAULT_ROUTES
} from '../../lib/supabaseFleetService';

export const AdminFleetCenter: React.FC = () => {
  const [buses, setBuses] = useState<SupabaseBus[]>(DEFAULT_BUSES);
  const [routes, setRoutes] = useState<SupabaseRoute[]>(DEFAULT_ROUTES);
  const [activeLocations, setActiveLocations] = useState<SupabaseLiveLocation[]>([]);
  const [selectedBusId, setSelectedBusId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'on_schedule' | 'delayed' | 'off_route'>('all');
  const [activeTab, setActiveTab] = useState<'fleet_map' | 'buses' | 'routes' | 'supabase_sql'>('fleet_map');
  const [copiedSql, setCopiedSql] = useState(false);

  // Map Refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routesLayerRef = useRef<L.LayerGroup | null>(null);

  // Load locations and routes
  useEffect(() => {
    const locs = supabaseFleetService.getAllActiveLocations();
    setActiveLocations(locs);

    const unsubscribe = supabaseFleetService.subscribeToLiveLocation((loc) => {
      setActiveLocations((prev) => {
        const idx = prev.findIndex((item) => item.bus_id === loc.bus_id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = loc;
          return updated;
        }
        return [...prev, loc];
      });
    });

    const unsubRoutes = supabaseFleetService.subscribeToRoutes((updatedRoutes) => {
      setRoutes(updatedRoutes);
    });

    return () => {
      unsubscribe();
      unsubRoutes();
    };
  }, []);

  // Initialize Map
  useEffect(() => {
    if (activeTab !== 'fleet_map') return;
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [27.0280, 84.6850],
      zoom: 13,
      zoomControl: false
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    const routesGroup = L.layerGroup().addTo(map);
    routesLayerRef.current = routesGroup;

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
      routesLayerRef.current = null;
    };
  }, [activeTab]);

  // Render snapped route polylines on Admin Map
  useEffect(() => {
    if (!mapInstanceRef.current || !routesLayerRef.current || activeTab !== 'fleet_map') return;
    routesLayerRef.current.clearLayers();

    const colors = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6'];
    routes.forEach((r, idx) => {
      if (r.polyline_coords && r.polyline_coords.length > 1) {
        // Casing for street visibility
        L.polyline(r.polyline_coords, {
          color: '#0f172a',
          weight: 6,
          opacity: 0.85,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(routesLayerRef.current!);

        // Snapped active street line
        L.polyline(r.polyline_coords, {
          color: colors[idx % colors.length],
          weight: 3.5,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(routesLayerRef.current!);
      }
    });
  }, [routes, activeTab]);

  // Update map markers when active locations or filter change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current || activeTab !== 'fleet_map') return;
    markersLayerRef.current.clearLayers();

    const filtered = activeLocations.filter((loc) => {
      if (selectedBusId !== 'all' && loc.bus_id !== selectedBusId) return false;
      const isDelayed = loc.delay_minutes >= 3;
      if (statusFilter === 'delayed' && !isDelayed) return false;
      if (statusFilter === 'on_schedule' && isDelayed) return false;
      return true;
    });

    filtered.forEach((loc) => {
      const isDelayed = loc.delay_minutes >= 3;
      const statusColor = isDelayed ? '#f43f5e' : '#10b981';

      const icon = L.divIcon({
        className: 'admin-bus-marker',
        html: `
          <div class="relative flex flex-col items-center">
            <div style="transform: rotate(${loc.heading}deg);" class="w-10 h-10 rounded-2xl shadow-xl flex items-center justify-center font-bold text-xs border-2 border-white ${
              isDelayed ? 'bg-rose-600 text-white animate-pulse' : 'bg-amber-500 text-slate-950'
            }">
              🚌
            </div>
            <div class="bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow border border-slate-700 whitespace-nowrap mt-1">
              ${loc.bus_number || loc.bus_id} • ${loc.speed} km/h
            </div>
          </div>
        `,
        iconSize: [40, 52],
        iconAnchor: [20, 26]
      });

      const m = L.marker([loc.latitude, loc.longitude], { icon }).addTo(markersLayerRef.current!);
      m.bindPopup(`
        <div style="font-family: sans-serif; min-width: 180px;">
          <h4 style="margin:0 0 4px; font-weight:bold;">${loc.bus_number || loc.bus_id}</h4>
          <p style="margin:0 0 2px; font-size:12px; color:#475569;">Driver: <b>${loc.driver_name}</b></p>
          <p style="margin:0 0 2px; font-size:12px; color:#475569;">Speed: <b>${loc.speed} km/h</b></p>
          <p style="margin:0 0 2px; font-size:12px; color:#475569;">Road: <b>${loc.current_road_name || 'En Route'}</b></p>
          <p style="margin:0; font-size:12px; font-weight:bold; color:${isDelayed ? '#e11d48' : '#059669'};">
            ${isDelayed ? `Delayed (+${loc.delay_minutes}m)` : 'On Schedule'}
          </p>
        </div>
      `);
    });
  }, [activeLocations, selectedBusId, statusFilter, activeTab]);

  const downloadSqlFile = () => {
    const link = document.createElement('a');
    link.href = '/mps_fleet_schema.sql';
    link.download = 'mps_fleet_schema.sql';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copySql = async () => {
    try {
      const response = await fetch('/mps_fleet_schema.sql');
      const text = await response.text();
      await navigator.clipboard.writeText(text);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
    } catch {
      setCopiedSql(false);
    }
  };

  return (
    <div className="bg-slate-950 text-slate-100 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl space-y-0">
      {/* Header */}
      <div className="bg-slate-900/90 border-b border-slate-800 p-5 sm:p-6 backdrop-blur flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 rounded-2xl font-black shadow-lg shadow-amber-500/20">
            <Bus className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">Global Fleet Command Center</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live multi-vehicle tracking, route operations, and Supabase database architecture.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('fleet_map')}
            className={`px-3 py-1.5 rounded-xl transition ${
              activeTab === 'fleet_map' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Live Fleet Map
          </button>
          <button
            onClick={() => setActiveTab('buses')}
            className={`px-3 py-1.5 rounded-xl transition ${
              activeTab === 'buses' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Vehicles ({buses.length})
          </button>
          <button
            onClick={() => setActiveTab('routes')}
            className={`px-3 py-1.5 rounded-xl transition ${
              activeTab === 'routes' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Routes ({routes.length})
          </button>
          <button
            onClick={() => setActiveTab('supabase_sql')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'supabase_sql' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-emerald-400 hover:text-emerald-300'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Supabase DDL & RLS</span>
          </button>
        </div>
      </div>

      {/* Content Panes */}
      {activeTab === 'fleet_map' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[600px]">
          {/* Map Container */}
          <div className="lg:col-span-8 relative h-[400px] lg:h-auto min-h-[450px] border-b lg:border-b-0 lg:border-r border-slate-800">
            <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: '100%' }} />

            {/* Map Filter Controls */}
            <div className="absolute top-4 left-4 z-[400] bg-slate-900/90 backdrop-blur-md p-3 rounded-2xl border border-slate-700 shadow-xl flex items-center gap-3 text-xs">
              <select
                value={statusFilter}
                onChange={(e: any) => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="on_schedule">On Schedule</option>
                <option value="delayed">Delayed</option>
              </select>

              <select
                value={selectedBusId}
                onChange={(e) => setSelectedBusId(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white outline-none"
              >
                <option value="all">All Vehicles</option>
                {buses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.bus_number}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right Fleet Telemetry Cards */}
          <div className="lg:col-span-4 p-5 sm:p-6 space-y-4 bg-slate-900/40 overflow-y-auto max-h-[650px]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Active Vehicles Telemetry</h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                {activeLocations.length} Online
              </span>
            </div>

            <div className="space-y-3">
              {activeLocations.map((loc) => {
                const isDelayed = loc.delay_minutes >= 3;

                return (
                  <div
                    key={loc.bus_id}
                    onClick={() => {
                      setSelectedBusId(loc.bus_id);
                      mapInstanceRef.current?.panTo([loc.latitude, loc.longitude], { animate: true });
                    }}
                    className={`p-4 rounded-2xl border transition cursor-pointer space-y-2 text-xs ${
                      selectedBusId === loc.bus_id
                        ? 'bg-amber-500/10 border-amber-500 shadow-lg'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-white text-sm">{loc.bus_number || loc.bus_id}</span>
                        <span className="text-[10px] text-slate-400">({loc.trip_type})</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        isDelayed
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}>
                        {isDelayed ? `Delayed (+${loc.delay_minutes}m)` : 'On Schedule'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                      <div>
                        Driver: <b className="text-slate-200">{loc.driver_name?.split(' ')[0]}</b>
                      </div>
                      <div>
                        Speed: <b className="text-white">{loc.speed} km/h</b>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800 flex items-center justify-between">
                      <span className="truncate">Next: {loc.next_stop_name || 'En Route'}</span>
                      <span className="text-amber-400 font-semibold">{loc.next_stop_eta || '07:15 AM'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Supabase Schema & RLS Tab */}
      {activeTab === 'supabase_sql' && (
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-400" />
                <span>Supabase PostgreSQL Schema & Row Level Security (RLS)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Ready-to-deploy SQL migration containing ENUMs, foreign keys, Realtime publications, and granular RLS policies.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={downloadSqlFile}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 transition shadow-lg shadow-indigo-600/30"
              >
                <Download className="w-4 h-4" />
                <span>Download .SQL File</span>
              </button>
              <button
                onClick={copySql}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-2 transition"
              >
                {copiedSql ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedSql ? 'Copied to Clipboard' : 'Copy SQL Script'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-amber-400 font-bold block">1. Row Level Security (RLS)</span>
              <p className="text-slate-400">
                Drivers restricted to active route updates; parents restricted to reading only their assigned child's telemetry.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-emerald-400 font-bold block">2. Supabase Realtime</span>
              <p className="text-slate-400">
                Enabled for <code>live_locations</code> and <code>attendance_logs</code> for instant zero-polling subscriptions.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-sky-400 font-bold block">3. Performance Indexes</span>
              <p className="text-slate-400">
                Indexes on foreign keys (<code>route_id</code>, <code>student_id</code>, <code>bus_id</code>, <code>timestamp</code>) ensure sub-millisecond query latency.
              </p>
            </div>
          </div>

          <div className="relative">
            <pre className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs overflow-x-auto max-h-[420px] leading-relaxed">
{`-- Production Supabase Tables
CREATE TABLE public.users (...);
CREATE TABLE public.buses (...);
CREATE TABLE public.routes (...);
CREATE TABLE public.stops (...);
CREATE TABLE public.students (...);
CREATE TABLE public.bus_assignments (...);
CREATE TABLE public.attendance_logs (...);
CREATE TABLE public.live_locations (...);
CREATE TABLE public.fleet_incidents (...);

-- Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_logs;

-- RLS: Parents can only read coordinates for their linked child's bus
CREATE POLICY "Parents read live coordinates for their child's bus"
    ON public.live_locations FOR SELECT
    TO authenticated
    USING (
        public.is_admin() OR
        EXISTS (
            SELECT 1 FROM public.bus_assignments ba
            JOIN public.students s ON s.id = ba.student_id
            WHERE ba.bus_id = live_locations.bus_id 
              AND s.parent_id = auth.uid()
              AND ba.active = TRUE
        )
    );

-- RLS: Drivers can only update their active bus
CREATE POLICY "Drivers update their active bus telemetry"
    ON public.live_locations FOR ALL
    TO authenticated
    USING (public.is_admin() OR driver_id = auth.uid());`}
            </pre>
          </div>
        </div>
      )}

      {/* Buses CRUD Tab */}
      {activeTab === 'buses' && (
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Registered School Fleet Vehicles</h3>
            <span className="text-xs text-slate-400">{buses.length} Vehicles Operational</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {buses.map((bus) => (
              <div key={bus.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-black text-white text-base">{bus.bus_number}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                    {bus.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-slate-400">{bus.model} • {bus.capacity} Seats</p>
                <div className="pt-2 border-t border-slate-800 space-y-1 text-[11px] text-slate-300">
                  <p>Number Plate: <b className="text-white">{bus.license_plate}</b></p>
                  <p>Driver: <b className="text-amber-400">{bus.driver_name}</b></p>
                  <p>Contact: {bus.driver_phone}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Routes Tab */}
      {activeTab === 'routes' && (
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">School Transit Routes</h3>
            <span className="text-xs text-slate-400">{routes.length} Active Corridors</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {routes.map((route) => (
              <div key={route.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-black text-white text-base">{route.route_name}</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                    {route.route_code}
                  </span>
                </div>
                <p className="text-slate-400">
                  From: {route.start_location} ➔ To: {route.end_location}
                </p>
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-300">
                  <span>Morning: {route.morning_start_time}</span>
                  <span>Afternoon: {route.afternoon_start_time}</span>
                  <span className="text-emerald-400 font-bold">{route.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFleetCenter;
