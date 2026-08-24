import React, { ReactNode } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface LuxuryCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  theme?: "light" | "dark";
  interactive?: boolean;
}

export const LuxuryCard: React.FC<LuxuryCardProps> = ({
  children,
  theme = "light",
  interactive = false,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        "rounded-2xl transition-all duration-300",
        theme === "dark"
          ? "bg-deep-forest text-warm-ivory border-emerald-900/30"
          : "bg-white text-charcoal border-warm-ivory",
        interactive && "hover:shadow-xl hover:-translate-y-1 cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
