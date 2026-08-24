import React from "react";
import { pagesData } from "@/data/pages";
import { GallerySection } from "@/components/sections/GallerySection";

export const metadata = {
  title: pagesData["gallery-prime-view"].title,
  description: pagesData["gallery-prime-view"].description,
};

export default function GalleryPage() {
  return (
    <div className="bg-pure-white min-h-screen text-charcoal">
      <GallerySection />
    </div>
  );
}
