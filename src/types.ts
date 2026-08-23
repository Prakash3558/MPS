export type UserRole = 'admin' | 'teacher' | 'student';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
  email?: string;
}

export interface Teacher {
  id: string;
  userId: string;
  name: string;
  username: string;
  password?: string;
  subject: string;
  assignedClass: string;
  assignedSection: string;
  phone: string;
  email?: string;
  photo?: string;
  salary?: number;
  qualification?: string;
}

export interface MonthFee {
  month: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  amount: number;
  dueDate?: string;
  paidDate?: string;
  receiptNo?: string;
}

export interface FeeStructure {
  totalAnnual: number;
  paid: number;
  pending: number;
  months: MonthFee[];
  notes?: string;
  annualFeeAmount?: number;
  annualFeeStatus?: 'Paid' | 'Unpaid' | 'Exempt';
  examFeeAmount?: number;
  examFeeStatus?: 'Paid' | 'Unpaid' | 'Exempt';
  admissionFeeAmount?: number;
  admissionFeeStatus?: 'Paid' | 'Unpaid' | 'Exempt';
  hostelFeeStatus?: 'Paid' | 'Unpaid' | 'Exempt';
  transportFeeStatus?: 'Paid' | 'Unpaid' | 'Exempt';
}

export interface Student {
  id: string;
  userId?: string;
  name: string;
  rollNo: string;
  class: string;
  section: string;
  password?: string;
  photo?: string;
  parentName: string;
  motherName?: string;
  enrollmentNo?: string;
  phone: string;
  email?: string;
  address?: string;
  dob?: string;
  gender?: 'Male' | 'Female' | string;
  feePending?: number;
  admissionDate?: string;
  feeInfo: FeeStructure;
  notice?: string;
  addons?: {
    hostel?: { enabled: boolean; amount: number };
    transportation?: { enabled: boolean; amount: number };
  };
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  class: string;
  section: string;
  date: string; // YYYY-MM-DD
  status: 'Present' | 'Absent' | 'Late' | 'Leave' | 'Holiday' | 'Not Mentioned';
  remarks?: string;
  isPublished?: boolean;
  teacherName?: string;
  publishedAt?: string;
}

export interface SubjectResult {
  subject: string;
  maxMarks: number;
  marksObtained: number;
  grade: string;
}

export interface ExamResult {
  id: string;
  studentId: string;
  examType: string; // e.g., 'Unit Test 1', 'Mid-Term', 'Final Exam'
  academicYear: string;
  subjects: SubjectResult[];
  totalMarks: number;
  maxTotalMarks: number;
  percentage: number;
  grade: string;
  teacherRemarks: string;
  date: string;
}

export interface Homework {
  id: string;
  class: string;
  section: string;
  subject: string;
  title: string;
  description: string;
  attachmentUrl?: string;
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low';
  teacherName: string;
  createdAt: string;
}

export interface AdmissionApplication {
  id: string;
  studentName: string;
  parentName: string;
  phone: string;
  targetClass: string;
  message?: string;
  status: 'Pending' | 'Contacted' | 'Approved' | 'Rejected';
  appliedDate: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  category: 'General' | 'Urgent' | 'Exam' | 'Holiday' | 'Event';
  targetClass?: string; // 'All' or '10-A'
  date: string;
  isUrgentTicker: boolean;
}

export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  image: string;
  primaryBtnText: string;
  primaryBtnUrl: string;
  secondaryBtnText: string;
  secondaryBtnUrl: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: string;
  url: string;
  caption: string;
}

export interface Facility {
  id: string;
  title: string;
  iconName: string;
  description: string;
  image: string;
  overview?: string;
  highlights?: string[];
  category?: string;
  order?: number;
  status?: 'Active' | 'Under Maintenance' | 'Featured';
}

export interface FeeItem {
  id: string;
  className: string;
  admissionFee: number;
  monthlyTuition: number;
  annualCharges: number;
  examFee: number;
  transportFee?: number;
  hostelFee?: number;
}

export interface ThemeColors {
  primary?: string;
  secondary?: string;
  accent?: string;
  background?: string;
  cardBg?: string;
  text?: string;
}

export interface SEOMetadata {
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  og_image?: string;
  canonical_url?: string;
  author?: string;
  robots?: string;
  enable_schema_markup?: boolean;
  google_adsense_id?: string;
  google_analytics_id?: string;
  google_search_console_id?: string;
  enable_adsense?: boolean;
}

export interface FacultyMember {
  id: string;
  name: string;
  designation: string;
  subject: string;
  qualification: string;
  experience?: string;
  photo: string;
  bio?: string;
  email?: string;
  phone?: string;
  joiningYear?: string;
  assignedClasses?: string;
  achievements?: string;
  order?: number;
  status?: 'Active' | 'On Leave';
}

export interface NoticeBannerConfig {
  enabled: boolean;
  badgeText: string;
  badgeColor?: 'blue' | 'rose' | 'amber' | 'emerald' | 'purple' | 'indigo' | string;
  customText: string;
  useLiveNotices: boolean;
  linkText?: string;
  linkUrl?: string;
  speed?: 'normal' | 'slow' | 'fast';
  isMarquee?: boolean;
  backgroundColor?: string;
  textColor?: string;
}

export interface SiteSettings {
  school_name: string;
  tagline: string;
  cbse_affiliation: string;
  address: string;
  contact_address?: string;
  phones: string;
  contact_phone?: string;
  email: string;
  principal_name: string;
  principal_message: string;
  principal_photo: string;
  logo_url: string;
  hero_slides: HeroSlide[];
  hero_video_url?: string;
  theme_colors: ThemeColors;
  font_heading: string;
  font_body: string;
  content_blocks: Record<string, string>;
  gallery: GalleryItem[];
  facilities: Facility[];
  faculty?: FacultyMember[];
  grade_fees: FeeItem[];
  section_order: string[];
  seo_meta?: SEOMetadata;
  receipt_accountant_name?: string;
  udise_code?: string;
  google_adsense_id?: string;
  notice_banner?: NoticeBannerConfig;
}

export interface OnlineClass {
  id: string;
  title: string;
  subject: string;
  class: string;
  section: string;
  teacherName: string;
  zoomUrl: string;
  meetingId?: string;
  passcode?: string;
  startTime: string;
  endTime: string;
  date: string;
  status: 'Scheduled' | 'Live' | 'Completed' | 'Upcoming' | 'Cancelled';
}

export interface OnlineExam {
  id: string;
  title: string;
  subject: string;
  class: string;
  section: string;
  zoomUrl?: string;
  examUrl?: string;
  durationMinutes: number;
  totalMarks: number;
  date: string;
  startTime: string;
  endTime: string;
  instructions?: string;
  status: 'Upcoming' | 'Live' | 'Completed';
}

export interface TimeTableSlot {
  id: string;
  class: string;
  section: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  time: string;
  startTime?: string;
  endTime?: string;
  periodNo?: number | string;
  subject: string;
  teacherName: string;
  roomNo?: string;
}

export interface StudyMaterial {
  id: string;
  class: string;
  section?: string;
  subject: string;
  title: string;
  description: string;
  fileUrl?: string;
  category: 'Notes' | 'PDF' | 'Video' | 'Sample Paper';
  uploadedBy: string;
  date: string;
}

export interface SchoolDiaryEntry {
  id: string;
  studentId?: string;
  class: string;
  section: string;
  date: string;
  subject: string;
  note: string;
  title?: string;
  content?: string;
  teacherName: string;
}

export interface SyllabusItem {
  id: string;
  class: string;
  section?: string;
  subject: string;
  term: 'Term 1' | 'Term 2' | 'Annual';
  chapters: string;
  chapterName?: string;
  status?: string;
  pdfUrl?: string;
}

export interface TransportRoute {
  id: string;
  routeName: string;
  busNumber?: string;
  vehicleNo?: string;
  driverName?: string;
  driverPhone?: string;
  stops?: string[];
  feeMonthly?: number;
  fareMonthly?: number;
}

export interface AdmitCard {
  id: string;
  studentId: string;
  examName: string;
  rollNo: string;
  centerName: string;
  instructions: string;
  issueDate: string;
}

export interface StudentDeclaration {
  id: string;
  title: string;
  content: string;
  date: string;
}

export interface SchoolMessage {
  id: string;
  studentId: string;
  studentName: string;
  class: string;
  section?: string;
  subject: string;
  message: string;
  title?: string;
  content?: string;
  status: 'Pending' | 'Replied';
  reply?: string;
  date: string;
  sender?: string;
  senderRole?: 'Student' | 'Teacher' | 'Admin';
}

export interface RecordUpdateReq {
  id: string;
  studentId: string;
  studentName: string;
  field: string;
  oldValue: string;
  newValue: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  date: string;
}

// ==================== SCHOOL FEES & FINANCE SYSTEM TYPES ====================

export interface FeeParticularMaster {
  id: string;
  name: string;
  code: string;
  defaultAmount: number;
  category: 'General' | 'Tuition' | 'Transport' | 'Hostel' | 'Exam' | 'Facility' | 'Fine';
  applicableCourse: string; // 'All' or specific class e.g. 'Class 10'
  taxSlabId?: string;
  taxRate?: number;
  description?: string;
}

export interface FeeDiscount {
  id: string;
  name: string;
  code: string;
  type: 'Percentage' | 'Fixed';
  value: number;
  description?: string;
  applicableTo?: string; // 'Merit' | 'Sibling' | 'Need-Based' | 'All'
}

export interface TaxSlab {
  id: string;
  name: string;
  code: string;
  rate: number; // percentage e.g. 5, 12, 18
  description?: string;
}

export interface AdvanceFeeRecord {
  id: string;
  studentId: string;
  studentName: string;
  rollNo: string;
  class: string;
  amount: number;
  advanceDate: string;
  paymentMode: 'Cash' | 'UPI' | 'Card' | 'Bank Transfer' | 'Cheque';
  receiptNo: string;
  purpose: string; // e.g., 'Transport Advance', 'Academic Advance', 'Hostel Advance'
  adjustedAmount: number;
  remainingBalance: number;
  status: 'Active' | 'Fully Adjusted' | 'Refunded';
}

export interface FeeReceiptTemplate {
  id: string;
  templateName: string;
  headerTitle: string;
  headerSubtitle: string;
  addressText: string;
  contactPhones: string;
  footerNotes: string;
  udiseCode: string;
  affiliationText: string;
  showLogo: boolean;
  primaryColor: string;
  authorizedSignatoryTitle: string;
  accountantName?: string;
}

export interface FeeReceiptRecord {
  id: string;
  receiptNo: string;
  payerType: 'Student' | 'Employee' | 'Guest';
  payerName: string;
  payerRef: string; // Roll No or Staff ID or Phone
  classOrRole?: string;
  date: string;
  monthOrPeriod: string;
  items: {
    particularName: string;
    amount: number;
    discount: number;
    tax: number;
    net: number;
  }[];
  totalAmount: number;
  totalDiscount: number;
  totalTax: number;
  netPaid: number;
  duesRemaining: number;
  paymentMode: 'Cash' | 'UPI' | 'Card' | 'Bank Transfer' | 'Cheque';
  transactionRef?: string;
  accountantName: string;
  isRefunded?: boolean;
  refundReason?: string;
  refundDate?: string;
}

export interface FinancialTransaction {
  id: string;
  type: 'Income' | 'Expense';
  category: string; // e.g. 'Tuition Fee Collection', 'Staff Salary', 'Utility Bill', 'Donation', 'Lab Equipment'
  subCategory?: string;
  amount: number;
  taxAmount?: number;
  date: string; // YYYY-MM-DD
  paymentMode: 'Cash' | 'UPI' | 'Card' | 'Bank Transfer' | 'Cheque';
  referenceNo?: string;
  payerOrPayee: string;
  description: string;
  accountGroup: 'General Fund' | 'Hostel Account' | 'Transport Account' | 'Development Fund';
  createdBy: string;
}

export interface StaffPayroll {
  id: string;
  staffId: string;
  staffName: string;
  role: string;
  department: string;
  month: string; // e.g. 'August 2026'
  basicSalary: number;
  allowances: number; // DA, HRA, Medical
  grossSalary: number;
  tdsTaxDeduction: number; // Income tax deduction
  pfDeduction: number;
  otherDeductions: number;
  netSalary: number;
  paymentDate: string;
  paymentMode: 'Bank Transfer' | 'Cash' | 'Cheque';
  status: 'Paid' | 'Pending';
  salarySlipNo: string;
}

export interface DonationRecord {
  id: string;
  donorName: string;
  donorPhone: string;
  donorEmail?: string;
  amount: number;
  purpose: string;
  date: string;
  receiptNo: string;
  paymentMode: 'Cash' | 'UPI' | 'Card' | 'Bank Transfer' | 'Cheque';
  panOrTaxId?: string;
  taxExemption80G: boolean;
  remarks?: string;
}

export interface AssetLiabilityRecord {
  id: string;
  type: 'Asset' | 'Liability';
  title: string;
  category: string; // e.g., 'Real Estate', 'Vehicles', 'Computers & IT', 'Lab Machinery', 'Bank Loan'
  valuation: number;
  acquisitionDate: string;
  status: 'Active' | 'Depreciated' | 'Settled' | 'Disposed';
  remarks?: string;
}

export interface FeeAlertLog {
  id: string;
  studentId: string;
  studentName: string;
  class: string;
  phone: string;
  amountDue: number;
  dueDate: string;
  alertType: 'SMS' | 'WhatsApp' | 'ERP Push';
  sentAt: string;
  status: 'Delivered' | 'Pending' | 'Failed';
  messageText: string;
}

