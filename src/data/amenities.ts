export interface Amenity {
  id: string;
  title: string;
  description: string;
  iconName: string;
}

export const amenitiesList: Amenity[] = [
  {
    id: "electricity",
    title: "Uninterrupted 24/7 Electricity",
    description: "Continuous power backup and stable grid supply to ensure uninterrupted modern living.",
    iconName: "Zap",
  },
  {
    id: "gas",
    title: "Reliable Gas Supply",
    description: "Direct connection to safe and reliable natural gas pipelines for household heating and cooking.",
    iconName: "Flame",
  },
  {
    id: "water",
    title: "Clean & Potable Water",
    description: "Filtered, clean, and safe drinking water supply available around the clock.",
    iconName: "Droplets",
  },
  {
    id: "sewerage",
    title: "Underground Sewerage System",
    description: "State-of-the-art underground drainage and waste management infrastructure preserving natural clean surroundings.",
    iconName: "Pipette",
  },
  {
    id: "security",
    title: "24/7 Security System",
    description: "Gated entry, physical security patrols, and round-the-clock surveillance for maximum safety.",
    iconName: "ShieldCheck",
  },
  {
    id: "mosque",
    title: "Grand Mosque",
    description: "Beautifully designed Jamia Grand Mosque for religious gatherings and daily prayers.",
    iconName: "Building2",
  },
  {
    id: "roads",
    title: "Wide Carpeted Roads",
    description: "Spacious, well-paved, carpeted main avenues and street network for smooth transportation.",
    iconName: "Compass",
  },
];
