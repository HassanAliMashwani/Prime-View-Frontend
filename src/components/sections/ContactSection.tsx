import React from "react";
import Image from "next/image";
import { ContactForm } from "@/components/ui/ContactForm";
import { siteConfig } from "@/data/site";
import { MapPin, Phone, Mail } from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export const ContactSection: React.FC = () => {
  return (
    <section className="bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-stone-100 via-stone-300 to-stone-500 text-charcoal relative overflow-hidden flex flex-col lg:flex-row border-t border-stone">

      {/* Left Visual Column - Stretches from left edge to middle */}
      <div className="w-full lg:w-[45%] xl:w-[45%] relative h-[300px] sm:h-[400px] lg:h-auto lg:min-h-[500px] lg:rounded-r-[2.5rem] overflow-hidden shadow-2xl border-r border-stone">
        <Image
          src="/new assests/about page logos/contactus pic.jpg"
          alt="Prime View Contact Us"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/20 bg-gradient-to-b from-black/80 via-black/50 to-black/90 backdrop-blur-[3px]" />

        <div className="absolute inset-0 p-8 lg:p-12 xl:p-16 z-10 flex flex-col justify-center">
          <div className="mb-10 lg:mb-12">
            <ScrollReveal variant="blur-word" className="font-display text-3xl lg:text-5xl text-white drop-shadow-md">
              Get In Touch
            </ScrollReveal>
            <p className="font-sans text-sm lg:text-base text-white/90 drop-shadow-md mt-3 max-w-xs leading-relaxed">
              We're here to help you secure your dream property.
            </p>
          </div>

          {/* Contact Details Overlay */}
          <div className="flex flex-col gap-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30">
                <MapPin className="w-4 h-4 text-white" />
              </div>
              <div className="text-white drop-shadow-md">
                <p className="text-[11px] uppercase tracking-wider font-bold text-white/70">Office</p>
                <p className="text-sm lg:text-base font-medium leading-tight mt-1 max-w-[240px]">{siteConfig.address}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30">
                <Phone className="w-4 h-4 text-white" />
              </div>
              <div className="text-white drop-shadow-md">
                <p className="text-[11px] uppercase tracking-wider font-bold text-white/70">Call Us</p>
                <p className="text-sm lg:text-base font-medium leading-tight mt-1">{siteConfig.phone}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30">
                <Mail className="w-4 h-4 text-white" />
              </div>
              <div className="text-white drop-shadow-md">
                <p className="text-[11px] uppercase tracking-wider font-bold text-white/70">Email</p>
                <p className="text-sm lg:text-base font-medium leading-tight mt-1">{siteConfig.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Form Column - Stays contained nicely */}
      <div className="w-full lg:w-[55%] xl:w-[55%] flex items-center px-6 sm:px-8 lg:px-16 xl:px-24 py-12 lg:py-16">
        <div className="w-full max-w-xl mx-auto lg:ml-0">
          <ContactForm />
        </div>
      </div>

    </section>
  );
};
