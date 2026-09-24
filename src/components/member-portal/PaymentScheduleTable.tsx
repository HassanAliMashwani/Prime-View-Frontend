'use client';

import React from 'react';
import { PaymentRecord } from '@/lib/mock/types';
import { AlertCircle, CheckCircle2, Clock, Calendar, Check } from 'lucide-react';

interface PaymentScheduleTableProps {
  schedule: PaymentRecord[];
  totalPrice: number;
  paidAmount: number;
}

export const PaymentScheduleTable: React.FC<PaymentScheduleTableProps> = ({
  schedule,
  totalPrice,
  paidAmount,
}) => {
  // Find upcoming payment or overdue payment
  const overdueInstallment = schedule.find((p) => p.status === 'overdue');
  const nextPendingInstallment = schedule.find((p) => p.status === 'pending' || p.status === 'partially_paid');

  const formatPKR = (num: number) =>
    new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      maximumFractionDigits: 0,
    }).format(num);

  const cleanDate = (val?: string | null) => (val ? String(val).split('T')[0] : '');

  return (
    <div className="space-y-6">
      {/* Top Banner Alert for Overdue or Upcoming Installment */}
      {overdueInstallment ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 sm:p-5 flex items-start gap-4 text-red-900">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0 text-red-600">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-red-800">
              Action Required: Installment #{overdueInstallment.installmentNumber} is Overdue
            </h4>
            <p className="text-xs text-red-700 leading-relaxed">
              An installment of{' '}
              <span className="font-bold">{formatPKR(overdueInstallment.amount)}</span> was due on{' '}
              <span className="font-bold">{cleanDate(overdueInstallment.dueDate)}</span>. Please submit payment
              to the society accounts office to avoid any surcharge.
            </p>
          </div>
        </div>
      ) : nextPendingInstallment ? (
        <div className="bg-[#FAF9F7] border border-[#43612B]/20 rounded-2xl p-4 sm:p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#EAF0E7] flex items-center justify-center shrink-0 text-[#43612B]">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-[#151914]">
              Next Upcoming Due: Installment #{nextPendingInstallment.installmentNumber}
              {nextPendingInstallment.status === 'partially_paid' && (
                <span className="ml-2 text-xs font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full">
                  Partially Settled
                </span>
              )}
            </h4>
            <p className="text-xs text-[#6B7462] leading-relaxed">
              Due Date: <span className="font-bold text-[#151914]">{cleanDate(nextPendingInstallment.dueDate)}</span> &bull; Remaining Due:{' '}
              <span className="font-bold text-[#43612B]">
                {formatPKR(nextPendingInstallment.amount - (nextPendingInstallment.paidAmount || 0))}
              </span>
              {nextPendingInstallment.status === 'partially_paid' && (
                <span className="text-[11px] text-amber-700 font-semibold ml-1.5">
                  ({formatPKR(nextPendingInstallment.paidAmount || 0)} of {formatPKR(nextPendingInstallment.amount)} paid)
                </span>
              )}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-[#EAF0E7] border border-[#43612B]/20 rounded-2xl p-4 flex items-center gap-3 text-[#43612B]">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p className="text-xs font-semibold">
            All installments have been fully paid. Your property clearance certificate is ready.
          </p>
        </div>
      )}

      {/* Installment Records Table */}
      <div className="bg-white rounded-2xl border border-black/[0.08] overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-black/[0.06] flex items-center justify-between">
          <h4 className="font-display font-bold text-base text-[#151914]">
            Official Installment Ledger
          </h4>
          <span className="text-xs font-semibold text-[#6B7462]">
            {schedule.filter((p) => p.status === 'paid').length} of {schedule.length} Paid
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF9F5] border-b border-black/[0.06] text-[#6B7462] font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Inst. #</th>
                <th className="py-3.5 px-4">Due Date</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Paid Date</th>
                <th className="py-3.5 px-4">Receipt Ref</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.05]">
              {schedule.map((record) => {
                let badgeClass = 'bg-black/5 text-[#6B7462] border-black/10';
                let Icon = Clock;
                let statusLabel: string = record.status;

                if (record.status === 'paid') {
                  badgeClass = 'bg-[#EAF0E7] text-[#43612B] border-[#43612B]/20';
                  Icon = Check;
                  statusLabel = 'Paid';
                } else if (record.status === 'partially_paid') {
                  badgeClass = 'bg-amber-50 text-amber-800 border-amber-300';
                  Icon = Clock;
                  statusLabel = 'Partially Paid';
                } else if (record.status === 'overdue') {
                  badgeClass = 'bg-red-50 text-red-700 border-red-200';
                  Icon = AlertCircle;
                  statusLabel = 'Overdue';
                } else {
                  statusLabel = 'Pending';
                }

                return (
                  <tr
                    key={record.id}
                    className={`hover:bg-black/[0.01] transition-colors ${
                      record.status === 'overdue' ? 'bg-red-50/40' : record.status === 'partially_paid' ? 'bg-amber-50/20' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 font-bold text-[#151914]">
                      {record.feeType === 'plot_downpayment' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                          Downpayment
                        </span>
                      ) : (
                        `#${record.installmentNumber || '1'}`
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[#151914] font-medium">
                      {cleanDate(record.dueDate)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#151914]">
                      <div>{formatPKR(record.amount)}</div>
                      {record.status === 'partially_paid' && (
                        <div className="text-[10px] font-semibold text-amber-800 mt-0.5">
                          Paid: {formatPKR(record.paidAmount || 0)} &bull; Left: {formatPKR(record.amount - (record.paidAmount || 0))}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${badgeClass}`}
                      >
                        <Icon className="w-3 h-3" />
                        <span className="capitalize">{statusLabel}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#6B7462]">
                      {cleanDate(record.paidDate) || '—'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#6B7462]">
                      {record.transactionRef || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
