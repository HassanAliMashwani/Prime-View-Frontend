"use client";

import React, { useState } from "react";
import { Send, CheckCircle2 } from "lucide-react";

export const ContactForm: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    number: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="bg-pure-white p-6 sm:p-8 rounded-2xl border border-stone/60 shadow-[0_0_60px_-15px_rgba(0,0,0,0.15)]">
      <h3 className="font-display text-2xl sm:text-3xl font-semibold text-charcoal mb-2">
        Send an Inquiry
      </h3>
      <p className="font-sans text-xs sm:text-sm text-charcoal/60 mb-6">
        Fill out the form below to reach out to the Prime View team directly.
      </p>

      {submitted ? (
        <div className="bg-soft-white border border-verified-green/30 text-charcoal p-5 rounded-xl text-sm font-medium flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-verified-green shrink-0" />
          <span>Thank you! We respond to all inquiries promptly within 2 hours.</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 font-sans">
          <div>
            <label
              htmlFor="form-field-name"
              className="block text-xs font-semibold text-charcoal mb-1.5 uppercase tracking-wider"
            >
              Your Name
            </label>
            <input
              type="text"
              id="form-field-name"
              name="name"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Full Name"
              className="w-full px-4 py-3 text-sm bg-soft-white border border-stone rounded-xl text-charcoal placeholder-charcoal/60/60 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-verified-green focus:border-verified-green"
            />
          </div>

          <div>
            <label
              htmlFor="form-field-number"
              className="block text-xs font-semibold text-charcoal mb-1.5 uppercase tracking-wider"
            >
              Phone / WhatsApp Number
            </label>
            <input
              type="tel"
              id="form-field-number"
              name="number"
              required
              value={formData.number}
              onChange={(e) =>
                setFormData({ ...formData, number: e.target.value })
              }
              placeholder="+92 3XX XXXXXXX"
              className="w-full px-4 py-3 text-sm bg-soft-white border border-stone rounded-xl text-charcoal placeholder-charcoal/60/60 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-verified-green focus:border-verified-green"
            />
          </div>

          <div>
            <label
              htmlFor="form-field-message"
              className="block text-xs font-semibold text-charcoal mb-1.5 uppercase tracking-wider"
            >
              Message / Property Interest
            </label>
            <textarea
              id="form-field-message"
              name="message"
              rows={4}
              required
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
              placeholder="Specify plot size (5, 7, 10 Marla, 1 Kanal) or questions..."
              className="w-full px-4 py-3 text-sm bg-soft-white border border-stone rounded-xl text-charcoal placeholder-charcoal/60/60 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-verified-green focus:border-verified-green"
            />
          </div>

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 bg-verified-green hover:bg-[#137547] text-pure-white text-xs font-bold py-3.5 rounded-xl uppercase tracking-wider shadow-xs transition-colors duration-150"
          >
            <span>Submit Booking Inquiry</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      )}
    </div>
  );
};
