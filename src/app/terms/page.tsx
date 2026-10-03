import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms and Conditions | Prime View Housing Society Abbottabad",
  description: "Terms and conditions governing plot reservations, membership, and property allotments at Prime View Housing Society, Abbottabad, Pakistan.",
  alternates: {
    canonical: "https://prime-view-livid.vercel.app/terms",
  },
};

export default function TermsAndConditionsPage() {
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
            <p className="text-xs uppercase tracking-widest font-bold text-[#43612B] mb-2">Society By-laws & Governance</p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#151914]">
              Terms and Conditions
            </h1>
            <p className="text-xs text-[#6B7462] mt-2">
              Last updated: October 2026 • Prime View Cooperative Housing Society Abbottabad
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-bold text-[#151914]">1. Agreement to Terms</h2>
            <p className="text-sm leading-relaxed text-[#4A5542]">
              By accessing the Prime View digital portal, initiating an online plot inquiry, submitting membership credentials, or remitting token booking deposits, you agree to be bound by these Terms and Conditions and the official by-laws of Prime View Cooperative Housing Society Abbottabad, Pakistan.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-bold text-[#151914]">2. Plot Reservations & Token Deposits</h2>
            <p className="text-sm leading-relaxed text-[#4A5542]">
              A temporary reservation lock holds a specific plot file for a limited window (typically 7 to 14 days) pending full downpayment submission. If the required initial downpayment and applicant documentation are not remitted prior to the reservation expiry timestamp, the plot automatically releases back to the available inventory pool.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-bold text-[#151914]">3. Installment Schedules & Payment Receipts</h2>
            <p className="text-sm leading-relaxed text-[#4A5542]">
              All installments must be remitted in Pakistani Rupees (PKR) into the designated society bank accounts. Members must upload genuine depository bank slips or wire transaction confirmations through the member portal. Payments are not deemed confirmed until audited and cryptographically verified by authorized society finance officers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-bold text-[#151914]">4. Default, Delinquency & Administrative Strikes</h2>
            <p className="text-sm leading-relaxed text-[#4A5542]">
              Consecutive overdue installments without formal extension notice may incur administrative warnings or strikes in accordance with society regulations. Persistent delinquency after official registered notices may result in file cancellation, re-allocation, or placement on deferred status.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-bold text-[#151914]">5. Survey Adjustments & Master Plan Revisions</h2>
            <p className="text-sm leading-relaxed text-[#4A5542]">
              Town planning authorities and terrain engineering in Abbottabad may necessitate minor dimensional or contour adjustments to plot boundaries. All adjustments are conducted strictly under official re-survey protocols and recorded in the immutable plot status audit ledger.
            </p>
          </section>

          <section className="space-y-3 border-t border-black/[0.08] pt-6">
            <h2 className="font-display text-xl font-bold text-[#151914]">6. Jurisdiction & Dispute Resolution</h2>
            <p className="text-sm leading-relaxed text-[#4A5542]">
              These terms are governed exclusively by the laws of the Islamic Republic of Pakistan. Any legal disputes or claims shall be adjudicated under the jurisdiction of the competent courts in Abbottabad, Khyber Pakhtunkhwa.
            </p>
            <div className="bg-[#FAF9F7] p-5 rounded-2xl border border-black/[0.06] text-xs sm:text-sm text-[#4A5542] space-y-1.5 mt-4">
              <p className="font-bold text-[#151914]">Prime View Society Secretariat</p>
              <p>Supply Road, Abbottabad, Khyber Pakhtunkhwa, Pakistan</p>
              <p>Official Helpline: +92 51 9876543 / (051) 111-PRIME</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
