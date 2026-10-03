"use client";

import React, { useState } from "react";
import { Send, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export const ContactForm: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    number: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // 1. Honeypot bot protection: if filled, quietly drop without alerting bot
    if (honeypot.trim() !== "") {
      setSubmitted(true);
      return;
    }

    // 2. Client-side burst rate limiting (60 second cooldown)
    const LAST_SUBMIT_KEY = "pv_last_inquiry_time";
    const now = Date.now();
    try {
      const lastSubmit = sessionStorage.getItem(LAST_SUBMIT_KEY);
      if (lastSubmit && now - parseInt(lastSubmit, 10) < 60000) {
        const remaining = Math.ceil((60000 - (now - parseInt(lastSubmit, 10))) / 1000);
        setErrorMsg(`Too many requests. Please wait ${remaining} seconds before submitting another inquiry.`);
        return;
      }
    } catch {
      /* ignore */
    }

    // 3. Validation
    if (formData.name.trim().length < 2) {
      setErrorMsg("Please enter your legal name (minimum 2 characters).");
      return;
    }
    const cleanNumber = formData.number.replace(/[^0-9+]/g, "");
    if (cleanNumber.length < 8) {
      setErrorMsg("Please provide a valid phone or WhatsApp number.");
      return;
    }
    if (formData.message.trim().length < 5) {
      setErrorMsg("Please provide a message describing your property inquiry.");
      return;
    }
    if (!consentAccepted) {
      setErrorMsg("You must consent to be contacted regarding this society inquiry.");
      return;
    }

    try {
      sessionStorage.setItem(LAST_SUBMIT_KEY, now.toString());
    } catch {
      /* ignore */
    }

    setSubmitted(true);
  };

  const handleReset = () => {
    setFormData({ name: "", number: "", message: "" });
    setConsentAccepted(false);
    setErrorMsg(null);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="bg-[#FAF9F7] p-5 sm:p-8 rounded-2xl border border-black/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.09)] transition-all duration-300 w-full max-w-full overflow-hidden"
    >
      <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#151914] mb-2">
        Send an Inquiry
      </h3>
      <p className="font-sans text-xs sm:text-sm text-[#3B4435] mb-6">
        Fill out the form below to reach out to the Prime View team directly.
      </p>

      {submitted ? (
        <div className="bg-[#EAF0E7] border border-[#A8BBA2]/50 text-[#151914] p-5 rounded-xl text-sm font-medium flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-[#43612B] shrink-0" />
          <span>Thank you! Your inquiry has been received. Our booking office will contact you within 2 business hours.</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 font-sans">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
              {errorMsg}
            </div>
          )}

          {/* Honeypot field - invisible to human users, traps spam bots */}
          <div aria-hidden="true" style={{ display: "none", position: "absolute", left: "-9999px" }}>
            <label htmlFor="form-field-hp">Leave this field blank</label>
            <input
              type="text"
              id="form-field-hp"
              name="_society_inquiry_hp"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          <div>
            <label
              htmlFor="form-field-name"
              className="block text-xs font-semibold text-[#151914] mb-1.5 uppercase tracking-wider"
            >
              Your Name
            </label>
            <input
              type="text"
              id="form-field-name"
              name="name"
              tabIndex={0}
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Full Name"
              className="w-full px-4 py-3 text-sm bg-white border border-black/[0.1] rounded-xl text-[#151914] placeholder-[#5A6352] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#43612B] focus:border-[#43612B]"
            />
          </div>

          <div>
            <label
              htmlFor="form-field-number"
              className="block text-xs font-semibold text-[#151914] mb-1.5 uppercase tracking-wider"
            >
              Phone / WhatsApp Number
            </label>
            <input
              type="tel"
              id="form-field-number"
              name="number"
              tabIndex={0}
              required
              value={formData.number}
              onChange={(e) =>
                setFormData({ ...formData, number: e.target.value })
              }
              placeholder="+92 3XX XXXXXXX"
              className="w-full px-4 py-3 text-sm bg-white border border-black/[0.1] rounded-xl text-[#151914] placeholder-[#5A6352] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#43612B] focus:border-[#43612B]"
            />
          </div>

          <div>
            <label
              htmlFor="form-field-message"
              className="block text-xs font-semibold text-[#151914] mb-1.5 uppercase tracking-wider"
            >
              Message / Property Interest
            </label>
            <textarea
              id="form-field-message"
              name="message"
              tabIndex={0}
              rows={4}
              required
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
              placeholder="Specify plot size (5, 7, 10 Marla, 1 Kanal) or questions..."
              className="w-full px-4 py-3 text-sm bg-white border border-black/[0.1] rounded-xl text-[#151914] placeholder-[#5A6352] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#43612B] focus:border-[#43612B]"
            />
          </div>

          {/* Form consent checkbox */}
          <div className="flex items-start gap-2.5 pt-1">
            <input
              type="checkbox"
              id="form-field-consent"
              name="consent"
              tabIndex={0}
              required
              checked={consentAccepted}
              onChange={(e) => setConsentAccepted(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-[#43612B] border-black/[0.2] focus:ring-[#43612B] cursor-pointer"
            />
            <label htmlFor="form-field-consent" className="text-xs text-[#3B4435] leading-relaxed cursor-pointer">
              I consent to Prime View Cooperative Housing Society storing my contact details and contacting me regarding this property inquiry. (Draft for owner review).
            </label>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <button
              type="submit"
              tabIndex={0}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-[#43612B] hover:bg-[#324920] text-white text-xs font-bold py-3.5 rounded-xl uppercase tracking-wider shadow-[0_4px_14px_rgba(67,97,43,0.35)] hover:shadow-[0_6px_20px_rgba(67,97,43,0.45)] transition-all duration-150 active:scale-[0.99] cursor-pointer"
            >
              <span>Send inquiry</span>
              <Send className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              tabIndex={0}
              onClick={handleReset}
              className="inline-flex items-center justify-center bg-transparent hover:bg-black/[0.04] text-[#151914] border border-black/[0.15] text-xs font-bold py-3.5 px-5 rounded-xl uppercase tracking-wider transition-colors cursor-pointer"
            >
              Clear form
            </button>
          </div>
        </form>
      )}
    </motion.div>
  );
};

