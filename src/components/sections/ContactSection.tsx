import React from "react";
import { siteConfig } from "@/data/site";
import { ContactForm } from "@/components/ui/ContactForm";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

export const ContactSection: React.FC = () => {
  return (
    <section className="py-20 sm:py-28 bg-soft-white text-charcoal border-b border-card-border/60 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Contact Details Column */}
          <div className="lg:col-span-5 space-y-6">
            <span className="kicker block text-xs font-semibold tracking-widest text-accent-green uppercase">
              BOOKING &amp; MARKETING OFFICE
            </span>

            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-charcoal tracking-tight">
              Get In Touch With Us
            </h2>

            <p className="font-sans text-sm sm:text-base text-muted-gray-text leading-relaxed">
              Visit our Islamabad marketing office or reach out via phone,
              email, or WhatsApp for instant booking assistance.
            </p>

            <div className="space-y-4 pt-2">
              {/* Address */}
              <div className="bg-pure-white p-4 rounded-xl border border-card-border">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-green-tint-bg text-accent-green flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-sans text-xs font-semibold text-charcoal uppercase tracking-wider">
                      Marketing &amp; Booking Office
                    </h4>
                    <p className="font-sans text-xs sm:text-sm text-muted-gray-text mt-1 leading-relaxed">
                      {siteConfig.address}
                    </p>
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div className="bg-pure-white p-4 rounded-xl border border-card-border">
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-green-tint-bg text-accent-green flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-sans text-xs font-semibold text-charcoal uppercase tracking-wider">
                      Phone Helpline
                    </h4>
                    <a
                      href={`tel:${siteConfig.phone}`}
                      className="font-sans text-xs sm:text-sm text-accent-green hover:underline font-medium mt-0.5 block"
                    >
                      {siteConfig.phone}
                    </a>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="bg-pure-white p-4 rounded-xl border border-card-border">
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-green-tint-bg text-accent-green flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-sans text-xs font-semibold text-charcoal uppercase tracking-wider">
                      Official Email
                    </h4>
                    <a
                      href={`mailto:${siteConfig.email}`}
                      className="font-sans text-xs sm:text-sm text-accent-green hover:underline font-medium mt-0.5 block"
                    >
                      {siteConfig.email}
                    </a>
                  </div>
                </div>
              </div>

              {/* Office Hours */}
              <div className="bg-pure-white p-4 rounded-xl border border-card-border">
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-green-tint-bg text-accent-green flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-sans text-xs font-semibold text-charcoal uppercase tracking-wider">
                      Office Timings
                    </h4>
                    <p className="font-sans text-xs sm:text-sm text-muted-gray-text mt-0.5">
                      Mon – Sat: 9:00 AM – 6:00 PM
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form Column */}
          <div className="lg:col-span-7">
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
};
