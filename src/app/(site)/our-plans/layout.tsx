import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Property Plans & Pricing | Prime View Housing Society Abbottabad",
  description: "Explore 4-year flexible installment plans for residential and commercial plots in Prime View Housing Society, Abbottabad, Pakistan.",
  alternates: {
    canonical: "https://prime-view-livid.vercel.app/our-plans",
  },
  openGraph: {
    title: "Property Plans & Pricing | Prime View Housing Society Abbottabad",
    description: "Explore 4-year flexible installment plans for residential and commercial plots in Abbottabad.",
    url: "https://prime-view-livid.vercel.app/our-plans",
    images: ["/master-plan/Master Plan.png"],
  },
};

export default function OurPlansLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link
        rel="preload"
        as="image"
        href="/new assests/our plan assests/card 2.webp"
        fetchPriority="high"
      />
      <link
        rel="preload"
        as="image"
        href="/new assests/our plan assests/card 1.webp"
      />
      <link
        rel="preload"
        as="image"
        href="/new assests/our plan assests/card 3.webp"
      />
      {children}
    </>
  );
}
