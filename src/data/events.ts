export interface EventData {
  id: string;
  title: string;
  date: string;
  summary: string;
  videoPreview: string; // URL to the video file
  coverImage: string;
  gallery: string[];
  fullDescription: string;
}

export const eventsData: EventData[] = [
  {
    id: "event-1",
    title: "NOC Approved Status",
    date: "October 15, 2023",
    summary: "Official announcement and documentation of Prime View's NOC approval.",
    videoPreview: "/new assests/Vedios/NOC APRROVED VIDEO.mp4",
    coverImage: "/assets/gallery/meeting-prime-view.jpg",
    gallery: [
      "/assets/gallery/meeting-prime-view.jpg",
      "/assets/gallery/npf-meetings.jpg",
      "/assets/gallery/npf-meetings-1.jpg",
      "/assets/gallery/npf-dinner.jpg"
    ],
    fullDescription: "Prime View Co-Operative Housing Society Ltd. has officially received its NOC, ensuring complete regulatory compliance and securing the future for our investors and residents. This milestone reflects our commitment to transparent and legally sound development.",
  },
  {
    id: "event-2",
    title: "Prime View Highlights",
    date: "November 02, 2023",
    summary: "A comprehensive look at the rapid development and scenic beauty of our society.",
    videoPreview: "/new assests/Vedios/PM HIGHLIGHTS.mp4",
    coverImage: "/assets/gallery/prime-site-view.jpg",
    gallery: [
      "/assets/gallery/site-picture.jpg",
      "/assets/gallery/luxurious-villa-with-modern-architectural-design.jpg",
      "/assets/gallery/luxury-house-about.jpg",
      "/new assests/about page logos/drone pic.jpg"
    ],
    fullDescription: "Explore the latest developments at Prime View. From sprawling green landscapes to the construction of state-of-the-art residential and commercial zones, our community is rapidly taking shape. Witness the harmony of nature and modern infrastructure.",
  },
  {
    id: "event-3",
    title: "Blue Water Overview",
    date: "December 10, 2023",
    summary: "Discover the breathtaking water features integrated into the Prime View landscape.",
    videoPreview: "/new assests/Vedios/PM BLUE WATER.mp4",
    coverImage: "/assets/gallery/axel-holen-537656-unsplash-jpg.jpg",
    gallery: [
      "/assets/gallery/axel-holen-537656-unsplash-jpg.jpg",
      "/assets/gallery/site-picture.jpg",
      "/assets/gallery/prime-site-view.jpg",
    ],
    fullDescription: "Water is at the heart of our ecological design. The Blue Water project integrates natural streams and custom water features into the community, providing residents with serene spots for relaxation and enhancing the local microclimate.",
  },
  {
    id: "event-4",
    title: "Drone Footage",
    date: "January 05, 2024",
    summary: "Aerial perspectives capturing the vast expanse and strategic location of our society.",
    videoPreview: "/new assests/Vedios/low qual vedio drone shoot.mp4",
    coverImage: "/new assests/new pic/Aerial_view_of_town_center_202608142359.jpeg",
    gallery: [
      "/new assests/new pic/Aerial_view_of_town_center_202608142359.jpeg",
      "/assets/gallery/abbotabad-club.jpg",
      "/assets/gallery/prime-site-view.jpg",
    ],
    fullDescription: "Take to the skies with our latest drone footage. See the strategic location of Prime View nestled in the Abbottabad hills, showcasing the seamless connectivity to major highways while retaining a peaceful, secluded atmosphere.",
  }
];
