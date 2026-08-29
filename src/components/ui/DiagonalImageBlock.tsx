import React from "react";
import Image from "next/image";

interface DiagonalImageBlockProps {
  src: string;
  alt: string;
  className?: string;
  variant?: "primary" | "secondary" | "beam";
  priority?: boolean;
}

export const DiagonalImageBlock: React.FC<DiagonalImageBlockProps> = ({
  src,
  alt,
  className = "",
  variant = "primary",
  priority = false,
}) => {
  const clipClass =
    variant === "primary"
      ? "clip-diagonal-primary"
      : variant === "secondary"
      ? "clip-diagonal-secondary"
      : "clip-diagonal-beam";

  return (
    <div className={`relative overflow-hidden ${clipClass} ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        className="object-cover object-center transition-transform duration-300 ease-out hover:scale-[1.02]"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
      />
    </div>
  );
};
