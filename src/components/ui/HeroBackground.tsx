import React from "react";

export function HeroBackground() {
  return (
    <>
      <style>{`
        @keyframes particle-drift {
          0%,100% { transform: translateY(0) rotate(0deg); opacity: .5; }
          50%     { transform: translateY(-30px) rotate(180deg); opacity: .15; }
        }
      `}</style>
      
      {/* Ambient particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-charcoal/[0.03]"
            style={{
              width: `${20 + (i * 13) % 60}px`,
              height: `${20 + (i * 13) % 60}px`,
              left: `${(i * 8.3) % 100}%`,
              top: `${(i * 12.7) % 100}%`,
              animation: `particle-drift ${8 + (i % 5) * 2}s ${i * 0.7}s linear infinite`,
            }}
          />
        ))}
      </div>

      {/* Large ambient circle */}
      <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[#B29A68]/10 blur-3xl pointer-events-none" aria-hidden="true" />
    </>
  );
}
