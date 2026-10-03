import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy | Prime View Housing Society Abbottabad",
  description: "Official refund and cancellation policy for plot bookings and token fees at Prime View Housing Society Abbottabad, Pakistan.",
  alternates: {
    canonical: "https://prime-view-livid.vercel.app/refund",
  },
};

export default function RefundPolicyPage() {
  return (
    <div className="py-16 sm:py-24 bg-[#F8F7F5] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mandatory owner review disclaimer */}
        <div className="mb-8 p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs sm:text-sm font-semibold flex items-center justify-between">
          <span>Draft for owner review. The society owner will confirm the final legal text.</span>
          <span className="text-[11px] uppercase tracking-wider text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded">Jurisdiction: Pakistan</span>
        </div>

        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-black/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-8 font-sans text-[#151914]">
          <div className="border-b border-black/[0.08] pb-6">
            <p className="text-xs uppercase tracking-widest font-bold text-[#43612B] mb-2">Financial Regulations</p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#151914]">
              Refund & Cancellation Policy
            </h1>
            <p className="text-xs text-[#6B7462] mt-2">
              Last updated: October 2026 • Prime View Cooperative Housing Society Abbottabad
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-bold text-[#151914]">1. Scope of Policy</h2>
            <p className="text-sm leading-relaxed text-[#4A5542]">
              This policy governs refund eligibility, administrative service charges, and cancellation timelines for token fees, advance registration downpayments, and installment deposits submitted to Prime View Cooperative Housing Society Abbottabad, Pakistan.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-bold text-[#151914]">2. Token Fee & Reservation Cancellations</h2>
            <p className="text-sm leading-relaxed text-[#4A5542]">
              Token amounts remitted to place a 7-day or 14-day reservation hold on residential or commercial plots are subject to the following conditions:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm text-[#4A5542]">
              <li><strong>Cancellation within 72 Hours:</strong> If a written cancellation request is delivered to the Abbottabad Secretariat within 72 hours of token remittance, 100% of the token fee is refunded minus nominal bank processing charges.</li>
              <li><strong>Reservation Expiry Without Downpayment:</strong> If an applicant fails to execute the booking agreement or remit the complete downpayment prior to the expiration date, the token deposit is forfeited in accordance with society rules and the plot is released.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-bold text-[#151914]">3. Active Booking File Surrender</h2>
            <p className="text-sm leading-relaxed text-[#4A5542]">
              Members wishing to voluntarily surrender an active, confirmed plot file before final allotment must submit an official File Surrender Application accompanied by the original society deposit slips and membership file. Approved refunds are disbursed via crossed society pay-order within 45 to 60 banking days, subject to a standard 10% administrative deduction on total principal deposited.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-bold text-[#151914]">4. Non-Refundable Society Fees</h2>
            <p className="text-sm leading-relaxed text-[#4A5542]">
              One-time society admission fees, registration application fees, and share subscription charges are non-refundable statutory contributions under cooperative society governance.
            </p>
          </section>

          <section className="space-y-3 border-t border-black/[0.08] pt-6">
            <h2 className="font-display text-xl font-bold text-[#151914]">5. Refund Processing Desk</h2>
            <p className="text-sm leading-relaxed text-[#4A5542]">
              All refund requests must be filed in person or by registered post to:
            </p>
            <div className="bg-[#FAF9F7] p-5 rounded-2xl border border-black/[0.06] text-xs sm:text-sm text-[#4A5542] space-y-1.5 mt-3">
              <p className="font-bold text-[#151914]">Prime View Finance & Allotment Committee</p>
              <p>Main Secretariat, Supply Road, Abbottabad, Pakistan</p>
              <p>Telephone: +92 51 9876543 / (051) 111-PRIME</p>
              <p>Email: finance@primeview.org</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
