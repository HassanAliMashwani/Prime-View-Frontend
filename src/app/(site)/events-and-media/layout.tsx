import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Events & Media | Prime View Housing Society Abbottabad",
  description: "Official events, ground-breaking updates, and media releases from Prime View Cooperative Housing Society in Abbottabad, Pakistan.",
  alternates: {
    canonical: "https://prime-view-livid.vercel.app/events-and-media",
  },
  openGraph: {
    title: "Events & Media | Prime View Housing Society Abbottabad",
    description: "Official events, ground-breaking updates, and media releases from Prime View Abbottabad.",
    url: "https://prime-view-livid.vercel.app/events-and-media",
    images: ["/master-plan/Master Plan.png"],
  },
};

export default function EventsAndMediaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
