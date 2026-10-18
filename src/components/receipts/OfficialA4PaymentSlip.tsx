'use client';

import React from 'react';
import QRCode from 'qrcode';
import { ReceiptSubmission } from '@/lib/mock/types';
import {
  Printer,
  X,
  ShieldCheck,
  Receipt,
  Building2,
  Calendar,
  CreditCard,
  User,
  Home,
  FileText,
  Coins,
  PenLine,
  Info,
  Lock,
} from 'lucide-react';
import { formatCnic } from '@/lib/utils/cnic';

/**
 * Format CNIC to 5-7-1 (00000-0000000-0) before drawing on receipt:
 * Takes only digits from stored CNIC and places dashes after 5th and 12th digits.
 * If stored value does not contain exactly 13 digits, prints as stored without inventing digits.
 */
export function formatSlipCnic(raw?: string | null): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  const digitsOnly = trimmed.replace(/\D/g, '');
  if (digitsOnly.length !== 13) {
    return trimmed;
  }
  return formatCnic(trimmed);
}

/**
 * Stable public verify URL builder using current origin or NEXT_PUBLIC_APP_URL.
 */
export function getSlipVerifyUrl(slipNumber: string): string {
  const clean = encodeURIComponent((slipNumber || '').trim().replace(/[.,;:/\\]+$/, ''));
  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');

  if (typeof window !== 'undefined' && window.location?.origin) {
    const host = window.location.hostname;
    if ((host === 'localhost' || host === '127.0.0.1') && configuredAppUrl && !configuredAppUrl.includes('localhost') && !configuredAppUrl.includes('127.0.0.1') && !configuredAppUrl.includes('192.168.1.4')) {
      return `${configuredAppUrl}/verify/${clean}`;
    }
    return `${window.location.origin}/verify/${clean}`;
  }

  const base = (configuredAppUrl && !configuredAppUrl.includes('192.168.1.4')) ? configuredAppUrl : 'http://localhost:3000';
  return `${base}/verify/${clean}`;
}

const qrSvgCache = new Map<string, string>();

/**
 * Hook to generate SVG QR code data URI using qrcode package.
 * Encodes getSlipVerifyUrl(slipNumber) with error correction 'M' and margin 2.
 */
export function useSlipQrCode(verifyUrl: string): string {
  const [dataUri, setDataUri] = React.useState<string>(() => qrSvgCache.get(verifyUrl) || '');

  React.useEffect(() => {
    if (!verifyUrl) return;
    if (qrSvgCache.has(verifyUrl)) {
      setDataUri(qrSvgCache.get(verifyUrl)!);
      return;
    }
    let isCurrent = true;
    QRCode.toString(verifyUrl, {
      type: 'svg',
      errorCorrectionLevel: 'M',
      margin: 2,
    })
      .then((svg) => {
        const uri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
        qrSvgCache.set(verifyUrl, uri);
        if (isCurrent) {
          setDataUri(uri);
        }
      })
      .catch(() => {
        QRCode.toDataURL(verifyUrl, { errorCorrectionLevel: 'M', margin: 2, width: 280 })
          .then((pngUri) => {
            qrSvgCache.set(verifyUrl, pngUri);
            if (isCurrent) {
              setDataUri(pngUri);
            }
          })
          .catch((err) => {
            console.error('Failed to generate verification QR code:', err);
          });
      });
    return () => {
      isCurrent = false;
    };
  }, [verifyUrl]);

  return dataUri;
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

  return (toWords(rounded).trim() + ' Rupees Only').replace(/\s+/g, ' ');
}

export interface SlipRenderModel {
  slipNumber: string;
  securityHash: string;
  qrPayload: string;
  customerName: string;
  fatherOrHusbandName: string;
  cnic: string;
  membershipNo: string;
  bookingFileNo: string; // stays blank per requirements
  blockName: string;
  plotNumber: string;
  plotSize: string;
  plotCategory: string; // 'Residential' | 'Commercial'
  installmentNumber?: number | null;
  paymentType?: string;
  feeType?: string;
  onAccountOf: string;
  // Category boxes:
  isInstallmentCategory: boolean;
  isFullSettlementCategory: boolean;
  isBookingCategory: boolean;
  isTransferFeeCategory: boolean;
  isDownPaymentCategory: boolean;
  // Membership plan boxes:
  isFullPaymentPlan: boolean;
  isInstallmentsPlan: boolean;
  // Payment Received In:
  isCash: boolean;
  isBank: boolean;
  isCheque: boolean;
  bankName: string;
  transactionRef: string;
  depositDate: string;
  verifiedDate: string;
  verifiedBy: string;
  amount: number;
  amountInWords: string;
}

export function buildSlipDataFromSubmission(
  sub: ReceiptSubmission | any,
  fallbacks?: {
    customerName?: string;
    membershipNo?: string;
    fatherOrHusbandName?: string;
    cnic?: string;
    plotNumber?: string;
    blockName?: string;
    plotSize?: string;
    plotCategory?: string;
  }
): SlipRenderModel {
  const customerName = (
    sub.customerName ||
    (sub as any).customer?.fullName ||
    fallbacks?.customerName ||
    ''
  ).trim();

  const fatherOrHusbandName = (
    sub.fatherOrHusbandName ||
    (sub as any).customer?.fatherOrHusbandName ||
    fallbacks?.fatherOrHusbandName ||
    ''
  ).trim();

  const rawCnic = (
    sub.customerCnic ||
    (sub as any).customer?.cnic ||
    (sub as any).cnic ||
    fallbacks?.cnic ||
    ''
  ).trim();
  const cnic = formatSlipCnic(rawCnic);

  const membershipNo = (
    sub.membershipNo ||
    (sub as any).customer?.membershipNo ||
    fallbacks?.membershipNo ||
    ''
  ).trim();

  const plotNumber = (
    sub.plotNumber ||
    (sub as any).plot?.plotNumber ||
    fallbacks?.plotNumber ||
    ''
  ).trim();

  const blockName = (
    sub.blockName ||
    (sub as any).plot?.blockName ||
    (sub as any).plot?.block?.name ||
    (sub as any).plot?.blockId ||
    fallbacks?.blockName ||
    ''
  ).trim();

  const plotSize = (
    sub.plotSize ||
    (sub as any).plot?.size ||
    fallbacks?.plotSize ||
    ''
  ).trim();

  const rawCategory = (
    sub.plotCategory ||
    (sub as any).plot?.category ||
    fallbacks?.plotCategory ||
    ''
  ).toLowerCase().trim();
  const plotCategory = rawCategory.includes('com') ? 'Commercial' : (rawCategory ? 'Residential' : 'Residential');

  const slipNumber =
    sub.slip?.slipNumber ||
    (sub as any).slipNumber ||
    `PV-SLIP-${new Date().getFullYear()}-${sub.id ? String(sub.id).slice(-4) : '0000'}`;

  const feeType = (
    sub.feeType ||
    (sub as any).paymentRecord?.feeType ||
    (sub as any).paymentRecordFeeType ||
    ''
  ).toLowerCase().trim();

  const instNum =
    sub.installmentNumber !== undefined && sub.installmentNumber !== null && !isNaN(Number(sub.installmentNumber))
      ? Number(sub.installmentNumber)
      : null;

  // Rules:
  // Check Installment, check Installments, and set On Account Of to Installment #N when the receipt is an installment.
  // Check Full Payment, leave Installment empty, and set On Account Of to Full Payment when the receipt is a full payment.
  // Check Full settlement only when the saved fee type is plot_one_time, or the payment type is one_time and there is no installment number.
  // Also check Membership Fee for admission_fee, Share Fee for share_subscription_fee, and Down Payment for plot_downpayment.
  // Leave Booking and Transfer Fee empty.
  // A balloon payment stays the installment or full payment it already is.

  const isExplicitOneTime = sub.paymentType === 'one_time' || feeType === 'plot_one_time';
  const isInstallment = !isExplicitOneTime && (
    feeType === 'plot_installment' ||
    (instNum !== null && instNum > 0) ||
    sub.paymentType === 'installment'
  );

  const isFullPayment = !isInstallment && (
    isExplicitOneTime ||
    sub.paymentType === 'full' ||
    sub.paymentType === 'full_payment'
  );

  const isInstallmentCategory = isInstallment;
  const isFullSettlementCategory = (feeType === 'plot_one_time' || (sub.paymentType === 'one_time' && instNum === null));
  const isBookingCategory = false;
  const isTransferFeeCategory = false;
  const isDownPaymentCategory = feeType === 'plot_downpayment';

  const isInstallmentsPlan = isInstallment || isDownPaymentCategory;
  const isFullPaymentPlan = isFullPayment || isFullSettlementCategory || (!isInstallmentsPlan && isExplicitOneTime);

  let onAccountOf = '';
  if (isInstallment) {
    onAccountOf = instNum !== null ? `Installment #${instNum}` : 'Installment';
  } else if (isFullPayment || isFullSettlementCategory) {
    onAccountOf = 'Full Payment';
  } else if (isDownPaymentCategory) {
    onAccountOf = 'Down Payment';
  } else {
    onAccountOf = (sub as any).notes || 'Full Payment';
  }

  const amount = Number(sub.amount) || 0;

  return {
    slipNumber,
    securityHash: (
      sub.securityHashDisplay ||
      (sub.hashKeyVersion && sub.integrityHash ? sub.integrityHash.substring(0, 16) : '') ||
      sub.securityHash ||
      sub.slip?.securityHash ||
      (sub as any).securityHash ||
      ''
    ),
    qrPayload: (
      sub.slip?.qrTarget ||
      (sub as any).qrTarget ||
      (sub.slip?.qrPayload && sub.slip.qrPayload.startsWith('http') ? sub.slip.qrPayload : undefined) ||
      getSlipVerifyUrl(slipNumber)
    ).replace('http://192.168.1.4:3000', 'http://localhost:3000').replace('192.168.1.4', 'localhost'),
    customerName,
    fatherOrHusbandName,
    cnic,
    membershipNo,
    bookingFileNo: '', // Booking / File No. stays blank. Do not print a booking id there.
    blockName,
    plotNumber,
    plotSize,
    plotCategory,
    installmentNumber: instNum,
    paymentType: sub.paymentType,
    feeType,
    onAccountOf,
    isInstallmentCategory,
    isFullSettlementCategory,
    isBookingCategory,
    isTransferFeeCategory,
    isDownPaymentCategory,
    isFullPaymentPlan,
    isInstallmentsPlan,
    isCash: false,
    isBank: true, // "These receipts are bank deposits, so Bank is checked and Cash and Cheque are empty."
    isCheque: false,
    bankName: (sub.depositoryBank || sub.bankName || (sub as any).depository_bank || '').trim(),
    transactionRef: (sub.transactionRef || (sub as any).transaction_ref || '').trim(),
    depositDate: sub.paymentDate ? String(sub.paymentDate).split('T')[0] : '—',
    verifiedDate: sub.verifiedAt
      ? String(sub.verifiedAt).split('T')[0]
      : (sub.paymentDate ? String(sub.paymentDate).split('T')[0] : new Date().toISOString().split('T')[0]),
    verifiedBy: sub.verifiedByAdminName || (sub as any).verifiedBy || 'Society Secretariat / Treasurer',
    amount,
    amountInWords: formatAmountInWords(amount),
  };
}

/**
 * Form Underline Field Component.
 * "Each value sits inside its own rule and does not touch the label."
 * The underline rule applies only to the value, not the label.
 */
const FormUnderlineField: React.FC<{
  label: string;
  value: React.ReactNode;
  labelWidth?: string;
  className?: string;
  rightSuffix?: React.ReactNode;
}> = ({ label, value, labelWidth = 'auto', className = '', rightSuffix }) => (
  <div className={`flex items-baseline min-h-[22px] text-[11px] leading-tight ${className}`}>
    <span
      className="shrink-0 text-slate-800 font-medium"
      style={labelWidth !== 'auto' ? { width: labelWidth } : undefined}
    >
      {label}
    </span>
    <span className="shrink-0 text-slate-500 font-normal px-1">:</span>
    <div className="grow border-b border-slate-500 flex items-baseline px-1 pb-0.5 min-h-[17px]">
      <span className="font-bold text-slate-900 truncate">
        {value || ''}
      </span>
    </div>
    {rightSuffix && (
      <span className="shrink-0 text-slate-600 text-[10px] pl-1.5 self-center">
        {rightSuffix}
      </span>
    )}
  </div>
);

/**
 * Official Form Checkbox Component matching client sheet aesthetics.
 */
const SlipCheckbox: React.FC<{
  label: string;
  checked?: boolean;
}> = ({ label, checked = false }) => (
  <div className="flex items-center gap-1.5 text-[11px] select-none">
    <div
      className={`w-3.5 h-3.5 rounded-xs flex items-center justify-center font-bold text-[10px] leading-none shrink-0 ${
        checked
          ? 'bg-[#1f4a30] text-white border border-[#1f4a30]'
          : 'bg-white border border-slate-500'
      }`}
      style={{
        backgroundColor: checked ? '#1f4a30' : '#ffffff',
        borderColor: checked ? '#1f4a30' : '#64748b',
        color: checked ? '#ffffff' : 'transparent',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      }}
    >
      {checked ? '✔' : ''}
    </div>
    <span className={`text-[11px] leading-none ${checked ? 'font-bold text-slate-900' : 'text-slate-800 font-medium'}`}>
      {label}
    </span>
  </div>
);

/**
 * Official Section Header Banner with icon and muted green tint.
 */
const SectionHeader: React.FC<{
  title: string;
  icon: React.ReactNode;
}> = ({ title, icon }) => (
  <div
    className="rounded-md px-2 py-0.5 flex items-center gap-2 mb-1.5 border border-[#c6d7c4]"
    style={{
      backgroundColor: '#e6eee5',
      borderColor: '#c6d7c4',
      WebkitPrintColorAdjust: 'exact',
      printColorAdjust: 'exact',
    }}
  >
    <div
      className="w-4 h-4 rounded-xs flex items-center justify-center text-white shrink-0 p-0.5"
      style={{
        backgroundColor: '#1c3829',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      }}
    >
      {icon}
    </div>
    <span
      className="font-bold text-[10.5px] tracking-[0.16em] uppercase"
      style={{
        color: '#1c3829',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      }}
    >
      {title}
    </span>
  </div>
);

export interface OfficialReceiptCopyProps {
  slip: SlipRenderModel;
  copyBadgeText?: 'ADMIN COPY (OFFICIAL VERIFIED RECEIPT)' | 'MEMBER COPY (OFFICIAL VERIFIED RECEIPT)' | string;
  copyBadgeTitle?: string;
  isReadOnly?: boolean;
}

/**
 * Single Official Receipt Sheet (Fits exactly on one A4 page).
 * Formulated with exact insetting, borders, logos, and print styles.
 */
export const OfficialReceiptCopy: React.FC<OfficialReceiptCopyProps> = ({
  slip,
  copyBadgeText,
  copyBadgeTitle,
}) => {
  const qrDataUri = useSlipQrCode(slip.qrPayload);
  const isCommercial = slip.plotCategory === 'Commercial';

  const rawTarget = (slip.qrPayload || getSlipVerifyUrl(slip.slipNumber) || '').trim();
  const verifyAddress = rawTarget
    .replace('http://192.168.1.4:3000', 'http://localhost:3000')
    .replace('https://192.168.1.4:3000', 'http://localhost:3000')
    .replace('192.168.1.4:3000', 'localhost:3000')
    .replace('192.168.1.4', 'localhost');

  const badgeString = copyBadgeText || copyBadgeTitle || 'MEMBER COPY';
  const badgeMain = badgeString.includes('ADMIN') ? 'ADMIN COPY' : 'MEMBER COPY';
  const badgeSub = '(OFFICIAL VERIFIED RECEIPT)';

  return (
    <div className="official-slip-page relative bg-white mx-auto select-text">
      <div
        className="official-slip-container relative w-full h-full flex flex-col justify-between"
        style={{
          border: '2px solid #1C3829',
          borderRadius: '8px',
          boxSizing: 'border-box',
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact',
        }}
      >
        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* HEADER SECTION (Left Logo, Center Text, Right Logo + Badge)       */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        <div className="relative shrink-0">
          <div className="flex items-start justify-between gap-2">
            {/* Left logo: Single main Prime View brand mark from public/new assests/updated Logo */}
            <div className="w-24 shrink-0 flex items-center justify-center pt-0.5">
              <img
                src="/new%20assests/updated%20Logo/prime-view-main-brand-logo.png"
                alt="Prime View Official Brand Mark"
                className="h-[74px] w-auto object-contain block"
                onError={(e) => {
                  e.currentTarget.src = '/invoice/prime-view-main-brand-logo.png';
                }}
              />
            </div>

            {/* Center: EXACT TEXT
                PRIME VIEW
                CO-OPERATIVE HOUSING SOCIETY LIMITED
                HAZARA DIVISION • ABBOTTABAD
                Under that, the title CASH RECEIPT */}
            <div className="grow text-center px-1">
              <h1 className="font-serif font-black text-2xl tracking-[0.15em] text-[#1c3829] leading-tight">
                PRIME VIEW
              </h1>
              <div className="font-serif font-bold text-[11.5px] tracking-[0.12em] text-[#244b34] mt-0.5">
                CO-OPERATIVE HOUSING SOCIETY LIMITED
              </div>
              <div className="text-[9px] tracking-[0.25em] text-[#4b6b55] font-semibold mt-0.5">
                HAZARA DIVISION • ABBOTTABAD
              </div>

              {/* Decorative mountain icon line below society header */}
              <div className="flex items-center justify-center gap-2 mt-1 w-48 mx-auto">
                <div className="h-[1px] bg-amber-700/50 grow" />
                <svg
                  className="w-5 h-3 text-amber-700/80 shrink-0"
                  viewBox="0 0 24 14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 12 L7 4 L11 9 L15 2 L22 12" />
                </svg>
                <div className="h-[1px] bg-amber-700/50 grow" />
              </div>
            </div>

            {/* Right logo: Co-operative Department KPK mark from public/new assests/updated Logo + Badge */}
            <div className="w-28 shrink-0 flex flex-col items-center pt-0.5">
              <img
                src="/new%20assests/updated%20Logo/cooperative-department-kpk-logo.png"
                alt="Co-operative Department KPK"
                className="h-[68px] w-auto object-contain block"
                onError={(e) => {
                  e.currentTarget.src = '/invoice/cooperative-department-kpk-logo.png';
                }}
              />
              {/* Badge: Page 1: ADMIN COPY (OFFICIAL VERIFIED RECEIPT) | Page 2: MEMBER COPY (OFFICIAL VERIFIED RECEIPT) */}
              <div
                className="mt-1 px-2.5 py-0.5 rounded-full border border-slate-400 text-center shadow-2xs w-full max-w-[125px]"
                style={{
                  backgroundColor: '#f1f5f1',
                  borderColor: '#94a3b8',
                  WebkitPrintColorAdjust: 'exact',
                  printColorAdjust: 'exact',
                }}
              >
                <div className="text-[8px] font-black tracking-wider leading-tight text-[#1c3829] uppercase">
                  {badgeMain}
                </div>
                <div className="text-[6.5px] font-bold text-slate-600 tracking-tight leading-tight uppercase">
                  {badgeSub}
                </div>
              </div>
            </div>
          </div>

          {/* Title: CASH RECEIPT with side divider lines */}
          <div className="flex items-center justify-center gap-3 my-1.5">
            <div className="h-[1.5px] bg-gradient-to-r from-transparent via-amber-700/40 to-amber-700/70 w-24" />
            <div
              className="px-7 py-0.5 rounded-full bg-[#edf2ec] border border-[#c6d7c4] shadow-2xs"
              style={{
                backgroundColor: '#edf2ec',
                borderColor: '#c6d7c4',
                WebkitPrintColorAdjust: 'exact',
                printColorAdjust: 'exact',
              }}
            >
              <span className="font-serif font-black text-base sm:text-lg tracking-[0.2em] text-[#1a3826]">
                CASH RECEIPT
              </span>
            </div>
            <div className="h-[1.5px] bg-gradient-to-l from-transparent via-amber-700/40 to-amber-700/70 w-24" />
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* 1. RECEIPT DETAILS                                                */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        <div className="shrink-0 mb-1.5">
          <SectionHeader
            title="RECEIPT DETAILS"
            icon={<Receipt className="w-2.5 h-2.5" />}
          />
          <div className="grid grid-cols-[1.25fr_1fr] gap-3 px-1">
            <div className="flex items-center gap-2">
              <Receipt className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="text-[11px] font-semibold text-slate-700 shrink-0">Receipt No.</span>
              <div className="grow min-w-0 border border-slate-400 rounded-md bg-white px-2 py-0.5 font-mono font-bold text-[10.5px] sm:text-[11.5px] text-slate-900 tracking-normal whitespace-nowrap overflow-visible shadow-2xs">
                {slip.slipNumber}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="text-[11px] font-semibold text-slate-700 shrink-0">Receipt Date</span>
              <div className="grow border border-slate-400 rounded-md bg-white px-2.5 py-0.5 font-mono font-bold text-[11.5px] text-slate-900 tracking-wider shadow-2xs">
                {slip.verifiedDate}
              </div>
            </div>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* 2. PAYMENT RECEIVED IN                                            */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        <div className="shrink-0 mb-1.5">
          <SectionHeader
            title="PAYMENT RECEIVED IN"
            icon={<CreditCard className="w-2.5 h-2.5" />}
          />
          <div className="grid grid-cols-12 gap-3 px-1 items-center">
            {/* Left checkboxes: Bank checked, Cash and Cheque empty */}
            <div className="col-span-5 flex items-center justify-between pr-3 border-r border-slate-200">
              <SlipCheckbox label="Cash" checked={slip.isCash} />
              <SlipCheckbox label="Bank" checked={slip.isBank} />
              <SlipCheckbox label="Cheque" checked={slip.isCheque} />
            </div>

            {/* Right stacked lines: Bank Name, Transaction Ref, Deposit Date */}
            <div className="col-span-7 flex items-start gap-2 pl-1">
              <Building2 className="w-4 h-4 text-slate-500 shrink-0 mt-1" />
              <div className="grow space-y-1">
                <FormUnderlineField
                  label="Bank Name"
                  value={slip.bankName}
                  labelWidth="160px"
                />
                <FormUnderlineField
                  label="Transaction / Reference No."
                  value={slip.transactionRef}
                  labelWidth="160px"
                />
                <FormUnderlineField
                  label="Deposit Date"
                  value={slip.depositDate}
                  labelWidth="160px"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* 3. MEMBER DETAILS                                                 */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        <div className="shrink-0 mb-1.5">
          <SectionHeader
            title="MEMBER DETAILS"
            icon={<User className="w-2.5 h-2.5" />}
          />
          <div className="grid grid-cols-2 gap-4 px-1">
            <div className="space-y-1">
              <FormUnderlineField
                label="Name"
                value={slip.customerName}
                labelWidth="60px"
              />
              <FormUnderlineField
                label="CNIC No."
                value={formatSlipCnic(slip.cnic)}
                labelWidth="60px"
              />
            </div>
            <div className="space-y-1">
              <FormUnderlineField
                label="Father’s / Husband’s Name"
                value={slip.fatherOrHusbandName}
                labelWidth="165px"
              />
              <FormUnderlineField
                label="Membership No."
                value={slip.membershipNo}
                labelWidth="165px"
              />
            </div>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* 4. PROPERTY DETAILS                                               */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        <div className="shrink-0 mb-1.5">
          <SectionHeader
            title="PROPERTY DETAILS"
            icon={<Home className="w-2.5 h-2.5" />}
          />
          <div className="grid grid-cols-2 gap-4 px-1">
            <div className="space-y-1">
              {/* Booking / File No. stays blank. Do not print a booking id there. */}
              <FormUnderlineField
                label="Booking / File No."
                value=""
                labelWidth="110px"
              />
              <FormUnderlineField
                label="Plot No."
                value={slip.plotNumber}
                labelWidth="110px"
              />
            </div>

            <div className="space-y-1">
              <FormUnderlineField
                label="Block"
                value={slip.blockName}
                labelWidth="65px"
              />
              <FormUnderlineField
                label="Plot Size"
                value={slip.plotSize}
                labelWidth="65px"
                rightSuffix="Marla ( )"
              />
              <FormUnderlineField
                label="Plot Type"
                value={isCommercial ? 'Commercial' : 'Residential'}
                labelWidth="65px"
                rightSuffix="(Residential / Commercial)"
              />
            </div>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* 5. PAYMENT DETAILS                                                */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        <div className="shrink-0 mb-1.5">
          <SectionHeader
            title="PAYMENT DETAILS"
            icon={<FileText className="w-2.5 h-2.5" />}
          />
          <div className="grid grid-cols-12 gap-3 px-1">
            {/* Left: Payment Category Boxes (Order: Installment, Full settlement, Booking, Transfer Fee, Membership Fee, Down Payment, Share Fee)
                The words Cash Plot must not appear. The box in that place says Full settlement. */}
            <div className="col-span-6 pr-2">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-800 mb-1.5">
                PAYMENT CATEGORY
              </div>
              <div className="grid grid-cols-2 gap-y-1.5 gap-x-2">
                <SlipCheckbox label="Installment" checked={slip.isInstallmentCategory} />
                <SlipCheckbox label="Full settlement" checked={slip.isFullSettlementCategory} />
                <SlipCheckbox label="Booking" checked={slip.isBookingCategory} />
                <SlipCheckbox label="Transfer Fee" checked={slip.isTransferFeeCategory} />
                <SlipCheckbox label="Down Payment" checked={slip.isDownPaymentCategory} />
              </div>
            </div>

            {/* Right: Membership Plan Boxes & On Account Of */}
            <div className="col-span-6 border-l border-dashed border-slate-300 pl-3 flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-800 mb-1.5">
                  MEMBERSHIP PLAN
                </div>
                <div className="flex items-center gap-6 mt-1 mb-2">
                  <SlipCheckbox label="Full Payment" checked={slip.isFullPaymentPlan} />
                  <SlipCheckbox label="Installments" checked={slip.isInstallmentsPlan} />
                </div>
              </div>

              <div className="mt-1">
                <FormUnderlineField
                  label="On Account Of"
                  value={slip.onAccountOf}
                  labelWidth="90px"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* 6. AMOUNT RECEIVED & IN WORDS                                     */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        <div
          className="shrink-0 mb-1.5 rounded-lg bg-[#ebf1eb] border border-[#cbd8cb] p-2 flex items-center justify-between gap-3 shadow-2xs"
          style={{
            backgroundColor: '#ebf1eb',
            borderColor: '#cbd8cb',
            WebkitPrintColorAdjust: 'exact',
            printColorAdjust: 'exact',
          }}
        >
          {/* Amount Box: PKR 520,833/- */}
          <div className="flex items-center gap-2 shrink-0">
            <div
              className="w-7 h-7 rounded-full bg-[#1c3829] text-white flex items-center justify-center shrink-0"
              style={{
                backgroundColor: '#1c3829',
                color: '#ffffff',
                WebkitPrintColorAdjust: 'exact',
                printColorAdjust: 'exact',
              }}
            >
              <Coins className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9.5px] font-bold text-slate-700 leading-tight">Amount</span>
              <span className="text-[9.5px] font-bold text-slate-700 leading-tight">Received</span>
            </div>
            <div
              className="border border-slate-400 rounded-md bg-white px-3 py-1 font-mono font-black text-sm sm:text-base text-slate-900 shadow-2xs tracking-tight"
              style={{
                backgroundColor: '#ffffff',
                borderColor: '#94a3b8',
                WebkitPrintColorAdjust: 'exact',
                printColorAdjust: 'exact',
              }}
            >
              PKR {Number(slip.amount).toLocaleString('en-US')}/-
            </div>
          </div>

          {/* In Words */}
          <div className="grow border-l border-slate-300 pl-3 flex flex-col justify-center">
            <span className="text-[9.5px] font-bold text-slate-600 uppercase tracking-wider mb-0.5">
              In Words
            </span>
            <div className="border-b border-slate-400 pb-0.5 text-[11px] font-bold text-slate-900 leading-tight">
              {slip.amountInWords}
            </div>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* 7. LOWER SECTION: Stamp / Instructions / Verification QR         */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        <div className="shrink-0 mb-1 grid grid-cols-12 gap-3 px-1">
          {/* Col 1: Stamp & Signature and Security Hash */}
          <div className="col-span-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-1 text-slate-800 font-bold text-[10px]">
                <PenLine className="w-3 h-3 text-slate-600" />
                <span>STAMP &amp; SIGNATURE</span>
              </div>
              {/* Stamp box: empty space for real physical ink stamp.
                  Label: Treasurer / Secretary. The words Treasurer / Accountant must not appear. */}
              <div className="border border-slate-400 rounded-md bg-white p-2 h-20 flex flex-col justify-end items-center shadow-2xs">
                <div className="w-44 border-b border-slate-700 mb-1.5" />
                <span className="text-[9.5px] font-bold text-slate-800 tracking-tight">
                  Treasurer / Secretary
                </span>
              </div>
            </div>

            {/* Security Hash Box */}
            <div className="mt-1.5">
              <div className="flex items-center gap-1.5 mb-0.5 text-slate-800 font-bold text-[9.5px]">
                <Lock className="w-3 h-3 text-slate-600" />
                <span>SECURITY HASH</span>
              </div>
              <div className="border border-slate-400 rounded-md bg-white px-2 py-0.5 font-mono font-bold text-[10px] text-slate-900 select-all tracking-wider text-center truncate shadow-2xs">
                {slip.securityHash || '—'}
              </div>
            </div>
          </div>

          {/* Col 2: Special Instructions (Exact 1, 2, 3) */}
          <div className="col-span-5 flex flex-col">
            <div className="flex items-center gap-1.5 mb-1 text-slate-800 font-bold text-[10px]">
              <Info className="w-3 h-3 text-slate-600" />
              <span>SPECIAL INSTRUCTIONS</span>
            </div>
            <div className="border border-slate-400 rounded-md bg-white p-2 h-[135px] flex flex-col justify-center text-[9px] text-slate-700 leading-relaxed shadow-2xs">
              <ol className="list-decimal pl-3 space-y-1 font-medium">
                <li>Please make sure to pay the installment before 05th day of each month.</li>
                <li>Don’t forget to receive the duly stamped receipt from the treasurer.</li>
                <li>Keep the receipt in original with your plot file, which shall be demanded at time of dues clearance certificate.</li>
              </ol>
            </div>
          </div>

          {/* Col 3: Receipt Verification QR */}
          <div className="col-span-3 flex flex-col">
            <div className="flex items-center gap-1.5 mb-1 text-slate-800 font-bold text-[10px]">
              <ShieldCheck className="w-3 h-3 text-slate-600" />
              <span>RECEIPT VERIFICATION</span>
            </div>
            <div className="border border-slate-400 rounded-md bg-white p-1 h-[135px] flex flex-col items-center justify-center text-center shadow-2xs overflow-hidden">
              {qrDataUri ? (
                <div className="flex flex-col items-center justify-center w-full px-1">
                  <img
                    src={qrDataUri}
                    alt="Receipt Verification QR"
                    className="w-[74px] h-[74px] object-contain block"
                  />
                  <span className="text-[8.5px] font-bold text-slate-700 leading-tight mt-0.5">
                    Scan to Verify
                  </span>
                  <span
                    className="text-[6.5px] sm:text-[7px] font-mono text-slate-600 leading-[1.1] max-w-full break-all select-all mt-0.5"
                    title={verifyAddress}
                  >
                    {verifyAddress}
                  </span>
                </div>
              ) : (
                <div className="w-[74px] h-[74px] bg-slate-100 rounded-md flex items-center justify-center text-slate-400 text-[9px]">
                  Generating QR…
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* 8. FOOTER SECTION                                                 */}
        {/* Mountain graphic is screen-only (print:hidden).                   */}
        {/* Footer on screen and paper: green band and lines:                 */}
        {/* Prime View Cooperative Housing Society Limited                    */}
        {/* Hazara Division, Abbottabad                                       */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        <div className="relative shrink-0 mt-1 overflow-hidden rounded-b-md">
          {/* Screen-only mountain graphic watermark (Do not draw on printed page) */}
          <div className="print:hidden pointer-events-none absolute right-4 bottom-2 opacity-25 flex items-end justify-end">
            <img
              src="/invoice/mountain-watermark.png"
              alt=""
              className="h-14 w-auto object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>

          {/* Footer content: Green band with text */}
          <div className="relative z-10 pt-1 pb-1">
            {/* Elegant multi-tone green vector wave band */}
            <div className="w-full h-2 mb-1.5">
              <svg
                viewBox="0 0 800 16"
                preserveAspectRatio="none"
                className="w-full h-full block"
                style={{
                  WebkitPrintColorAdjust: 'exact',
                  printColorAdjust: 'exact',
                }}
              >
                <path
                  d="M0,12 Q200,4 400,10 T800,4 L800,16 L0,16 Z"
                  fill="#c8d6c7"
                />
                <path
                  d="M0,14 Q250,6 500,12 T800,8 L800,16 L0,16 Z"
                  fill="#1C3829"
                />
              </svg>
            </div>

            <div className="text-right pr-3">
              <div
                className="font-serif font-bold text-[10px] tracking-wide"
                style={{
                  color: '#1c3829',
                  WebkitPrintColorAdjust: 'exact',
                  printColorAdjust: 'exact',
                }}
              >
                Prime View Cooperative Housing Society Limited
              </div>
              <div
                className="text-[8.5px] font-medium flex items-center justify-end gap-2 mt-0.5"
                style={{
                  color: '#2d5a3f',
                  WebkitPrintColorAdjust: 'exact',
                  printColorAdjust: 'exact',
                }}
              >
                <div className="h-[1px] w-8 bg-amber-600/70" />
                <span>Hazara Division, Abbottabad</span>
                <div className="h-[1px] w-8 bg-amber-600/70" />
              </div>
            </div>
          </div>
        </div>

      </div>

      <style jsx global>{`
        .official-slip-page {
          width: 210mm;
          min-height: 297mm;
          height: 297mm;
          box-sizing: border-box;
          padding: 8mm 10mm;
          margin: 0 auto;
          background: #ffffff;
        }

        .official-slip-container {
          width: 100%;
          height: 100%;
          border: 2px solid #1C3829 !important;
          border-radius: 8px !important;
          padding: 6mm 8mm;
          box-sizing: border-box;
          background: #ffffff;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        @media screen and (max-width: 820px) {
          .official-slip-page {
            width: 100%;
            height: auto;
            min-height: auto;
            padding: 12px;
          }
          .official-slip-container {
            padding: 12px;
          }
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          html, body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Hide the portal sidebar, header, navigation, and buttons on paper */
          .no-print, header, aside, nav, button, footer, #global-whatsapp-fab, [data-portal-sidebar], [data-portal-header], .member-sidebar, .admin-sidebar {
            display: none !important;
            visibility: hidden !important;
          }
          .page-break {
            page-break-after: always !important;
            break-after: page !important;
          }
          .official-slip-page-wrapper {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            width: 210mm !important;
            height: 297mm !important;
            max-height: 297mm !important;
            overflow: hidden !important;
          }
          .official-slip-page {
            width: 210mm !important;
            height: 297mm !important;
            max-height: 297mm !important;
            margin: 0 !important;
            padding: 8mm 10mm !important;
            box-shadow: none !important;
            border: none !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            overflow: hidden !important;
            display: flex !important;
            align-items: stretch !important;
            justify-content: stretch !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .official-slip-container {
            width: 100% !important;
            height: 100% !important;
            padding: 6mm 8mm !important;
            border: 2px solid #1C3829 !important;
            border-radius: 8px !important;
            box-sizing: border-box !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
};

interface OfficialA4PaymentSlipProps {
  slip: SlipRenderModel;
  submission?: ReceiptSubmission;
  viewMode?: 'admin' | 'customer' | 'full';
  onClose?: () => void;
  isReadOnly?: boolean;
}

/**
 * Official A4 Payment Slip Component
 * Displays the rebuilt client form on screen and in print.
 * - Admin view: Page 1 (ADMIN COPY) then Page 2 (MEMBER COPY).
 * - Member view: Page 1 (MEMBER COPY only).
 */
export const OfficialA4PaymentSlip: React.FC<OfficialA4PaymentSlipProps> = ({
  slip,
  viewMode = 'full',
  onClose,
  isReadOnly = false,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const isCustomerView = viewMode === 'customer';

  // Read-only inline mode
  if (isReadOnly) {
    return (
      <div className="w-full flex flex-col items-center">
        <OfficialReceiptCopy
          slip={slip}
          copyBadgeText="MEMBER COPY (OFFICIAL VERIFIED RECEIPT)"
          isReadOnly={true}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      {/* Container simulating A4 preview on screen */}
      <div
        id="pv-official-slip-printable"
        className="relative max-w-4xl w-full bg-slate-100 text-[#151914] shadow-2xl rounded-2xl print:rounded-none print:shadow-none print:border-none print:bg-white border border-black/20 overflow-hidden flex flex-col my-auto print:m-0"
      >
        {/* Top Control Bar (Hidden on Print) */}
        <div className="no-print bg-[#151914] text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#2D4F37] flex items-center justify-center text-white shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight">
                {isCustomerView
                  ? `Official Member Payment Slip • ${slip.slipNumber}`
                  : `Official A4 Verified Payment Slip • ${slip.slipNumber}`}
              </h3>
              <p className="text-[11px] text-[#A6ADA0]">
                {isCustomerView
                  ? 'Official Member Copy (1 Page)'
                  : 'Page 1: ADMIN COPY • Page 2: MEMBER COPY'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-[#2D4F37] hover:bg-[#233f2c] text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{isCustomerView ? 'Print Member Slip' : 'Print A4 Slip'}</span>
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* Printable Sheets Area                                            */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        <div className="p-4 sm:p-8 space-y-8 bg-slate-200 print:bg-white print:p-0 print:space-y-0 text-slate-900">
          {/* Member Portal Print: Shows Member Copy only (1 Page) */}
          {isCustomerView ? (
            <div className="official-slip-page-wrapper">
              <OfficialReceiptCopy
                slip={slip}
                copyBadgeText="MEMBER COPY (OFFICIAL VERIFIED RECEIPT)"
              />
            </div>
          ) : (
            /* Admin Print: Shows Page 1 (Admin copy) then Page 2 (Member copy) */
            <>
              {/* PAGE 1: ADMIN COPY */}
              <div className="official-slip-page-wrapper page-break">
                <OfficialReceiptCopy
                  slip={slip}
                  copyBadgeText="ADMIN COPY (OFFICIAL VERIFIED RECEIPT)"
                />
              </div>

              {/* PAGE 2: MEMBER COPY */}
              <div className="official-slip-page-wrapper">
                <OfficialReceiptCopy
                  slip={slip}
                  copyBadgeText="MEMBER COPY (OFFICIAL VERIFIED RECEIPT)"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
