import React, { useState, useEffect } from 'react';
import {
  Users, Bus, MapPin, DollarSign, Plus, Search, Edit3, Trash2, Phone, Mail,
  ShieldCheck, CheckCircle, XCircle, AlertTriangle, Navigation, Clock,
  CreditCard, FileText, ChevronRight, UserPlus, RefreshCw, Eye, EyeOff, Key,
  Sparkles, Check, Car, UserCheck, Award
} from 'lucide-react';
import { StaffMember, StaffRole, TransportRoute, TransportStop, TransportStudentRosterItem, VehicleLiveLocation, StaffPaymentRecord } from '../../types';
import { api } from '../../lib/api';

export const StaffManagementSystem: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'staff_list' | 'live_fleet' | 'transport_students' | 'routes_stops' | 'payroll'>('staff_list');
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [stops, setStops] = useState<TransportStop[]>([]);
  const [transportStudents, setTransportStudents] = useState<TransportStudentRosterItem[]>([]);
  const [liveLocations, setLiveLocations] = useState<VehicleLiveLocation[]>([]);
  const [payments, setPayments] = useState<StaffPaymentRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [routeFilter, setRouteFilter] = useState<string>('All');
  const [studentSearch, setStudentSearch] = useState('');

  // Modals
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [staffForm, setStaffForm] = useState({
    name: '',
    role: 'Driver' as StaffRole,
    customRoleTitle: '',
    username: '',
    password: '',
    phone: '',
    email: '',
    photo: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    address: 'Sikta, West Champaran, Bihar',
    joiningDate: new Date().toISOString().split('T')[0],
    status: 'Active' as 'Active' | 'Inactive' | 'On Leave',
    vehicleType: 'School Bus',
    vehicleNumber: 'Bus #01',
    numberPlate: 'BR-22-PA-8757',
    drivingLicenseNo: '',
    licenseExpiry: '',
    experienceYears: '5 Years',
    assignedRouteId: '',
    salary: 15000,
    salaryType: 'Monthly' as 'Monthly' | 'Daily' | 'Contract',
    paymentStatus: 'Paid' as 'Paid' | 'Pending',
    emergencyContact: '',
    bankAccountNo: '',
    bankIfsc: '',
    bankName: '',
    notes: ''
  });

  // Payment Record Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payingStaff, setPayingStaff] = useState<StaffMember | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    month: new Date().toISOString().slice(0, 7),
    amount: 15000,
    baseSalary: 15000,
    bonus: 0,
    deductions: 0,
    paymentMethod: 'Bank Transfer' as 'Cash' | 'Bank Transfer' | 'UPI' | 'Cheque',
    remarks: 'Monthly salary disbursement'
  });

  // Route & Stop Modals
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState<TransportRoute | null>(null);
  const [routeForm, setRouteForm] = useState({
    routeName: '',
    routeCode: '',
    vehicleType: 'School Bus' as 'School Bus' | 'Van' | 'Mini Bus' | 'Magic/Auto' | 'Other',
    busNumber: 'Bus #01',
    numberPlate: 'BR-22-PA-8757',
    driverName: '',
    driverPhone: '',
    conductorName: '',
    conductorPhone: '',
    capacity: 40,
    morningDepartureTime: '07:15 AM',
    afternoonDepartureTime: '02:30 PM',
    feeMonthly: 600,
    status: 'Active' as 'Active' | 'Inactive'
  });

  const [showStopModal, setShowStopModal] = useState(false);
  const [stopForm, setStopForm] = useState({
    routeId: '',
    stopName: '',
    stopNumber: 1,
    pickupTime: '07:30 AM',
    dropTime: '02:45 PM',
    landmark: '',
    latitude: 27.0270,
    longitude: 84.6826,
    feeMonthly: 600
  });

  // Assign Student Modal
  const [showAssignStudentModal, setShowAssignStudentModal] = useState(false);
  const [assignForm, setAssignForm] = useState({
    class: '10',
    section: 'A',
    rollNo: '',
    routeId: '',
    stopId: ''
  });

  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [stList, rList, stpList, stdList, locList, payList] = await Promise.all([
        api.getStaff(),
        api.getTransport(),
        api.getTransportStops(),
        api.getTransportStudents(),
        api.getLiveLocations(),
        api.getStaffPayments()
      ]);
      setStaffList(stList || []);
      setRoutes(rList || []);
      setStops(stpList || []);
      setTransportStudents(stdList || []);
      setLiveLocations(locList || []);
      setPayments(payList || []);
    } catch (e) {
      console.error('Failed to load staff management data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
    // Poll live fleet updates every 6 seconds when viewing live fleet
    const interval = setInterval(() => {
      api.getLiveLocations().then(locs => {
        if (locs) setLiveLocations(locs);
      }).catch(() => {});
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const triggerToast = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const handleOpenStaffModal = (staff?: StaffMember) => {
    if (staff) {
      setEditingStaff(staff);
      setStaffForm({
        name: staff.name || '',
        role: (staff.role as StaffRole) || 'Driver',
        customRoleTitle: staff.customRoleTitle || '',
        username: staff.username || '',
        password: '',
        phone: staff.phone || '',
        email: staff.email || '',
        photo: staff.photo || '',
        gender: (staff.gender as 'Male' | 'Female' | 'Other') || 'Male',
        address: staff.address || '',
        joiningDate: staff.joiningDate || new Date().toISOString().split('T')[0],
        status: (staff.status as 'Active' | 'Inactive' | 'On Leave') || 'Active',
        vehicleType: staff.vehicleType || 'School Bus',
        vehicleNumber: staff.vehicleNumber || 'Bus #01',
        numberPlate: staff.numberPlate || '',
        drivingLicenseNo: staff.drivingLicenseNo || '',
        licenseExpiry: staff.licenseExpiry || '',
        experienceYears: String(staff.experienceYears || '5 Years'),
        assignedRouteId: staff.assignedRouteId || '',
        salary: staff.salary || 15000,
        salaryType: (staff.salaryType as 'Monthly' | 'Daily' | 'Contract') || 'Monthly',
        paymentStatus: staff.paymentStatus || 'Paid',
        emergencyContact: staff.emergencyContact || '',
        bankAccountNo: staff.bankDetails?.accountNo || '',
        bankIfsc: staff.bankDetails?.ifsc || '',
        bankName: staff.bankDetails?.bankName || '',
        notes: staff.notes || ''
      });
    } else {
      setEditingStaff(null);
      setStaffForm({
        name: '',
        role: 'Driver',
        customRoleTitle: '',
        username: `staff${Math.floor(100 + Math.random() * 900)}`,
        password: 'staff123',
        phone: '',
        email: '',
        photo: '',
        gender: 'Male',
        address: 'Sikta, West Champaran, Bihar',
        joiningDate: new Date().toISOString().split('T')[0],
        status: 'Active',
        vehicleType: 'School Bus',
        vehicleNumber: 'Bus #01',
        numberPlate: 'BR-22-PA-8757',
        drivingLicenseNo: '',
        licenseExpiry: '',
        experienceYears: '5 Years',
        assignedRouteId: routes[0]?.id || '',
        salary: 15000,
        salaryType: 'Monthly',
        paymentStatus: 'Paid',
        emergencyContact: '',
        bankAccountNo: '',
        bankIfsc: '',
        bankName: '',
        notes: ''
      });
    }
    setShowStaffModal(true);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffForm.name || !staffForm.username) {
      alert('Name and Username are required.');
      return;
    }

    const assignedRoute = routes.find(r => r.id === staffForm.assignedRouteId);

    const payload: Partial<StaffMember> = {
      name: staffForm.name,
      role: staffForm.role,
      customRoleTitle: staffForm.customRoleTitle,
      username: staffForm.username,
      phone: staffForm.phone,
      email: staffForm.email,
      photo: staffForm.photo,
      gender: staffForm.gender,
      address: staffForm.address,
      joiningDate: staffForm.joiningDate,
      status: staffForm.status,
      vehicleType: staffForm.vehicleType as any,
      vehicleNumber: staffForm.vehicleNumber,
      numberPlate: staffForm.numberPlate,
      drivingLicenseNo: staffForm.drivingLicenseNo,
      licenseExpiry: staffForm.licenseExpiry,
      experienceYears: staffForm.experienceYears,
      assignedRouteId: staffForm.assignedRouteId,
      assignedRouteName: assignedRoute?.routeName,
      salary: Number(staffForm.salary) || 0,
      salaryType: staffForm.salaryType as any,
      paymentStatus: staffForm.paymentStatus,
      emergencyContact: staffForm.emergencyContact,
      bankDetails: {
        accountNo: staffForm.bankAccountNo,
        ifsc: staffForm.bankIfsc,
        bankName: staffForm.bankName,
        holderName: staffForm.name
      },
      notes: staffForm.notes
    };

    if (staffForm.password) {
      payload.password = staffForm.password;
    }

    if (editingStaff) {
      await api.updateStaff(editingStaff.id, payload);
      triggerToast(`Staff profile for ${staffForm.name} updated successfully!`);
    } else {
      await api.createStaff(payload);
      triggerToast(`New staff member ${staffForm.name} added successfully!`);
    }

    setShowStaffModal(false);
    loadAllData();
  };

  const handleDeleteStaff = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove staff member "${name}"?`)) {
      await api.deleteStaff(id);
      triggerToast(`Staff member "${name}" removed.`);
      loadAllData();
    }
  };

  const handleOpenPayment = (staff: StaffMember) => {
    setPayingStaff(staff);
    setPaymentForm({
      month: new Date().toISOString().slice(0, 7),
      amount: staff.salary || 15000,
      baseSalary: staff.salary || 15000,
      bonus: 0,
      deductions: 0,
      paymentMethod: 'Bank Transfer',
      remarks: `Monthly salary for ${staff.name} (${staff.role})`
    });
    setShowPaymentModal(true);
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingStaff) return;
    const finalAmount = Number(paymentForm.baseSalary) + Number(paymentForm.bonus) - Number(paymentForm.deductions);
    await api.createStaffPayment(payingStaff.id, {
      month: paymentForm.month,
      paymentDate: new Date().toISOString().split('T')[0],
      amount: finalAmount,
      baseSalary: Number(paymentForm.baseSalary),
      bonus: Number(paymentForm.bonus),
      deductions: Number(paymentForm.deductions),
      paymentMethod: paymentForm.paymentMethod,
      status: 'Paid',
      remarks: paymentForm.remarks
    });
    triggerToast(`Salary payment of ₹${finalAmount.toLocaleString('en-IN')} recorded for ${payingStaff.name}!`);
    setShowPaymentModal(false);
    loadAllData();
  };

  // Filtered staff list
  const filteredStaff = staffList.filter(s => {
    const matchesSearch = s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone?.includes(searchQuery) ||
      s.vehicleNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.numberPlate?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.username?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'All' || s.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalPayrollMonthly = staffList.reduce((acc, s) => acc + (s.salary || 0), 0);
  const totalDrivers = staffList.filter(s => s.role === 'Driver').length;
  const activeTripsCount = liveLocations.filter(l => l.isActive).length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {actionSuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-200" />
          <span className="font-semibold text-sm">{actionSuccess}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-700">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Staff & Transport Control Center
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Comprehensive management for bus drivers, cleaners, security guards, live GPS vehicle tracking, and payroll.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={loadAllData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700/60 rounded-xl hover:bg-slate-200 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => handleOpenStaffModal()}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-md shadow-blue-500/20 transition"
            >
              <UserPlus className="w-4 h-4" />
              Add Staff Member
            </button>
          </div>
        </div>

        {/* Quick KPI stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-slate-700/70">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Staff</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{staffList.length}</p>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">All active roles</span>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Bus Drivers & Fleet</p>
            <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{totalDrivers}</p>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{routes.length} Active Routes</span>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Live Trips Now</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-3 h-3 rounded-full ${activeTripsCount > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              <p className="text-2xl font-black text-slate-900 dark:text-white">{activeTripsCount}</p>
            </div>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Transmitting GPS</span>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Monthly Payroll</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">₹{totalPayrollMonthly.toLocaleString('en-IN')}</p>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Staff Salary</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/70">
          {[
            { id: 'staff_list', label: 'Staff Directory', icon: Users, count: staffList.length },
            { id: 'live_fleet', label: 'Live GPS Fleet Map', icon: Navigation, count: activeTripsCount, pulse: activeTripsCount > 0 },
            { id: 'transport_students', label: 'Transport Students', icon: UserCheck, count: transportStudents.length },
            { id: 'routes_stops', label: 'Routes & Stops', icon: MapPin, count: routes.length },
            { id: 'payroll', label: 'Payroll & Salaries', icon: DollarSign, count: payments.length }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300'
                  } ${tab.pulse ? 'animate-pulse bg-emerald-500 text-white' : ''}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: STAFF DIRECTORY */}
      {activeTab === 'staff_list' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200/80 dark:border-slate-700 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search staff name, vehicle #, phone..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <span className="text-xs font-semibold text-slate-500 uppercase">Role:</span>
              {['All', 'Driver', 'Bus Conductor', 'Cleaner', 'Security Guard', 'Peon', 'Custom'].map(r => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    roleFilter === r
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Staff Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredStaff.map(staff => (
              <div
                key={staff.id}
                className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex-shrink-0">
                        {staff.photo ? (
                          <img src={staff.photo} alt={staff.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-slate-500 text-lg">
                            {staff.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition">
                          {staff.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            staff.role === 'Driver'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                              : staff.role === 'Bus Conductor'
                              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                          }`}>
                            {staff.customRoleTitle || staff.role}
                          </span>
                          <span className={`w-2 h-2 rounded-full ${staff.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenStaffModal(staff)}
                        title="Edit Staff Member"
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteStaff(staff.id, staff.name)}
                        title="Delete Staff Member"
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-700 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-700/60">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Key className="w-3.5 h-3.5" /> Username:
                      </span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{staff.username}</span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-700/60">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" /> Phone:
                      </span>
                      <a href={`tel:${staff.phone}`} className="font-medium hover:underline text-blue-600 dark:text-blue-400">
                        {staff.phone || 'N/A'}
                      </a>
                    </div>

                    {staff.role === 'Driver' && (
                      <>
                        <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-700/60">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Bus className="w-3.5 h-3.5" /> Vehicle:
                          </span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {staff.vehicleNumber} ({staff.vehicleType})
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-700/60">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Car className="w-3.5 h-3.5" /> Plate No:
                          </span>
                          <span className="font-mono font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 px-2 py-0.5 rounded">
                            {staff.numberPlate || 'Not Assigned'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-700/60">
                          <span className="text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" /> Route:
                          </span>
                          <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[170px]">
                            {staff.assignedRouteName || 'Main Campus Route'}
                          </span>
                        </div>
                      </>
                    )}

                    <div className="flex items-center justify-between py-1">
                      <span className="text-slate-400 flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5" /> Salary:
                      </span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{(staff.salary || 0).toLocaleString('en-IN')}/{staff.salaryType || 'Month'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    staff.paymentStatus === 'Paid'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                  }`}>
                    {staff.paymentStatus === 'Paid' ? 'Salary Paid' : 'Payment Due'}
                  </span>

                  <button
                    onClick={() => handleOpenPayment(staff)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-semibold transition"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    Pay Salary
                  </button>
                </div>
              </div>
            ))}

            {filteredStaff.length === 0 && (
              <div className="col-span-full text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-base font-bold text-slate-700 dark:text-slate-300">No staff members found</p>
                <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or add a new staff member.</p>
                <button
                  onClick={() => handleOpenStaffModal()}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl"
                >
                  <UserPlus className="w-4 h-4" /> Add Staff Member
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: LIVE FLEET GPS TRACKING */}
      {activeTab === 'live_fleet' && (
        <div className="space-y-5">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-blue-600" />
                  Live School Vehicle GPS Fleet Radar
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Real-time GPS tracking stream received directly from drivers' smart portals. Auto-refreshes every 6 seconds.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  Live Tracking Sync Active
                </span>
              </div>
            </div>

            {/* Vehicle Radar Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {routes.map(r => {
                const live = liveLocations.find(l => l.routeId === r.id);
                const assignedDriver = staffList.find(s => s.id === r.driverId || s.name === r.driverName);
                const isLive = !!live?.isActive;

                return (
                  <div
                    key={r.id}
                    className={`p-5 rounded-2xl border transition ${
                      isLive
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 shadow-lg shadow-emerald-500/5'
                        : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 rounded">
                            {r.routeCode || r.busNumber}
                          </span>
                          <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                            isLive
                              ? 'bg-emerald-600 text-white animate-pulse'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}>
                            {isLive ? 'ON TRIP • GPS ACTIVE' : 'IDLE / COMPLETED'}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1.5">
                          {r.routeName}
                        </h4>
                        <p className="text-xs text-slate-500">
                          {r.vehicleType} • Number Plate: <strong className="text-slate-800 dark:text-slate-200">{r.numberPlate || r.vehicleNo}</strong>
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-2xl font-black text-slate-900 dark:text-white">
                          {isLive ? `${live?.speed || 0}` : '0'}
                        </span>
                        <span className="text-xs text-slate-400 block font-medium">km/h Speed</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-200/70 dark:border-slate-700/70 text-xs">
                      <div>
                        <span className="text-slate-400 block">Driver:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {live?.driverName || r.driverName || 'Vikram Singh'}
                        </span>
                        <a href={`tel:${live?.driverPhone || r.driverPhone}`} className="text-blue-600 block mt-0.5 hover:underline font-medium">
                          {live?.driverPhone || r.driverPhone || '+91 91620 24642'}
                        </a>
                      </div>

                      <div>
                        <span className="text-slate-400 block">Current Trip Status:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {isLive ? (live?.tripType || 'Active Run') : 'Standby at Depot'}
                        </span>
                        <span className="text-slate-500 block mt-0.5">
                          Students Onboard: <strong>{live?.studentsBoardedCount || 0}</strong>
                        </span>
                      </div>
                    </div>

                    {isLive && (
                      <div className="mt-3 p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-semibold">
                          <MapPin className="w-3.5 h-3.5" /> Next Scheduled Stop:
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-100">
                          {live?.nextStopName || r.stops?.[0] || 'Parsa High School Mod'}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Live GPS Fleet Telemetry & Google Maps Stream */}
            <div className="p-5 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                    🛰️ Live GPS Vehicle Telemetry & Satellite Radar
                  </span>
                  <span className="text-xs text-slate-400">
                    Real satellite fixes from driver mobile portals & vehicle tracking units
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-emerald-400 font-mono bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded-full">
                    GPS Fix: High Accuracy (±5m)
                  </span>
                  <a
                    href="https://www.google.com/maps/dir/?api=1&destination=27.0180,84.6725"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 px-3 py-1 rounded-lg transition"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Open Campus in Google Maps</span>
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
                {liveLocations.map(l => (
                  <div key={l.routeId} className="p-3 bg-slate-800/90 rounded-xl border border-slate-700 space-y-2">
                    <div className="flex items-center justify-between text-blue-400 font-bold">
                      <span>{l.vehicleNumber} ({l.numberPlate})</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        (l.speed || 0) > 0 ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-700 text-slate-300'
                      }`}>
                        {(l.speed || 0) > 0 ? `${l.speed} km/h • Cruising` : 'Stopped (0 km/h)'}
                      </span>
                    </div>
                    <div className="text-slate-300 flex items-center justify-between">
                      <span>Lat: {l.latitude.toFixed(4)}°, Lng: {l.longitude.toFixed(4)}°</span>
                      <span className="text-amber-400 font-bold">Heading: {l.heading || 0}°</span>
                    </div>
                    <div className="text-slate-400 text-[11px] flex items-center justify-between">
                      <span>Next Stop: {l.nextStopName || 'Campus Depot'}</span>
                      <span>{new Date(l.lastUpdated).toLocaleTimeString()}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between gap-2">
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${l.latitude},${l.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-sans font-bold"
                      >
                        <Navigation className="w-3 h-3" /> Track on Google Maps
                      </a>
                      {l.driverPhone && (
                        <a href={`tel:${l.driverPhone}`} className="text-xs text-emerald-400 hover:underline font-sans">
                          📞 Call Driver
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Admin Google Maps Live Stream Embed */}
              <div className="h-64 rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950 relative">
                <iframe
                  src={
                    liveLocations.find(l => l.isActive)
                      ? `https://maps.google.com/maps?q=${liveLocations.find(l => l.isActive)?.latitude},${liveLocations.find(l => l.isActive)?.longitude}&t=m&z=15&output=embed`
                      : `https://maps.google.com/maps?q=27.0180,84.6725+(Model+Public+School+Campus+Depot)&t=m&z=15&output=embed`
                  }
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen={false}
                  loading="lazy"
                  title="Admin Fleet Live GPS Stream"
                  className="w-full h-full filter contrast-[1.02]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TRANSPORT STUDENTS DIRECTORY */}
      {activeTab === 'transport_students' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200/80 dark:border-slate-700 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)}
                placeholder="Search student name, roll no, stop..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={() => {
                  setAssignForm({ class: '10', section: 'A', rollNo: '', routeId: routes[0]?.id || '', stopId: stops[0]?.id || '' });
                  setShowAssignStudentModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition"
              >
                <Plus className="w-4 h-4" /> Assign Student to Bus
              </button>
            </div>
          </div>

          {/* Transportation Students Table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-xs uppercase font-bold text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-4">Student & Class</th>
                    <th className="px-5 py-4">Roll No.</th>
                    <th className="px-5 py-4">Assigned Route</th>
                    <th className="px-5 py-4">Boarding Stop</th>
                    <th className="px-5 py-4">Timings (Pick/Drop)</th>
                    <th className="px-5 py-4">Parent Phone</th>
                    <th className="px-5 py-4">Monthly Fee</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {transportStudents
                    .filter(s =>
                      s.studentName?.toLowerCase().includes(studentSearch.toLowerCase()) ||
                      s.rollNo?.includes(studentSearch) ||
                      s.stopName?.toLowerCase().includes(studentSearch.toLowerCase()) ||
                      s.routeName?.toLowerCase().includes(studentSearch.toLowerCase())
                    )
                    .map(st => (
                      <tr key={st.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-750 transition">
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-900 dark:text-white">{st.studentName}</div>
                          <div className="text-xs text-slate-400">Class {st.class}-{st.section}</div>
                        </td>
                        <td className="px-5 py-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                          {st.rollNo}
                        </td>
                        <td className="px-5 py-4 font-semibold text-blue-600 dark:text-blue-400">
                          {st.routeName}
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-rose-500" />
                            {st.stopName}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-600 dark:text-slate-300">
                          <div className="flex items-center gap-1 font-medium">
                            <Clock className="w-3 h-3 text-slate-400" />
                            Pick: {st.pickupTime || '07:15 AM'}
                          </div>
                          <div className="text-slate-400">Drop: {st.dropTime || '02:45 PM'}</div>
                        </td>
                        <td className="px-5 py-4">
                          <a href={`tel:${st.phone}`} className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600">
                            {st.phone || '+91 91620 00000'}
                          </a>
                        </td>
                        <td className="px-5 py-4 font-bold text-emerald-600 dark:text-emerald-400">
                          ₹{st.feeMonthly || 600}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={async () => {
                              if (window.confirm(`Remove ${st.studentName} from school transport roster?`)) {
                                await api.removeTransportStudent(st.studentId);
                                triggerToast(`${st.studentName} removed from transport roster.`);
                                loadAllData();
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-700 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}

                  {transportStudents.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-slate-400 text-xs font-semibold">
                        No transportation students assigned yet. Click "Assign Student to Bus" above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ROUTES & STOPS CONFIGURATION */}
      {activeTab === 'routes_stops' && (
        <div className="space-y-6">
          {/* Routes Section */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Active Transport Routes</h3>
                <p className="text-xs text-slate-500">Configure vehicles, number plates, drivers, and monthly fares.</p>
              </div>
              <button
                onClick={() => {
                  setEditingRoute(null);
                  setRouteForm({
                    routeName: '',
                    routeCode: `RT-${Math.floor(10 + Math.random() * 90)}`,
                    vehicleType: 'School Bus',
                    busNumber: 'Bus #01',
                    numberPlate: 'BR-22-PA-',
                    driverName: '',
                    driverPhone: '',
                    conductorName: '',
                    conductorPhone: '',
                    capacity: 40,
                    morningDepartureTime: '07:15 AM',
                    afternoonDepartureTime: '02:30 PM',
                    feeMonthly: 600,
                    status: 'Active'
                  });
                  setShowRouteModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition"
              >
                <Plus className="w-4 h-4" /> Add Route
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {routes.map(r => (
                <div key={r.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 rounded">
                        {r.routeCode || r.busNumber}
                      </span>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">{r.routeName}</h4>
                      <p className="text-xs text-slate-500">{r.vehicleType} • Plate: <strong>{r.numberPlate || r.vehicleNo}</strong></p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingRoute(r);
                          setRouteForm({
                            routeName: r.routeName,
                            routeCode: r.routeCode || '',
                            vehicleType: r.vehicleType || 'School Bus',
                            busNumber: r.busNumber || '',
                            numberPlate: r.numberPlate || r.vehicleNo || '',
                            driverName: r.driverName || '',
                            driverPhone: r.driverPhone || '',
                            conductorName: r.conductorName || '',
                            conductorPhone: r.conductorPhone || '',
                            capacity: r.capacity || 40,
                            morningDepartureTime: r.morningDepartureTime || '07:15 AM',
                            afternoonDepartureTime: r.afternoonDepartureTime || '02:30 PM',
                            feeMonthly: r.feeMonthly || 600,
                            status: (r.status as any) || 'Active'
                          });
                          setShowRouteModal(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          if (window.confirm(`Delete route "${r.routeName}"?`)) {
                            await api.deleteTransport(r.id);
                            triggerToast(`Route deleted.`);
                            loadAllData();
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700/60 text-xs space-y-1 text-slate-600 dark:text-slate-300">
                    <div>Driver: <strong>{r.driverName || 'Not Assigned'}</strong> ({r.driverPhone || 'No Phone'})</div>
                    <div>Capacity: <strong>{r.capacity || 35} Seats</strong> • Monthly Fee: <strong className="text-emerald-600">₹{r.feeMonthly || 600}</strong></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stops List */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Route Stops & Geolocation Points</h3>
                <p className="text-xs text-slate-500">Pick-up and drop locations mapped with student assignments.</p>
              </div>
              <button
                onClick={() => {
                  setStopForm({
                    routeId: routes[0]?.id || 'tr-1',
                    stopName: '',
                    stopNumber: stops.length + 1,
                    pickupTime: '07:30 AM',
                    dropTime: '02:45 PM',
                    landmark: '',
                    latitude: 27.0270,
                    longitude: 84.6826,
                    feeMonthly: 600
                  });
                  setShowStopModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition"
              >
                <Plus className="w-4 h-4" /> Add Stop
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stops.map(st => {
                const matchedRoute = routes.find(r => r.id === st.routeId);
                return (
                  <div key={st.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                          {st.stopNumber}
                        </span>
                        <button
                          onClick={async () => {
                            if (window.confirm(`Delete stop "${st.stopName}"?`)) {
                              await api.deleteTransportStop(st.id);
                              triggerToast(`Stop deleted.`);
                              loadAllData();
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h4 className="text-base font-bold text-slate-900 dark:text-white mt-2 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-rose-500" />
                        {st.stopName}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">{st.landmark || matchedRoute?.routeName}</p>

                      <div className="mt-3 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                        <div>Pickup: <strong>{st.pickupTime}</strong> • Drop: <strong>{st.dropTime}</strong></div>
                        <div>Assigned Students: <strong className="text-blue-600">{st.studentCount || (st.assignedStudentIds || []).length} Students</strong></div>
                        <div className="font-mono text-slate-400">Coords: {st.latitude.toFixed(4)}, {st.longitude.toFixed(4)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PAYROLL & SALARIES */}
      {activeTab === 'payroll' && (
        <div className="space-y-5">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Staff Payroll & Salary Ledger</h3>
            <p className="text-xs text-slate-500 mb-6">Payment history, vouchers, and disbursement receipts for all staff members.</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-xs uppercase font-bold text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Voucher No.</th>
                    <th className="px-5 py-4">Month</th>
                    <th className="px-5 py-4">Payment Date</th>
                    <th className="px-5 py-4">Amount Disbursed</th>
                    <th className="px-5 py-4">Payment Mode</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Processed By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {payments.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-750 transition">
                      <td className="px-5 py-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {p.receiptNo}
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-800 dark:text-slate-200">
                        {p.month}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500">
                        {p.paymentDate}
                      </td>
                      <td className="px-5 py-4 font-black text-emerald-600 dark:text-emerald-400 text-base">
                        ₹{p.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {p.paymentMethod}
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 rounded-full text-xs font-bold">
                          {p.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500">
                        {p.processedBy || 'System Administrator'}
                      </td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-xs text-slate-400 font-semibold">
                        No salary disbursements logged yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT STAFF */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                {editingStaff ? 'Edit Staff Profile' : 'Add New Staff Member'}
              </h3>
              <button
                onClick={() => setShowStaffModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="space-y-4 mt-4 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={staffForm.name}
                    onChange={e => setStaffForm({ ...staffForm, name: e.target.value })}
                    placeholder="e.g. Vikram Singh"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                    Staff Role *
                  </label>
                  <select
                    value={staffForm.role}
                    onChange={e => setStaffForm({ ...staffForm, role: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Driver">Bus / Van Driver</option>
                    <option value="Bus Conductor">Bus Conductor</option>
                    <option value="Cleaner">Cleaner / Housekeeping</option>
                    <option value="Security Guard">Security Guard</option>
                    <option value="Peon">Peon / Attendant</option>
                    <option value="Custom">Custom Role</option>
                  </select>
                </div>
              </div>

              {staffForm.role === 'Custom' && (
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                    Custom Role Title *
                  </label>
                  <input
                    type="text"
                    value={staffForm.customRoleTitle}
                    onChange={e => setStaffForm({ ...staffForm, customRoleTitle: e.target.value })}
                    placeholder="e.g. Campus Electrician, Lab Assistant"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* Login Credentials */}
              <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl border border-blue-200/60 dark:border-blue-800/40 space-y-3">
                <h4 className="text-xs font-black uppercase text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                  <Key className="w-4 h-4" /> Portal Login Credentials
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Staff Username *
                    </label>
                    <input
                      type="text"
                      required
                      value={staffForm.username}
                      onChange={e => setStaffForm({ ...staffForm, username: e.target.value })}
                      placeholder="e.g. driver1"
                      className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      {editingStaff ? 'New Password (leave blank to keep current)' : 'Login Password *'}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={staffForm.password}
                        onChange={e => setStaffForm({ ...staffForm, password: e.target.value })}
                        placeholder={editingStaff ? '••••••••' : 'e.g. driver123'}
                        className="w-full px-3.5 py-2 pr-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Driver & Transport Specifics */}
              {staffForm.role === 'Driver' && (
                <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl border border-amber-200/60 dark:border-amber-800/40 space-y-3">
                  <h4 className="text-xs font-black uppercase text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    <Bus className="w-4 h-4" /> Vehicle & Driving License Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Vehicle Type
                      </label>
                      <select
                        value={staffForm.vehicleType}
                        onChange={e => setStaffForm({ ...staffForm, vehicleType: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                      >
                        <option value="School Bus">School Bus (40+ Seats)</option>
                        <option value="Mini Bus">Mini Bus (25 Seats)</option>
                        <option value="Van">School Van / Winger (18 Seats)</option>
                        <option value="Auto / Magic">Auto / Magic (8 Seats)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Vehicle Number
                      </label>
                      <input
                        type="text"
                        value={staffForm.vehicleNumber}
                        onChange={e => setStaffForm({ ...staffForm, vehicleNumber: e.target.value })}
                        placeholder="e.g. Bus #01"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Number Plate *
                      </label>
                      <input
                        type="text"
                        value={staffForm.numberPlate}
                        onChange={e => setStaffForm({ ...staffForm, numberPlate: e.target.value })}
                        placeholder="e.g. BR-22-PA-8757"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Driving License No.
                      </label>
                      <input
                        type="text"
                        value={staffForm.drivingLicenseNo}
                        onChange={e => setStaffForm({ ...staffForm, drivingLicenseNo: e.target.value })}
                        placeholder="e.g. DL-BR22-201800451"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Assigned Bus Route
                      </label>
                      <select
                        value={staffForm.assignedRouteId}
                        onChange={e => setStaffForm({ ...staffForm, assignedRouteId: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                      >
                        <option value="">-- Choose Route --</option>
                        {routes.map(r => (
                          <option key={r.id} value={r.id}>{r.routeName}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Contact & Personal Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={staffForm.phone}
                    onChange={e => setStaffForm({ ...staffForm, phone: e.target.value })}
                    placeholder="e.g. 9162024642"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                    Monthly Salary (₹)
                  </label>
                  <input
                    type="number"
                    value={staffForm.salary}
                    onChange={e => setStaffForm({ ...staffForm, salary: Number(e.target.value) })}
                    placeholder="e.g. 16500"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={staffForm.address}
                    onChange={e => setStaffForm({ ...staffForm, address: e.target.value })}
                    placeholder="e.g. Bhawanipur, Sikta"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                    Photo URL
                  </label>
                  <input
                    type="url"
                    value={staffForm.photo}
                    onChange={e => setStaffForm({ ...staffForm, photo: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Bank Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Bank Account No.
                  </label>
                  <input
                    type="text"
                    value={staffForm.bankAccountNo}
                    onChange={e => setStaffForm({ ...staffForm, bankAccountNo: e.target.value })}
                    placeholder="e.g. 309827162534"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    value={staffForm.bankIfsc}
                    onChange={e => setStaffForm({ ...staffForm, bankIfsc: e.target.value })}
                    placeholder="e.g. SBIN0002981"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={staffForm.bankName}
                    onChange={e => setStaffForm({ ...staffForm, bankName: e.target.value })}
                    placeholder="e.g. SBI Sikta"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowStaffModal(false)}
                  className="px-4 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20"
                >
                  {editingStaff ? 'Save Changes' : 'Create Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RECORD SALARY PAYMENT */}
      {showPaymentModal && payingStaff && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                Record Salary Payment
              </h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs space-y-1">
              <div>Staff Member: <strong className="text-slate-900 dark:text-white">{payingStaff.name}</strong></div>
              <div>Role: <strong>{payingStaff.customRoleTitle || payingStaff.role}</strong></div>
              <div>Base Salary: <strong className="text-emerald-600">₹{(payingStaff.salary || 0).toLocaleString('en-IN')}</strong></div>
            </div>

            <form onSubmit={handleSavePayment} className="space-y-3 mt-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Salary Month *
                </label>
                <input
                  type="month"
                  required
                  value={paymentForm.month}
                  onChange={e => setPaymentForm({ ...paymentForm, month: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Bonus / Extra (₹)
                  </label>
                  <input
                    type="number"
                    value={paymentForm.bonus}
                    onChange={e => setPaymentForm({ ...paymentForm, bonus: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Deductions (₹)
                  </label>
                  <input
                    type="number"
                    value={paymentForm.deductions}
                    onChange={e => setPaymentForm({ ...paymentForm, deductions: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Payment Mode *
                </label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={e => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                >
                  <option value="Bank Transfer">Bank Transfer (NEFT / IMPS)</option>
                  <option value="UPI">UPI / Google Pay / PhonePe</option>
                  <option value="Cash">Cash at School Counter</option>
                  <option value="Cheque">Bank Cheque</option>
                </select>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-900 dark:text-emerald-300">Total Net Disbursed:</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  ₹{(Number(paymentForm.baseSalary) + Number(paymentForm.bonus) - Number(paymentForm.deductions)).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700"
                >
                  Confirm & Disburse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ASSIGN TRANSPORT STUDENT */}
      {showAssignStudentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Bus className="w-5 h-5 text-blue-600" />
                Assign Student to Bus Route
              </h3>
              <button onClick={() => setShowAssignStudentModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form
              onSubmit={async e => {
                e.preventDefault();
                if (!assignForm.rollNo) {
                  alert('Please enter Roll Number');
                  return;
                }
                const selectedRoute = routes.find(r => r.id === assignForm.routeId);
                const selectedStop = stops.find(s => s.id === assignForm.stopId);

                const res = await api.addTransportStudent({
                  class: assignForm.class,
                  section: assignForm.section,
                  rollNo: assignForm.rollNo,
                  routeId: assignForm.routeId,
                  routeName: selectedRoute?.routeName,
                  stopId: assignForm.stopId,
                  stopName: selectedStop?.stopName,
                  pickupTime: selectedStop?.pickupTime,
                  dropTime: selectedStop?.dropTime
                });

                if (res && res.error) {
                  alert(res.error);
                } else {
                  triggerToast(`Student Roll ${assignForm.rollNo} (Class ${assignForm.class}-${assignForm.section}) assigned to transport!`);
                  setShowAssignStudentModal(false);
                  loadAllData();
                }
              }}
              className="space-y-3 mt-4 text-sm"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Class *
                  </label>
                  <select
                    value={assignForm.class}
                    onChange={e => setAssignForm({ ...assignForm, class: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    {['Playgroup', 'Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map(c => (
                      <option key={c} value={c}>Class {c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Section
                  </label>
                  <select
                    value={assignForm.section}
                    onChange={e => setAssignForm({ ...assignForm, section: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    {['A', 'B', 'C'].map(s => (
                      <option key={s} value={s}>Section {s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Roll Number *
                </label>
                <input
                  type="text"
                  required
                  value={assignForm.rollNo}
                  onChange={e => setAssignForm({ ...assignForm, rollNo: e.target.value })}
                  placeholder="e.g. 1001"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Select Transport Route *
                </label>
                <select
                  value={assignForm.routeId}
                  onChange={e => setAssignForm({ ...assignForm, routeId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                >
                  {routes.map(r => (
                    <option key={r.id} value={r.id}>{r.routeName} ({r.busNumber})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Select Boarding Stop *
                </label>
                <select
                  value={assignForm.stopId}
                  onChange={e => setAssignForm({ ...assignForm, stopId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                >
                  {stops.map(st => (
                    <option key={st.id} value={st.id}>{st.stopName} (Pick: {st.pickupTime})</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowAssignStudentModal(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700"
                >
                  Assign Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT ROUTE */}
      {showRouteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Bus className="w-5 h-5 text-blue-600" />
                {editingRoute ? 'Edit Route' : 'Add Transport Route'}
              </h3>
              <button onClick={() => setShowRouteModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form
              onSubmit={async e => {
                e.preventDefault();
                if (editingRoute) {
                  await api.updateTransport(editingRoute.id, routeForm);
                  triggerToast(`Route updated successfully!`);
                } else {
                  await api.createTransport(routeForm);
                  triggerToast(`New route created successfully!`);
                }
                setShowRouteModal(false);
                loadAllData();
              }}
              className="space-y-3 mt-4 text-sm"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Route Name *
                </label>
                <input
                  type="text"
                  required
                  value={routeForm.routeName}
                  onChange={e => setRouteForm({ ...routeForm, routeName: e.target.value })}
                  placeholder="e.g. Route A - Sikta Main Market to School"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Vehicle Type
                  </label>
                  <select
                    value={routeForm.vehicleType}
                    onChange={e => setRouteForm({ ...routeForm, vehicleType: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  >
                    <option value="School Bus">School Bus</option>
                    <option value="Van">Van / Winger</option>
                    <option value="Mini Bus">Mini Bus</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Number Plate *
                  </label>
                  <input
                    type="text"
                    required
                    value={routeForm.numberPlate}
                    onChange={e => setRouteForm({ ...routeForm, numberPlate: e.target.value })}
                    placeholder="e.g. BR-22-PA-8757"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Driver Name
                  </label>
                  <input
                    type="text"
                    value={routeForm.driverName}
                    onChange={e => setRouteForm({ ...routeForm, driverName: e.target.value })}
                    placeholder="e.g. Vikram Singh"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Driver Phone
                  </label>
                  <input
                    type="tel"
                    value={routeForm.driverPhone}
                    onChange={e => setRouteForm({ ...routeForm, driverPhone: e.target.value })}
                    placeholder="e.g. 9162024642"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Monthly Fare (₹)
                  </label>
                  <input
                    type="number"
                    value={routeForm.feeMonthly}
                    onChange={e => setRouteForm({ ...routeForm, feeMonthly: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Seating Capacity
                  </label>
                  <input
                    type="number"
                    value={routeForm.capacity}
                    onChange={e => setRouteForm({ ...routeForm, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowRouteModal(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700"
                >
                  Save Route
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD STOP */}
      {showStopModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-rose-500" />
                Add Route Stop
              </h3>
              <button onClick={() => setShowStopModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form
              onSubmit={async e => {
                e.preventDefault();
                await api.createTransportStop(stopForm);
                triggerToast(`Stop "${stopForm.stopName}" added successfully!`);
                setShowStopModal(false);
                loadAllData();
              }}
              className="space-y-3 mt-4 text-sm"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Route *
                </label>
                <select
                  value={stopForm.routeId}
                  onChange={e => setStopForm({ ...stopForm, routeId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                >
                  {routes.map(r => (
                    <option key={r.id} value={r.id}>{r.routeName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Stop Name *
                </label>
                <input
                  type="text"
                  required
                  value={stopForm.stopName}
                  onChange={e => setStopForm({ ...stopForm, stopName: e.target.value })}
                  placeholder="e.g. Sikta Railway Station"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Morning Pickup
                  </label>
                  <input
                    type="text"
                    value={stopForm.pickupTime}
                    onChange={e => setStopForm({ ...stopForm, pickupTime: e.target.value })}
                    placeholder="07:15 AM"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Afternoon Drop
                  </label>
                  <input
                    type="text"
                    value={stopForm.dropTime}
                    onChange={e => setStopForm({ ...stopForm, dropTime: e.target.value })}
                    placeholder="02:45 PM"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Landmark
                </label>
                <input
                  type="text"
                  value={stopForm.landmark}
                  onChange={e => setStopForm({ ...stopForm, landmark: e.target.value })}
                  placeholder="e.g. Opposite Main Chowk Temple"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowStopModal(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700"
                >
                  Add Stop
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagementSystem;
