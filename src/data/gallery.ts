export interface GalleryItem {
  id: string;
  title: string;
  category: "Site View" | "Site Development" | "Brochure" | "Masterplan" | "Branding";
  imagePath: string;
}

export const galleryData: GalleryItem[] = [
  {
    id: "gal-site-1",
    title: "Prime View Drone Photography - Valley View",
    category: "Site View",
    imagePath: "/assets/gallery/greenery_villa_cinematic.jpg",
  },
  {
    id: "gal-site-2",
    title: "Prime View Abbottabad - Surrounding Mountains",
    category: "Site View",
    imagePath: "/assets/hero/prime-site-view-scaled.jpg",
  },
  {
    id: "gal-site-3",
    title: "Prime View - On-Site Greenery",
    category: "Site View",
    imagePath: "/new assests/new pic/1.jpeg",
  },
  {
    id: "gal-1",
    title: "Prime View Official Brochure Page 1",
    category: "Brochure",
    imagePath: "/assets/hero/artboard-22x-100.webp",
  },
  {
    id: "gal-2",
    title: "Prime View Society Logo & Identity",
    category: "Branding",
    imagePath: "/assets/brand/artboard-284x-100.jpg",
  },
  {
    id: "gal-3",
    title: "Prime View Final Master Plan Layout",
    category: "Masterplan",
    imagePath: "/assets/masterplan/prime-view-abbottabad-final-master-plan-11-08-2026.webp",
  },
];
