import React from "react";
import Image from "next/image";

const mockImages = [
  { id: 1, src: "/assets/gallery/site-picture.jpg", alt: "Site Picture" },
  { id: 2, src: "/assets/gallery/luxurious-villa-with-modern-architectural-design.jpg", alt: "Luxurious Villa" },
  { id: 3, src: "/assets/gallery/prime-site-view.jpg", alt: "Prime Site View" },
  { id: 4, src: "/assets/gallery/luxury-house-about.jpg", alt: "Luxury House" },
  { id: 5, src: "/assets/gallery/meeting-prime-view.jpg", alt: "Meeting" },
  { id: 6, src: "/assets/gallery/npf-meetings.jpg", alt: "NPF Meeting" },
  { id: 7, src: "/new assests/about page logos/drone pic.jpg", alt: "Best Site Pic" },
  { id: 9, src: "/assets/gallery/abbotabad-club.jpg", alt: "Abbottabad Club" },
  { id: 10, src: "/assets/gallery/npf-meetings-1.jpg", alt: "Meeting 1" },
  { id: 11, src: "/assets/gallery/axel-holen-537656-unsplash-jpg.jpg", alt: "Nature" },
  { id: 12, src: "/assets/gallery/npf-dinner.jpg", alt: "Dinner" },
];

const row1 = [mockImages[0], mockImages[1], mockImages[2], mockImages[3]];
const row2 = [mockImages[4], mockImages[5], mockImages[6], mockImages[7]];
const row3 = [mockImages[8], mockImages[9], mockImages[10], mockImages[0]];
const row4 = [mockImages[1], mockImages[3], mockImages[5], mockImages[7]];

const Row = ({ images, direction }: { images: typeof mockImages; direction: "left" | "right" }) => {
  // Duplicate array for seamless infinite scroll
  const duplicatedImages = [...images, ...images, ...images, ...images];

  return (
    <div className="w-full overflow-hidden relative">
      <div
        className={`flex flex-row gap-4 sm:gap-6 w-max ${
          direction === "left" ? "animate-marquee-left" : "animate-marquee-right"
        }`}
      >
        {duplicatedImages.map((image, i) => (
          <div key={`${image.id}-${i}`} className="relative h-[200px] sm:h-[280px] lg:h-[340px] w-[300px] sm:w-[420px] lg:w-[500px] shrink-0 overflow-hidden rounded-xl">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-500 hover:scale-105"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export const MasonryGrid: React.FC = () => {
  return (
    <div className="w-full py-8 bg-transparent max-w-[2000px] mx-auto overflow-hidden">
      {/* 4 rows: 1 left, 2 right, 3 left, 4 right */}
      <div className="flex flex-col gap-4 sm:gap-6 justify-center w-full">
        <Row images={row1} direction="left" />
        <Row images={row2} direction="right" />
        <Row images={row3} direction="left" />
        <Row images={row4} direction="right" />
      </div>
    </div>
  );
};
