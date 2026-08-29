"use client";

import React, { useState } from "react";
import { Grid2X2 } from "lucide-react";

export const GalleryNav: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"following" | "foryou">("following");

  return (
    <header className="sticky top-20 z-40 w-full bg-pure-white border-b border-card-border/60 shadow-sm mt-4">
      <div className="flex items-center justify-between px-4 sm:px-6 h-14 max-w-[1600px] mx-auto">
        
        {/* Left space to balance center (empty) */}
        <div className="flex-1" />

        {/* Center Tabs */}
        <nav className="flex items-center gap-6">
          <button
            onClick={() => setActiveTab("following")}
            className={`text-[15px] font-sans font-medium transition-colors pb-1 border-b-2 ${
              activeTab === "following"
                ? "text-charcoal border-charcoal"
                : "text-muted-gray-text border-transparent hover:text-charcoal/70"
            }`}
          >
            Following
          </button>
          
          <button
            onClick={() => setActiveTab("foryou")}
            className={`text-[15px] font-sans font-medium transition-colors pb-1 border-b-2 ${
              activeTab === "foryou"
                ? "text-charcoal border-charcoal"
                : "text-muted-gray-text border-transparent hover:text-charcoal/70"
            }`}
          >
            For You
          </button>
        </nav>

        {/* Right Icon */}
        <div className="flex-1 flex justify-end">
          <button className="text-muted-gray-text hover:text-charcoal transition-colors p-2 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-charcoal">
            <Grid2X2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

