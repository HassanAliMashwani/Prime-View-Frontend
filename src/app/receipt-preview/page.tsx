'use client';

import React from 'react';
import { OfficialA4PaymentSlip, buildSlipDataFromSubmission } from '@/components/receipts/OfficialA4PaymentSlip';

const slip9264 = {
  id: 'rcpt-1791643095794-oxzr',
  customerId: 'cust-1791638890685-8xrk',
  bookingId: 'book-1791638890685-ek4j',
  paymentRecordId: 'pay-inst-book-1791638890685-ek4j-2',
  depositoryBank: 'Meezan Bank',
  transactionRef: 'mzn-0099',
  paymentDate: '2026-10-10',
  amount: 1166660,
  paymentKind: 'balloon',
  status: 'verified',
  verifiedByAdminId: 'admin-1',
  verifiedAt: '2026-10-10T14:38:33.239Z',
  rejectionReason: null,
  slipNumber: 'PV-SLIP-2026-9264',
  securityHash: 'PV-SEC-A08E-46B1-3239',
  uploadedAt: '2026-10-10T14:38:15.794Z',
  customer: {
    id: 'cust-1791638890685-8xrk',
    fullName: 'Hassan Ali',
    membershipNo: 'PV-2026-644',
    phone: '03495680991',
    cnic: '13503-1234-7890',
    strikeCount: 0,
    fatherOrHusbandName: 'zia',
  },
  hasPhoto: true,
  customerName: 'Hassan Ali',
  membershipNo: 'PV-2026-644',
  customerPhone: '03495680991',
  customerCnic: '13503-1234-7890',
  fatherOrHusbandName: 'zia',
  plotNumber: '203',
  blockName: 'Elite Block',
  plotSize: '4 Marla',
  plotCategory: 'residential',
  feeType: 'plot_installment',
  paymentType: 'installment',
  installmentNumber: 2,
  slip: {
    slipNumber: 'PV-SLIP-2026-9264',
    securityHash: 'PV-SEC-A08E-46B1-3239',
    verifiedAt: '2026-10-10',
    verifiedBy: 'admin-1',
  },
};

export default function ReceiptPreviewPage() {
  const slip = buildSlipDataFromSubmission(slip9264);

  return (
    <div className="min-h-screen bg-slate-900">
      <OfficialA4PaymentSlip slip={slip} viewMode="full" />
    </div>
  );
}
