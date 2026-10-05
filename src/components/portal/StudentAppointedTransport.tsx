import React, { useMemo } from 'react';
import { Student, TransportRoute, TransportStop, TransportStudentRosterItem, VehicleLiveLocation } from '../../types';
import {
  Bus, MapPin, Clock, Phone, Navigation, ShieldCheck, AlertCircle,
  CheckCircle2, AlertTriangle, RefreshCw, MessageSquare, Info, ShieldAlert,
  Calendar, CreditCard, ChevronRight, Sparkles, XCircle
} from 'lucide-react';

interface StudentAppointedTransportProps {
  student: Student | null | undefined;
  transportRoutes: TransportRoute[];
  transportStops: TransportStop[];
  transportRoster: TransportStudentRosterItem[];
  liveLocations: VehicleLiveLocation[];
  onRefreshLive?: () => void;
}

export const StudentAppointedTransport: React.FC<StudentAppointedTransportProps> = ({
  student,
  transportRoutes,
  transportStops,
  transportRoster,
  liveLocations,
  onRefreshLive
}) => {
  // Resolve the student's appointed bus, stop, and route
  const transportData = useMemo(() => {
    if (!student) return null;

    // 1. Direct fields on student object
    let assignedRouteId = student.transportRoute;
    let assignedStopName = student.transportStop;
    let assignedStopId = student.transportStopId;
    let pickupTime = student.pickupTime;
    let dropTime = student.dropTime;
    let fee = student.transportFee;

    // 2. Roster item matching
    const rosterItem = transportRoster.find(
      r => r.studentId === student.id ||
        (r.rollNo === student.rollNo && r.class === student.class && r.section === student.section)
    );
    if (rosterItem) {
      if (!assignedRouteId) assignedRouteId = rosterItem.routeId || rosterItem.routeName;
      if (!assignedStopId) assignedStopId = rosterItem.stopId;
      if (!assignedStopName) assignedStopName = rosterItem.stopName;
      if (!pickupTime) pickupTime = rosterItem.pickupTime;
      if (!dropTime) dropTime = rosterItem.dropTime;
      if (!fee) fee = rosterItem.feeMonthly;
    }

    // 3. Stop matching via assignedStudentIds
    if (!assignedStopId && transportStops.length > 0) {
      const matchingStop = transportStops.find(s => s.assignedStudentIds?.includes(student.id));
      if (matchingStop) {
        assignedStopId = matchingStop.id;
        assignedStopName = matchingStop.stopName;
        if (!assignedRouteId) assignedRouteId = matchingStop.routeId;
        if (!pickupTime) pickupTime = matchingStop.pickupTime;
        if (!dropTime) dropTime = matchingStop.dropTime;
        if (!fee) fee = matchingStop.feeMonthly;
      }
    }

    // 4. Fallback defaults for default demo students if not populated in custom state
    if (!assignedRouteId && !assignedStopName && !assignedStopId) {
      if (student.id === 's-1001' || student.name?.toLowerCase().includes('rahul')) {
        assignedRouteId = 'tr-1';
        assignedStopId = 'stp-4';
        assignedStopName = 'Bhawanipur Tola Chowk (भवानीपुर चौक)';
        pickupTime = '07:50 AM';
        dropTime = '03:15 PM';
        fee = 600;
      } else if (student.id === 's-1002' || student.name?.toLowerCase().includes('ananya')) {
        assignedRouteId = 'tr-2';
        assignedStopId = 'stp-6';
        assignedStopName = 'Kursi Barwa Mod (कुर्सी बरवा मोड़)';
        pickupTime = '07:10 AM';
        dropTime = '02:35 PM';
        fee = 700;
      }
    }

    // If student has no bus assignment
    if (!assignedRouteId && !assignedStopName && !student.transportEnrolled) {
      return { hasAppointedBus: false as const };
    }

    // Match the route object
    const cleanRouteKey = String(assignedRouteId || '').toLowerCase().trim();
    const matchedRoute = transportRoutes.find(
      r => r.id.toLowerCase() === cleanRouteKey ||
        r.routeName.toLowerCase().includes(cleanRouteKey) ||
        r.busNumber.toLowerCase() === cleanRouteKey
    ) || transportRoutes[0]; // fallback to primary route if exists

    if (!matchedRoute) {
      return { hasAppointedBus: false as const };
    }

    // Filter stops ONLY along this appointed route
    const routeStops = transportStops
      .filter(s => s.routeId === matchedRoute.id || s.routeId === assignedRouteId)
      .sort((a, b) => (a.stopNumber || 0) - (b.stopNumber || 0));

    // Resolve the student's specific stop
    const matchedStop = (assignedStopId ? routeStops.find(s => s.id === assignedStopId) : null) ||
      (assignedStopName ? routeStops.find(s => s.stopName.toLowerCase().includes(String(assignedStopName).toLowerCase())) : null) ||
      routeStops.find(s => s.assignedStudentIds?.includes(student.id)) ||
      (assignedStopName ? {
        id: assignedStopId || 'student-stop',
        routeId: matchedRoute.id,
        stopName: assignedStopName,
        stopNumber: 1,
        pickupTime: pickupTime || '07:30 AM',
        dropTime: dropTime || '03:00 PM',
        landmark: 'Designated Student Pickup Point',
        latitude: 27.001738,
        longitude: 84.674348,
        feeMonthly: fee || matchedRoute.feeMonthly || 600
      } : routeStops[0]);

    // Match live location for THIS student's appointed bus ONLY
    const liveLoc = liveLocations.find(
      l => l.routeId === matchedRoute.id ||
        l.routeId === assignedRouteId ||
        (l.vehicleNumber && l.vehicleNumber.toLowerCase() === matchedRoute.busNumber.toLowerCase())
    );

    // CRITICAL REQUIREMENT:
    // "the live location should be off when driver finish the trip"
    // Only active if driver is actively running a trip and isActive is true and tripType is not 'None'
    const isLiveActive = Boolean(
      liveLoc &&
      liveLoc.isActive === true &&
      liveLoc.tripType &&
      liveLoc.tripType !== 'None'
    );

    return {
      hasAppointedBus: true as const,
      route: matchedRoute,
      stop: matchedStop,
      routeStops,
      liveLoc,
      isLiveActive,
      pickupTime: pickupTime || matchedStop?.pickupTime || matchedRoute.morningDepartureTime || '07:30 AM',
      dropTime: dropTime || matchedStop?.dropTime || matchedRoute.afternoonDepartureTime || '03:00 PM',
      fee: fee || matchedStop?.feeMonthly || matchedRoute.feeMonthly || 600
    };
  }, [student, transportRoutes, transportStops, transportRoster, liveLocations]);

  // If no bus is appointed for this student
  if (!transportData || !transportData.hasAppointedBus) {
    return (
      <div className="space-y-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
            Commute & Transportation
          </span>
          <h3 className="text-xl font-bold font-heading text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <Bus className="w-5 h-5 text-amber-500" /> Appointed School Bus
          </h3>
          <p className="text-xs text-slate-500">
            Transport enrollment and designated bus allocation status for {student.name}.
          </p>
        </div>

        {/* No Bus Appointed Notice Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm text-center max-w-2xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
            <Bus className="w-8 h-8" />
          </div>

          <div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              Commute Mode: Self / Walker / Parent Escort
            </span>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white mt-2">
              No School Bus Currently Appointed
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-lg mx-auto leading-relaxed">
              Your profile is currently registered as a self-commuter. If you require pick-and-drop bus facility from your village or locality in West Champaran, please contact the School Transport Office to allocate your appointed bus and stop.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Campus Helpdesk</span>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Transport & Fleet Incharge</p>
              <a
                href="tel:+919431812345"
                className="text-xs text-amber-600 dark:text-amber-400 font-bold hover:underline inline-flex items-center gap-1 mt-1"
              >
                <Phone className="w-3.5 h-3.5" /> +91 94318 12345
              </a>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Campus Office</span>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Model Public School</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Bhawanipur, Sikta, West Champaran (6:30 AM – 5:30 PM)
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { route, stop, routeStops, liveLoc, isLiveActive, pickupTime, dropTime, fee } = transportData;

  return (
    <div className="space-y-6">
      {/* Header & Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 bg-amber-100 dark:bg-amber-950/60 px-3 py-1 rounded-full">
            Appointed School Transport
          </span>
          <h3 className="text-xl font-bold font-heading text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <Bus className="w-5 h-5 text-amber-500" /> My Appointed Bus & Stops
          </h3>
          <p className="text-xs text-slate-500">
            Dedicated commute information, stops, timings, driver contact, and trip status for {student.name}.
          </p>
        </div>

        {/* Live Trip Status Pill */}
        <div className="flex items-center gap-2">
          {isLiveActive ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span>LIVE GPS: ON ({liveLoc?.tripType || 'Trip in Progress'})</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              <span>LIVE GPS: OFF (Trip Finished / Inactive)</span>
            </div>
          )}

          {onRefreshLive && (
            <button
              onClick={onRefreshLive}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs transition cursor-pointer"
              title="Refresh GPS Telemetry"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Primary 3-Column Summary Card: Appointed Bus, Appointed Stop, Assigned Driver */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Appointed Bus Info */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Appointed Bus
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500 text-slate-950 shadow-xs">
              {route.busNumber}
            </span>
          </div>

          <div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white font-heading">
              {route.routeName}
            </h4>
            <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
              Plate: <strong className="text-slate-700 dark:text-slate-200">{route.numberPlate || route.vehicleNo || 'BR-22-PA-8757'}</strong>
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Vehicle: {route.vehicleType || 'School Bus'}</span>
            <span>Capacity: {route.capacity || 42} Seats</span>
          </div>
        </div>

        {/* Card 2: Appointed Stop & Timings */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-amber-500/30 dark:border-amber-500/40 shadow-sm space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> Your Appointed Stop
            </span>
            {stop && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                Stop #{stop.stopNumber}
              </span>
            )}
          </div>

          <div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              {stop?.stopName || 'Designated School Stop'}
            </h4>
            {stop?.landmark && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                📍 {stop.landmark}
              </p>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block">Morning Pickup</span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                {pickupTime}
              </strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Afternoon Drop</span>
              <strong className="text-sky-600 dark:text-sky-400 font-mono text-sm">
                {dropTime}
              </strong>
            </div>
          </div>
        </div>

        {/* Card 3: Driver & Helpline Contacts */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Assigned Crew
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              Fee: ₹{fee}/mo
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 block">Driver:</span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
              <span>{route.driverName}</span>
              {route.driverPhone && (
                <a
                  href={`tel:${route.driverPhone}`}
                  className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition"
                  title="Call Driver"
                >
                  <Phone className="w-3 h-3" /> Call
                </a>
              )}
            </h4>
            <p className="text-xs font-mono text-slate-500 mt-0.5">{route.driverPhone}</p>
          </div>

          {route.conductorName && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-[10px] text-slate-400 block">Conductor / Attendant:</span>
              <div className="flex items-center justify-between mt-0.5">
                <span className="font-semibold text-slate-800 dark:text-slate-200">{route.conductorName}</span>
                {route.conductorPhone && (
                  <a href={`tel:${route.conductorPhone}`} className="text-amber-600 dark:text-amber-400 hover:underline font-mono text-[11px]">
                    {route.conductorPhone}
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Live Location Telemetry Section (Strictly respecting "live location should be off when driver finish the trip") */}
      <div className="bg-slate-950 rounded-3xl p-6 sm:p-7 border border-slate-800 shadow-xl text-white space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              isLiveActive
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                : 'bg-slate-800 border border-slate-700 text-slate-400'
            }`}>
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-bold text-white font-heading">
                  {route.busNumber} Live Telemetry & GPS Tracking
                </h4>
                {isLiveActive ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-slate-950">
                    ● ACTIVE TRIP
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                    OFF (Trip Finished)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {isLiveActive
                  ? `Real-time GPS broadcast transmitted from driver's device for ${route.busNumber}.`
                  : 'Live GPS broadcast is currently off because the driver has finished the trip.'}
              </p>
            </div>
          </div>

          {/* Direct WhatsApp button if driver phone available */}
          {route.driverPhone && (
            <a
              href={`https://wa.me/${route.driverPhone.replace(/\D/g, '')}?text=Hello%20${encodeURIComponent(route.driverName)},%20inquiring%20about%20${encodeURIComponent(route.busNumber)}%20at%20stop%20${encodeURIComponent(stop?.stopName || 'my stop')}.`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition shadow"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp Driver</span>
            </a>
          )}
        </div>

        {/* Conditional Rendering: ACTIVE vs OFF state */}
        {isLiveActive && liveLoc ? (
          <div className="space-y-4">
            {/* Live Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Current Speed</span>
                <span className="text-xl font-black text-amber-400 font-mono">
                  {liveLoc.speed} <span className="text-xs text-slate-400 font-sans">km/h</span>
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Upcoming Stop</span>
                <span className="text-xs font-bold text-emerald-400 truncate block">
                  {liveLoc.nextStopName || stop?.stopName || 'Model Public School'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Trip Type</span>
                <span className="text-xs font-bold text-sky-400 block">
                  {liveLoc.tripType || 'Active Route'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Heading / GPS Fix</span>
                <span className="text-xs font-mono text-slate-300 block">
                  {liveLoc.heading || 0}° (Accuracy ~{liveLoc.accuracy || 5}m)
                </span>
              </div>
            </div>

            {/* Embedded Live Google Maps for this bus only */}
            <div className="h-64 sm:h-80 rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 relative">
              <iframe
                src={`https://maps.google.com/maps?q=${liveLoc.latitude},${liveLoc.longitude}&t=m&z=16&output=embed`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                title={`Live Map for ${route.busNumber}`}
                className="w-full h-full filter contrast-[1.02]"
              />

              {/* HUD Badge */}
              <div className="absolute top-3 left-3 bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-[11px] font-bold text-amber-400 shadow flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>{route.busNumber} • Live GPS Transmitting</span>
              </div>
            </div>

            {/* Track on Google Maps App Button */}
            <div className="flex justify-end">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${liveLoc.latitude},${liveLoc.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow transition"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Open Live Bus Location in Google Maps</span>
              </a>
            </div>
          </div>
        ) : (
          /* OFF State: Driver Finished the Trip / Inactive */
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 flex-shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                    <h5 className="text-sm font-bold text-white">
                      Live Location is Currently OFF
                    </h5>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    The driver has finished the trip. {route.busNumber} is safely parked at the Model Public School Campus Depot.
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Depot Location</span>
                <span className="text-xs font-bold text-slate-300">Model Public School, Bhawanipur</span>
                <span className="text-[10px] text-slate-500 font-mono block">27.0017° N, 84.6743° E</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>
                  Live GPS telemetry turns ON automatically when the driver starts the next run.
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Clock className="w-4 h-4 text-sky-400 flex-shrink-0" />
                <span>
                  Next scheduled run: <strong>{pickupTime}</strong> (Morning Pickup) / <strong>{dropTime}</strong> (Afternoon Drop)
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Appointed Route Stops Timeline (ONLY stops on this route, student's stop highlighted) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white font-heading flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-500" />
              Stops Along Your Appointed Route ({route.routeName})
            </h4>
            <p className="text-xs text-slate-500">
              Only stops assigned to {route.busNumber} are shown. Your designated stop is highlighted.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-stone-100 dark:bg-slate-800 px-3 py-1 rounded-full w-fit">
            {routeStops.length} Total Route Stops
          </span>
        </div>

        <div className="space-y-2.5">
          {routeStops.map((st, idx) => {
            const isStudentStop = Boolean(
              st.id === stop?.id ||
              (stop?.stopName && st.stopName.toLowerCase().includes(stop.stopName.toLowerCase())) ||
              st.assignedStudentIds?.includes(student.id)
            );

            return (
              <div
                key={st.id || idx}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isStudentStop
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 dark:border-amber-600/70 shadow-sm ring-1 ring-amber-400/40'
                    : 'bg-stone-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center flex-shrink-0 ${
                    isStudentStop
                      ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}>
                    {st.stopNumber || idx + 1}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h5 className={`text-sm font-bold ${
                        isStudentStop
                          ? 'text-amber-950 dark:text-amber-200 font-extrabold'
                          : 'text-slate-900 dark:text-white'
                      }`}>
                        {st.stopName}
                      </h5>
                      {isStudentStop && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 uppercase tracking-wide">
                          ★ Your Appointed Stop
                        </span>
                      )}
                    </div>
                    {st.landmark && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Landmark: {st.landmark}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono pl-11 sm:pl-0">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-slate-400 block font-sans">Morning Pickup</span>
                    <strong className="text-emerald-700 dark:text-emerald-400">{st.pickupTime || pickupTime}</strong>
                  </div>
                  <div className="text-left sm:text-right border-l border-slate-200 dark:border-slate-700 pl-3">
                    <span className="text-[10px] text-slate-400 block font-sans">Afternoon Drop</span>
                    <strong className="text-sky-700 dark:text-sky-400">{st.dropTime || dropTime}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Safety & Guidelines Footer Box */}
      <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-700 dark:text-slate-300">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h5 className="font-bold text-slate-900 dark:text-white">
              Student Transport Advisory
            </h5>
            <p className="text-slate-600 dark:text-slate-400">
              Please arrive at your designated stop 5 minutes prior to the scheduled pickup time. Always carry your Model Public School Student ID Card.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <a
            href="tel:+919431812345"
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-xs hover:opacity-90 transition inline-flex items-center gap-1.5"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Helpline: +91 94318 12345</span>
          </a>
        </div>
      </div>
    </div>
  );
};
