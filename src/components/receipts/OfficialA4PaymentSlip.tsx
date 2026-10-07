'use client';

import React from 'react';
import QRCode from 'qrcode';
import { ReceiptSubmission } from '@/lib/mock/types';
import { Printer, X, ShieldCheck } from 'lucide-react';

/**
 * Stable public verify URL builder using NEXT_PUBLIC_APP_URL or fallback production origin.
 * Does not invent arbitrary domains.
 */
export function getSlipVerifyUrl(slipNumber: string): string {
  const clean = encodeURIComponent((slipNumber || '').trim().replace(/[.,;:/\\]+$/, ''));
  const base = (process.env.NEXT_PUBLIC_APP_URL || 'https://prime-view-livid.vercel.app').replace(/\/$/, '');
  return `${base}/verify/${clean}`;
}

const qrSvgCache = new Map<string, string>();

/**
 * Hook to generate real SVG QR code data URI using standard qrcode package.
 * Encodes only getSlipVerifyUrl(slipNumber) with error correction 'M' and margin 4.
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
      margin: 4,
    })
      .then((svg) => {
        const uri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
        qrSvgCache.set(verifyUrl, uri);
        if (isCurrent) {
          setDataUri(uri);
        }
      })
      .catch(() => {
        QRCode.toDataURL(verifyUrl, { errorCorrectionLevel: 'M', margin: 4, width: 300 })
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
  
  const verifyUrl = getSlipVerifyUrl(slip.slipNumber);
  const qrDataUri = useSlipQrCode(verifyUrl);

  return (
    <div className="official-slip-page relative bg-white mx-auto overflow-hidden print:w-[210mm] print:h-[296mm] max-w-[794px] w-full border border-slate-200/90 shadow-md print:shadow-none print:border-none print:m-0 print:p-0 print:flex print:items-center print:justify-center">
      {/* Inner frame matching exactly the 612 / 792 US Letter picture aspect ratio */}
      <div
        className="official-slip-letter-frame relative w-full aspect-[612/792] overflow-hidden select-none print:w-[210mm] print:h-[calc(210mm*792/612)] print:max-h-none print:aspect-auto"
        style={{ aspectRatio: '612 / 792' }}
      >
        {/* Copy Type Tag (Top Right) */}
        <div className="absolute top-3.5 right-6 z-20 px-3 py-1 rounded bg-slate-100/95 border border-slate-300 text-slate-700 text-[10px] font-extrabold tracking-wider uppercase font-mono print:border-slate-400">
          {copyLabel}
        </div>

        {/* Official Background Image - Fills inner frame 100% */}
        <img
          src="/new assests/invoice/INVOICE.png"
          onError={(e) => {
            // Fallback to /invoice/INVOICE.png if path resolution requires it
            e.currentTarget.src = '/invoice/INVOICE.png';
          }}
          alt="Prime View Official Cash Receipt"
          className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none"
          style={{ objectFit: 'fill', width: '100%', height: '100%' }}
        />

        {/* 1. Receipt No: left 22.43%, top 17.74%, width 21.65%, height 2.08% */}
        <div
          className="absolute font-mono font-bold text-slate-900 flex items-center justify-center text-[10px] sm:text-[11.5px] print:text-[10pt] tracking-wider z-10 overflow-hidden leading-none"
          style={{ left: '22.43%', top: '17.74%', width: '21.65%', height: '2.08%' }}
        >
          <span className="truncate">{slip.slipNumber}</span>
        </div>

        {/* 2. Receipt Date: left 69.00%, top 17.74%, width 21.73%, height 2.08% */}
        <div
          className="absolute font-semibold text-slate-900 flex items-center justify-center text-[10px] sm:text-[11.5px] print:text-[10pt] z-10 overflow-hidden leading-none"
          style={{ left: '69.00%', top: '17.74%', width: '21.73%', height: '2.08%' }}
        >
          <span className="truncate">{slip.verifiedDate || slip.depositDate}</span>
        </div>

        {/* 3. Payment Received In: CASH checkbox vs BANK checkbox */}
        {isBank ? (
          <div
            className="absolute flex items-center justify-center font-black text-emerald-800 text-[13px] sm:text-[15px] print:text-[13pt] z-10 leading-none"
            style={{ left: '50.16%', top: '21.55%', width: '2.45%', height: '2.15%' }}
          >
            ✔
          </div>
        ) : (
          <div
            className="absolute flex items-center justify-center font-black text-emerald-800 text-[13px] sm:text-[15px] print:text-[13pt] z-10 leading-none"
            style={{ left: '41.78%', top: '21.55%', width: '2.04%', height: '2.15%' }}
          >
            ✔
          </div>
        )}

        {/* Payment Line Details: starts to the right of BANK checkbox so words do not cover the box */}
        <div
          className="absolute flex items-center font-semibold text-slate-800 text-[9px] sm:text-[11px] print:text-[9pt] truncate z-10 leading-none"
          style={{ left: '54.0%', top: '21.55%', width: '42.0%', height: '2.15%' }}
        >
          {isBank ? (
            <span className="truncate">
              {slip.bankName} {slip.transactionRef ? `• Ref: ${slip.transactionRef}` : ''} {slip.depositDate && slip.depositDate !== '—' ? `• Dep: ${slip.depositDate}` : ''}
            </span>
          ) : (
            <span className="truncate">Cash Payment {slip.depositDate && slip.depositDate !== '—' ? `• Dep: ${slip.depositDate}` : ''}</span>
          )}
        </div>

        {/* 4. Name: left 12.0%, top 28.15%, width 26.5%, height 1.45% (underline at y=29.61%) */}
        <div
          className="absolute flex items-end font-bold text-slate-900 text-[11px] sm:text-[12.5px] print:text-[11pt] leading-none truncate z-10 overflow-hidden"
          style={{ left: '12.0%', top: '28.15%', width: '26.5%', height: '1.45%' }}
        >
          <span className="truncate">{slip.customerName}</span>
        </div>

        {/* 5. Plot: left 57.8%, top 28.15%, width 9.6%, height 1.45% (underline x=57.72% to 67.61%) */}
        <div
          className="absolute flex items-end justify-center font-bold text-slate-900 text-[11px] sm:text-[12.5px] print:text-[11pt] leading-none truncate z-10 overflow-hidden"
          style={{ left: '57.8%', top: '28.15%', width: '9.6%', height: '1.45%' }}
        >
          <span className="truncate">{slip.plotNumber}</span>
        </div>

        {/* 6. Block: left 79.2%, top 28.15%, width 11.3%, height 1.45% (underline x=79.04% to 90.73%) */}
        <div
          className="absolute flex items-end justify-center font-bold text-slate-900 text-[11px] sm:text-[12.5px] print:text-[11pt] leading-none truncate z-10 overflow-hidden"
          style={{ left: '79.2%', top: '28.15%', width: '11.3%', height: '1.45%' }}
        >
          <span className="truncate">{slip.blockName}</span>
        </div>

        {/* 7. Membership: left 17.3%, top 34.75%, width 21.2%, height 1.55% (underline y=36.30%) */}
        <div
          className="absolute flex items-end font-bold text-slate-900 text-[11px] sm:text-[12.5px] print:text-[11pt] leading-none truncate z-10 overflow-hidden"
          style={{ left: '17.3%', top: '34.75%', width: '21.2%', height: '1.55%' }}
        >
          <span className="truncate">{slip.membershipNo}</span>
        </div>

        {/* 8. Membership Type: Full Payment vs Installments checkbox */}
        {isInstallment ? (
          <div
            className="absolute flex items-center justify-center font-black text-emerald-800 text-[14px] sm:text-[17px] print:text-[14pt] z-10 leading-none"
            style={{ left: '90.4%', top: '33.8%', width: '3.07%', height: '3.6%' }}
          >
            ✔
          </div>
        ) : (
          <div
            className="absolute flex items-center justify-center font-black text-emerald-800 text-[14px] sm:text-[17px] print:text-[14pt] z-10 leading-none"
            style={{ left: '77.2%', top: '33.8%', width: '3.17%', height: '3.6%' }}
          >
            ✔
          </div>
        )}

        {/* 9. Amount Received: left 22.43%, top 40.53%, width 19.6%, height 3.54% (Box y=40.53% to 44.07%) */}
        <div
          className="absolute font-mono font-bold text-emerald-800 flex items-center justify-center text-[12px] sm:text-[14px] print:text-[12pt] tracking-tight z-10 overflow-hidden leading-none"
          style={{ left: '22.43%', top: '40.53%', width: '19.6%', height: '3.54%' }}
        >
          PKR {Number(slip.amount).toLocaleString()}/-
        </div>

        {/* 10. On Account Of: left 56.2%, top 41.35%, width 34.5%, height 1.6% (Line y=42.93%) */}
        <div
          className="absolute flex items-end font-bold text-slate-900 text-[10.5px] sm:text-[12px] print:text-[10pt] leading-none truncate z-10 overflow-hidden"
          style={{ left: '56.2%', top: '41.35%', width: '34.5%', height: '1.6%' }}
        >
          <span className="truncate">{isInstallment ? `Installment #${slip.installmentNumber}` : 'Full Payment'}</span>
        </div>

        {/* 11. In Words: left 15.0%, top 45.15%, width 71%, height 1.7% (Line y=46.84%) */}
        <div
          className="absolute flex items-end font-semibold text-slate-800 text-[9.5px] sm:text-[11px] print:text-[9.5pt] leading-none truncate z-10 overflow-hidden"
          style={{ left: '15.0%', top: '45.15%', width: '71.0%', height: '1.7%' }}
        >
          <span className="truncate">{slip.amountInWords}</span>
        </div>

        {/* 12. Stamp & Signature Treasurer: left 22.43%, top 48.5%, width 28%, height 6.2% */}
        <div
          className="absolute flex flex-col items-center justify-center text-center p-0.5 z-10 overflow-hidden"
          style={{ left: '22.43%', top: '48.5%', width: '28.0%', height: '6.2%' }}
        >
          <span className="font-extrabold text-[10px] sm:text-[11px] print:text-[9.5pt] text-emerald-800 tracking-tight leading-tight">
            ✔ DIGITALLY VERIFIED
          </span>
          <span className="text-[8px] sm:text-[9px] print:text-[7.5pt] text-slate-600 font-medium leading-none mt-0.5">
            {slip.verifiedBy || 'Treasurer / Secretariat'}
          </span>
        </div>

        {/* 13. Security Footer (Security Hash & QR Code only — no web address printed beside QR) */}
        <div
          className="absolute z-10 flex items-center justify-between border-t border-dashed border-slate-300 pt-3"
          style={{ left: '6.5%', right: '6.5%', top: '55.5%' }}
        >
          <div className="space-y-1">
            <div className="text-[9px] sm:text-[10px] print:text-[8pt] font-bold text-slate-500 uppercase tracking-wider font-mono">
              Cryptographic Anti-Tamper Security Hash
            </div>
            <div className="font-mono font-bold text-[11px] sm:text-[12px] print:text-[10pt] bg-slate-50 border border-slate-200/90 text-slate-900 px-3 py-1.5 rounded-lg inline-block select-all shadow-2xs">
              {slip.securityHash || '—'}
            </div>
          </div>

          {/* QR Code image — 96px on screen, 25mm on print */}
          <div className="shrink-0 flex items-center justify-center bg-white p-1 border border-slate-300/80 rounded-xl shadow-xs">
            {qrDataUri ? (
              <img
                src={qrDataUri}
                alt="Security Verification QR"
                className="official-slip-qr-img w-[96px] h-[96px] print:w-[25mm] print:h-[25mm] object-contain block"
              />
            ) : (
              <div className="official-slip-qr-img w-[96px] h-[96px] print:w-[25mm] print:h-[25mm] bg-white" />
            )}
          </div>
        </div>
      </div>

      {/* Scoped print CSS for exact A4 centered letter frame */}
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
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            overflow: hidden !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            background: #ffffff !important;
          }
          .official-slip-letter-frame {
            width: 210mm !important;
            height: calc(210mm * 792 / 612) !important;
            max-height: calc(210mm * 792 / 612) !important;
            aspect-ratio: 612 / 792 !important;
            margin: 0 auto !important;
            position: relative !important;
            overflow: hidden !important;
            flex-shrink: 0 !important;
          }
          .official-slip-qr-img {
            width: 25mm !important;
            height: 25mm !important;
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
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            overflow: hidden !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            background: #ffffff !important;
          }
          .official-slip-letter-frame {
            width: 210mm !important;
            height: calc(210mm * 792 / 612) !important;
            max-height: calc(210mm * 792 / 612) !important;
            aspect-ratio: 612 / 792 !important;
            margin: 0 auto !important;
            position: relative !important;
            overflow: hidden !important;
            flex-shrink: 0 !important;
          }
          .official-slip-qr-img {
            width: 25mm !important;
            height: 25mm !important;
          }
        }
      `}</style>
    </div>
  );
};
