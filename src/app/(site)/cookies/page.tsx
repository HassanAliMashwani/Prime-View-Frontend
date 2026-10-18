import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Cookie, ShieldCheck, Lock, Sliders, Database, Info } from "lucide-react";

export const metadata: Metadata = {
  title: "Cookies Policy | Prime View Housing Society Abbottabad",
  description: "Cookies Policy for Prime View Housing Society portal explaining essential session cookies, local storage, and member privacy choices.",
  alternates: {
    canonical: "https://prime-view-livid.vercel.app/cookies",
  },
};

export default function CookiesPolicyPage() {
  return (
    <div className="py-16 sm:py-24 bg-[#F8F7F5] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-black/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-8 font-sans text-[#151914]">
          {/* Header */}
          <div className="border-b border-black/[0.08] pb-6">
            <p className="text-xs uppercase tracking-widest font-bold text-[#43612B] mb-2">
              Legal Compliance • Transparency &amp; Privacy
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#151914]">
              Cookies Policy
            </h1>
            <p className="text-xs text-[#6B7462] mt-2">
              Last updated: October 2026 • Prime View Co-operative Housing Society Ltd Hazara Division
            </p>
          </div>

          {/* 1. Introduction */}
          <section className="space-y-3">
            <h2 className="font-display text-xl font-bold text-[#151914] flex items-center gap-2">
              <Cookie className="w-5 h-5 text-[#43612B]" />
              <span>1. What Are Cookies and Local Storage?</span>
            </h2>
            <p className="text-sm leading-relaxed text-[#4A5542]">
              Cookies and local browser storage are compact text files and key-value records placed on your computer or mobile device when you browse websites. They enable online platforms to recognize your device, maintain active authenticated sessions, safeguard account security, and recall member preferences between page visits.
            </p>
            <p className="text-sm leading-relaxed text-[#4A5542]">
              Prime View Co-operative Housing Society Ltd (&quot;Prime View&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;the Society&quot;) uses these tools exclusively to provide secure digital access to our official portal, plot reservation ledgers, verified payment receipts, and property master plan maps.
            </p>
          </section>

          {/* 2. Categories of Cookies We Use */}
          <section className="space-y-4">
            <h2 className="font-display text-xl font-bold text-[#151914] flex items-center gap-2">
              <Database className="w-5 h-5 text-[#43612B]" />
              <span>2. Categories of Cookies &amp; Storage Used</span>
            </h2>

            <div className="space-y-4 text-sm text-[#4A5542]">
              {/* Strictly Essential */}
              <div className="p-5 bg-[#FAF9F7] rounded-2xl border border-black/[0.06] space-y-2">
                <div className="flex items-center gap-2 text-[#151914] font-bold">
                  <Lock className="w-4 h-4 text-[#43612B]" />
                  <h3>Strictly Essential Technical Cookies &amp; Session Tokens</h3>
                </div>
                <p className="text-xs leading-relaxed">
                  These records are mandatory for the fundamental security and operational integrity of the society portal. They store encrypted member and administrative JWT session tokens, CSRF protection identifiers, and cryptographic request lane keys. They ensure that your plot ledgers, personal records, and financial transaction slips cannot be accessed or intercepted by unauthorized third parties.
                </p>
                <div className="text-[11px] font-mono text-[#6B7462] bg-white/80 p-2.5 rounded-xl border border-black/[0.05]">
                  <strong>Examples:</strong> <code>pv_member_token</code>, <code>pv_admin_token</code>, <code>session_id</code> • <strong>Lifespan:</strong> Session / 30 Days • <strong>Exempt from Consent:</strong> Yes (Required for Service)
                </div>
              </div>

              {/* Preferences & Consent */}
              <div className="p-5 bg-[#FAF9F7] rounded-2xl border border-black/[0.06] space-y-2">
                <div className="flex items-center gap-2 text-[#151914] font-bold">
                  <Sliders className="w-4 h-4 text-[#43612B]" />
                  <h3>Consent &amp; Display Preference Storage</h3>
                </div>
                <p className="text-xs leading-relaxed">
                  We maintain a minimal local browser flag solely to remember your cookie consent preferences (whether you clicked &quot;Accept Cookies&quot; or &quot;Reject All&quot;), preventing repeated consent prompts on every page load. We also store non-identifying UI preferences such as active map filters and table sorting states.
                </p>
                <div className="text-[11px] font-mono text-[#6B7462] bg-white/80 p-2.5 rounded-xl border border-black/[0.05]">
                  <strong>Examples:</strong> <code>pv_cookie_consent</code>, <code>pv_map_filters</code> • <strong>Lifespan:</strong> 365 Days • <strong>Opt-Out Available:</strong> Yes
                </div>
              </div>

              {/* Analytics & Performance */}
              <div className="p-5 bg-[#FAF9F7] rounded-2xl border border-black/[0.06] space-y-2">
                <div className="flex items-center gap-2 text-[#151914] font-bold">
                  <ShieldCheck className="w-4 h-4 text-[#43612B]" />
                  <h3>Telemetry &amp; Performance Optimization (Strictly Opt-In)</h3>
                </div>
                <p className="text-xs leading-relaxed">
                  Optional, aggregated telemetry helps our engineering desk measure server response speeds, page load times, and public interest across society development sectors. <strong>No analytics cookies are ever set or loaded before you explicitly click &quot;Accept Cookies&quot; on our consent banner.</strong> If you select &quot;Reject All&quot;, zero tracking or performance cookies are installed.
                </p>
                <div className="text-[11px] font-mono text-[#6B7462] bg-white/80 p-2.5 rounded-xl border border-black/[0.05]">
                  <strong>Status:</strong> Disabled by Default • <strong>Personal Data Collected:</strong> None (Anonymized IPs only)
                </div>
              </div>
            </div>
          </section>

          {/* 3. Third Parties */}
          <section className="space-y-3">
            <h2 className="font-display text-xl font-bold text-[#151914] flex items-center gap-2">
              <Info className="w-5 h-5 text-[#43612B]" />
              <span>3. Third-Party Tracking &amp; Advertising</span>
            </h2>
            <p className="text-sm leading-relaxed text-[#4A5542]">
              Prime View Co-operative Housing Society does <strong>not</strong> partner with commercial advertising networks, ad-targeting trackers, behavioral data brokers, or cross-site tracking corporations. We do not sell, rent, or monetize your digital footprint under any circumstances.
            </p>
          </section>

          {/* 4. Managing Choices */}
          <section className="space-y-3">
            <h2 className="font-display text-xl font-bold text-[#151914] flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#43612B]" />
              <span>4. Controlling &amp; Managing Your Cookie Preferences</span>
            </h2>
            <p className="text-sm leading-relaxed text-[#4A5542]">
              You hold complete control over cookies on your devices. You can exercise your preferences at any time through the following means:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm text-[#4A5542]">
              <li>
                <strong>On Our Portal:</strong> You can select &quot;Reject All&quot; on our Cookie Preferences banner to prevent any non-essential cookies from being deployed.
              </li>
              <li>
                <strong>Browser Settings:</strong> You can configure your browser (Google Chrome, Safari, Mozilla Firefox, or Microsoft Edge) to refuse all cookies, alert you when a cookie is placed, or delete cached records upon closing your browser. Note that disabling essential cookies will prevent authentication into the member and administrative portals.
              </li>
              <li>
                <strong>Clearing Local Storage:</strong> Clearing your browser history and site data will remove all stored session preferences, prompting the consent banner upon your next visit.
              </li>
            </ul>
          </section>

          {/* 5. Legal Framework */}
          <section className="space-y-3">
            <h2 className="font-display text-xl font-bold text-[#151914]">
              5. Statutory Governance &amp; Byelaws Alignment
            </h2>
            <p className="text-sm leading-relaxed text-[#4A5542]">
              This policy is executed in strict adherence to the directions issued by the Prime View Co-operative Housing Society Ltd Hazara Division Amended By-Laws, the Co-operative Societies Act 1925 (Amended 2020), and Co-operative Societies Rules 1927. For additional details regarding member data protections, please review our{" "}
              <Link href="/privacy" className="text-[#43612B] underline font-bold">
                Privacy Policy
              </Link>{" "}
              and{" "}
              <Link href="/terms" className="text-[#43612B] underline font-bold">
                Terms &amp; Conditions
              </Link>.
            </p>
          </section>

          {/* 6. Contact */}
          <section className="space-y-3 border-t border-black/[0.08] pt-6">
            <h2 className="font-display text-xl font-bold text-[#151914]">
              6. Secretariat &amp; Technical Support Contact
            </h2>
            <p className="text-sm leading-relaxed text-[#4A5542]">
              For technical queries regarding our cookie architecture, data privacy controls, or portal security, please contact our secretariat desk:
            </p>
            <div className="bg-[#FAF9F7] p-5 rounded-2xl border border-black/[0.06] text-xs sm:text-sm text-[#4A5542] space-y-1.5">
              <p className="font-bold text-[#151914]">
                Prime View Co-operative Housing Society Ltd — Main Secretariat
              </p>
              <p>Supply Road, Abbottabad, Khyber Pakhtunkhwa, Pakistan</p>
              <p>Telephone: +92 51 9876543 / (051) 111-PRIME</p>
              <p>
                Email:{" "}
                <a
                  href="mailto:secretariat@primeview.org"
                  className="text-[#43612B] underline font-medium"
                >
                  secretariat@primeview.org
                </a>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
