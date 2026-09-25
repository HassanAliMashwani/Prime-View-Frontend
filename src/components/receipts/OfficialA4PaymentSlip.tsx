'use client';

import React from 'react';
import { ReceiptSlipData, ReceiptSubmission } from '@/lib/mock/types';
import {
  Printer,
  X,
  ShieldCheck,
  Building2,
  CheckCircle2,
  Scissors,
  QrCode,
  Lock,
} from 'lucide-react';

/** Stable public verify URL — uses NEXT_PUBLIC_APP_URL or window.location.origin, never an invented domain */
function slipVerifyUrl(slipNumber: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const base = (process.env.NEXT_PUBLIC_APP_URL || origin).replace(/\/$/, '');
  return base ? `${base}/verify/${slipNumber}` : `/verify/${slipNumber}`;
}

export function formatAmountInWords(amount: number): string {
  const rounded = Math.round(Number(amount) || 0);
  if (rounded <= 0) return 'Zero Rupees Only';

  const units = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function toWords(n: number): string {
    if (n === 0) return '';
    if (n < 20) return units[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + units[n % 10] : '');
    if (n < 1000) return units[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + toWords(n % 100) : '');
    if (n < 1000000) return toWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + toWords(n % 1000) : '');
    if (n < 1000000000) return toWords(Math.floor(n / 1000000)) + ' Million' + (n % 1000000 ? ' ' + toWords(n % 1000000) : '');
    return toWords(Math.floor(n / 1000000000)) + ' Billion' + (n % 1000000000 ? ' ' + toWords(n % 1000000000) : '');
  }

  return `${toWords(rounded)} Rupees Only`;
}

export interface SlipRenderModel {
  slipNumber: string;
  securityHash: string;
  qrPayload: string;
  customerName: string;
  membershipNo: string;
  plotNumber: string;
  blockName: string;
  installmentNumber?: number;
  amount: number;
  amountInWords: string;
  bankName: string;
  transactionRef: string;
  depositDate: string;
  verifiedDate: string;
  verifiedBy: string;
}

export function buildSlipDataFromSubmission(
  sub: ReceiptSubmission,
  fallbacks?: {
    customerName?: string;
    membershipNo?: string;
    plotNumber?: string;
    blockName?: string;
  }
): SlipRenderModel {
  const customerName = (
    sub.customerName ||
    (sub as any).customer?.fullName ||
    fallbacks?.customerName ||
    '—'
  ).trim();

  const membershipNo = (
    sub.membershipNo ||
    (sub as any).customer?.membershipNo ||
    fallbacks?.membershipNo ||
    '—'
  ).trim();

  const plotNumber = (
    sub.plotNumber ||
    (sub as any).plot?.plotNumber ||
    fallbacks?.plotNumber ||
    '—'
  ).trim();

  const blockName = (
    sub.blockName ||
    (sub as any).plot?.blockName ||
    (sub as any).plot?.block?.name ||
    (sub as any).plot?.blockId ||
    fallbacks?.blockName ||
    ''
  ).trim();

  const slipNumber = sub.slip?.slipNumber || (sub as any).slipNumber || `PV-SLIP-${new Date().getFullYear()}-${sub.id.slice(-4)}`;

  return {
    slipNumber,
    customerName,
    membershipNo,
    plotNumber,
    blockName,
    installmentNumber: sub.installmentNumber,
    amount: sub.amount,
    amountInWords: formatAmountInWords(sub.amount),
    bankName: sub.depositoryBank || sub.bankName || 'Meezan Bank Ltd',
    transactionRef: sub.transactionRef,
    depositDate: sub.paymentDate ? String(sub.paymentDate).split('T')[0] : '—',
    verifiedDate: sub.verifiedAt ? String(sub.verifiedAt).split('T')[0] : new Date().toISOString().split('T')[0],
    verifiedBy: sub.verifiedByAdminName || (sub as any).verifiedBy || 'Society Secretariat / Finance Officer',
    securityHash: sub.slip?.securityHash || (sub as any).securityHash || `PV-SEC-${sub.id.slice(-6).toUpperCase()}`,
    qrPayload: slipVerifyUrl(slipNumber),
  };
}

interface OfficialA4PaymentSlipProps {
  slip: SlipRenderModel;
  submission?: ReceiptSubmission;
  viewMode?: 'admin' | 'customer' | 'full';
  onClose?: () => void;
}

export const OfficialA4PaymentSlip: React.FC<OfficialA4PaymentSlipProps> = ({
  slip,
  submission,
  viewMode = 'full',
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const formatPKR = (amount: number) =>
    new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      maximumFractionDigits: 0,
    }).format(amount);

  const isCustomerView = viewMode === 'customer';

  const displayCustomerName = (
    slip.customerName?.trim() ||
    submission?.customerName?.trim() ||
    (submission as any)?.customer?.fullName?.trim() ||
    '—'
  );

  const displayMembershipNo = (
    slip.membershipNo?.trim() ||
    submission?.membershipNo?.trim() ||
    (submission as any)?.customer?.membershipNo?.trim() ||
    '—'
  );

  const rawPlotNum = (
    slip.plotNumber?.trim() ||
    submission?.plotNumber?.trim() ||
    (submission as any)?.plot?.plotNumber?.trim() ||
    ''
  );
  const plotNumClean = rawPlotNum === '—' ? '' : rawPlotNum;

  const rawBlockName = (
    slip.blockName?.trim() ||
    submission?.blockName?.trim() ||
    (submission as any)?.plot?.blockName?.trim() ||
    (submission as any)?.plot?.block?.name?.trim() ||
    (submission as any)?.plot?.blockId?.trim() ||
    ''
  );
  const blockNameClean = rawBlockName === '—' ? '' : rawBlockName;

  let displayPlotUpper = '—';
  let displayPlotLower = '—';
  if (plotNumClean && blockNameClean) {
    displayPlotUpper = `Plot ${plotNumClean} • ${blockNameClean}`;
    displayPlotLower = `Plot ${plotNumClean} (${blockNameClean})`;
  } else if (plotNumClean) {
    displayPlotUpper = `Plot ${plotNumClean}`;
    displayPlotLower = `Plot ${plotNumClean}`;
  } else if (blockNameClean) {
    displayPlotUpper = blockNameClean;
    displayPlotLower = blockNameClean;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      {/* Container simulating A4 sheet */}
      <div id="pv-official-slip-printable" className="relative max-w-4xl w-full bg-white text-[#151914] shadow-2xl rounded-2xl print:rounded-none print:shadow-none print:border-none border border-black/15 overflow-hidden flex flex-col my-auto print:m-0">
        {/* Top Control Bar (Hidden on Print) */}
        <div className="no-print bg-[#151914] text-white px-6 py-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#43612B] flex items-center justify-center text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight">
                {isCustomerView
                  ? `Official Member Payment Slip \u2022 ${slip.slipNumber}`
                  : `Official A4 Verified Payment Slip \u2022 ${slip.slipNumber}`}
              </h3>
              <p className="text-[11px] text-[#A6ADA0]">
                {isCustomerView
                  ? 'Official Customer Copy \u2022 Retained Record'
                  : 'Two-Part Slip: Upper (Society Archive) \u2022 Lower (Customer Secured Copy)'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-[#43612B] hover:bg-[#365222] text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{isCustomerView ? 'Print Member Slip' : 'Print A4 Slip'}</span>
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════════════ */}
        {/* A4 Printable Sheet Container */}
        {/* ═════════════════════════════════════════════════════════════════════════ */}
        <div className="p-8 sm:p-10 space-y-8 bg-white print:p-6 print:space-y-6 text-[#151914] font-sans">
          {!isCustomerView && (
            <>
              {/* ────────────────────────────────────────────────────────────────── */}
              {/* UPPER HALF: SOCIETY ARCHIVE / OFFICE RECORD                         */}
              {/* ────────────────────────────────────────────────────────────────── */}
              <section className="border-2 border-dashed border-black/20 rounded-2xl p-6 relative bg-[#FCFBF9] print:bg-white print:p-4">
                {/* Header Stamp */}
                <div className="flex items-start justify-between border-b border-black/10 pb-4 gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-serif font-black tracking-wider text-lg sm:text-xl text-[#151914] uppercase">
                        Prime View Housing Society Ltd
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6B7462] mt-0.5">
                      Registered Society KPK &bull; PrimeView Cooperative Housing Society Abt &bull; Reg No. PV/KPK/2021-09
                    </p>
                    <p className="text-[10px] text-[#6B7462]">
                      Central Secretariat: Main Boulevard, Abbottabad Road, KPK
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="inline-block px-3 py-1 rounded bg-[#151914] text-white text-[10px] font-bold tracking-widest uppercase">
                      Upper Part &bull; Society Office Copy
                    </span>
                    <p className="text-xs font-mono font-bold text-[#43612B] mt-1.5">
                      Slip #{slip.slipNumber}
                    </p>
                    <p className="text-[10px] text-[#6B7462]">Issued: {slip.verifiedDate}</p>
                  </div>
                </div>

                {/* Upper Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 text-xs border-b border-black/10">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#6B7462] block">
                      Member Name
                    </span>
                    <p className="font-bold text-[#151914]">{displayCustomerName}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#6B7462] block">
                      Membership No
                    </span>
                    <p className="font-mono font-bold text-[#151914]">{displayMembershipNo}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#6B7462] block">
                      Plot Allotment
                    </span>
                    <p className="font-bold text-[#43612B]">{displayPlotUpper}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#6B7462] block">
                      Payment Account
                    </span>
                    <p className="font-bold text-[#151914]">
                      {slip.installmentNumber ? `Installment #${slip.installmentNumber}` : 'Full Payment'}
                    </p>
                  </div>
                </div>

                {/* Upper Financial & Audit Details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#6B7462] block">
                      Bank / Mode
                    </span>
                    <p className="font-semibold text-[#151914]">{slip.bankName}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#6B7462] block">
                      Bank Reference / Challan
                    </span>
                    <p className="font-mono font-bold text-[#151914]">{slip.transactionRef}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#6B7462] block">
                      Deposit Date
                    </span>
                    <p className="font-medium text-[#151914]">{slip.depositDate ? String(slip.depositDate).split('T')[0] : '—'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#6B7462] block">
                      Amount Deposited
                    </span>
                    <p className="font-display font-bold text-base text-[#43612B]">
                      {formatPKR(slip.amount)}
                    </p>
                  </div>
                </div>

                {/* Office Security & Audit Footer */}
                <div className="mt-4 pt-3 border-t border-black/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-[#6B7462]">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#43612B]" />
                    <span>
                      <strong>Internal Audit Status:</strong> Verified and reconciled with bank statement by {slip.verifiedBy}
                    </span>
                  </div>
                  <div className="font-mono text-[9px] bg-black/5 px-2 py-0.5 rounded">
                    Hash: {slip.securityHash.slice(0, 16)}...
                  </div>
                </div>

                {/* Upper Half QR — same URL as lower, stable public origin */}
                <div className="mt-3 pt-3 border-t border-black/10 flex items-center gap-3">
                  <a
                    href={slipVerifyUrl(slip.slipNumber)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-20 h-20 bg-white border-2 border-[#43612B] rounded-xl p-1 flex flex-col items-center justify-center shadow-xs shrink-0 hover:border-[#365222] transition-colors"
                    title="Scan or click to verify this receipt"
                  >
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(slipVerifyUrl(slip.slipNumber))}`}
                      alt={`QR Code for ${slip.slipNumber}`}
                      className="w-14 h-14 object-contain"
                      onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                    />
                    <span className="text-[8px] font-bold font-mono tracking-tighter text-[#43612B] mt-0.5">SCAN TO VERIFY</span>
                  </a>
                  <p className="text-[10px] text-[#6B7462] leading-tight">
                    Society Archive Copy — scan or visit <span className="font-mono font-semibold text-[#43612B]">{slipVerifyUrl(slip.slipNumber)}</span>
                  </p>
                </div>
              </section>

              {/* ────────────────────────────────────────────────────────────────── */}
              {/* PERFORATION DIVIDER                                                */}
              {/* ────────────────────────────────────────────────────────────────── */}
              <div className="relative flex items-center justify-center my-6">
                <div className="w-full border-t-2 border-dashed border-black/30" />
                <div className="absolute bg-white px-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#6B7462]">
                  <Scissors className="w-4 h-4 text-[#43612B]" />
                  <span>Cut / Tear Along Perforation &bull; Lower Part Given to Member</span>
                </div>
              </div>
            </>
          )}

          {/* ────────────────────────────────────────────────────────────────── */}
          {/* LOWER HALF: CUSTOMER SECURED COPY (WITH ANTI-COPY IDENTIFICATION) */}
          {/* ────────────────────────────────────────────────────────────────── */}
          <section className="relative border-2 border-[#43612B] rounded-2xl p-6 sm:p-7 bg-white shadow-xs overflow-hidden print:p-4">
            {/* Anti-Copy Watermark in background */}
            <div className="absolute inset-0 pointer-events-none select-none flex items-center justify-center opacity-[0.04] rotate-[-20deg]">
              <span className="text-6xl sm:text-7xl font-black uppercase text-black tracking-widest text-center">
                PRIME VIEW &bull; ORIGINAL VERIFIED RECEIPT
              </span>
            </div>

            {/* Member Copy Header */}
            <div className="flex items-start justify-between border-b-2 border-[#43612B]/30 pb-4 gap-4 relative z-10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-serif font-black tracking-wider text-xl sm:text-2xl text-[#151914] uppercase">
                    Prime View Housing Society
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#EAF0E7] text-[#43612B] border border-[#43612B]/30 text-[10px] font-bold uppercase">
                    Official Member Slip
                  </span>
                </div>
                <p className="text-xs text-[#6B7462]">
                  Registered Society KPK &bull; PrimeView Cooperative Housing Society Abt &bull; Co-operative Societies Act 1925
                </p>
                <p className="text-[11px] text-[#43612B] font-semibold">
                  Official Verified Payment Receipt &bull; Customer Retained Record
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="inline-block px-3.5 py-1 rounded-full bg-[#43612B] text-white text-[11px] font-bold tracking-wider uppercase shadow-xs">
                  Member Copy
                </span>
                <p className="text-sm font-mono font-bold text-[#151914] mt-2">
                  Receipt #{slip.slipNumber}
                </p>
                <p className="text-[11px] text-[#6B7462]">Cleared On: {slip.verifiedDate}</p>
              </div>
            </div>

            {/* Member & Plot Details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 text-xs border-b border-black/10 relative z-10">
              <div>
                <span className="text-[10px] font-bold uppercase text-[#6B7462] block">
                  Allotment Member
                </span>
                <p className="font-bold text-sm text-[#151914]">{displayCustomerName}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-[#6B7462] block">
                  Membership No
                </span>
                <p className="font-mono font-bold text-sm text-[#43612B]">{displayMembershipNo}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-[#6B7462] block">
                  Plot Designation
                </span>
                <p className="font-bold text-sm text-[#151914]">{displayPlotLower}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-[#6B7462] block">
                  Payment Nature
                </span>
                <p className="font-bold text-sm text-[#151914]">
                  {slip.installmentNumber ? `Installment #${slip.installmentNumber}` : 'Full Payment'}
                </p>
              </div>
            </div>

            {/* Financial Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 text-xs border-b border-black/10 relative z-10 bg-[#FAF9F5] p-4 rounded-xl my-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-[#6B7462] block">
                  Deposited Amount
                </span>
                <p className="font-display font-extrabold text-xl text-[#43612B]">
                  {formatPKR(slip.amount)}
                </p>
              </div>
              <div className="sm:col-span-2">
                <span className="text-[10px] font-bold uppercase text-[#6B7462] block">
                  Amount in Words
                </span>
                <p className="font-serif font-bold text-sm text-[#151914] italic">
                  {slip.amountInWords}
                </p>
              </div>
            </div>

            {/* Banking Details */}
            <div className="grid grid-cols-3 gap-4 py-2 text-xs border-b border-black/10 relative z-10">
              <div>
                <span className="text-[10px] font-bold uppercase text-[#6B7462] block">
                  Depository Bank
                </span>
                <p className="font-semibold text-[#151914]">{slip.bankName}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-[#6B7462] block">
                  Bank Trx / Slip Ref
                </span>
                <p className="font-mono font-bold text-[#151914]">{slip.transactionRef}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-[#6B7462] block">
                  Transaction Date
                </span>
                <p className="font-medium text-[#151914]">{slip.depositDate ? String(slip.depositDate).split('T')[0] : '—'}</p>
              </div>
            </div>

            {/* ── ANTI-COPY UNIQUE IDENTIFICATION & SECURITY EMBED ── */}
            <div className="mt-5 pt-4 flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
              {/* Left Security Verification Box */}
              <div className="flex items-center gap-4">
                {/* Visual Security QR Stamp */}
                <a
                  href={`/verify/${encodeURIComponent(slip.slipNumber)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-24 h-24 bg-white border-2 border-[#43612B] rounded-xl p-1.5 flex flex-col items-center justify-center shadow-xs shrink-0 relative group hover:border-[#365222] transition-colors"
                  title="Click to test official public verification"
                >
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(slipVerifyUrl(slip.slipNumber))}`}
                    alt={`QR Code for ${slip.slipNumber}`}
                    className="w-16 h-16 object-contain"
                    onError={(e) => {
                      // Fallback if network fails
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                  <span className="text-[8px] font-bold font-mono tracking-tighter text-[#43612B] mt-0.5 group-hover:underline">
                    SCAN TO VERIFY
                  </span>
                </a>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#43612B]">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Cryptographic Anti-Tamper Security Hash:</span>
                  </div>
                  <div className="font-mono font-bold text-xs bg-[#FAF9F5] border border-black/10 px-3 py-1.5 rounded-lg text-[#151914] select-all">
                    {slip.securityHash}
                  </div>
                  <p className="text-[10px] text-[#6B7462] leading-tight max-w-sm">
                    This security hash links directly to immutable ledger records. Scan the QR code or visit{' '}
                    <a
                      href={slipVerifyUrl(slip.slipNumber)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono font-semibold text-[#43612B] underline hover:text-[#365222]"
                    >
                      {slipVerifyUrl(slip.slipNumber)}
                    </a>
                  </p>
                </div>
              </div>

              {/* Right Signature & Seal Box */}
              <div className="text-center sm:text-right shrink-0 space-y-2">
                <div className="inline-block border-b-2 border-black/40 pb-1 px-4 text-center">
                  <p className="font-serif italic text-xs font-bold text-[#151914]">
                    {slip.verifiedBy}
                  </p>
                  <p className="text-[9px] uppercase tracking-wider text-[#6B7462]">
                    Director Finance &bull; Society Secretariat
                  </p>
                </div>
                <div className="flex items-center justify-center sm:justify-end gap-1.5 text-[10px] text-[#43612B] font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Authorized Society Digital Stamp</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
