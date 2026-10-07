'use client';

import React from 'react';
import { ReceiptSubmission } from '@/lib/mock/types';
import { Printer, X, ShieldCheck } from 'lucide-react';

/**
 * Stable public verify URL builder using NEXT_PUBLIC_APP_URL or current origin.
 * Does not invent arbitrary domains.
 */
export function getSlipVerifyUrl(slipNumber: string): string {
  const clean = encodeURIComponent((slipNumber || '').trim().replace(/[.,;:/\\]+$/, ''));
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const base = (process.env.NEXT_PUBLIC_APP_URL || origin).replace(/\/$/, '');
  return base ? `${base}/verify/${clean}` : `/verify/${clean}`;
}

/**
 * In-app pure TypeScript QR Code generator (Byte Mode, ISO/IEC 18004).
 * Generates inline SVG Data URI without calling external APIs like api.qrserver.com.
 */
export function generateQrSvgDataUri(text: string, pixelSize = 160): string {
  // GF(256) Math
  const expTable = new Uint8Array(512);
  const logTable = new Uint8Array(256);
  let x = 1;
  for (let i = 0; i < 255; i++) {
    expTable[i] = x;
    logTable[x] = i;
    x <<= 1;
    if (x & 256) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) {
    expTable[i] = expTable[i - 255];
  }

  function gfMul(a: number, b: number): number {
    if (a === 0 || b === 0) return 0;
    return expTable[logTable[a] + logTable[b]];
  }

  function getRsGeneratorPoly(degree: number): Uint8Array {
    let poly = new Uint8Array([1]);
    for (let i = 0; i < degree; i++) {
      const next = new Uint8Array(poly.length + 1);
      const factor = expTable[i];
      for (let j = 0; j < poly.length; j++) {
        next[j] ^= poly[j];
        next[j + 1] ^= gfMul(poly[j], factor);
      }
      poly = next;
    }
    return poly;
  }

  function computeRsRemainder(data: Uint8Array, numEcBytes: number): Uint8Array {
    const gen = getRsGeneratorPoly(numEcBytes);
    const rem = new Uint8Array(numEcBytes);
    for (const b of data) {
      const factor = b ^ rem[0];
      rem.copyWithin(0, 1);
      rem[numEcBytes - 1] = 0;
      for (let i = 0; i < numEcBytes; i++) {
        rem[i] ^= gfMul(gen[i + 1], factor);
      }
    }
    return rem;
  }

  const versions = [
    { version: 2, size: 25, dataBytes: 34, ecBytes: 10, align: [6, 18] },
    { version: 3, size: 29, dataBytes: 55, ecBytes: 15, align: [6, 22] },
    { version: 4, size: 33, dataBytes: 80, ecBytes: 20, align: [6, 26] },
    { version: 5, size: 37, dataBytes: 108, ecBytes: 26, align: [6, 30] },
    { version: 6, size: 41, dataBytes: 136, ecBytes: 36, align: [6, 34] },
  ];

  const rawBytes = new TextEncoder().encode(text);
  const spec = versions.find((v) => v.dataBytes >= rawBytes.length + 3) || versions[versions.length - 1];

  const bits: number[] = [];
  function putBits(val: number, len: number) {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >> i) & 1);
    }
  }

  // Byte Mode indicator (0100) & character count (8 bits)
  putBits(0b0100, 4);
  putBits(rawBytes.length, 8);
  for (const b of rawBytes) putBits(b, 8);

  const totalDataBits = spec.dataBytes * 8;
  const termLen = Math.min(4, totalDataBits - bits.length);
  putBits(0, termLen);
  while (bits.length % 8 !== 0) bits.push(0);

  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (bits.length < totalDataBits) {
    putBits(padBytes[padIdx % 2], 8);
    padIdx++;
  }

  const dataBytes = new Uint8Array(spec.dataBytes);
  for (let i = 0; i < spec.dataBytes; i++) {
    let b = 0;
    for (let j = 0; j < 8; j++) {
      b = (b << 1) | bits[i * 8 + j];
    }
    dataBytes[i] = b;
  }

  const ecBytes = computeRsRemainder(dataBytes, spec.ecBytes);
  const fullCodewords = new Uint8Array(spec.dataBytes + spec.ecBytes);
  fullCodewords.set(dataBytes, 0);
  fullCodewords.set(ecBytes, spec.dataBytes);

  const N = spec.size;
  const matrix: (number | null)[][] = Array.from({ length: N }, () => Array(N).fill(null));
  const isFunction: boolean[][] = Array.from({ length: N }, () => Array(N).fill(false));

  function setFunction(r: number, c: number, val: number) {
    matrix[r][c] = val;
    isFunction[r][c] = true;
  }

  function addFinder(row: number, col: number) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const mr = row + r;
        const mc = col + c;
        if (mr >= 0 && mr < N && mc >= 0 && mc < N) {
          const isBorder = r === -1 || r === 7 || c === -1 || c === 7;
          const isOuter = r === 0 || r === 6 || c === 0 || c === 6;
          const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          setFunction(mr, mc, !isBorder && (isOuter || isInner) ? 1 : 0);
        }
      }
    }
  }
  addFinder(0, 0);
  addFinder(0, N - 7);
  addFinder(N - 7, 0);

  for (let i = 8; i < N - 8; i++) {
    if (matrix[6][i] === null) setFunction(6, i, i % 2 === 0 ? 1 : 0);
    if (matrix[i][6] === null) setFunction(i, 6, i % 2 === 0 ? 1 : 0);
  }

  if (spec.align.length > 1) {
    for (const ar of spec.align) {
      for (const ac of spec.align) {
        if (isFunction[ar][ac]) continue;
        for (let r = -2; r <= 2; r++) {
          for (let c = -2; c <= 2; c++) {
            const val = Math.max(Math.abs(r), Math.abs(c)) !== 1 ? 1 : 0;
            setFunction(ar + r, ac + c, val);
          }
        }
      }
    }
  }

  for (let i = 0; i < 9; i++) {
    if (!isFunction[8][i]) setFunction(8, i, 0);
    if (!isFunction[i][8]) setFunction(i, 8, 0);
  }
  for (let i = N - 8; i < N; i++) {
    if (!isFunction[8][i]) setFunction(8, i, 0);
    if (!isFunction[i][8]) setFunction(i, 8, 0);
  }
  setFunction(N - 8, 8, 1);

  let bitIdx = 0;
  const totalCodewordBits = fullCodewords.length * 8;
  for (let right = N - 1; right > 0; right -= 2) {
    if (right === 6) right--;
    for (let vert = 0; vert < N; vert++) {
      for (let j = 0; j < 2; j++) {
        const col = right - j;
        const upward = ((right + 1) & 2) === 0;
        const row = upward ? vert : N - 1 - vert;
        if (isFunction[row][col]) continue;

        let bit = 0;
        if (bitIdx < totalCodewordBits) {
          const byte = fullCodewords[Math.floor(bitIdx / 8)];
          bit = (byte >> (7 - (bitIdx % 8))) & 1;
          bitIdx++;
        }
        const mask = (row + col) % 2 === 0 ? 1 : 0;
        matrix[row][col] = bit ^ mask;
      }
    }
  }

  const formatBits = 0x77c4; // Low ECC, Mask 0
  for (let i = 0; i < 15; i++) {
    const bit = (formatBits >> (14 - i)) & 1;
    if (i < 6) matrix[8][i] = bit;
    else if (i === 6) matrix[8][7] = bit;
    else if (i === 7) matrix[8][8] = bit;
    else if (i === 8) matrix[7][8] = bit;
    else matrix[14 - i][8] = bit;

    if (i < 8) matrix[N - 1 - i][8] = bit;
    else matrix[8][N - 15 + i] = bit;
  }

  const cellSize = pixelSize / (N + 4);
  let rects = '';
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (matrix[r][c] === 1) {
        const cx = (c + 2) * cellSize;
        const cy = (r + 2) * cellSize;
        rects += `<rect x="${cx.toFixed(1)}" y="${cy.toFixed(1)}" width="${cellSize.toFixed(1)}" height="${cellSize.toFixed(1)}" fill="#000000"/>`;
      }
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${pixelSize} ${pixelSize}" width="${pixelSize}" height="${pixelSize}"><rect width="100%" height="100%" fill="#ffffff"/>${rects}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
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
  installmentNumber?: number | null;
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
    bankName: sub.depositoryBank || sub.bankName || '',
    transactionRef: sub.transactionRef || '',
    depositDate: sub.paymentDate ? String(sub.paymentDate).split('T')[0] : '—',
    verifiedDate: sub.verifiedAt ? String(sub.verifiedAt).split('T')[0] : new Date().toISOString().split('T')[0],
    verifiedBy: sub.verifiedByAdminName || (sub as any).verifiedBy || 'Society Secretariat / Treasurer',
    securityHash: sub.slip?.securityHash || (sub as any).securityHash || '',
    qrPayload: getSlipVerifyUrl(slipNumber),
  };
}

export interface OfficialReceiptCopyProps {
  slip: SlipRenderModel;
  copyLabel: string;
  isReadOnly?: boolean;
}

/**
 * Single Official Receipt Sheet (Fits exactly on one A4 page).
 * Preserves the original PDF document layout from public/new assests/invoice/INVOICE.pdf.
 * Types member's details onto blank lines with zero redrawing of logos/instructions.
 */
export const OfficialReceiptCopy: React.FC<OfficialReceiptCopyProps> = ({
  slip,
  copyLabel,
}) => {
  const isBank = Boolean(slip.bankName && slip.bankName.trim().length > 0 && slip.bankName.toLowerCase() !== 'cash');
  const isInstallment = slip.installmentNumber !== undefined && slip.installmentNumber !== null && Number(slip.installmentNumber) > 0;
  
  // In-app QR generation (no external API calls)
  const qrDataUri = React.useMemo(() => {
    return generateQrSvgDataUri(slip.qrPayload || getSlipVerifyUrl(slip.slipNumber), 180);
  }, [slip.qrPayload, slip.slipNumber]);

  return (
    <div className="official-slip-page relative bg-white mx-auto overflow-hidden print:w-[210mm] print:h-[296mm] max-w-[794px] w-full aspect-[612/792] sm:aspect-auto sm:h-[1027px] border border-slate-200/90 shadow-md print:shadow-none print:border-none print:m-0 print:p-0">
      {/* Copy Type Tag (Top Right) */}
      <div className="absolute top-3.5 right-6 z-20 px-3 py-1 rounded bg-slate-100/95 border border-slate-300 text-slate-700 text-[10px] font-extrabold tracking-wider uppercase font-mono print:border-slate-400">
        {copyLabel}
      </div>

      {/* Official PDF Document Template Background */}
      <div className="relative w-full h-full select-none">
        <img
          src="/new assests/invoice/INVOICE.png"
          onError={(e) => {
            // Fallback to /invoice/INVOICE.png if path resolution requires it
            e.currentTarget.src = '/invoice/INVOICE.png';
          }}
          alt="Prime View Official Cash Receipt"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
        />

        {/* 1. Receipt No: Box is at x0=139.1 (22.7%), top=140.4 (17.7%) */}
        <div
          className="absolute font-mono font-bold text-slate-900 flex items-center justify-center text-[10.5px] sm:text-[11.5px] tracking-wider z-10"
          style={{ left: '22.8%', top: '17.75%', width: '21.3%', height: '2.15%' }}
        >
          {slip.slipNumber}
        </div>

        {/* 2. Receipt Date: Box is at x0=424.3 (69.3%), top=140.4 (17.7%) */}
        <div
          className="absolute font-semibold text-slate-900 flex items-center justify-center text-[10.5px] sm:text-[11.5px] z-10"
          style={{ left: '69.4%', top: '17.75%', width: '21.3%', height: '2.15%' }}
        >
          {slip.verifiedDate || slip.depositDate}
        </div>

        {/* 3. Payment Received In: CASH checkbox vs BANK checkbox */}
        {isBank ? (
          <div
            className="absolute flex items-center justify-center font-black text-emerald-800 text-[13px] sm:text-[15px] z-10"
            style={{ left: '50.16%', top: '21.55%', width: '2.45%', height: '2.15%' }}
          >
            ✔
          </div>
        ) : (
          <div
            className="absolute flex items-center justify-center font-black text-emerald-800 text-[13px] sm:text-[15px] z-10"
            style={{ left: '41.78%', top: '21.55%', width: '2.04%', height: '2.15%' }}
          >
            ✔
          </div>
        )}

        {/* Payment Line Details: Bank Name, Transaction Reference, Deposit Date */}
        <div
          className="absolute flex items-center font-semibold text-slate-800 text-[9.5px] sm:text-[11px] truncate z-10"
          style={{ left: '54.0%', top: '21.55%', width: '42.0%', height: '2.15%' }}
        >
          {isBank ? (
            <span>
              {slip.bankName} {slip.transactionRef ? `• Ref: ${slip.transactionRef}` : ''} {slip.depositDate && slip.depositDate !== '—' ? `• Dep: ${slip.depositDate}` : ''}
            </span>
          ) : (
            <span>Cash Payment {slip.depositDate && slip.depositDate !== '—' ? `• Dep: ${slip.depositDate}` : ''}</span>
          )}
        </div>

        {/* 4. Name */}
        <div
          className="absolute flex items-center font-bold text-slate-900 text-[11px] sm:text-[12.5px] truncate z-10"
          style={{ left: '12.0%', top: '27.9%', width: '26.8%', height: '2.0%' }}
        >
          {slip.customerName}
        </div>

        {/* 5. Plot # */}
        <div
          className="absolute flex items-center font-bold text-slate-900 text-[11px] sm:text-[12.5px] truncate z-10"
          style={{ left: '58.0%', top: '27.9%', width: '9.8%', height: '2.0%' }}
        >
          {slip.plotNumber}
        </div>

        {/* 6. Block */}
        <div
          className="absolute flex items-center font-bold text-slate-900 text-[11px] sm:text-[12.5px] truncate z-10"
          style={{ left: '79.5%', top: '27.9%', width: '11.8%', height: '2.0%' }}
        >
          {slip.blockName}
        </div>

        {/* 7. Membership# */}
        <div
          className="absolute flex items-center font-bold text-slate-900 text-[11px] sm:text-[12.5px] truncate z-10"
          style={{ left: '17.5%', top: '34.5%', width: '21.2%', height: '2.0%' }}
        >
          {slip.membershipNo}
        </div>

        {/* 8. Membership Type: Full Payment vs Installments checkbox */}
        {isInstallment ? (
          <div
            className="absolute flex items-center justify-center font-black text-emerald-800 text-[14px] sm:text-[17px] z-10"
            style={{ left: '90.4%', top: '33.8%', width: '3.07%', height: '3.6%' }}
          >
            ✔
          </div>
        ) : (
          <div
            className="absolute flex items-center justify-center font-black text-emerald-800 text-[14px] sm:text-[17px] z-10"
            style={{ left: '77.2%', top: '33.8%', width: '3.17%', height: '3.6%' }}
          >
            ✔
          </div>
        )}

        {/* 9. Amount Received: Box at x0=137.2 (22.4%), top=320.9 (40.5%) */}
        <div
          className="absolute font-mono font-bold text-emerald-800 flex items-center justify-center text-[12px] sm:text-[14px] tracking-tight z-10"
          style={{ left: '22.5%', top: '40.52%', width: '19.3%', height: '3.59%' }}
        >
          PKR {Number(slip.amount).toLocaleString()}/-
        </div>

        {/* 10. On Account Of */}
        <div
          className="absolute flex items-center font-bold text-slate-900 text-[11px] sm:text-[12.5px] truncate z-10"
          style={{ left: '56.5%', top: '41.2%', width: '34.5%', height: '2.0%' }}
        >
          {isInstallment ? `Installment #${slip.installmentNumber}` : 'Full Payment'}
        </div>

        {/* 11. In Words */}
        <div
          className="absolute flex items-center font-semibold text-slate-800 text-[10px] sm:text-[11.5px] leading-tight truncate z-10"
          style={{ left: '15.0%', top: '45.1%', width: '71.5%', height: '2.0%' }}
        >
          {slip.amountInWords}
        </div>

        {/* 12. Stamp & Signature Treasurer: Box at x0=137.2 (22.4%), top=383.1 (48.3%) */}
        <div
          className="absolute flex flex-col items-center justify-center text-center p-1 z-10"
          style={{ left: '22.5%', top: '48.37%', width: '27.7%', height: '6.48%' }}
        >
          <span className="font-extrabold text-[10px] sm:text-[11px] text-emerald-800 tracking-tight">
            ✔ DIGITALLY VERIFIED
          </span>
          <span className="text-[8.5px] sm:text-[9.5px] text-slate-600 font-medium leading-none mt-0.5">
            {slip.verifiedBy || 'Treasurer / Secretariat'}
          </span>
        </div>

        {/* 13. Security Footer (Security Hash & QR Code only — no web address printed beside QR) */}
        <div
          className="absolute z-10 flex items-center justify-between border-t border-dashed border-slate-300 pt-3"
          style={{ left: '6.5%', right: '6.5%', top: '55.5%' }}
        >
          <div className="space-y-1">
            <div className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
              Cryptographic Anti-Tamper Security Hash
            </div>
            <div className="font-mono font-bold text-[11px] sm:text-[12px] bg-slate-50 border border-slate-200/90 text-slate-900 px-3 py-1.5 rounded-lg inline-block select-all shadow-2xs">
              {slip.securityHash || '—'}
            </div>
          </div>

          {/* QR Code image — stand-alone control, no URL beside it, not wrapped in a link */}
          <div className="shrink-0 flex items-center justify-center bg-white p-1.5 border border-slate-300/80 rounded-xl shadow-xs">
            <img
              src={qrDataUri}
              alt="Security Verification QR"
              className="w-18 h-18 sm:w-20 sm:h-20 object-contain block"
            />
          </div>
        </div>
      </div>
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
 * Displays the verified cash receipt PDF template on screen and in print.
 * - Admin view: Page 1 (Admin copy) and Page 2 (Member copy).
 * - Customer view: Page 2 (Member copy only).
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

  // If used in inline/read-only mode without modal wrapper
  if (isReadOnly) {
    return (
      <div className="w-full flex flex-col items-center">
        <OfficialReceiptCopy slip={slip} copyLabel="MEMBER COPY (OFFICIAL RECEIPT)" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      {/* Container simulating A4 sheet preview */}
      <div
        id="pv-official-slip-printable"
        className="relative max-w-4xl w-full bg-slate-100 text-[#151914] shadow-2xl rounded-2xl print:rounded-none print:shadow-none print:border-none print:bg-white border border-black/20 overflow-hidden flex flex-col my-auto print:m-0"
      >
        {/* Top Control Bar (Hidden on Print) */}
        <div className="no-print bg-[#151914] text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#43612B] flex items-center justify-center text-white shrink-0">
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
                  : 'Page 1: Society Archive (Admin Copy) • Page 2: Customer Copy'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-[#43612B] hover:bg-[#365222] text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
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

        {/* ═════════════════════════════════════════════════════════════════════════ */}
        {/* Printable Sheets Area                                                    */}
        {/* ═════════════════════════════════════════════════════════════════════════ */}
        <div className="p-4 sm:p-8 space-y-8 bg-slate-100 print:bg-white print:p-0 print:space-y-0 text-slate-900">
          {/* Member Portal Print: Shows Member Copy only */}
          {isCustomerView ? (
            <div className="official-slip-page-wrapper">
              <OfficialReceiptCopy
                slip={slip}
                copyLabel="MEMBER COPY (PAGE 1 OF 1)"
              />
            </div>
          ) : (
            /* Admin Print: Shows Page 1 (Admin copy) then Page 2 (Member copy) */
            <>
              {/* PAGE 1: ADMIN COPY */}
              <div className="official-slip-page-wrapper page-break">
                <OfficialReceiptCopy
                  slip={slip}
                  copyLabel="ADMIN COPY (PAGE 1)"
                />
              </div>

              {/* PAGE 2: MEMBER COPY */}
              <div className="official-slip-page-wrapper">
                <OfficialReceiptCopy
                  slip={slip}
                  copyLabel="MEMBER COPY (PAGE 2)"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Scoped print CSS for exact A4 page breaks */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .page-break {
            page-break-after: always !important;
            break-after: page !important;
          }
          .official-slip-page {
            width: 210mm !important;
            height: 296mm !important;
            max-height: 296mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            overflow: hidden !important;
          }
        }
      `}</style>
    </div>
  );
};
