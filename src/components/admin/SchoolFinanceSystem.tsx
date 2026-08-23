import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import { useSupabaseRealtimeRefresh } from '../../hooks/useSupabaseRealtimeRefresh';
import {
  Student, Teacher, SiteSettings, FeeParticularMaster, FeeDiscount, TaxSlab,
  AdvanceFeeRecord, FeeReceiptTemplate, FeeReceiptRecord, FinancialTransaction,
  StaffPayroll, FeeAlertLog, FeeItem
} from '../../types';
import { OfficialFeeReceipt, numberToWords } from '../common/OfficialFeeReceipt';
import { downloadElementAsPDF } from '../../lib/pdf';
import {
  DollarSign, TrendingUp, TrendingDown, Clock, ShieldCheck, Download, Plus, Trash2,
  Edit3, Search, Filter, Calendar, FileText, Send, CheckCircle2, AlertTriangle, Users,
  Building, RefreshCw, Layers, Percent, Settings, Award, ArrowUpRight, ArrowDownRight,
  Printer, Check, X, Bell, Landmark, Shield, CreditCard, ChevronRight, BarChart3, PieChart as PieIcon, Truck, Building2
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, CartesianGrid
} from 'recharts';

const ALL_ACADEMIC_MONTHS = [
  'April, 2026', 'May, 2026', 'June, 2026', 'July, 2026',
  'August, 2026', 'September, 2026', 'October, 2026', 'November, 2026',
  'December, 2026', 'January, 2027', 'February, 2027', 'March, 2027'
];

interface SchoolFinanceSystemProps {
  students: Student[];
  teachers: Teacher[];
  settings?: SiteSettings | null;
  onUpdateStudent?: (student: Student) => void;
  onUpdateSettings?: (settings: SiteSettings) => void;
}

export const SchoolFinanceSystem: React.FC<SchoolFinanceSystemProps> = ({
  students,
  teachers,
  settings,
  onUpdateStudent,
  onUpdateSettings
}) => {
  // Navigation Sub-Tabs
  type SubTab =
    | 'overview'
    | 'fee_register'
    | 'class_fee_structure'
    | 'fee_setup'
    | 'receipt_designer'
    | 'ledger'
    | 'payroll'
    | 'due_alerts'
    | 'reports';

  const [activeTab, setActiveTab] = useState<SubTab>('overview');
  const [overviewChartMode, setOverviewChartMode] = useState<'collection' | 'heads' | 'ratio' | 'cashflow'>('collection');

  // Master Class Fee Structure State
  const [classFeeMatrix, setClassFeeMatrix] = useState<{
    classGroup: string;
    admissionFee: number;
    monthlyTuition: number;
    annualCharges: number;
    examFee: number;
    transportFee: number;
    hostelFee: number;
  }[]>([
    { classGroup: 'Nursery - UKG', admissionFee: 2500, monthlyTuition: 800, annualCharges: 1500, examFee: 500, transportFee: 600, hostelFee: 3500 },
    { classGroup: 'Class 1 - 5', admissionFee: 3000, monthlyTuition: 1000, annualCharges: 2000, examFee: 600, transportFee: 750, hostelFee: 4000 },
    { classGroup: 'Class 6 - 8', admissionFee: 3500, monthlyTuition: 1200, annualCharges: 2500, examFee: 800, transportFee: 850, hostelFee: 4500 },
    { classGroup: 'Class 9 - 10', admissionFee: 4000, monthlyTuition: 1500, annualCharges: 3000, examFee: 1000, transportFee: 1000, hostelFee: 5000 },
    { classGroup: 'Class 11 - 12 (Sci / Comm / Arts)', admissionFee: 5000, monthlyTuition: 1800, annualCharges: 3500, examFee: 1200, transportFee: 1200, hostelFee: 5500 }
  ]);
  const [feeSaveMsg, setFeeSaveMsg] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Staff Salary State
  const [staffSalaries, setStaffSalaries] = useState<{ [teacherId: string]: number }>({});
  const [staffSaveMsg, setStaffSaveMsg] = useState('');

  // WhatsApp Alert & Reminder States
  const [previewStudentForWhatsApp, setPreviewStudentForWhatsApp] = useState<Student | null>(null);
  const [customWhatsAppMsg, setCustomWhatsAppMsg] = useState('');
  const [dueAlertFilterClass, setDueAlertFilterClass] = useState('All');
  const [dueAlertSearch, setDueAlertSearch] = useState('');
  const [copiedMsg, setCopiedMsg] = useState(false);

  useEffect(() => {
    if (teachers && teachers.length > 0) {
      const initialSalaries: { [id: string]: number } = {};
      teachers.forEach(t => {
        initialSalaries[t.id] = t.salary || 30000;
      });
      setStaffSalaries(initialSalaries);
    }
  }, [teachers]);

  // ==================== INITIAL DATA STATES ====================

  // 1. Fee Particular Masters
  const [particulars, setParticulars] = useState<FeeParticularMaster[]>([
    { id: 'p1', name: 'Tuition Fee (Monthly)', code: 'TUF-01', defaultAmount: 1100, category: 'Tuition', applicableCourse: 'All', taxRate: 0, description: 'Standard monthly academic tuition fee' },
    { id: 'p2', name: 'Admission & Prospectus Fee', code: 'ADM-01', defaultAmount: 3500, category: 'General', applicableCourse: 'Nursery to 12', taxRate: 0, description: 'One-time admission charge' },
    { id: 'p3', name: 'Transport Bus Facility Fee', code: 'TRN-01', defaultAmount: 750, category: 'Transport', applicableCourse: 'Transport Enrolled', taxSlabId: 'tax1', taxRate: 0, description: 'Monthly bus pickup and drop facility' },
    { id: 'p4', name: 'Hostel Lodging & Mess Fee', code: 'HST-01', defaultAmount: 5000, category: 'Hostel', applicableCourse: 'Hostel Enrolled', taxSlabId: 'tax1', taxRate: 0, description: 'Monthly accommodation & dining charges' },
    { id: 'p5', name: 'Term Examination Fee', code: 'EXM-01', defaultAmount: 600, category: 'Exam', applicableCourse: 'All', taxRate: 0, description: 'Semi-annual examination and evaluation fee' },
    { id: 'p6', name: 'Smart Computer Lab & Facilities', code: 'FAC-01', defaultAmount: 400, category: 'Facility', applicableCourse: 'Class 6 to 12', taxSlabId: 'tax2', taxRate: 0, description: 'Digital lab access & internet charges' },
    { id: 'p7', name: 'Late Payment Fine', code: 'FIN-01', defaultAmount: 100, category: 'Fine', applicableCourse: 'All', taxRate: 0, description: 'Fine charged post 15th of month' }
  ]);

  // 2. Discount Concession Masters
  const [discounts, setDiscounts] = useState<FeeDiscount[]>([
    { id: 'd1', name: 'Merit Academic Scholarship', code: 'MERIT-25', type: 'Percentage', value: 25, description: '25% tuition fee waiver for top rankers', applicableTo: 'Merit' },
    { id: 'd2', name: 'Sibling Concession', code: 'SIB-1000', type: 'Fixed', value: 1000, description: 'Flat ₹1000 monthly discount for second child', applicableTo: 'Sibling' },
    { id: 'd3', name: 'MPS Staff Ward Waiver', code: 'STAFF-50', type: 'Percentage', value: 50, description: '50% fee concession for children of institute employees', applicableTo: 'All' },
    { id: 'd4', name: 'Need-Based Financial Assistance', code: 'EWS-100', type: 'Percentage', value: 100, description: '100% full fee waiver under RTE / EWS quota', applicableTo: 'Need-Based' }
  ]);

  // 3. Advance Fee Records
  const [advanceRecords, setAdvanceRecords] = useState<AdvanceFeeRecord[]>([
    { id: 'adv1', studentId: 'st1', studentName: 'Aarav Kumar', rollNo: '01', class: '10', amount: 3000, advanceDate: '2026-07-10', paymentMode: 'UPI', receiptNo: 'MPS-ADV-101', purpose: 'Transport Advance Q2', adjustedAmount: 1500, remainingBalance: 1500, status: 'Active' },
    { id: 'adv2', studentId: 'st3', studentName: 'Rohan Sharma', rollNo: '03', class: '10', amount: 5000, advanceDate: '2026-06-15', paymentMode: 'Cash', receiptNo: 'MPS-ADV-102', purpose: 'Academic Session Advance', adjustedAmount: 5000, remainingBalance: 0, status: 'Fully Adjusted' }
  ]);

  // 4. Receipt Template Config
  const [receiptTemplate, setReceiptTemplate] = useState<FeeReceiptTemplate>({
    id: 'tmpl1',
    templateName: 'Official MPS Sikta Standard Voucher',
    headerTitle: settings?.school_name || 'MODEL PUBLIC SCHOOL',
    headerSubtitle: 'Affiliated to CBSE, New Delhi | UDISE: 10011301103',
    addressText: settings?.contact_address || 'Bhawanipur, Kursi Barwa, Sikta, West Champaran, Bihar - 845307',
    contactPhones: settings?.contact_phone || 'Ph: +91 8757968130, Email: contact@modelpublicschool.com',
    footerNotes: 'Note :: 1. Please deposit fees before 15th of every month to avoid fine. 2. Keep receipt for all future records.',
    udiseCode: settings?.udise_code || '10011301103',
    affiliationText: 'CBSE Affiliation No: 330854 | School Code: 65821',
    showLogo: true,
    primaryColor: '#1e3a8a',
    authorizedSignatoryTitle: 'Accounts Officer / Principal'
  });

  // 5. Fee Receipts Log
  const [receipts, setReceipts] = useState<FeeReceiptRecord[]>([
    {
      id: 'rec-101',
      receiptNo: 'MPS-REC-2026-01',
      payerType: 'Student',
      payerName: 'Aarav Kumar',
      payerRef: 'Roll No 01',
      classOrRole: 'Class 10-A',
      date: '2026-08-01',
      monthOrPeriod: 'August, 2026',
      items: [
        { particularName: 'Tuition Fee (August)', amount: 1100, discount: 0, tax: 0, net: 1100 },
        { particularName: 'Transport Bus Facility', amount: 750, discount: 0, tax: 0, net: 750 }
      ],
      totalAmount: 1850,
      totalDiscount: 0,
      totalTax: 0,
      netPaid: 1850,
      duesRemaining: 0,
      paymentMode: 'UPI',
      transactionRef: 'UPI/9841230491',
      accountantName: 'Sandeep Kumar'
    },
    {
      id: 'rec-102',
      receiptNo: 'MPS-REC-2026-02',
      payerType: 'Student',
      payerName: 'Priya Verma',
      payerRef: 'Roll No 02',
      classOrRole: 'Class 10-A',
      date: '2026-08-03',
      monthOrPeriod: 'August, 2026',
      items: [
        { particularName: 'Tuition Fee (August)', amount: 1100, discount: 275, tax: 0, net: 825 },
        { particularName: 'Hostel Lodging & Mess Fee', amount: 5000, discount: 0, tax: 0, net: 5000 }
      ],
      totalAmount: 6100,
      totalDiscount: 275,
      totalTax: 0,
      netPaid: 5825,
      duesRemaining: 0,
      paymentMode: 'Bank Transfer',
      transactionRef: 'NEFT/MBK8492019',
      accountantName: 'Sandeep Kumar'
    }
  ]);

  // 6. Income & Expense Ledger Transactions
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([
    { id: 'tx1', type: 'Income', category: 'Tuition Fee Collection', amount: 148500, date: '2026-08-01', paymentMode: 'UPI', payerOrPayee: 'Student Monthly Fees', description: 'Batch August fee collections', accountGroup: 'General Fund', createdBy: 'Accounts Officer' },
    { id: 'tx2', type: 'Expense', category: 'Staff Salary', amount: 285000, date: '2026-08-02', paymentMode: 'Bank Transfer', payerOrPayee: 'Faculty & Support Staff', description: 'July Month Payroll Disbursement', accountGroup: 'General Fund', createdBy: 'Principal Office' },
    { id: 'tx3', type: 'Expense', category: 'Utilities & Electricity', amount: 24500, date: '2026-08-03', paymentMode: 'Bank Transfer', payerOrPayee: 'North Bihar Power Distribution', description: 'Main Campus Monthly Power Bill', accountGroup: 'General Fund', createdBy: 'Estate Mgr' },
    { id: 'tx4', type: 'Expense', category: 'Bus Fuel & Maintenance', amount: 38000, date: '2026-08-04', paymentMode: 'Card', payerOrPayee: 'Indian Oil Sikta Fuel Station', description: 'Diesel refuel for School Fleet Buses 1-4', accountGroup: 'Transport Account', createdBy: 'Transport Incharge' }
  ]);

  // 7. Staff Payroll Slips
  const [payrolls, setPayrolls] = useState<StaffPayroll[]>([
    { id: 'pay1', staffId: 'T01', staffName: 'Anand Sharma', role: 'Senior Physics Teacher', department: 'Science', month: 'August 2026', basicSalary: 35000, allowances: 7000, grossSalary: 42000, tdsTaxDeduction: 0, pfDeduction: 1800, otherDeductions: 0, netSalary: 38100, paymentDate: '2026-08-02', paymentMode: 'Bank Transfer', status: 'Paid', salarySlipNo: 'MPS-SAL-2026-01' },
    { id: 'pay2', staffId: 'T02', staffName: 'Sunita Devi', role: 'Mathematics Teacher', department: 'Mathematics', month: 'August 2026', basicSalary: 32000, allowances: 6400, grossSalary: 38400, tdsTaxDeduction: 0, pfDeduction: 1800, otherDeductions: 0, netSalary: 34680, paymentDate: '2026-08-02', paymentMode: 'Bank Transfer', status: 'Paid', salarySlipNo: 'MPS-SAL-2026-02' }
  ]);

  // 8. Fee Due Reminders Log
  const [alertLogs, setAlertLogs] = useState<FeeAlertLog[]>([
    { id: 'alt1', studentId: 'st2', studentName: 'Priya Verma', class: '10', phone: '+91 9876543210', amountDue: 3500, dueDate: '2026-08-15', alertType: 'WhatsApp', sentAt: '2026-08-05 10:30 AM', status: 'Delivered', messageText: 'Dear Parent, gentle reminder that fee of ₹3500 for August 2026 is due on 15-Aug-2026. Pay online at MPS portal.' }
  ]);

  // 9. Teacher Salary Paid / Pending Tracking State
  const [teacherSalaries, setTeacherSalaries] = useState<Record<string, { status: 'Paid' | 'Pending'; paidDate?: string; amount: number; month: string }>>({
    'T01': { status: 'Paid', paidDate: '2026-08-02', amount: 38100, month: 'August 2026' },
    'T02': { status: 'Paid', paidDate: '2026-08-02', amount: 34680, month: 'August 2026' },
    'T03': { status: 'Pending', amount: 26500, month: 'August 2026' },
    'T04': { status: 'Pending', amount: 30000, month: 'August 2026' }
  });

  const loadFinanceData = useCallback(() => {
    api.getFinanceData().then(data => {
      if (!data) return;
      if (data.feeReceipts && data.feeReceipts.length > 0) {
        setReceipts(prev => {
          const ids = new Set(data.feeReceipts.map(r => r.id));
          const rest = prev.filter(p => !ids.has(p.id));
          return [...data.feeReceipts, ...rest];
        });
      }
      if (data.transactions && data.transactions.length > 0) {
        setTransactions(prev => {
          const ids = new Set(data.transactions.map(t => t.id));
          const rest = prev.filter(p => !ids.has(p.id));
          return [...data.transactions, ...rest];
        });
      }
      if (data.teacherSalaries && Object.keys(data.teacherSalaries).length > 0) {
        setTeacherSalaries(prev => ({ ...prev, ...data.teacherSalaries }));
      }
      if (data.feeParticulars && data.feeParticulars.length > 0) {
        setParticulars(data.feeParticulars);
      }
      if (data.feeDiscounts && data.feeDiscounts.length > 0) {
        setDiscounts(data.feeDiscounts);
      }
      if (data.advanceRecords && data.advanceRecords.length > 0) {
        setAdvanceRecords(data.advanceRecords);
      }
    }).catch(e => console.warn('Failed to load finance data:', e));
  }, []);

  // Global Realtime Refresh hook for fee_records & teachers
  const { refreshCount } = useSupabaseRealtimeRefresh(
    ['public:fee_records', 'public:teachers', 'public:students'],
    useCallback((event) => {
      console.log(`[SchoolFinanceSystem] Realtime broadcast on ${event.topic} received -> refreshing finance records`);
      loadFinanceData();
    }, [loadFinanceData])
  );

  // Load persistent finance data on mount & realtime updates
  useEffect(() => {
    loadFinanceData();
  }, [loadFinanceData, refreshCount]);

  const toggleTeacherSalaryStatus = async (teacherId: string, defaultAmount: number = 30000) => {
    const current = teacherSalaries[teacherId] || { status: 'Pending' as const, amount: defaultAmount, month: 'August 2026' };
    const newStatus: 'Paid' | 'Pending' = current.status === 'Paid' ? 'Pending' : 'Paid';
    const updated: Record<string, { status: 'Paid' | 'Pending'; paidDate?: string; amount: number; month: string }> = {
      ...teacherSalaries,
      [teacherId]: {
        ...current,
        status: newStatus,
        paidDate: newStatus === 'Paid' ? new Date().toISOString().split('T')[0] : undefined
      }
    };
    setTeacherSalaries(updated);
    try {
      await api.updateTeacherSalaries(updated);
    } catch (err) {
      console.error('Error saving teacher salary status:', err);
    }
  };

  const totalPaidTeachersCount = (Object.values(teacherSalaries) as Array<{ status: 'Paid' | 'Pending' }>).filter(s => s.status === 'Paid').length;
  const totalPendingTeachersCount = (Object.values(teacherSalaries) as Array<{ status: 'Paid' | 'Pending' }>).filter(s => s.status === 'Pending').length;

  // ==================== INTERACTIVE MODALS & FORM STATES ====================

  // Fee Particular Modal
  const [showParticularModal, setShowParticularModal] = useState(false);
  const [newParticular, setNewParticular] = useState<Partial<FeeParticularMaster>>({
    name: '', code: '', defaultAmount: 1000, category: 'General', applicableCourse: 'All', taxRate: 0, description: ''
  });

  // Discount Modal
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [newDiscount, setNewDiscount] = useState<Partial<FeeDiscount>>({
    name: '', code: '', type: 'Percentage', value: 10, description: '', applicableTo: 'All'
  });

  // Transaction Ledger Modal
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [newTx, setNewTx] = useState<Partial<FinancialTransaction>>({
    type: 'Expense', category: 'Utilities & Electricity', amount: 5000, date: new Date().toISOString().split('T')[0],
    paymentMode: 'Bank Transfer', payerOrPayee: '', description: '', accountGroup: 'General Fund', createdBy: 'Admin'
  });

  // Student Fee Collection Modal States
  const [selectedStudentForPay, setSelectedStudentForPay] = useState<Student | null>(null);
  const [paySelectedMonths, setPaySelectedMonths] = useState<string[]>(['August, 2026']);
  const [payTuitionAmount, setPayTuitionAmount] = useState<number>(1100);
  const [payTuitionFree, setPayTuitionFree] = useState<boolean>(false);

  const [payAnnualFee, setPayAnnualFee] = useState<boolean>(false);
  const [payAnnualAmount, setPayAnnualAmount] = useState<number>(2500);
  const [payAnnualFree, setPayAnnualFree] = useState<boolean>(false);

  const [payExamFee, setPayExamFee] = useState<boolean>(false);
  const [payExamAmount, setPayExamAmount] = useState<number>(1200);
  const [payExamFree, setPayExamFree] = useState<boolean>(false);

  const [payAdmissionFee, setPayAdmissionFee] = useState<boolean>(false);
  const [payAdmissionAmount, setPayAdmissionAmount] = useState<number>(3000);
  const [payAdmissionFree, setPayAdmissionFree] = useState<boolean>(false);

  const [payHostelFee, setPayHostelFee] = useState<boolean>(false);
  const [payHostelAmount, setPayHostelAmount] = useState<number>(4500);
  const [payHostelFree, setPayHostelFree] = useState<boolean>(false);

  const [payTransportFee, setPayTransportFee] = useState<boolean>(false);
  const [payTransportAmount, setPayTransportAmount] = useState<number>(1500);
  const [payTransportFree, setPayTransportFree] = useState<boolean>(false);

  const [payConcessionDiscount, setPayConcessionDiscount] = useState<number>(0);
  const [payMode, setPayMode] = useState<'Cash' | 'UPI' | 'Card' | 'Bank Transfer' | 'Cheque'>('Cash');
  const [payTxnRef, setPayTxnRef] = useState('');

  // Staff Salary Modal
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [selectedSalarySlip, setSelectedSalarySlip] = useState<StaffPayroll | null>(null);

  // Selected Fee Receipt Modal Preview
  const [activeReceiptForModal, setActiveReceiptForModal] = useState<FeeReceiptRecord | null>(null);

  // Filters for Fee Register
  const [feeSearchQuery, setFeeSearchQuery] = useState('');
  const [feeClassFilter, setFeeClassFilter] = useState('All');
  const [feeStatusFilter, setFeeStatusFilter] = useState('All');

  // Categories for Income & Expense
  const [customCategories, setCustomCategories] = useState<string[]>([
    'Tuition Fee Collection', 'Staff Salary', 'Bus Fuel & Maintenance', 'Utilities & Electricity',
    'Lab Equipment & IT', 'Event & Sports Budget', 'Building Maintenance'
  ]);

  // ==================== COMPUTED FINANCIAL TOTALS ====================

  const totalFeeCollected = receipts.reduce((acc, r) => acc + (r.isRefunded ? 0 : r.netPaid), 0);
  const totalExpenses = transactions.filter(t => t.type === 'Expense').reduce((acc, t) => acc + t.amount, 0);
  const totalOtherIncome = transactions.filter(t => t.type === 'Income').reduce((acc, t) => acc + t.amount, 0);
  const totalPendingDues = students.reduce((acc, s) => acc + (s.feeInfo?.pending || 0), 0);
  const netOperatingMargin = (totalFeeCollected + totalOtherIncome) - totalExpenses;

  // Chart Data Collections
  const collectionTrendData = [
    { month: 'Apr', collected: 210000, target: 250000 },
    { month: 'May', collected: 245000, target: 250000 },
    { month: 'Jun', collected: 198000, target: 250000 },
    { month: 'Jul', collected: 285000, target: 250000 },
    { month: 'Aug', collected: 312000, target: 250000 },
    { month: 'Sep', collected: 235000, target: 250000 }
  ];

  const feeHeadBreakdownData = [
    { name: 'Tuition Fee', amount: 850000, fill: '#3b82f6' },
    { name: 'Transport Bus', amount: 220000, fill: '#10b981' },
    { name: 'Hostel Lodging', amount: 180000, fill: '#f59e0b' },
    { name: 'Computer & Lab', amount: 110000, fill: '#6366f1' },
    { name: 'Exam & Misc', amount: 125000, fill: '#8b5cf6' }
  ];

  const paidPendingRatioData = [
    { name: 'Collected (Paid)', value: totalFeeCollected || 1485000, fill: '#10b981' },
    { name: 'Outstanding (Pending)', value: totalPendingDues || 342000, fill: '#f43f5e' },
    { name: 'Concessions / Waivers', value: 85000, fill: '#3b82f6' }
  ];

  const cashFlowData = [
    { month: 'Apr', income: 240000, expense: 120000 },
    { month: 'May', income: 260000, expense: 135000 },
    { month: 'Jun', income: 210000, expense: 110000 },
    { month: 'Jul', income: 290000, expense: 145000 },
    { month: 'Aug', income: 330000, expense: 160000 },
    { month: 'Sep', income: 250000, expense: 130000 }
  ];

  // Handler: Open Student Fee Collection Modal
  const handleOpenCollectFee = (st: Student) => {
    setSelectedStudentForPay(st);
    const tuitionMonthly = Math.round((st.feeInfo?.totalAnnual || 13200) / 12);
    setPayTuitionAmount(tuitionMonthly);
    setPayTuitionFree(false);
    setPaySelectedMonths(['August, 2026']);

    const isAnnualPaid = st.feeInfo?.annualFeeStatus === 'Paid' || st.feeInfo?.annualFeeStatus === 'Exempt';
    setPayAnnualFee(!isAnnualPaid);
    setPayAnnualAmount(st.feeInfo?.annualFeeAmount || 2500);
    setPayAnnualFree(st.feeInfo?.annualFeeStatus === 'Exempt');

    const isExamPaid = st.feeInfo?.examFeeStatus === 'Paid' || st.feeInfo?.examFeeStatus === 'Exempt';
    setPayExamFee(!isExamPaid);
    setPayExamAmount(st.feeInfo?.examFeeAmount || 1200);
    setPayExamFree(st.feeInfo?.examFeeStatus === 'Exempt');

    const isAdmissionPaid = st.feeInfo?.admissionFeeStatus === 'Paid' || st.feeInfo?.admissionFeeStatus === 'Exempt';
    setPayAdmissionFee(!isAdmissionPaid && (st.feeInfo?.admissionFeeAmount || 0) > 0);
    setPayAdmissionAmount(st.feeInfo?.admissionFeeAmount || 3000);
    setPayAdmissionFree(st.feeInfo?.admissionFeeStatus === 'Exempt');

    const isHostelEnabled = st.addons?.hostel?.enabled || false;
    setPayHostelFee(isHostelEnabled && st.feeInfo?.hostelFeeStatus !== 'Paid');
    setPayHostelAmount(st.addons?.hostel?.amount || 4500);
    setPayHostelFree(st.feeInfo?.hostelFeeStatus === 'Exempt');

    const isTransportEnabled = st.addons?.transportation?.enabled || false;
    setPayTransportFee(isTransportEnabled && st.feeInfo?.transportFeeStatus !== 'Paid');
    setPayTransportAmount(st.addons?.transportation?.amount || 1500);
    setPayTransportFree(st.feeInfo?.transportFeeStatus === 'Exempt');

    setPayConcessionDiscount(0);
    setPayTxnRef('');
  };

  // Confirm Fee Payment
  const handleConfirmFeePayment = () => {
    if (!selectedStudentForPay) return;

    const receiptItems: { particularName: string; amount: number; discount: number; tax: number; net: number }[] = [];

    // 1. Monthly Tuition
    if (paySelectedMonths.length > 0) {
      const tuitionTotal = payTuitionFree ? 0 : payTuitionAmount * paySelectedMonths.length;
      receiptItems.push({
        particularName: `Tuition Fee (${paySelectedMonths.join(', ')})`,
        amount: tuitionTotal,
        discount: 0,
        tax: 0,
        net: tuitionTotal
      });
    }

    // 2. Annual Fee
    if (payAnnualFee) {
      const amt = payAnnualFree ? 0 : payAnnualAmount;
      receiptItems.push({
        particularName: `Annual Charges ${payAnnualFree ? '(Free / Waived)' : ''}`,
        amount: amt,
        discount: 0,
        tax: 0,
        net: amt
      });
    }

    // 3. Exam Fee
    if (payExamFee) {
      const amt = payExamFree ? 0 : payExamAmount;
      receiptItems.push({
        particularName: `Term Examination Fee ${payExamFree ? '(Free / Waived)' : ''}`,
        amount: amt,
        discount: 0,
        tax: 0,
        net: amt
      });
    }

    // 4. Admission Fee
    if (payAdmissionFee) {
      const amt = payAdmissionFree ? 0 : payAdmissionAmount;
      receiptItems.push({
        particularName: `Admission Fee ${payAdmissionFree ? '(Free / Waived)' : ''}`,
        amount: amt,
        discount: 0,
        tax: 0,
        net: amt
      });
    }

    // 5. Hostel Fee
    if (payHostelFee) {
      const amt = payHostelFree ? 0 : payHostelAmount;
      receiptItems.push({
        particularName: `Hostel Facility Fee ${payHostelFree ? '(Free / Waived)' : ''}`,
        amount: amt,
        discount: 0,
        tax: 0,
        net: amt
      });
    }

    // 6. Transport Fee
    if (payTransportFee) {
      const amt = payTransportFree ? 0 : payTransportAmount;
      receiptItems.push({
        particularName: `Transportation Bus Fee ${payTransportFree ? '(Free / Waived)' : ''}`,
        amount: amt,
        discount: 0,
        tax: 0,
        net: amt
      });
    }

    const subTotal = receiptItems.reduce((acc, i) => acc + i.amount, 0);
    const net = Math.max(0, subTotal - payConcessionDiscount);

    const recNo = `MPS-REC-2026-${(receipts.length + 1).toString().padStart(2, '0')}`;
    const periodDesc = paySelectedMonths.join(', ') || 'Installment';

    const newRec: FeeReceiptRecord = {
      id: `rec-${Date.now()}`,
      receiptNo: recNo,
      payerType: 'Student',
      payerName: selectedStudentForPay.name,
      payerRef: `Roll No ${selectedStudentForPay.rollNo}`,
      classOrRole: `Class ${selectedStudentForPay.class}-${selectedStudentForPay.section}`,
      date: new Date().toISOString().split('T')[0],
      monthOrPeriod: periodDesc,
      items: receiptItems,
      totalAmount: subTotal,
      totalDiscount: payConcessionDiscount,
      totalTax: 0,
      netPaid: net,
      duesRemaining: Math.max(0, (selectedStudentForPay.feeInfo?.pending || 0) - net),
      paymentMode: payMode,
      transactionRef: payTxnRef || `${payMode}/MPS-${Date.now().toString().slice(-6)}`,
      accountantName: 'Sandeep (Accounts Counter)'
    };

    setReceipts([newRec, ...receipts]);

    const incomeEntry: FinancialTransaction = {
      id: `tx-${Date.now()}`,
      type: 'Income',
      category: 'Tuition Fee Collection',
      amount: net,
      date: new Date().toISOString().split('T')[0],
      paymentMode: payMode,
      referenceNo: recNo,
      payerOrPayee: selectedStudentForPay.name,
      description: `Fee Receipt ${recNo} for ${periodDesc}`,
      accountGroup: 'General Fund',
      createdBy: 'Accounts Counter'
    };
    setTransactions([incomeEntry, ...transactions]);

    api.saveFeeReceipt(newRec).catch(e => console.error(e));
    api.saveTransaction(incomeEntry).catch(e => console.error(e));

    if (onUpdateStudent) {
      const existingMonths = selectedStudentForPay.feeInfo?.months || [];
      const updatedMonths = [...existingMonths];

      paySelectedMonths.forEach(sm => {
        const smShort = sm.split(',')[0].trim().toLowerCase();
        const idx = updatedMonths.findIndex(m => m.month.toLowerCase().includes(smShort));
        if (idx >= 0) {
          updatedMonths[idx] = { ...updatedMonths[idx], status: 'Paid', paidDate: new Date().toISOString().split('T')[0] };
        } else {
          updatedMonths.push({ month: sm, status: 'Paid', amount: payTuitionAmount, paidDate: new Date().toISOString().split('T')[0] });
        }
      });

      const updatedInfo = {
        ...selectedStudentForPay.feeInfo,
        annualFeeStatus: payAnnualFee ? (payAnnualFree ? ('Exempt' as const) : ('Paid' as const)) : (selectedStudentForPay.feeInfo?.annualFeeStatus || 'Unpaid'),
        examFeeStatus: payExamFee ? (payExamFree ? ('Exempt' as const) : ('Paid' as const)) : (selectedStudentForPay.feeInfo?.examFeeStatus || 'Unpaid'),
        admissionFeeStatus: payAdmissionFee ? (payAdmissionFree ? ('Exempt' as const) : ('Paid' as const)) : (selectedStudentForPay.feeInfo?.admissionFeeStatus || 'Unpaid'),
        hostelFeeStatus: payHostelFee ? (payHostelFree ? ('Exempt' as const) : ('Paid' as const)) : (selectedStudentForPay.feeInfo?.hostelFeeStatus || 'Unpaid'),
        transportFeeStatus: payTransportFee ? (payTransportFree ? ('Exempt' as const) : ('Paid' as const)) : (selectedStudentForPay.feeInfo?.transportFeeStatus || 'Unpaid'),
        paid: (selectedStudentForPay.feeInfo?.paid || 0) + net,
        pending: Math.max(0, (selectedStudentForPay.feeInfo?.pending || 0) - net),
        months: updatedMonths
      };
      const updatedStudent = { ...selectedStudentForPay, feeInfo: updatedInfo };
      onUpdateStudent(updatedStudent);
      api.updateStudent(updatedStudent.id, updatedStudent).catch(e => console.error(e));
    }

    setActiveReceiptForModal(newRec);
    setSelectedStudentForPay(null);
  };

  // Helper to format WhatsApp phone number (strip spaces/dashes, ensure Indian country code 91 if 10 digits)
  const formatWhatsAppNumber = (phoneStr?: string) => {
    if (!phoneStr) return '918757968130';
    let digits = phoneStr.replace(/\D/g, '');
    if (digits.length === 10) {
      digits = '91' + digits;
    }
    return digits;
  };

  // Helper to generate structured official WhatsApp fee reminder text
  const generateFeeDueWhatsAppText = (st: Student) => {
    const schoolName = settings?.school_name || 'Model Public School';
    const dueAmount = st.feeInfo?.pending || 3500;
    const dueDate = '15th ' + new Date().toLocaleString('en-US', { month: 'short' }) + ', ' + new Date().getFullYear();
    const helpline = settings?.phones || '+91 87579 68130';
    
    return `🏫 *${schoolName.toUpperCase()} (MPS SIKTA)*\n` +
      `📢 *FEE DUE NOTIFICATION & GENTLE REMINDER*\n\n` +
      `Dear Parent / Guardian,\n` +
      `This is a gentle reminder regarding the pending academic fee for your ward:\n\n` +
      `👤 *Student Name:* ${st.name}\n` +
      `🎓 *Class & Section:* Class ${st.class}-${st.section || 'A'}\n` +
      `🔢 *Roll Number:* ${st.rollNo || 'N/A'}\n` +
      `💰 *Pending Amount Due:* ₹${dueAmount.toLocaleString('en-IN')}\n` +
      `📅 *Due Date:* ${dueDate}\n\n` +
      `Kindly deposit the outstanding amount at the school accounts desk or via online portal at your earliest convenience to ensure uninterrupted academic sessions.\n\n` +
      `📞 *Accounts Helpline:* ${helpline}\n` +
      `📍 *Campus:* Bhawanipur, Sikta, West Champaran (Bihar - 845307)\n` +
      `_Thank you for your cooperation!_`;
  };

  // Open Preview Modal before sending
  const handleOpenWhatsAppPreview = (st: Student) => {
    setPreviewStudentForWhatsApp(st);
    setCustomWhatsAppMsg(generateFeeDueWhatsAppText(st));
    setCopiedMsg(false);
  };

  // Send Parent Fee Due Alert via WhatsApp Web / App
  const handleSendParentAlert = (st: Student, customText?: string) => {
    const phone = formatWhatsAppNumber(st.phone);
    const text = customText || generateFeeDueWhatsAppText(st);
    const encodedText = encodeURIComponent(text);
    const whatsappUrl = `https://wa.me/${phone}?text=${encodedText}`;

    // Open WhatsApp Web or Mobile Client
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

    const newLog: FeeAlertLog = {
      id: `alt-${Date.now()}`,
      studentId: st.id,
      studentName: st.name,
      class: `${st.class}-${st.section || 'A'}`,
      phone: st.phone || '+91 8757968130',
      amountDue: st.feeInfo?.pending || 3500,
      dueDate: '15th ' + new Date().toLocaleString('en-US', { month: 'short' }),
      alertType: 'WhatsApp',
      sentAt: new Date().toLocaleString(),
      status: 'Delivered',
      messageText: text
    };
    setAlertLogs([newLog, ...alertLogs]);
    setSaveSuccessMsg(`WhatsApp reminder dispatched for ${st.name} (${st.phone || '+91 8757968130'})!`);
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100 font-sans">
      {/* Top Header Banner - Clean & Modern */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] border border-indigo-200 dark:border-indigo-800">
              Institutional Finance ERP
            </span>
            <span className="text-xs text-slate-500">Model Public School (MPS Sikta)</span>
          </div>
          <h2 className="text-2xl font-bold font-heading text-slate-900 dark:text-white mt-1 flex items-center gap-2.5">
            <Landmark className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            School Fee & Financial Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Simplified student fee collection, master fee heads, daily income/expense ledger, teacher salary payment status, and parent fee reminders.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setActiveTab('fee_register')}
            className="flex-1 md:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all"
          >
            <DollarSign className="w-4 h-4" /> Collect Student Fee
          </button>
          <button
            onClick={() => setShowTransactionModal(true)}
            className="flex-1 md:flex-none px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4 text-indigo-500" /> Record Entry
          </button>
        </div>
      </div>

      {/* Sub Navigation Bar - Clean Minimal Tabs */}
      <div className="flex overflow-x-auto gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 no-scrollbar">
        {[
          { id: 'overview', label: 'Dashboard & Analytics', icon: BarChart3 },
          { id: 'fee_register', label: 'Student Fees & Counter', icon: DollarSign },
          { id: 'class_fee_structure', label: 'Class Fee Matrix & Salaries', icon: Settings },
          { id: 'fee_setup', label: 'Fee Particulars & Concessions', icon: Layers },
          { id: 'receipt_designer', label: 'Receipt Customizer', icon: Printer },
          { id: 'ledger', label: 'Income & Expense Ledger', icon: CreditCard },
          { id: 'payroll', label: 'Teacher Salary Status', icon: Users },
          { id: 'due_alerts', label: 'Parent Fee Reminders', icon: Bell },
          { id: 'reports', label: 'Financial Reports', icon: FileText }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SubTab)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold text-xs whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ==================== SUB TAB 1: OVERVIEW & INTERACTIVE CHARTS ==================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top Key Financial Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-center text-slate-500 text-xs font-bold uppercase">
                <span>Total Fee Collected</span>
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl text-emerald-600">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2 font-heading">
                ₹{totalFeeCollected.toLocaleString()}
              </div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" /> +12.4% collected this term
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-center text-slate-500 text-xs font-bold uppercase">
                <span>Outstanding Dues</span>
                <div className="p-2 bg-rose-50 dark:bg-rose-950/60 rounded-xl text-rose-600">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-2 font-heading">
                ₹{totalPendingDues.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-1">
                Pending across {students.filter(s => (s.feeInfo?.pending || 0) > 0).length} students
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-center text-slate-500 text-xs font-bold uppercase">
                <span>Total Expenses</span>
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl text-indigo-600">
                  <TrendingDown className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2 font-heading">
                ₹{totalExpenses.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-1">
                Faculty salaries & operational fuel
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-center text-slate-500 text-xs font-bold uppercase">
                <span>Net Operating Margin</span>
                <div className="p-2 bg-amber-50 dark:bg-amber-950/60 rounded-xl text-amber-600">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-2 font-heading">
                ₹{netOperatingMargin.toLocaleString()}
              </div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                Healthy reserve balance
              </div>
            </div>
          </div>

          {/* Interactive Visual Financial Charts */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Financial Performance & Collection Charts
                </h3>
                <p className="text-xs text-slate-500">
                  Switch between chart views for deeper institutional insights
                </p>
              </div>

              {/* Chart Switcher Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-medium">
                <button
                  onClick={() => setOverviewChartMode('collection')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    overviewChartMode === 'collection'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Monthly Collection
                </button>
                <button
                  onClick={() => setOverviewChartMode('heads')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    overviewChartMode === 'heads'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Fee Head Breakdown
                </button>
                <button
                  onClick={() => setOverviewChartMode('ratio')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    overviewChartMode === 'ratio'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Paid vs Dues
                </button>
                <button
                  onClick={() => setOverviewChartMode('cashflow')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    overviewChartMode === 'cashflow'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Income vs Expense
                </button>
              </div>
            </div>

            {/* Recharts Container */}
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                {overviewChartMode === 'collection' ? (
                  <AreaChart data={collectionTrendData}>
                    <defs>
                      <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
                    <Tooltip formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Amount']} />
                    <Legend />
                    <Area type="monotone" dataKey="collected" name="Fee Collected (₹)" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCollected)" />
                  </AreaChart>
                ) : overviewChartMode === 'heads' ? (
                  <BarChart data={feeHeadBreakdownData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
                    <Tooltip formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Total Revenue']} />
                    <Bar dataKey="amount" name="Revenue by Particular (₹)" radius={[6, 6, 0, 0]}>
                      {feeHeadBreakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                ) : overviewChartMode === 'ratio' ? (
                  <PieChart>
                    <Pie
                      data={paidPendingRatioData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {paidPendingRatioData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Total']} />
                    <Legend />
                  </PieChart>
                ) : (
                  <BarChart data={cashFlowData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
                    <Tooltip formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Amount']} />
                    <Legend />
                    <Bar dataKey="income" name="Income (₹)" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Expenses (₹)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Teacher Salary Summary & Recent Receipts Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Teacher Salary Status Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white font-heading flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-500" /> Faculty Teacher Salary Tracker
                  </h4>
                  <p className="text-xs text-slate-500">Monthly salary disbursement status</p>
                </div>
                <button
                  onClick={() => setActiveTab('payroll')}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Manage Salaries →
                </button>
              </div>

              <div className="space-y-2 text-xs">
                {(teachers.length > 0 ? teachers : [
                  { id: 'T01', name: 'Anand Sharma', subject: 'Physics' },
                  { id: 'T02', name: 'Sunita Devi', subject: 'Mathematics' },
                  { id: 'T03', name: 'Rajesh Mishra', subject: 'Sports / PE' },
                  { id: 'T04', name: 'Meenakshi Verma', subject: 'Chemistry' }
                ]).map(t => {
                  const sal = teacherSalaries[t.id] || { status: 'Pending', amount: 30000 };
                  const isPaid = sal.status === 'Paid';

                  return (
                    <div key={t.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">{t.name}</span>
                        <span className="text-[11px] text-slate-500">{t.subject} Faculty</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">₹{sal.amount}</span>
                        <button
                          onClick={() => toggleTeacherSalaryStatus(t.id, sal.amount)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                            isPaid
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                              : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                          }`}
                        >
                          {isPaid ? '✓ Paid' : '⏳ Pending'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Paid Fee Receipts Log */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white font-heading flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-500" /> Recent Issued Fee Receipts
                  </h4>
                  <p className="text-xs text-slate-500">Latest completed student fee transactions</p>
                </div>
                <button
                  onClick={() => setActiveTab('fee_register')}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  View All Counter →
                </button>
              </div>

              <div className="space-y-2 text-xs">
                {receipts.slice(0, 4).map(r => (
                  <div key={r.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">{r.payerName} ({r.classOrRole})</span>
                      <span className="text-[11px] text-slate-500">{r.receiptNo} • {r.paymentMode} ({r.date})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">₹{r.netPaid}</span>
                      <button
                        onClick={() => setActiveReceiptForModal(r)}
                        className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100"
                        title="View Official Fee Receipt"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SUB TAB 2: STUDENT FEE REGISTER & COUNTER ==================== */}
      {activeTab === 'fee_register' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-heading flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" /> Class-wise Student Fee Counter
                </h3>
                <p className="text-xs text-slate-500">Collect monthly fees, apply concessions, and issue official paid receipts</p>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search student name or roll number..."
                  value={feeSearchQuery}
                  onChange={e => setFeeSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Class:</span>
                <select
                  value={feeClassFilter}
                  onChange={e => setFeeClassFilter(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                >
                  <option value="All">All Classes</option>
                  <option value="10">Class 10</option>
                  <option value="9">Class 9</option>
                  <option value="8">Class 8</option>
                  <option value="7">Class 7</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Fee Status:</span>
                <select
                  value={feeStatusFilter}
                  onChange={e => setFeeStatusFilter(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                >
                  <option value="All">All Statuses</option>
                  <option value="Paid">All Clear (Paid)</option>
                  <option value="Pending">Dues Pending</option>
                </select>
              </div>
            </div>

            {/* Students Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold uppercase text-[11px]">
                  <tr>
                    <th className="p-3.5">Roll & Name</th>
                    <th className="p-3.5">Class & Sec</th>
                    <th className="p-3.5">Parent Contact</th>
                    <th className="p-3.5">Annual Fee</th>
                    <th className="p-3.5">Total Paid</th>
                    <th className="p-3.5">Pending Dues</th>
                    <th className="p-3.5">Fee Status</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                  {students
                    .filter(st => {
                      const matchesSearch = st.name.toLowerCase().includes(feeSearchQuery.toLowerCase()) || st.rollNo.includes(feeSearchQuery);
                      const matchesClass = feeClassFilter === 'All' || st.class === feeClassFilter;
                      const matchesStatus = feeStatusFilter === 'All' ||
                        (feeStatusFilter === 'Paid' && (st.feeInfo?.pending || 0) <= 0) ||
                        (feeStatusFilter === 'Pending' && (st.feeInfo?.pending || 0) > 0);
                      return matchesSearch && matchesClass && matchesStatus;
                    })
                    .map(st => {
                      const isClear = (st.feeInfo?.pending || 0) <= 0;

                      return (
                        <tr key={st.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-3.5">
                            <span className="font-bold text-slate-900 dark:text-white text-sm block">{st.name}</span>
                            <span className="text-[11px] text-slate-500">Roll No: {st.rollNo}</span>
                          </td>
                          <td className="p-3.5 font-bold text-indigo-600 dark:text-indigo-400">Class {st.class}-{st.section}</td>
                          <td className="p-3.5 text-slate-600 dark:text-slate-400">{st.phone || '+91 8757968130'}</td>
                          <td className="p-3.5 font-semibold text-slate-900 dark:text-white">₹{st.feeInfo?.totalAnnual || 13200}</td>
                          <td className="p-3.5 font-bold text-emerald-600 dark:text-emerald-400">₹{st.feeInfo?.paid || 0}</td>
                          <td className="p-3.5 font-bold text-rose-600 dark:text-rose-400">₹{st.feeInfo?.pending || 0}</td>
                          <td className="p-3.5">
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              isClear
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            }`}>
                              {isClear ? '✓ ALL CLEAR' : `PENDING ₹${st.feeInfo?.pending}`}
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => handleOpenCollectFee(st)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-sm flex items-center gap-1 ml-auto"
                            >
                              <DollarSign className="w-3.5 h-3.5" /> Collect Fee
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SUB TAB: CLASS FEE MATRIX & STAFF SALARY ==================== */}
      {activeTab === 'class_fee_structure' && (
        <div className="space-y-6">
          {/* Section 1: Class-Wise Fee Structure Matrix */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-heading flex items-center gap-2">
                  <Settings className="w-5 h-5 text-amber-500" /> Class Fee Structure & Particulars Setup
                </h3>
                <p className="text-xs text-slate-500">Set admission, tuition, annual, exam, hostel & transport fees for each class. Auto-syncs with homepage!</p>
              </div>

              <button
                onClick={async () => {
                  try {
                    const updatedGradeFees: FeeItem[] = classFeeMatrix.map((c, index) => ({
                      id: `fee-${index + 1}`,
                      className: c.classGroup,
                      monthlyTuition: c.monthlyTuition,
                      annualCharges: c.annualCharges,
                      examFee: c.examFee,
                      admissionFee: c.admissionFee,
                      hostelFee: c.hostelFee,
                      transportFee: c.transportFee
                    }));
                    await api.updateSettings({ grade_fees: updatedGradeFees });
                    setFeeSaveMsg('✓ Class Fee Matrix saved & synchronized with Homepage and active database!');
                    setTimeout(() => setFeeSaveMsg(''), 4000);
                  } catch (e) {
                    console.error('Failed to update class fee structure:', e);
                  }
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs shadow-md flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Save & Sync Class Fee Structure
              </button>
            </div>

            {feeSaveMsg && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-xs rounded-xl border border-emerald-200 dark:border-emerald-800">
                {feeSaveMsg}
              </div>
            )}

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Class Group</th>
                    <th className="p-3">Admission Fee (₹)</th>
                    <th className="p-3">Monthly Tuition (₹)</th>
                    <th className="p-3">Annual Charges (₹)</th>
                    <th className="p-3">Exam Fee (₹)</th>
                    <th className="p-3">Transport Addon (₹)</th>
                    <th className="p-3">Hostel Addon (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                  {classFeeMatrix.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{row.classGroup}</td>
                      <td className="p-3">
                        <input
                          type="number"
                          value={row.admissionFee}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setClassFeeMatrix(prev => prev.map((r, i) => i === idx ? { ...r, admissionFee: val } : r));
                          }}
                          className="w-24 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          value={row.monthlyTuition}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setClassFeeMatrix(prev => prev.map((r, i) => i === idx ? { ...r, monthlyTuition: val } : r));
                          }}
                          className="w-24 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold text-emerald-600 dark:text-emerald-400"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          value={row.annualCharges}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setClassFeeMatrix(prev => prev.map((r, i) => i === idx ? { ...r, annualCharges: val } : r));
                          }}
                          className="w-24 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          value={row.examFee}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setClassFeeMatrix(prev => prev.map((r, i) => i === idx ? { ...r, examFee: val } : r));
                          }}
                          className="w-24 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          value={row.transportFee}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setClassFeeMatrix(prev => prev.map((r, i) => i === idx ? { ...r, transportFee: val } : r));
                          }}
                          className="w-24 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold text-amber-600"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          value={row.hostelFee}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setClassFeeMatrix(prev => prev.map((r, i) => i === idx ? { ...r, hostelFee: val } : r));
                          }}
                          className="w-24 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold text-indigo-600"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 1.5: Transportation & Hostel Facility Rate Structure (Non-Class Specific) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-heading flex items-center gap-2">
                  <Truck className="w-5 h-5 text-amber-500" /> Transportation & Hostel Facility Fee Rates (Other Section)
                </h3>
                <p className="text-xs text-slate-500">
                  Transportation and Hostel fees are not determined by class level. Transportation options (₹750, ₹900, ₹1000, ₹1200, ₹1500) and Hostel rates are assigned individually per student.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800/50 space-y-3">
                <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-300 text-sm">
                  <Truck className="w-4 h-4 text-amber-600" /> Bus Pickup Route Tiers
                </div>
                <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                  <div className="flex justify-between items-center p-2 bg-white dark:bg-slate-800 rounded-lg">
                    <span>Local Route Tier 1 (0 – 3 KM)</span>
                    <span className="font-extrabold text-amber-700 dark:text-amber-400">₹750 / month</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white dark:bg-slate-800 rounded-lg">
                    <span>Mid Route Tier 2 (3 – 6 KM)</span>
                    <span className="font-extrabold text-amber-700 dark:text-amber-400">₹900 / month</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white dark:bg-slate-800 rounded-lg">
                    <span>Extended Route Tier 3 (6 – 10 KM)</span>
                    <span className="font-extrabold text-amber-700 dark:text-amber-400">₹1,000 / month</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white dark:bg-slate-800 rounded-lg">
                    <span>Outstation Tier 4 (10 – 15 KM)</span>
                    <span className="font-extrabold text-amber-700 dark:text-amber-400">₹1,200 / month</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white dark:bg-slate-800 rounded-lg">
                    <span>Far Outstation Tier 5 (15+ KM)</span>
                    <span className="font-extrabold text-amber-700 dark:text-amber-400">₹1,500 / month</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-200 dark:border-indigo-800/50 space-y-3">
                <div className="flex items-center gap-2 font-bold text-indigo-900 dark:text-indigo-300 text-sm">
                  <Building2 className="w-4 h-4 text-indigo-600" /> Hostel Accommodation Rates
                </div>
                <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                  <div className="flex justify-between items-center p-2 bg-white dark:bg-slate-800 rounded-lg">
                    <span>Standard Boarding & Lodging</span>
                    <span className="font-extrabold text-indigo-700 dark:text-indigo-400">₹4,500 / month</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white dark:bg-slate-800 rounded-lg">
                    <span>Premium Air-Conditioned Mess Hostel</span>
                    <span className="font-extrabold text-indigo-700 dark:text-indigo-400">₹5,000 / month</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Staff & Faculty Monthly Salary Manager */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-heading flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-500" /> Staff & Faculty Base Salary Configuration
                </h3>
                <p className="text-xs text-slate-500">Set and edit base monthly salaries for each teaching and non-teaching staff member.</p>
              </div>

              <button
                onClick={async () => {
                  try {
                    for (const t of teachers) {
                      const newSal = staffSalaries[t.id];
                      if (newSal !== undefined) {
                        await api.updateTeacher(t.id, { ...t, salary: newSal });
                      }
                    }
                    setStaffSaveMsg('✓ Staff Salaries updated and persisted!');
                    setTimeout(() => setStaffSaveMsg(''), 4000);
                  } catch (e) {
                    console.error('Failed to update staff salaries:', e);
                  }
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Save Staff Salaries
              </button>
            </div>

            {staffSaveMsg && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-xs rounded-xl border border-emerald-200 dark:border-emerald-800">
                {staffSaveMsg}
              </div>
            )}

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Staff Name</th>
                    <th className="p-3">Subject / Role</th>
                    <th className="p-3">Assigned Class</th>
                    <th className="p-3">Phone Contact</th>
                    <th className="p-3">Base Monthly Salary (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                  {teachers.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{t.name}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">{t.subject || 'Faculty'}</td>
                      <td className="p-3 font-semibold text-indigo-600 dark:text-indigo-400">Class {t.assignedClass}-{t.assignedSection}</td>
                      <td className="p-3 text-slate-500">{t.phone || '+91 8757968130'}</td>
                      <td className="p-3">
                        <input
                          type="number"
                          value={staffSalaries[t.id] ?? t.salary ?? 30000}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setStaffSalaries(prev => ({ ...prev, [t.id]: val }));
                          }}
                          className="w-32 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-extrabold text-sm"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SUB TAB 3: FEE PARTICULARS & CONCESSIONS ==================== */}
      {activeTab === 'fee_setup' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-heading flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-600" /> Master Fee Particulars
                </h3>
                <p className="text-xs text-slate-500">Configure tuition, bus, hostel, exam, and computer lab fee structures</p>
              </div>
              <button
                onClick={() => setShowParticularModal(true)}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" /> + Fee Particular
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {particulars.map(p => (
                <div key={p.id} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] rounded uppercase">
                      {p.category}
                    </span>
                    <span className="text-xs font-mono text-slate-400">{p.code}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{p.name}</h4>
                  <p className="text-xs text-slate-500">{p.description}</p>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200/80 dark:border-slate-700 text-xs">
                    <span className="text-slate-500">Default Amount:</span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400">₹{p.defaultAmount}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Concessions & Scholarships */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-heading flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" /> Scholarship & Concession Discounts
                </h3>
                <p className="text-xs text-slate-500">Merit scholarships, sibling waivers, staff ward discounts, and EWS support</p>
              </div>
              <button
                onClick={() => setShowDiscountModal(true)}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" /> + Concession Category
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {discounts.map(d => (
                <div key={d.id} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 flex justify-between items-center">
                  <div>
                    <h5 className="font-bold text-slate-900 dark:text-white text-xs">{d.name} ({d.code})</h5>
                    <p className="text-[11px] text-slate-500">{d.description}</p>
                  </div>
                  <span className="font-extrabold text-amber-600 dark:text-amber-400 text-sm px-2.5 py-1 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
                    {d.type === 'Percentage' ? `${d.value}% OFF` : `-₹${d.value}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== SUB TAB 4: RECEIPT DESIGNER ==================== */}
      {activeTab === 'receipt_designer' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-heading flex items-center gap-2">
                <Printer className="w-5 h-5 text-indigo-600" /> Receipt Header & Notes Customizer
              </h3>
              <p className="text-xs text-slate-500">Customize official receipt voucher layout and school credentials</p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">Header Title</label>
                <input
                  type="text"
                  value={receiptTemplate.headerTitle}
                  onChange={e => setReceiptTemplate({ ...receiptTemplate, headerTitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">Subtitle / Affiliation</label>
                <input
                  type="text"
                  value={receiptTemplate.headerSubtitle}
                  onChange={e => setReceiptTemplate({ ...receiptTemplate, headerSubtitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">Address Text</label>
                <input
                  type="text"
                  value={receiptTemplate.addressText}
                  onChange={e => setReceiptTemplate({ ...receiptTemplate, addressText: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">Accountant / Counter Signatory Name</label>
                <input
                  type="text"
                  value={receiptTemplate.accountantName || settings?.receipt_accountant_name || ''}
                  onChange={e => {
                    const val = e.target.value;
                    setReceiptTemplate({ ...receiptTemplate, accountantName: val });
                    if (onUpdateSettings && settings) {
                      onUpdateSettings({ ...settings, receipt_accountant_name: val });
                    }
                  }}
                  placeholder="Sandeep (Accounts Counter)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">Receipt Logo Branding</label>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                  <img
                    src={settings?.logo_url || "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=120&auto=format&fit=crop&q=80"}
                    alt="School Logo"
                    className="w-10 h-10 object-contain rounded-lg bg-white p-1 border border-slate-200"
                  />
                  <div className="text-xs">
                    <p className="font-bold text-slate-800 dark:text-slate-200">Official Website Logo Inherited</p>
                    <p className="text-slate-500 text-[11px]">All generated fee receipts automatically display the live website logo uploaded in site settings.</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">Footer Notes & Terms</label>
                <textarea
                  value={receiptTemplate.footerNotes}
                  onChange={e => setReceiptTemplate({ ...receiptTemplate, footerNotes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-xs"
                />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem('mps_receipt_template', JSON.stringify(receiptTemplate));
                    if (onUpdateSettings && settings) {
                      onUpdateSettings({
                        ...settings,
                        school_name: receiptTemplate.headerTitle || settings.school_name,
                        contact_address: receiptTemplate.addressText || settings.contact_address,
                        receipt_accountant_name: receiptTemplate.accountantName || settings.receipt_accountant_name,
                        udise_code: receiptTemplate.udiseCode || settings.udise_code
                      });
                    }
                    setSaveSuccessMsg('✓ Receipt template & custom credentials saved successfully!');
                    setTimeout(() => setSaveSuccessMsg(''), 4000);
                  }}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md flex items-center gap-2 transition-all"
                >
                  <Check className="w-4 h-4" /> Save Receipt Template
                </button>
                {saveSuccessMsg ? (
                  <span className="text-xs text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {saveSuccessMsg}
                  </span>
                ) : (
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Auto-syncs live preview
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Live Voucher Preview */}
          <div className="bg-slate-100 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Live Receipt Preview</h4>
            <OfficialFeeReceipt
              student={students[0] || {
                id: 'preview', name: 'Aarav Kumar', rollNo: '01', class: '10', section: 'A',
                parentName: 'Ramesh Kumar', phone: '+91 8757968130',
                feeInfo: { totalAnnual: 13200, paid: 13200, pending: 0, months: [] }
              }}
              settings={settings}
              selectedMonth="August, 2026"
              accountantName={receiptTemplate.accountantName || settings?.receipt_accountant_name || 'Sandeep'}
              templateOverrides={{
                headerTitle: receiptTemplate.headerTitle,
                headerSubtitle: receiptTemplate.headerSubtitle,
                addressText: receiptTemplate.addressText,
                footerNotes: receiptTemplate.footerNotes,
                udiseCode: receiptTemplate.udiseCode,
                affiliationText: receiptTemplate.affiliationText,
              }}
            />
          </div>
        </div>
      )}

      {/* ==================== SUB TAB 5: INCOME & EXPENSE LEDGER ==================== */}
      {activeTab === 'ledger' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-heading flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-indigo-600" /> Daily Income & Expense Ledger
                </h3>
                <p className="text-xs text-slate-500">Track all cash inflow, vendor payments, utilities, and fuel expenses</p>
              </div>

              <button
                onClick={() => setShowTransactionModal(true)}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" /> + Record Transaction
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold uppercase text-[11px]">
                  <tr>
                    <th className="p-3.5">Type & Category</th>
                    <th className="p-3.5">Payer / Payee</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Payment Mode</th>
                    <th className="p-3.5">Description</th>
                    <th className="p-3.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                  {transactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold mr-2 ${
                          tx.type === 'Income' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                        }`}>
                          {tx.type}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">{tx.category}</span>
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-400">{tx.payerOrPayee}</td>
                      <td className="p-3.5 text-slate-500">{tx.date}</td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-400">{tx.paymentMode}</td>
                      <td className="p-3.5 text-slate-500">{tx.description}</td>
                      <td className={`p-3.5 text-right font-extrabold text-sm ${
                        tx.type === 'Income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {tx.type === 'Income' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SUB TAB 6: TEACHER SALARY PAID / PENDING MANAGEMENT ==================== */}
      {activeTab === 'payroll' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-heading flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" /> Faculty Teacher Salary Payment Tracker
                </h3>
                <p className="text-xs text-slate-500">Track and manage monthly salary payment status for all teachers and staff</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSalaryModal(true)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Process Custom Payout
                </button>
              </div>
            </div>

            {/* Quick KPI Counters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Total Faculty Staff</span>
                  <h4 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                    {(teachers.length > 0 ? teachers : [1, 2, 3, 4]).length} Teachers
                  </h4>
                </div>
                <Users className="w-5 h-5 text-indigo-500" />
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Salary Paid</span>
                  <h4 className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {totalPaidTeachersCount} Paid
                  </h4>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Salary Pending</span>
                  <h4 className="text-lg font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">
                    {totalPendingTeachersCount} Pending
                  </h4>
                </div>
                <Clock className="w-5 h-5 text-rose-500" />
              </div>
            </div>

            {/* Teacher List Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold uppercase text-[11px]">
                  <tr>
                    <th className="p-3.5">Teacher Name</th>
                    <th className="p-3.5">Subject & Class</th>
                    <th className="p-3.5">Contact Phone</th>
                    <th className="p-3.5">Monthly Salary</th>
                    <th className="p-3.5">Payment Date</th>
                    <th className="p-3.5">Salary Status</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                  {(teachers.length > 0 ? teachers : [
                    { id: 'T01', name: 'Anand Sharma', subject: 'Physics', assignedClass: '10', assignedSection: 'A', phone: '+91 9876543210' },
                    { id: 'T02', name: 'Sunita Devi', subject: 'Mathematics', assignedClass: '10', assignedSection: 'B', phone: '+91 9876543211' },
                    { id: 'T03', name: 'Rajesh Mishra', subject: 'Sports / PE', assignedClass: '9', assignedSection: 'A', phone: '+91 9876543212' },
                    { id: 'T04', name: 'Meenakshi Verma', subject: 'Chemistry', assignedClass: '11', assignedSection: 'A', phone: '+91 9876543213' }
                  ]).map(t => {
                    const sal = teacherSalaries[t.id] || { status: 'Pending', amount: 30000, month: 'August 2026' };
                    const isPaid = sal.status === 'Paid';

                    return (
                      <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5">
                          <span className="font-bold text-slate-900 dark:text-white text-sm block">{t.name}</span>
                          <span className="text-[11px] text-slate-500">ID: {t.id}</span>
                        </td>
                        <td className="p-3.5 font-bold text-indigo-600 dark:text-indigo-400">
                          {t.subject} <span className="text-slate-500 font-normal">({t.assignedClass}-{t.assignedSection})</span>
                        </td>
                        <td className="p-3.5 text-slate-600 dark:text-slate-400">{t.phone}</td>
                        <td className="p-3.5 font-extrabold text-slate-900 dark:text-white">₹{sal.amount.toLocaleString()}</td>
                        <td className="p-3.5 text-slate-500">{sal.paidDate || 'Not Paid Yet'}</td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                            isPaid
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          }`}>
                            {isPaid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                            {isPaid ? 'PAID' : 'PENDING'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right flex items-center justify-end gap-2">
                          <button
                            onClick={() => toggleTeacherSalaryStatus(t.id, sal.amount)}
                            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                              isPaid
                                ? 'bg-slate-100 dark:bg-slate-800 text-rose-600 dark:text-rose-400 border border-slate-200 dark:border-slate-700'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm'
                            }`}
                          >
                            {isPaid ? 'Mark Pending' : '✓ Mark Paid'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SUB TAB 7: PARENT FEE DUE REMINDERS ==================== */}
      {activeTab === 'due_alerts' && (() => {
        const unpaidStudents = students.filter(s => (s.feeInfo?.pending || 0) > 0);
        const filteredUnpaid = unpaidStudents.filter(st => {
          const matchClass = dueAlertFilterClass === 'All' || String(st.class) === dueAlertFilterClass;
          const matchSearch = !dueAlertSearch ||
            st.name.toLowerCase().includes(dueAlertSearch.toLowerCase()) ||
            (st.phone && st.phone.includes(dueAlertSearch)) ||
            (st.rollNo && st.rollNo.toLowerCase().includes(dueAlertSearch.toLowerCase()));
          return matchClass && matchSearch;
        });

        const totalUnpaidRupees = unpaidStudents.reduce((acc, s) => acc + (s.feeInfo?.pending || 0), 0);
        const availableClasses = Array.from(new Set(students.map(s => String(s.class)))).sort((a, b) => Number(a) - Number(b));

        return (
          <div className="space-y-6">
            {/* Top Stat Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Unpaid Students</div>
                  <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">{unpaidStudents.length} Students</div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Pending Dues</div>
                  <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">₹{totalUnpaidRupees.toLocaleString('en-IN')}</div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <Send className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">WhatsApp Reminders Dispatched</div>
                  <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">{alertLogs.length} Sent</div>
                </div>
              </div>
            </div>

            {/* Main Alert Dispatcher Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white font-heading flex items-center gap-2">
                    <Bell className="w-5 h-5 text-emerald-500" /> WhatsApp Fee Due Alert Manager
                  </h3>
                  <p className="text-xs text-slate-500">
                    Dispatches personalized official reminders directly to parent WhatsApp phone numbers with fee amount, roll number, and online payment details.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Class Filter */}
                  <select
                    value={dueAlertFilterClass}
                    onChange={e => setDueAlertFilterClass(e.target.value)}
                    className="p-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-slate-800 dark:text-white"
                  >
                    <option value="All">All Classes ({unpaidStudents.length})</option>
                    {availableClasses.map(c => (
                      <option key={c} value={c}>Class {c}</option>
                    ))}
                  </select>

                  {/* Search Input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Search student or phone..."
                      value={dueAlertSearch}
                      onChange={e => setDueAlertSearch(e.target.value)}
                      className="pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-slate-800 dark:text-white w-48"
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold uppercase text-[11px]">
                    <tr>
                      <th className="p-3.5">Student Details</th>
                      <th className="p-3.5">Class & Roll</th>
                      <th className="p-3.5">Parent Contact No.</th>
                      <th className="p-3.5">Pending Dues</th>
                      <th className="p-3.5">Fee Status</th>
                      <th className="p-3.5 text-right">Send Notification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                    {filteredUnpaid.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                          No pending fee records found for this filter criteria!
                        </td>
                      </tr>
                    ) : (
                      filteredUnpaid.map(st => (
                        <tr key={st.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-3.5 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-[11px]">
                              {st.name.charAt(0)}
                            </div>
                            <span>{st.name}</span>
                          </td>
                          <td className="p-3.5 text-indigo-600 dark:text-indigo-400 font-bold">
                            Class {st.class}-{st.section || 'A'} <span className="text-slate-400 text-[10px] font-normal">({st.rollNo ? `Roll: ${st.rollNo}` : 'ID: ' + st.id})</span>
                          </td>
                          <td className="p-3.5 text-slate-700 dark:text-slate-300 font-mono">
                            {st.phone || '+91 87579 68130'}
                          </td>
                          <td className="p-3.5 font-extrabold text-rose-600 dark:text-rose-400 text-sm">
                            ₹{(st.feeInfo?.pending || 3500).toLocaleString('en-IN')}
                          </td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 text-[10px] font-extrabold border border-rose-200 dark:border-rose-800">
                              Payment Overdue
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenWhatsAppPreview(st)}
                                className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-[11px] flex items-center gap-1 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                                title="Preview & Customize Message Text"
                              >
                                <Edit3 className="w-3.5 h-3.5" /> Customize
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSendParentAlert(st)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg font-bold text-[11px] flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                                title="Open WhatsApp Directly"
                              >
                                <Send className="w-3.5 h-3.5" /> WhatsApp Alert
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Alert Logs & Sent History */}
            {alertLogs.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" /> Recent WhatsApp Reminder Logs
                  </h4>
                  <span className="text-xs text-slate-400">{alertLogs.length} total logged records</span>
                </div>

                <div className="space-y-2">
                  {alertLogs.slice(0, 5).map(log => (
                    <div key={log.id} className="p-3 bg-stone-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white">{log.studentName}</span>
                          <span className="text-slate-400 ml-1.5">({log.class})</span>
                          <span className="text-slate-500 font-mono text-[11px] ml-2">{log.phone}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        <span className="font-extrabold text-rose-600 dark:text-rose-400">₹{log.amountDue}</span>
                        <span className="text-[11px] text-slate-400">{log.sentAt}</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                          {log.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* ==================== SUB TAB 8: FINANCIAL REPORTS ==================== */}
      {activeTab === 'reports' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-heading flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" /> Institutional Financial Audit Summary
              </h3>
              <p className="text-xs text-slate-500">Session 2026-2027 consolidated fee statement</p>
            </div>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs border border-slate-200 dark:border-slate-700 flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4 text-indigo-500" /> Print Summary
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-medium pt-2">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Fees Collected</span>
              <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">₹{totalFeeCollected.toLocaleString()}</span>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Operating Expenses</span>
              <span className="text-xl font-extrabold text-rose-600 dark:text-rose-400">₹{totalExpenses.toLocaleString()}</span>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Net Operating Reserve</span>
              <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">₹{netOperatingMargin.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: STUDENT FEE COLLECTION ==================== */}
      {selectedStudentForPay && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-xs my-8">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Collect Fee — Itemized Tick-Box Counter</h3>
                <p className="text-slate-500 text-xs">{selectedStudentForPay.name} • Class {selectedStudentForPay.class}-{selectedStudentForPay.section} (Roll: {selectedStudentForPay.rollNo})</p>
              </div>
              <button onClick={() => setSelectedStudentForPay(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {/* Month Selection */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-indigo-500" /> Monthly Tuition Fee (Select Month)
                  </span>
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-amber-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={payTuitionFree}
                      onChange={e => setPayTuitionFree(e.target.checked)}
                      className="rounded text-amber-500 focus:ring-0"
                    />
                    Free / Waived
                  </label>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500 font-semibold">Academic Months (Green = Paid / Disabled):</span>
                    <span className="text-emerald-600 font-bold flex items-center gap-1 text-[10px]">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> Paid Months Marked Green
                    </span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                    {ALL_ACADEMIC_MONTHS.map(m => {
                      const monthName = m.split(',')[0].trim();
                      const isPaid = (selectedStudentForPay?.feeInfo?.months || []).some(
                        x => x.month.toLowerCase().includes(monthName.toLowerCase()) && x.status === 'Paid'
                      );
                      const isSelected = paySelectedMonths.includes(m);

                      if (isPaid) {
                        return (
                          <button
                            key={m}
                            type="button"
                            disabled
                            className="px-2 py-1.5 rounded-lg text-[11px] font-extrabold border bg-emerald-600 text-white border-emerald-600 cursor-not-allowed opacity-90 shadow-xs flex items-center justify-center gap-1"
                            title="Already Paid — Cannot select"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            {monthName}
                          </button>
                        );
                      }

                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              if (paySelectedMonths.length > 1) {
                                setPaySelectedMonths(paySelectedMonths.filter(x => x !== m));
                              }
                            } else {
                              setPaySelectedMonths([...paySelectedMonths, m]);
                            }
                          }}
                          className={`px-2 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {monthName}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500 text-[11px]">Monthly Amount (₹):</span>
                  <input
                    type="number"
                    value={payTuitionAmount}
                    onChange={e => setPayTuitionAmount(Number(e.target.value))}
                    disabled={payTuitionFree}
                    className="w-28 px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-right font-extrabold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Fee Heads Tick-Boxes */}
              <div className="space-y-2">
                <label className="block text-slate-600 dark:text-slate-400 font-bold">Select Heads to Collect Now:</label>

                {/* Annual Fee */}
                {selectedStudentForPay?.feeInfo?.annualFeeStatus === 'Paid' || selectedStudentForPay?.feeInfo?.annualFeeStatus === 'Exempt' ? (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/60 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-emerald-900 dark:text-emerald-200 text-xs">Annual Charges (One-Time Fee)</span>
                    </div>
                    <span className="text-[11px] font-extrabold px-2.5 py-1 bg-emerald-600 text-white rounded-lg flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      {selectedStudentForPay?.feeInfo?.annualFeeStatus === 'Exempt' ? 'FREE / EXEMPT' : 'PAID / CLEARED'}
                    </span>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={payAnnualFee}
                        onChange={e => setPayAnnualFee(e.target.checked)}
                        className="rounded text-indigo-600 w-4 h-4 focus:ring-0"
                      />
                      Annual Charges
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 cursor-pointer mr-2">
                        <input
                          type="checkbox"
                          checked={payAnnualFree}
                          onChange={e => setPayAnnualFree(e.target.checked)}
                          className="rounded text-amber-500"
                        />
                        Free
                      </label>
                      <input
                        type="number"
                        value={payAnnualAmount}
                        onChange={e => setPayAnnualAmount(Number(e.target.value))}
                        disabled={!payAnnualFee || payAnnualFree}
                        className="w-24 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-right font-bold text-slate-900 dark:text-white disabled:opacity-40"
                      />
                    </div>
                  </div>
                )}

                {/* Exam Fee */}
                {selectedStudentForPay?.feeInfo?.examFeeStatus === 'Paid' || selectedStudentForPay?.feeInfo?.examFeeStatus === 'Exempt' ? (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/60 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-emerald-900 dark:text-emerald-200 text-xs">Term Examination Fee (One-Time Fee)</span>
                    </div>
                    <span className="text-[11px] font-extrabold px-2.5 py-1 bg-emerald-600 text-white rounded-lg flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      {selectedStudentForPay?.feeInfo?.examFeeStatus === 'Exempt' ? 'FREE / EXEMPT' : 'PAID / CLEARED'}
                    </span>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={payExamFee}
                        onChange={e => setPayExamFee(e.target.checked)}
                        className="rounded text-indigo-600 w-4 h-4 focus:ring-0"
                      />
                      Term Exam Fee
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 cursor-pointer mr-2">
                        <input
                          type="checkbox"
                          checked={payExamFree}
                          onChange={e => setPayExamFree(e.target.checked)}
                          className="rounded text-amber-500"
                        />
                        Free
                      </label>
                      <input
                        type="number"
                        value={payExamAmount}
                        onChange={e => setPayExamAmount(Number(e.target.value))}
                        disabled={!payExamFee || payExamFree}
                        className="w-24 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-right font-bold text-slate-900 dark:text-white disabled:opacity-40"
                      />
                    </div>
                  </div>
                )}

                {/* Admission Fee */}
                {selectedStudentForPay?.feeInfo?.admissionFeeStatus === 'Paid' || selectedStudentForPay?.feeInfo?.admissionFeeStatus === 'Exempt' ? (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/60 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-emerald-900 dark:text-emerald-200 text-xs">Admission Fee (One-Time Fee)</span>
                    </div>
                    <span className="text-[11px] font-extrabold px-2.5 py-1 bg-emerald-600 text-white rounded-lg flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      {selectedStudentForPay?.feeInfo?.admissionFeeStatus === 'Exempt' ? 'FREE / EXEMPT' : 'PAID / CLEARED'}
                    </span>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={payAdmissionFee}
                        onChange={e => setPayAdmissionFee(e.target.checked)}
                        className="rounded text-indigo-600 w-4 h-4 focus:ring-0"
                      />
                      Admission One-Time Fee
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 cursor-pointer mr-2">
                        <input
                          type="checkbox"
                          checked={payAdmissionFree}
                          onChange={e => setPayAdmissionFree(e.target.checked)}
                          className="rounded text-amber-500"
                        />
                        Free
                      </label>
                      <input
                        type="number"
                        value={payAdmissionAmount}
                        onChange={e => setPayAdmissionAmount(Number(e.target.value))}
                        disabled={!payAdmissionFee || payAdmissionFree}
                        className="w-24 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-right font-bold text-slate-900 dark:text-white disabled:opacity-40"
                      />
                    </div>
                  </div>
                )}

                {/* Hostel Addon Fee */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={payHostelFee}
                      onChange={e => setPayHostelFee(e.target.checked)}
                      className="rounded text-indigo-600 w-4 h-4 focus:ring-0"
                    />
                    Hostel Addon Fee
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 cursor-pointer mr-2">
                      <input
                        type="checkbox"
                        checked={payHostelFree}
                        onChange={e => setPayHostelFree(e.target.checked)}
                        className="rounded text-amber-500"
                      />
                      Free
                    </label>
                    <input
                      type="number"
                      value={payHostelAmount}
                      onChange={e => setPayHostelAmount(Number(e.target.value))}
                      disabled={!payHostelFee || payHostelFree}
                      className="w-24 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-right font-bold text-slate-900 dark:text-white disabled:opacity-40"
                    />
                  </div>
                </div>

                {/* Transportation Addon Fee */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={payTransportFee}
                      onChange={e => setPayTransportFee(e.target.checked)}
                      className="rounded text-indigo-600 w-4 h-4 focus:ring-0"
                    />
                    Transportation Addon Fee
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 cursor-pointer mr-2">
                      <input
                        type="checkbox"
                        checked={payTransportFree}
                        onChange={e => setPayTransportFree(e.target.checked)}
                        className="rounded text-amber-500"
                      />
                      Free
                    </label>
                    <input
                      type="number"
                      value={payTransportAmount}
                      onChange={e => setPayTransportAmount(Number(e.target.value))}
                      disabled={!payTransportFee || payTransportFree}
                      className="w-24 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-right font-bold text-slate-900 dark:text-white disabled:opacity-40"
                    />
                  </div>
                </div>
              </div>

              {/* Special Concession Discount */}
              <div className="p-3 bg-amber-50/60 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/60 flex justify-between items-center">
                <span className="font-bold text-amber-900 dark:text-amber-300">Special Concession / Scholarship Discount (₹)</span>
                <input
                  type="number"
                  placeholder="0"
                  value={payConcessionDiscount || ''}
                  onChange={e => setPayConcessionDiscount(Number(e.target.value))}
                  className="w-24 px-2.5 py-1 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg text-right font-extrabold text-amber-600"
                />
              </div>

              {/* Payment Mode Selection */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">Payment Mode</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Card'].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPayMode(m as any)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                        payMode === m
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Calculated Total Payable */}
              {(() => {
                const tuitionTotal = payTuitionFree ? 0 : payTuitionAmount * paySelectedMonths.length;
                const annualAmt = payAnnualFee ? (payAnnualFree ? 0 : payAnnualAmount) : 0;
                const examAmt = payExamFee ? (payExamFree ? 0 : payExamAmount) : 0;
                const admissionAmt = payAdmissionFee ? (payAdmissionFree ? 0 : payAdmissionAmount) : 0;
                const hostelAmt = payHostelFee ? (payHostelFree ? 0 : payHostelAmount) : 0;
                const transportAmt = payTransportFee ? (payTransportFree ? 0 : payTransportAmount) : 0;
                const grossTotal = tuitionTotal + annualAmt + examAmt + admissionAmt + hostelAmt + transportAmt;
                const netTotal = Math.max(0, grossTotal - payConcessionDiscount);

                return (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl border border-emerald-200 dark:border-emerald-800/80 flex justify-between items-center font-bold">
                    <div>
                      <span className="text-emerald-900 dark:text-emerald-200 block text-xs">Total Net Paid Collection</span>
                      <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-normal">
                        Gross: ₹{grossTotal.toLocaleString()} | Discount: ₹{payConcessionDiscount.toLocaleString()}
                      </span>
                    </div>
                    <span className="text-xl text-emerald-700 dark:text-emerald-300 font-extrabold">
                      ₹{netTotal.toLocaleString()}
                    </span>
                  </div>
                );
              })()}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedStudentForPay(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmFeePayment}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Record Payment & Print Paid Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: OFFICIAL RECEIPT PREVIEW ==================== */}
      {activeReceiptForModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Official Paid Fee Receipt</h3>
              <button onClick={() => setActiveReceiptForModal(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div id="modal-official-fee-receipt">
              <OfficialFeeReceipt
                student={students.find(s => s.name === activeReceiptForModal.payerName) || {
                  id: 'modal', name: activeReceiptForModal.payerName, rollNo: '01', class: '10', section: 'A',
                  parentName: 'Parent', phone: '+91 8757968130',
                  feeInfo: { totalAnnual: 13200, paid: activeReceiptForModal.netPaid, pending: activeReceiptForModal.duesRemaining, months: [] }
                }}
                settings={settings}
                selectedMonth={activeReceiptForModal.monthOrPeriod}
                recId={activeReceiptForModal.receiptNo}
                dateStr={activeReceiptForModal.date}
                paidVia={activeReceiptForModal.paymentMode}
                accountantName={activeReceiptForModal.accountantName || receiptTemplate.accountantName || settings?.receipt_accountant_name || 'Sandeep'}
                templateOverrides={{
                  headerTitle: receiptTemplate.headerTitle,
                  headerSubtitle: receiptTemplate.headerSubtitle,
                  addressText: receiptTemplate.addressText,
                  footerNotes: receiptTemplate.footerNotes,
                  udiseCode: receiptTemplate.udiseCode,
                  affiliationText: receiptTemplate.affiliationText,
                }}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => downloadElementAsPDF('modal-official-fee-receipt', `Official_Receipt_${activeReceiptForModal.receiptNo}.pdf`)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-4 h-4" /> Download PDF
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: ADD TRANSACTION ==================== */}
      {showTransactionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Record Ledger Transaction</h3>
              <button onClick={() => setShowTransactionModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Income', 'Expense'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewTx({ ...newTx, type: t as any })}
                      className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                        newTx.type === t
                          ? t === 'Income' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-rose-600 text-white border-rose-600'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">Category</label>
                <select
                  value={newTx.category}
                  onChange={e => setNewTx({ ...newTx, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                >
                  {customCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">Amount (₹)</label>
                <input
                  type="number"
                  value={newTx.amount || ''}
                  onChange={e => setNewTx({ ...newTx, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">Payer / Payee Name</label>
                <input
                  type="text"
                  placeholder="e.g. Electricity Board / Fuel Station"
                  value={newTx.payerOrPayee || ''}
                  onChange={e => setNewTx({ ...newTx, payerOrPayee: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Notes or reference details"
                  value={newTx.description || ''}
                  onChange={e => setNewTx({ ...newTx, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowTransactionModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!newTx.amount) return;
                  const txEntry: FinancialTransaction = {
                    id: `tx-${Date.now()}`,
                    type: newTx.type || 'Expense',
                    category: newTx.category || 'Utilities',
                    amount: newTx.amount,
                    date: newTx.date || new Date().toISOString().split('T')[0],
                    paymentMode: newTx.paymentMode || 'Bank Transfer',
                    payerOrPayee: newTx.payerOrPayee || 'General Party',
                    description: newTx.description || 'General Ledger Entry',
                    accountGroup: 'General Fund',
                    createdBy: 'Admin'
                  };
                  setTransactions([txEntry, ...transactions]);
                  api.saveTransaction(txEntry).catch(e => console.error(e));
                  setShowTransactionModal(false);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm"
              >
                Save Transaction
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ==================== MODAL: WHATSAPP FEE DUE REMINDER PREVIEW & SENDER ==================== */}
      {previewStudentForWhatsApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-xs my-8 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Personalized WhatsApp Fee Alert</h3>
                  <p className="text-slate-500 text-xs">Review or edit the message text before sending to parent</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewStudentForWhatsApp(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Student Info Card */}
            <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 dark:text-white text-sm">{previewStudentForWhatsApp.name}</div>
                <div className="text-slate-500 text-xs mt-0.5">
                  Class {previewStudentForWhatsApp.class}-{previewStudentForWhatsApp.section || 'A'} • Roll: {previewStudentForWhatsApp.rollNo || 'N/A'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-slate-400">Total Dues</div>
                <div className="text-base font-extrabold text-rose-600 dark:text-rose-400">
                  ₹{(previewStudentForWhatsApp.feeInfo?.pending || 3500).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Target WhatsApp Number */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                Parent WhatsApp Number
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={previewStudentForWhatsApp.phone || '+91 8757968130'}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs font-bold"
                />
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold whitespace-nowrap bg-emerald-50 dark:bg-emerald-950 px-2 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  Target URL Ready
                </span>
              </div>
            </div>

            {/* Message Body Editor */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-slate-700 dark:text-slate-300 font-bold">
                  WhatsApp Message Text (Editable)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(customWhatsAppMsg);
                    setCopiedMsg(true);
                    setTimeout(() => setCopiedMsg(false), 2000);
                  }}
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                >
                  {copiedMsg ? '✓ Copied!' : 'Copy Text'}
                </button>
              </div>
              <textarea
                rows={9}
                value={customWhatsAppMsg}
                onChange={e => setCustomWhatsAppMsg(e.target.value)}
                className="w-full p-3 rounded-2xl bg-stone-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-sans text-xs leading-relaxed focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setPreviewStudentForWhatsApp(null)}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleSendParentAlert(previewStudentForWhatsApp, customWhatsAppMsg);
                  setPreviewStudentForWhatsApp(null);
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" /> Open in WhatsApp & Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
