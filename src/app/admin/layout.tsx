import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Prime View Admin Core | Society Management',
  description: 'Administrative core for Prime View Housing Society master plan, inventory, locking, and reservations.',
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F8FAF9] text-[#111827] font-sans antialiased selection:bg-[#D4AF37] selection:text-[#10251E]">
      {children}
    </div>
  );
}
