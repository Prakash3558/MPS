import React from 'react';
import { Student, SiteSettings } from '../../types';

export function numberToWords(num: number): string {
  if (num === 0) return 'Rs. ZERO only';
  const a = [
    '', 'ONE ', 'TWO ', 'THREE ', 'FOUR ', 'FIVE ', 'SIX ', 'SEVEN ', 'EIGHT ', 'NINE ', 'TEN ',
    'ELEVEN ', 'TWELVE ', 'THIRTEEN ', 'FOURTEEN ', 'FIFTEEN ', 'SIXTEEN ', 'SEVENTEEN ', 'EIGHTEEN ', 'NINETEEN '
  ];
  const b = ['', '', 'TWENTY ', 'THIRTY ', 'FORTY ', 'FIFTY ', 'SIXTY ', 'SEVENTY ', 'EIGHTY ', 'NINETY '];

  function inWords(n: number): string {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + a[n % 10];
    if (n < 1000) return a[Math.floor(n / 100)] + 'HUNDRED ' + (n % 100 !== 0 ? inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + 'THOUSAND ' + (n % 1000 !== 0 ? inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + 'LAKH ' + (n % 100000 !== 0 ? inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + 'CRORE ' + (n % 10000000 !== 0 ? inWords(n % 10000000) : '');
  }

  return `Rs. ${inWords(Math.floor(num)).trim()} only`;
}

export interface FeeReceiptItem {
  description: string;
  amount: number;
  paid: number;
}

export interface FeeReceiptTemplateOverrides {
  headerTitle?: string;
  headerSubtitle?: string;
  addressText?: string;
  footerNotes?: string;
  udiseCode?: string;
  affiliationText?: string;
  authorizedSignatoryTitle?: string;
  showLogo?: boolean;
}

export interface OfficialFeeReceiptProps {
  student: Student;
  settings?: SiteSettings | null;
  selectedMonth?: string;
  recId?: string;
  receiptNo?: string;
  dateStr?: string;
  paymentDate?: string;
  paidVia?: string;
  paymentMode?: string;
  accountantName?: string;
  customItems?: FeeReceiptItem[];
  collectedItems?: { headName?: string; particularName?: string; description?: string; monthName?: string; amount?: number; paid?: number }[];
  customTotal?: number;
  customPaid?: number;
  totalPaid?: number;
  templateOverrides?: FeeReceiptTemplateOverrides;
}

export const OfficialFeeReceipt: React.FC<OfficialFeeReceiptProps> = ({
  student,
  settings,
  selectedMonth,
  recId,
  receiptNo,
  dateStr,
  paymentDate,
  paidVia = 'Cash',
  paymentMode,
  accountantName,
  customItems,
  collectedItems,
  customTotal,
  customPaid,
  totalPaid: totalPaidProp,
  templateOverrides
}) => {
  const displayAccountant = accountantName || settings?.receipt_accountant_name || 'Sandeep';
  // Format receipt data
  const currentAcademicYear = '2026-2027';
  const receiptId = recId || receiptNo || `33${student.rollNo ? student.rollNo.padStart(2, '0') : '22'}`;
  const currentDate = dateStr || paymentDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
  const paymentMethod = paymentMode || paidVia;
  const nowTimestamp = new Date().toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\//g, '/');

  const activeMonth = selectedMonth || 'August, 2026';

  // Build itemized fee list
  let items: FeeReceiptItem[] = customItems || [];
  if (items.length === 0 && collectedItems && collectedItems.length > 0) {
    items = collectedItems.map(c => ({
      description: c.headName || c.particularName || c.description || c.monthName || 'Fee Collection',
      amount: c.amount || 0,
      paid: c.paid !== undefined ? c.paid : (c.amount || 0)
    }));
  }
  if (items.length === 0) {
    const tuitionAmount = Math.round((student.feeInfo?.totalAnnual || 13200) / 12);
    items.push({
      description: 'Tuition Fee',
      amount: tuitionAmount,
      paid: tuitionAmount
    });

    if (student.addons?.transportation?.enabled) {
      items.unshift({
        description: `Transport Fees (Transport Fee)`,
        amount: student.addons.transportation.amount || 650,
        paid: student.addons.transportation.amount || 650
      });
    }

    if (student.addons?.hostel?.enabled) {
      items.push({
        description: 'Hostel Accommodation Fee',
        amount: student.addons.hostel.amount || 5000,
        paid: student.addons.hostel.amount || 5000
      });
    }
  }

  const totalAmount = customTotal !== undefined ? customTotal : items.reduce((acc, i) => acc + i.amount, 0);
  const totalPaid = customPaid !== undefined ? customPaid : items.reduce((acc, i) => acc + i.paid, 0);
  const duesAmount = student.feeInfo?.pending || 0;

  const schoolName = templateOverrides?.headerTitle || settings?.school_name || 'MODEL PUBLIC SCHOOL';
  const udiseNo = templateOverrides?.udiseCode || settings?.udise_code || '10011301103';
  const subtitleText = templateOverrides?.headerSubtitle || `UDISE No. ${udiseNo}, http://www.modelpublicschool.com`;
  const schoolAddr = templateOverrides?.addressText || settings?.contact_address || 'Bhawanipur, Kursi Barwa, Sikta, West Champaran, 845307';
  const schoolPhone = settings?.contact_phone || '8757968130';
  const footerNotesText = templateOverrides?.footerNotes || 'Note :: 1. Please deposit the fee before 15th of every month in advance to avoid late payment fine.\n2. Please bring the fee card along at the time of depositing the fees for your convenience.';
  const signatoryTitle = templateOverrides?.authorizedSignatoryTitle || 'Authorized Signatory';
  const showLogoOption = templateOverrides?.showLogo !== undefined ? templateOverrides.showLogo : true;

  return (
    <div className="w-full max-w-3xl mx-auto my-4 bg-white text-slate-900 font-sans print:my-0 print:p-0 select-text">
      <div className="text-center font-bold text-base text-black mb-1 font-serif print:text-lg">
        Fee Receipt
      </div>

      <div className="border-2 border-slate-900 p-4 sm:p-6 bg-white shadow-sm print:shadow-none print:p-4 print:border-black">
        {/* Header Section */}
        <div className="text-center pb-3 border-b border-slate-300">
          <div className="flex items-center justify-center gap-3 mb-1">
            {showLogoOption && settings?.logo_url ? (
              <img src={settings.logo_url} alt="School Logo" className="max-h-16 max-w-[160px] w-auto h-auto object-contain flex-shrink-0" />
            ) : showLogoOption ? (
              <div className="w-14 h-14 rounded-full bg-slate-900 text-amber-400 font-black text-xl flex items-center justify-center border-2 border-amber-400 flex-shrink-0">
                MPS
              </div>
            ) : null}
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl font-black text-[#1e3a8a] tracking-wide font-serif uppercase">
                {schoolName}
              </h1>
              <div className="text-xs font-semibold text-slate-700">
                {subtitleText}
              </div>
              <div className="text-xs text-slate-700">
                {schoolAddr}{schoolPhone ? `, Ph: ${schoolPhone}` : ''}
              </div>
            </div>
          </div>
          <div className="text-base font-black text-slate-900 mt-1 font-serif tracking-wider">
            {currentAcademicYear}
          </div>
        </div>

        {/* Student Information Grid */}
        <div className="my-3 overflow-x-auto">
          <table className="w-full border-collapse border border-slate-400 text-xs text-slate-900 font-medium">
            <tbody>
              <tr className="border-b border-slate-400">
                <td className="border-r border-slate-400 p-1.5 w-1/6 font-bold text-slate-700 text-center">Rec Id</td>
                <td className="border-r border-slate-400 p-1.5 w-2/6 font-bold text-center">{receiptId}</td>
                <td className="border-r border-slate-400 p-1.5 w-1/6 font-bold text-slate-700 text-center">Date</td>
                <td className="p-1.5 w-2/6 font-bold text-center">{currentDate}</td>
              </tr>
              <tr className="border-b border-slate-400">
                <td className="border-r border-slate-400 p-1.5 font-bold text-slate-700 text-center">Name</td>
                <td className="border-r border-slate-400 p-1.5 font-bold text-center uppercase">{student.name}</td>
                <td className="border-r border-slate-400 p-1.5 font-bold text-slate-700 text-center">Class</td>
                <td className="p-1.5 font-bold text-center">Class {student.class} - {student.section}</td>
              </tr>
              <tr className="border-b border-slate-400">
                <td className="border-r border-slate-400 p-1.5 font-bold text-slate-700 text-center">Father</td>
                <td className="border-r border-slate-400 p-1.5 font-bold text-center uppercase">{student.parentName || 'ANIL SAH'}</td>
                <td className="border-r border-slate-400 p-1.5 font-bold text-slate-700 text-center">Mother</td>
                <td className="p-1.5 font-bold text-center uppercase">{student.motherName || 'LALSA DEVI'}</td>
              </tr>
              <tr>
                <td className="border-r border-slate-400 p-1.5 font-bold text-slate-700 text-center">Contact</td>
                <td className="border-r border-slate-400 p-1.5 font-bold text-center">{student.phone}</td>
                <td className="border-r border-slate-400 p-1.5 font-bold text-slate-700 text-center">Enrollment No / Roll. No</td>
                <td className="p-1.5 font-bold text-center">{student.enrollmentNo || '1667'} / {student.rollNo}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Fee Particulars Table */}
        <div className="my-3 overflow-x-auto">
          <table className="w-full border-collapse border border-slate-400 text-xs text-slate-900 font-medium">
            <thead>
              <tr className="border-b border-slate-400 font-bold bg-slate-50">
                <th className="border-r border-slate-400 p-2 w-1/5 text-center">Month</th>
                <th className="border-r border-slate-400 p-2 w-2/5 text-center">Description</th>
                <th className="border-r border-slate-400 p-2 w-1/5 text-center">Amount</th>
                <th className="p-2 w-1/5 text-center">Paid</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} className="border-b border-slate-300">
                  {idx === 0 ? (
                    <td rowSpan={items.length} className="border-r border-slate-400 p-2 text-center font-bold align-middle">
                      {activeMonth}
                    </td>
                  ) : null}
                  <td className="border-r border-slate-400 p-2 text-center">{item.description}</td>
                  <td className="border-r border-slate-400 p-2 text-center">{item.amount}</td>
                  <td className="p-2 text-center">{item.paid}</td>
                </tr>
              ))}

              <tr className="border-b border-slate-400 font-bold">
                <td colSpan={2} className="border-r border-slate-400 p-1.5 text-center">Total :</td>
                <td className="border-r border-slate-400 p-1.5 text-center">{totalAmount}</td>
                <td className="p-1.5 text-center"></td>
              </tr>

              <tr className="border-b border-slate-400 font-bold">
                <td colSpan={2} className="border-r border-slate-400 p-1.5 text-center">Paid :</td>
                <td className="border-r border-slate-400 p-1.5 text-center"></td>
                <td className="p-1.5 text-center">{totalPaid}</td>
              </tr>

              <tr className="border-b border-slate-400">
                <td colSpan={4} className="p-1.5 text-center font-bold">Paid via : {paidVia}</td>
              </tr>

              <tr>
                <td colSpan={4} className="p-1.5 text-center font-bold">Current Dues (Till {activeMonth.split(',')[0]}): ₹{duesAmount}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer & Signatures */}
        <div className="flex justify-between items-end text-xs text-slate-800 pt-3 pb-1 gap-2">
          <div>
            <div className="font-bold">Accountant: {displayAccountant}</div>
            <div className="text-[10px] text-slate-600">{nowTimestamp}</div>
          </div>

          <div className="text-center flex-1 px-2">
            <div className="font-bold text-slate-900 text-xs sm:text-sm tracking-wide uppercase">
              {numberToWords(totalPaid)}
            </div>
          </div>

          <div className="text-right">
            <div className="font-bold text-slate-900 border-t border-slate-400 pt-1 px-2 inline-block">
              {signatoryTitle}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="text-[10px] text-slate-600 text-center pt-2 border-t border-slate-300 leading-tight whitespace-pre-line">
          {footerNotesText}
        </div>
      </div>
    </div>
  );
};
