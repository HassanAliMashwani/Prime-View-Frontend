'use client';

import React from 'react';
import Image from 'next/image';
import { FileText, Printer, X } from 'lucide-react';
import { siteConfig } from '@/data/site';

export interface BookingAgreementData {
  customer: {
    membershipNo?: string;
    fullName?: string;
    fatherOrHusbandName?: string;
    cnic?: string;
    phone?: string;
    email?: string;
    nokName?: string;
    mailingAddress?: string;
  };
  plot: {
    plotNumber?: string;
    blockId?: string;
    size?: string;
    category?: string;
    price: number;
  };
  paymentType?: string;
  paperRef?: string;
  bookingDate?: string;
  installmentPlan?: {
    planYears?: number;
    years?: number;
    downpayment?: number;
    totalPayment?: number;
    numberOfInstallments?: number;
    monthlyInstallmentCount?: number;
    biannualInstallmentCount?: number;
  };
}

interface BookingAgreementModalProps {
  open: boolean;
  onClose: () => void;
  data: BookingAgreementData | null;
}

export function BookingAgreementModal({ open, onClose, data }: BookingAgreementModalProps) {
  if (!open || !data) return null;

  const { customer, plot, paymentType, paperRef, bookingDate, installmentPlan } = data;

  const effectivePrice = Number(installmentPlan?.totalPayment ?? plot.price ?? 0);
  const planYears = Number(installmentPlan?.planYears ?? installmentPlan?.years ?? 1);
  const downpayment = Number(installmentPlan?.downpayment ?? Math.floor(effectivePrice * 0.25));

  const totalInstallments = installmentPlan?.numberOfInstallments ?? 
    ((installmentPlan?.monthlyInstallmentCount || (planYears * 12)) + (installmentPlan?.biannualInstallmentCount || (planYears * 2)));

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden print:p-0 print:bg-white print:static print:inset-auto print:overflow-visible"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div id="pv-booking-agreement-printable" className="bg-white rounded-2xl border border-slate-300 w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[100dvh] print:border-none print:shadow-none print:my-0 print:max-w-none print:max-h-none print:h-auto print:overflow-visible">
        {/* Modal Actions Bar (Sticky/Anchored at top, hidden on print) */}
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800 shadow-xs print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">
              Official Booking Agreement Document (Preview)
            </span>
            <span className="text-xs font-bold uppercase tracking-wider sm:hidden">
              Agreement Preview
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-[#D4AF37] hover:bg-[#b5952f] text-slate-950 font-bold text-xs rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Agreement</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              title="Close preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-5 text-slate-900 font-sans print:p-6 print:overflow-visible print:h-auto">
          <div className="space-y-4 sm:space-y-5">
            {/* Header with Prime View Logo on the Right Side */}
            <div className="border-b-2 border-[#10251E] pb-3 sm:pb-4 flex items-center justify-between gap-3">
              <div className="hidden sm:block w-16 sm:w-20 shrink-0" />

              <div className="flex-1 text-center">
                <div className="font-serif font-extrabold text-xl sm:text-2xl tracking-wider text-[#10251E]">
                  PRIME VIEW HOUSING SCHEME
                </div>
                <div className="text-[11px] sm:text-xs uppercase tracking-widest text-[#D4AF37] font-bold">
                  Executive Society Administration & Plot Allocation
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-500 mt-1">
                  Main Expressway Sector, Islamabad / Rawalpindi Territory • UAN: (051) 111-PRIME
                </div>
                <div className="mt-2.5 sm:mt-3 inline-block bg-[#10251E] text-white px-3.5 sm:px-4 py-1 rounded text-[11px] sm:text-xs font-bold uppercase tracking-widest">
                  PLOT BOOKING & ALLOTMENT AGREEMENT
                </div>
              </div>

              <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 relative flex items-center justify-center">
                <Image
                  src={siteConfig.logoPath}
                  alt="Prime View Logo"
                  width={80}
                  height={80}
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            {/* Reference & Date */}
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 py-1">
              <div>
                Membership Ref: <strong className="font-mono text-slate-950">{customer.membershipNo || 'PENDING'}</strong>
              </div>
              <div>
                Date of Issue: <strong>{bookingDate || new Date().toLocaleDateString('en-GB')}</strong>
              </div>
            </div>

            {/* Customer Particulars Table */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1 border-b border-slate-200 pb-1">
                Section I: Allottee Particulars
              </div>
              <table className="w-full text-xs border border-slate-300">
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="p-1.5 sm:p-2 bg-slate-50 font-bold w-1/4">Full Name:</td>
                    <td className="p-1.5 sm:p-2 w-1/4">{customer.fullName || 'N/A'}</td>
                    <td className="p-1.5 sm:p-2 bg-slate-50 font-bold w-1/4">S/O or W/O:</td>
                    <td className="p-1.5 sm:p-2 w-1/4">{customer.fatherOrHusbandName || 'N/A'}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-1.5 sm:p-2 bg-slate-50 font-bold">CNIC Number:</td>
                    <td className="p-1.5 sm:p-2 font-mono">{customer.cnic || 'N/A'}</td>
                    <td className="p-1.5 sm:p-2 bg-slate-50 font-bold">Contact No:</td>
                    <td className="p-1.5 sm:p-2 font-mono">{customer.phone || 'N/A'}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-1.5 sm:p-2 bg-slate-50 font-bold">Email Address:</td>
                    <td className="p-1.5 sm:p-2">{customer.email || 'N/A'}</td>
                    <td className="p-1.5 sm:p-2 bg-slate-50 font-bold">Nominee / NOK:</td>
                    <td className="p-1.5 sm:p-2">{customer.nokName || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="p-1.5 sm:p-2 bg-slate-50 font-bold">Mailing Address:</td>
                    <td colSpan={3} className="p-1.5 sm:p-2">{customer.mailingAddress || 'N/A'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Plot Allocation Particulars */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1 border-b border-slate-200 pb-1">
                Section II: Allocated Plot Particulars
              </div>
              <table className="w-full text-xs border border-slate-300">
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="p-1.5 sm:p-2 bg-slate-50 font-bold w-1/4">Plot Number:</td>
                    <td className="p-1.5 sm:p-2 font-mono font-bold w-1/4">{plot.plotNumber}</td>
                    <td className="p-1.5 sm:p-2 bg-slate-50 font-bold w-1/4">Assigned Block:</td>
                    <td className="p-1.5 sm:p-2 uppercase font-bold w-1/4">{plot.blockId}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-1.5 sm:p-2 bg-slate-50 font-bold">Size / Dimensions:</td>
                    <td className="p-1.5 sm:p-2">{plot.size}</td>
                    <td className="p-1.5 sm:p-2 bg-slate-50 font-bold">Category:</td>
                    <td className="p-1.5 sm:p-2 capitalize">{plot.category}</td>
                  </tr>
                  <tr>
                    <td className="p-1.5 sm:p-2 bg-slate-50 font-bold">Total Plot Value:</td>
                    <td colSpan={3} className="p-1.5 sm:p-2 font-bold text-slate-900">
                      PKR {effectivePrice.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Payment Terms & Schedule Structure */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1 border-b border-slate-200 pb-1">
                Section III: Payment Terms & Schedule Structure
              </div>
              <table className="w-full text-xs border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 text-left">
                    <th className="p-1.5 sm:p-2">Description</th>
                    <th className="p-1.5 sm:p-2">Amount (PKR)</th>
                    <th className="p-1.5 sm:p-2">Payment Status</th>
                    <th className="p-1.5 sm:p-2">Classification</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentType === 'installment' && (
                    <tr className="border-b border-slate-200">
                      <td className="p-1.5 sm:p-2 font-semibold">Plot Upfront Downpayment</td>
                      <td className="p-1.5 sm:p-2 font-mono">{downpayment.toLocaleString()}</td>
                      <td className="p-1.5 sm:p-2 font-bold text-emerald-700">PAID UPFRONT</td>
                      <td className="p-1.5 sm:p-2 text-slate-500">Initial Booking Downpayment</td>
                    </tr>
                  )}
                  <tr>
                    <td className="p-1.5 sm:p-2 font-semibold">
                      Plot Payment:{' '}
                      {paymentType === 'installment'
                        ? `${planYears}-Year Fixed Schedule`
                        : 'Full Upfront Payment'}
                    </td>
                    <td className="p-1.5 sm:p-2 font-mono font-bold">
                      {effectivePrice.toLocaleString()}
                    </td>
                    <td className="p-1.5 sm:p-2 font-bold text-indigo-700">
                      {paymentType === 'installment'
                        ? `Downpayment Paid • ${totalInstallments} Installments Scheduled`
                        : 'Full Payment Paid'}
                    </td>
                    <td className="p-1.5 sm:p-2 text-slate-500">
                      {paperRef ? `Ref: ${paperRef}` : 'Standard Schedule'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Signatures */}
            <div className="pt-5 sm:pt-6 border-t border-slate-300 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-center text-xs">
              <div>
                <div className="h-9 sm:h-11 border-b border-dashed border-slate-400 mb-1.5 sm:mb-2" />
                <div className="font-bold text-slate-800 text-[11px] sm:text-xs">Applicant Signature</div>
                <div className="text-[10px] text-slate-400">Allottee Member</div>
              </div>

              <div>
                <div className="h-9 sm:h-11 border-b border-dashed border-slate-400 mb-1.5 sm:mb-2" />
                <div className="font-bold text-slate-800 text-[11px] sm:text-xs">Authorized Officer</div>
                <div className="text-[10px] text-slate-400">Prime View Operations</div>
              </div>

              <div>
                <div className="h-9 sm:h-11 border-b border-dashed border-slate-400 mb-1.5 sm:mb-2" />
                <div className="font-bold text-slate-800 text-[11px] sm:text-xs">Society Secretary</div>
                <div className="text-[10px] text-slate-400">Executive Committee Seal</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
