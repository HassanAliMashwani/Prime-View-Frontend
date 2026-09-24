import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'rectangular' | 'rounded' | 'circular';
}

/**
 * Premium Skeleton Primitive with smooth pulse & shimmer
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rounded',
  ...props
}) => {
  const variantClass =
    variant === 'circular'
      ? 'rounded-full'
      : variant === 'rectangular'
      ? 'rounded-none'
      : 'rounded-2xl';

  return (
    <div
      className={cn(
        'animate-pulse bg-slate-200/80 select-none relative overflow-hidden',
        variantClass,
        className
      )}
      {...props}
    />
  );
};

export const SkeletonText: React.FC<{ className?: string; lines?: number }> = ({
  className,
  lines = 1,
}) => {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-3.5 bg-slate-200/80 rounded-md',
            i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full',
            className
          )}
        />
      ))}
    </div>
  );
};
