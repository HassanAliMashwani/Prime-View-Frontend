import React from "react";
import Image from "next/image";

export const AboutOfferingsCluster: React.FC = () => {
  return (
    <section className="bg-pure-white text-charcoal py-14 sm:py-16 border-b border-card-border relative overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-6 sm:px-8 lg:px-12 relative z-10">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* Left: Heading */}
          <div className="space-y-2">
            <span className="kicker block text-xs font-bold tracking-widest text-accent-green uppercase">
              OFFICIAL SOCIETY BROCHURE
            </span>
            <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold text-charcoal tracking-tight leading-[1.0]">
              WHAT CAN <br />WE DO <br />
              <span className="text-accent-green">FOR YOU?</span>
            </h2>
          </div>

          {/* Right: Poster — constrained height so it fits on screen */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[340px] rounded-2xl overflow-hidden shadow-xl border border-[#E8E1D5] group">
              <Image
                src="/assets/gallery/project-of-brouchres-final-society-version.jpg"
                alt="Prime View Official Brochure — Facilities, Payment Plan & Location"
                width={680}
                height={960}
                className="w-full h-auto object-contain transition-transform duration-700 ease-out group-hover:scale-[1.015]"
                sizes="(max-width: 1024px) 80vw, 340px"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
