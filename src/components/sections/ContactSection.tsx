"use client";

import React from "react";
import { siteConfig } from "@/data/site";
import { ContactForm } from "@/components/ui/ContactForm";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { SectionReveal } from "@/components/motion/SectionReveal";
import { StaggerContainer, StaggerItem } from "@/components/motion/StaggerContainer";
import { LuxuryCard } from "@/components/ui/LuxuryCard";

export const ContactSection: React.FC = () => {
  return (
    <section className="py-24 sm:py-32 bg-warm-ivory text-charcoal border-t border-stone/30 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Contact Details Column */}
          <div className="lg:col-span-5 space-y-6">
            <StaggerContainer>
              <StaggerItem>
                <span className="kicker block mb-2">
                  BOOKING &amp; MARKETING OFFICE
                </span>
              </StaggerItem>

              <StaggerItem yOffset={20}>
                <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-charcoal tracking-tight">
                  Get In Touch With Us
                </h2>
              </StaggerItem>

              <StaggerItem yOffset={16}>
                <p className="font-sans text-sm sm:text-base text-charcoal/75 leading-relaxed pt-2">
                  Visit our Islamabad marketing office or reach out via phone,
                  email, or WhatsApp for instant booking assistance.
                </p>
              </StaggerItem>

              <StaggerItem yOffset={18}>
                <div className="space-y-4 pt-4">
                  {/* Address */}
                  <LuxuryCard theme="light" interactive={false} className="p-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-9 h-9 rounded-lg bg-verified-green/10 text-verified-green flex items-center justify-center shrink-0 mt-0.5">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-sans text-xs font-semibold text-charcoal uppercase tracking-wider">
                          Marketing &amp; Booking Office
                        </h4>
                        <p className="font-sans text-xs sm:text-sm text-charcoal/80 mt-1 leading-relaxed">
                          {siteConfig.address}
                        </p>
                      </div>
                    </div>
                  </LuxuryCard>

                  {/* Phone */}
                  <LuxuryCard theme="light" interactive={false} className="p-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-9 h-9 rounded-lg bg-verified-green/10 text-verified-green flex items-center justify-center shrink-0">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-sans text-xs font-semibold text-charcoal uppercase tracking-wider">
                          Phone Helpline
                        </h4>
                        <a
                          href={`tel:${siteConfig.phone}`}
                          className="font-sans text-xs sm:text-sm text-verified-green hover:underline font-medium mt-0.5 block"
                        >
                          {siteConfig.phone}
                        </a>
                      </div>
                    </div>
                  </LuxuryCard>

                  {/* Email */}
                  <LuxuryCard theme="light" interactive={false} className="p-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-9 h-9 rounded-lg bg-verified-green/10 text-verified-green flex items-center justify-center shrink-0">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-sans text-xs font-semibold text-charcoal uppercase tracking-wider">
                          Official Email
                        </h4>
                        <a
                          href={`mailto:${siteConfig.email}`}
                          className="font-sans text-xs sm:text-sm text-verified-green hover:underline font-medium mt-0.5 block"
                        >
                          {siteConfig.email}
                        </a>
                      </div>
                    </div>
                  </LuxuryCard>

                  {/* Office Hours */}
                  <LuxuryCard theme="light" interactive={false} className="p-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-9 h-9 rounded-lg bg-verified-green/10 text-verified-green flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-sans text-xs font-semibold text-charcoal uppercase tracking-wider">
                          Office Hours
                        </h4>
                        <p className="font-sans text-xs sm:text-sm text-charcoal/80 mt-0.5">
                          Monday - Saturday: 9:00 AM - 6:00 PM
                        </p>
                      </div>
                    </div>
                  </LuxuryCard>
                </div>
              </StaggerItem>
            </StaggerContainer>
          </div>

          {/* Form Column */}
          <div className="lg:col-span-7">
            <SectionReveal delay={0.15} yOffset={24}>
              <ContactForm />
            </SectionReveal>
          </div>
        </div>
      </div>
    </section>
  );
};
