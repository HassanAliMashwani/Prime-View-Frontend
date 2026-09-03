"use client";

import React, { useState } from "react";
import { Send, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

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
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="bg-[#FAF9F7] p-6 sm:p-8 rounded-2xl border border-black/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.09)] hover:-translate-y-1 transition-all duration-300"
    >
      <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#151914] mb-2">
        Send an Inquiry
      </h3>
      <p className="font-sans text-xs sm:text-sm text-[#6B7462] mb-6">
        Fill out the form below to reach out to the Prime View team directly.
      </p>

      {submitted ? (
        <div className="bg-[#EAF0E7] border border-[#A8BBA2]/50 text-[#151914] p-5 rounded-xl text-sm font-medium flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-[#43612B] shrink-0" />
          <span>Thank you! We respond to all inquiries promptly within 2 hours.</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 font-sans">
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
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Full Name"
              className="w-full px-4 py-3 text-sm bg-white border border-black/[0.1] rounded-xl text-[#151914] placeholder-[#6B7462]/60 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#43612B] focus:border-[#43612B]"
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
              required
              value={formData.number}
              onChange={(e) =>
                setFormData({ ...formData, number: e.target.value })
              }
              placeholder="+92 3XX XXXXXXX"
              className="w-full px-4 py-3 text-sm bg-white border border-black/[0.1] rounded-xl text-[#151914] placeholder-[#6B7462]/60 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#43612B] focus:border-[#43612B]"
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
              rows={4}
              required
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
              placeholder="Specify plot size (5, 7, 10 Marla, 1 Kanal) or questions..."
              className="w-full px-4 py-3 text-sm bg-white border border-black/[0.1] rounded-xl text-[#151914] placeholder-[#6B7462]/60 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#43612B] focus:border-[#43612B]"
            />
          </div>

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 bg-[#43612B] hover:bg-[#324920] text-white text-xs font-bold py-3.5 rounded-xl uppercase tracking-wider shadow-[0_4px_14px_rgba(67,97,43,0.35)] hover:shadow-[0_6px_20px_rgba(67,97,43,0.45)] transition-all duration-150 active:scale-[0.99] cursor-pointer"
          >
            <span>Submit Booking Inquiry</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      )}
    </motion.div>
  );
};
