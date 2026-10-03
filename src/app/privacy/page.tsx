import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Prime View Housing Society Abbottabad",
  description: "Privacy Policy for Prime View Housing Society in Abbottabad, Pakistan. Details regarding member and applicant information handling.",
  alternates: {
    canonical: "https://prime-view-livid.vercel.app/privacy",
  },
};

export default function PrivacyPolicyPage() {
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
            <p className="text-xs uppercase tracking-widest font-bold text-[#43612B] mb-2">Legal Compliance</p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#151914]">
              Privacy Policy
            </h1>
            <p className="text-xs text-[#6B7462] mt-2">
              Last updated: October 2026 • Prime View Cooperative Housing Society Abbottabad
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-bold text-[#151914]">1. Introduction & Society Identity</h2>
            <p className="text-sm leading-relaxed text-[#4A5542]">
              Prime View Cooperative Housing Society (&quot;Prime View&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;the Society&quot;) operates the residential and commercial land allotment portal and marketing site located in Abbottabad, Khyber Pakhtunkhwa, Pakistan. We are committed to safeguarding the privacy and personal records of our members, property buyers, overseas investors, and inquiry applicants.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-bold text-[#151914]">2. Information Collected by the Society</h2>
            <p className="text-sm leading-relaxed text-[#4A5542]">
              To process plot bookings, maintain official society records, and verify financial transactions, Prime View collects only necessary data, including:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm text-[#4A5542]">
              <li><strong>Applicant Particulars:</strong> Full legal name, Father/Husband name, Computerized National Identity Card (CNIC) or NICOP for overseas applicants, and photograph.</li>
              <li><strong>Contact Information:</strong> Active mobile telephone number, mailing address, city, and email address for official notices and ballot updates.</li>
              <li><strong>Nominee / Next-of-Kin Details:</strong> Nominee legal name and CNIC number for property title succession in society records.</li>
              <li><strong>Payment & Banking Verification:</strong> Depository bank name, transaction deposit reference number, payment dates, and uploaded bank deposit receipts or wire confirmation documents.</li>
              <li><strong>Inquiry Details:</strong> Name, phone number, and message submitted through public inquiry forms.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-bold text-[#151914]">3. Purpose of Data Processing</h2>
            <p className="text-sm leading-relaxed text-[#4A5542]">
              Collected personal and property data is utilized exclusively for:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm text-[#4A5542]">
              <li>Issuing verified society membership numbers and computerized plot reservation files.</li>
              <li>Reconciling bank deposits against installment plans and generating official two-part verified payment receipts.</li>
              <li>Delivering critical society notices, development milestones, and ballot schedules.</li>
              <li>Preventing unauthorized transactions, duplicate claims, and fraudulent payment slip submissions.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-bold text-[#151914]">4. Data Protection & Security Controls</h2>
            <p className="text-sm leading-relaxed text-[#4A5542]">
              Prime View implements robust technical controls including TLS encryption in transit, strict role-based administrative access scoping, cryptographic password hashing (bcrypt), and server-side magic byte inspection for uploaded documents. No financial PANs or plaintext authentication credentials are ever stored or exposed.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-bold text-[#151914]">5. Data Retention & Third Parties</h2>
            <p className="text-sm leading-relaxed text-[#4A5542]">
              Property files and verified payment records are retained for the legal duration of society ownership. We do not sell, rent, or trade member records to commercial advertisers. Information is disclosed only when required by applicable laws of Pakistan or authorized judicial bodies.
            </p>
          </section>

          <section className="space-y-3 border-t border-black/[0.08] pt-6">
            <h2 className="font-display text-xl font-bold text-[#151914]">6. Contact & Office Address</h2>
            <p className="text-sm leading-relaxed text-[#4A5542]">
              For inquiries regarding personal records or society registration:
            </p>
            <div className="bg-[#FAF9F7] p-5 rounded-2xl border border-black/[0.06] text-xs sm:text-sm text-[#4A5542] space-y-1.5">
              <p className="font-bold text-[#151914]">Prime View Main Secretariat</p>
              <p>Supply Road, Abbottabad, Khyber Pakhtunkhwa, Pakistan</p>
              <p>Telephone: +92 51 9876543 / (051) 111-PRIME</p>
              <p>Email: secretariat@primeview.org</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
