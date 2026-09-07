export interface EventData {
  id: string;
  title: string;
  subtitle?: string;
  date: string;
  venue?: string;
  summary: string;
  videoPreview?: string; // URL to the video file
  coverImage: string;
  gallery: string[];
  fullDescription: string;
}

export const eventsData: EventData[] = [
  {
    id: "pre-launch-ceremony",
    title: "Pre-Launch Ceremony",
    subtitle: "Prime View Cooperative Housing Society Abbottabad",
    date: "Monday, 17 August | 12:00 PM",
    venue: "Rosecliff Marquee, Main Margalla Road, E-11/1, Islamabad",
    summary: "You are cordially invited to the Pre-Launch Ceremony of Prime View Cooperative Housing Society Abbottabad at Rosecliff Marquee, Islamabad.",
    coverImage: "/new assests/Events and media/event1/QAS07562_improved.png",
    gallery: [
      "/new assests/Events and media/event1/WhatsApp Image 2026-09-06 at 3.10.12 PM.jpeg",
      "/new assests/Events and media/event1/QAS07025.JPG_202609031129.jpeg",
      "/new assests/Events and media/event1/QAS07031.JPG_2K_202609031134.jpeg",
      "/new assests/Events and media/event1/QAS07033.JPG_2K_202609031135.jpeg",
      "/new assests/Events and media/event1/QAS07562_improved.png",
      "/new assests/Events and media/event1/QAS07590_glow.png",
      "/new assests/Events and media/event1/QAS07600.png_2K_202609031145.jpeg",
      "/new assests/Events and media/event1/QAS07627.JPG_202609031125.jpeg",
    ],
    fullDescription: "You are cordially invited to the Pre-Launch Ceremony of Prime View Cooperative Housing Society Abbottabad.\n\nDate & Time: Monday, 17 August at 12:00 PM\nVenue: Rosecliff Marquee, Main Margalla Road, E-11/1, Islamabad\n\nCelebrate this landmark pre-launch occasion with Prime View leadership, distinguished guests, and cooperative society members as we showcase the blueprint of modern master-planned living nestled in the serene hills of Abbottabad.",
  },
];

