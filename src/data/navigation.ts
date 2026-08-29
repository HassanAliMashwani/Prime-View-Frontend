export interface NavItem {
  title: string;
  href: string;
  children?: NavItem[];
}

export const mainNavigation: NavItem[] = [
  { title: "Home", href: "/" },
  { title: "Plans", href: "/our-plans" },
  { title: "Events & Media", href: "/events-and-media" },
  {
    title: "Team",
    href: "/owners",
    children: [
      { title: "Managing Committee & Owners", href: "/owners" },
      { title: "Society Members", href: "/society-members" },
      { title: "Legal Team", href: "/legal-team" },
      { title: "Marketing & Sales Partner", href: "/marketing-sales-partner" },
    ],
  },
  {
    title: "Maps",
    href: "/map",
    children: [
      { title: "Location Map", href: "/map" },
      { title: "Masterplan Map", href: "/map-2" },
    ],
  },
  { title: "Contact", href: "/contact" },
];

export const footerNavigation = {
  quickLinks: [
    { title: "Home", href: "/" },
    { title: "Plans", href: "/our-plans" },
    { title: "Events & Media", href: "/events-and-media" },
    { title: "Team", href: "/owners" },
    { title: "Contact", href: "/contact" },
  ],
  mapsAndPlans: [
    { title: "Society Location Map", href: "/map" },
    { title: "Masterplan Layout", href: "/map-2" },
    { title: "Marketing & Sales Partner", href: "/marketing-sales-partner" },
    { title: "Managing Committee", href: "/owners" },
    { title: "Legal Team", href: "/legal-team" },
  ],
};
