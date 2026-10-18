'use client';

import React, { useState } from 'react';
import { useMemberStore } from '@/lib/store/useMemberStore';
import { acceptTermsAndConditions } from '@/lib/dal/customers';
import { runLane1 } from '@/lib/requestLanes';
import { useAuth } from '@/lib/hooks/useAuth';
import { Shield, FileCheck, CheckCircle, AlertCircle, LogOut } from 'lucide-react';

interface TermsAgreementModalProps {
  standalone?: boolean;
}

export const TermsAgreementModal: React.FC<TermsAgreementModalProps> = ({ standalone = false }) => {
  const { profile, fetchProfile, termsModalOpen, closeTermsModal } = useMemberStore();
  const { logout } = useAuth();
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mandatory first-login check (when profile.termsAccepted is strictly false)
  const isMandatory = profile ? profile.termsAccepted === false : false;
  const isVisible = standalone || isMandatory || termsModalOpen;

  // If not mandatory and not explicitly triggered, do not render
  if (!isVisible) {
    return null;
  }

  const handleAccept = async () => {
    if (!agreed && isMandatory) return;
    setIsSubmitting(true);
    setError(null);

    try {
      if (profile) {
        const res = await runLane1({
          screen: 'member-terms',
          isSave: true,
          fn: async () => acceptTermsAndConditions(profile.id),
        });
        if (res.ok) {
          useMemberStore.setState((state) => ({
            ...state,
            profile: state.profile
              ? { ...state.profile, termsAccepted: true, termsAcceptedAt: new Date().toISOString() }
              : null,
            termsModalOpen: false,
          }));
          await fetchProfile();
          closeTermsModal();
        } else {
          setError(res.error || 'Failed to record acceptance. Please try again.');
        }
      } else {
        closeTermsModal();
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const cardContent = (
    <div className="max-w-2xl w-full bg-white rounded-3xl border border-black/[0.08] shadow-[0_24px_60px_rgba(0,0,0,0.1)] p-6 sm:p-8 space-y-6 animate-scale-in mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-black/[0.06]">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#EAF0E7] text-[#43612B] flex items-center justify-center shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#43612B] block">
                {isMandatory ? 'Mandatory First-Login Agreement' : 'Official Society Bylaws • Verified Agreement'}
              </span>
              <h2 className="font-display font-bold text-xl sm:text-2xl text-[#151914]">
                Society Terms &amp; Conditions
              </h2>
              <p className="text-xs text-[#6B7462] mt-0.5">
                {isMandatory
                  ? 'Welcome to the Prime View Member Portal. Please review and agree to the society bylaws before proceeding to your dashboard.'
                  : 'Official registered bylaws and governance policies of Prime View Co-Operative Housing Society Ltd.'}
              </p>
            </div>
          </div>
          {!isMandatory && (
            <button
              type="button"
              onClick={closeTermsModal}
              className="text-[#6B7462] hover:text-[#151914] p-1.5 rounded-lg hover:bg-black/5 transition-colors"
              title="Close"
            >
              ✕
            </button>
          )}
        </div>

        {/* Scrollable Terms Content */}
        <div className="max-h-72 sm:max-h-80 overflow-y-auto pr-3 space-y-3.5 text-xs text-[#4A5347] leading-relaxed border border-black/[0.06] rounded-2xl p-4 sm:p-5 bg-[#FAF9F7]">
          <div className="space-y-1">
            <h4 className="font-bold text-[#151914] flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#EAF0E7] text-[#43612B] text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                1
              </span>
              <span>Society Byelaws Compliance</span>
            </h4>
            <p className="pl-7">
              That the applicant shall abide by the byelaws of the Society.
            </p>
          </div>

          <div className="space-y-1 pt-2 border-t border-black/[0.04]">
            <h4 className="font-bold text-[#151914] flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#EAF0E7] text-[#43612B] text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                2
              </span>
              <span>Ownership Basis &amp; Master Plan Allotment</span>
            </h4>
            <p className="pl-7">
              The Plots offered to the buyers in the project shall be on ownership basis &amp; allotment shall be subject to Master Plan after Completion of All Dues.
            </p>
          </div>

          <div className="space-y-1 pt-2 border-t border-black/[0.04]">
            <h4 className="font-bold text-[#151914] flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#EAF0E7] text-[#43612B] text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                3
              </span>
              <span>Down Payment &amp; Monthly Installments Schedule</span>
            </h4>
            <p className="pl-7">
              Down Payment at the time of Booking is Mandatory. If purchased on installments, Monthly installments shall be payable and cleared on or before the 5th of each month through suitable banking channel (Online/Direct Deposit).
            </p>
          </div>

          <div className="space-y-1 pt-2 border-t border-black/[0.04]">
            <h4 className="font-bold text-[#151914] flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#EAF0E7] text-[#43612B] text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                4
              </span>
              <span>Bi-Annual / Half-Yearly Installments</span>
            </h4>
            <p className="pl-7">
              Bi-Annual/Half-Yearly Payments are subject to clear concurrently with the Monthly Installment of that respective month.
            </p>
          </div>

          <div className="space-y-1 pt-2 border-t border-black/[0.04]">
            <h4 className="font-bold text-[#151914] flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#EAF0E7] text-[#43612B] text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                5
              </span>
              <span>Payment Schedule &amp; Cancellation Liability</span>
            </h4>
            <p className="pl-7">
              The applicant shall make the payment of installments within the period specified. If the applicant fails to pay the payment / dues within the period as mentioned in the Booking Form and any additional document provided by the Society, the application will be liable to cancellation as per byelaws of the Society.
            </p>
          </div>

          <div className="space-y-1 pt-2 border-t border-black/[0.04]">
            <h4 className="font-bold text-[#151914] flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#EAF0E7] text-[#43612B] text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                6
              </span>
              <span>Final Notice, Cancellation &amp; Refund Policy</span>
            </h4>
            <p className="pl-7">
              In case of failure on the part of the applicant to make payments within the prescribed period as per schedule or after being served the FINAL NOTICE, the application / allotment will stand cancelled. The amount deposited by the applicant shall be refunded after deduction of 100% of down-payment, and 20% of Installments amount.
            </p>
          </div>

          <div className="space-y-1 pt-2 border-t border-black/[0.04]">
            <h4 className="font-bold text-[#151914] flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#EAF0E7] text-[#43612B] text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                7
              </span>
              <span>Development Charges &amp; TMA Formalities</span>
            </h4>
            <p className="pl-7">
              The cost of the plot includes all development charges. The applicant will pay transfer expenses, documentation charges and all other ancillary and miscellaneous expenses to the PVCHS Hazara Division as determined for fulfillment of formalities of various departments / agencies as and when asked by the TMA Abbottabad within the prescribed period (legal time).
            </p>
          </div>

          <div className="space-y-1 pt-2 border-t border-black/[0.04]">
            <h4 className="font-bold text-[#151914] flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#EAF0E7] text-[#43612B] text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                8
              </span>
              <span>Taxes &amp; Statutory Government Charges</span>
            </h4>
            <p className="pl-7">
              The allotee will pay all taxes and other charges levied by Federal, Provincial or Local Govt, local bodies and Municipal Bodies or any other Authorities, including those existing at present and those, which may be levied by the above-mentioned, and / or other Authorities in future.
            </p>
          </div>

          <div className="space-y-1 pt-2 border-t border-black/[0.04]">
            <h4 className="font-bold text-[#151914] flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#EAF0E7] text-[#43612B] text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                9
              </span>
              <span>Late Payment Surcharge (KIBOR + 5%)</span>
            </h4>
            <p className="pl-7">
              Registered members are requested to make payments as per schedule given by PVCHS Hazara Division. A surcharge @ 6 months KIBOR plus 5% for each day of delay shall be levied for the amount in default subject to Byelaws of Society.
            </p>
          </div>

          <div className="space-y-1 pt-2 border-t border-black/[0.04]">
            <h4 className="font-bold text-[#151914] flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#EAF0E7] text-[#43612B] text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                10
              </span>
              <span>Plot Position &amp; Master Plan Protection</span>
            </h4>
            <p className="pl-7">
              PVCHS Hazara Division, shall not change the position of plot, master Plan shall be strictly obeyed, if any changes were required, same shall be done after consent of Applicant.
            </p>
          </div>

          <div className="space-y-1 pt-2 border-t border-black/[0.04]">
            <h4 className="font-bold text-[#151914] flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#EAF0E7] text-[#43612B] text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                11
              </span>
              <span>Allotment Letter &amp; Physical Possession</span>
            </h4>
            <p className="pl-7">
              Formal / Final allotment letter(s) and physical possession of the plot are subject to complete clearance of all dues as mentioned under society byelaws.
            </p>
          </div>

          <div className="pt-3 pb-1 border-t border-black/[0.08]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#43612B] bg-[#EAF0E7] px-2.5 py-1 rounded-md">
              Membership Eligibility &amp; Statutory Standing
            </span>
          </div>

          <div className="space-y-1 pt-2 border-t border-black/[0.04]">
            <h4 className="font-bold text-[#151914] flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#EAF0E7] text-[#43612B] text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                12
              </span>
              <span>Age Requirement</span>
            </h4>
            <p className="pl-7">
              Should be of more than 18 years of age, unless he/she is a minor nominee of a deceased member.
            </p>
          </div>

          <div className="space-y-1 pt-2 border-t border-black/[0.04]">
            <h4 className="font-bold text-[#151914] flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#EAF0E7] text-[#43612B] text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                13
              </span>
              <span>Moral Character</span>
            </h4>
            <p className="pl-7">
              Must possess good moral character.
            </p>
          </div>

          <div className="space-y-1 pt-2 border-t border-black/[0.04]">
            <h4 className="font-bold text-[#151914] flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#EAF0E7] text-[#43612B] text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                14
              </span>
              <span>Share Purchase Requirement</span>
            </h4>
            <p className="pl-7">
              Purchase at least one share.
            </p>
          </div>

          <div className="space-y-1 pt-2 border-t border-black/[0.04]">
            <h4 className="font-bold text-[#151914] flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#EAF0E7] text-[#43612B] text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                15
              </span>
              <span>Membership Approval &amp; Nominee Standing</span>
            </h4>
            <p className="pl-7">
              Has applied for membership or his/her membership is approved, as a nominee or legal representative of deceased member.
            </p>
          </div>

          <div className="space-y-1 pt-2 border-t border-black/[0.04]">
            <h4 className="font-bold text-[#151914] flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#EAF0E7] text-[#43612B] text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                16
              </span>
              <span>Statutory Compliance with Amended By-Laws &amp; Acts</span>
            </h4>
            <p className="pl-7">
              Is in accordance with the directions issued by the Prime View Co-operative Housing Society Ltd Hazara Division Amendend by-Laws, &amp; Co-operative Society Act 1925 Amended 2020 &amp; Co-operative societies rules 1927, from time to time.
            </p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Checkbox */}
        <label className="flex items-start gap-3 cursor-pointer select-none bg-[#FAF9F5] p-3.5 rounded-xl border border-black/[0.06]">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 w-4 h-4 text-[#43612B] rounded-sm focus:ring-[#43612B] border-black/20"
          />
          <span className="text-xs font-semibold text-[#151914] leading-snug">
            I hereby confirm that I have read, understood, and solemnly accept all Terms &amp; Conditions, society bylaws, and digital portal policies of Prime View Housing Society.
          </span>
        </label>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
          {isMandatory ? (
            <button
              type="button"
              onClick={() => logout()}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors text-center cursor-pointer"
            >
              Log Out
            </button>
          ) : (
            <button
              type="button"
              onClick={closeTermsModal}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors text-center cursor-pointer"
            >
              Close
            </button>
          )}

          <button
            type="button"
            disabled={(!agreed && isMandatory) || isSubmitting}
            onClick={handleAccept}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#43612B] hover:bg-[#365222] disabled:opacity-40 text-white font-bold text-xs tracking-wide flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(67,97,43,0.3)] transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Recording Agreement...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>{isMandatory ? 'Agree & Enter Member Portal' : 'Accept Terms & Save'}</span>
              </>
            )}
          </button>
        </div>
    </div>
  );

  if (standalone) {
    return cardContent;
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {cardContent}
    </div>
  );
};
