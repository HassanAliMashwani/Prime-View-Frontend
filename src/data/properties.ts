export interface PlotPlan {
  id: string;
  category: "Residential" | "Commercial";
  size: string;
  totalPrice?: string;
  downPayment?: string;
  monthlyInstallment?: string;
  installmentPeriod: string;
  features: string[];
  imagePath: string;
}

export const propertyPlans: PlotPlan[] = [
  {
    id: "com-4marla",
    category: "Commercial",
    size: "4 Marla Commercial",
    installmentPeriod: "Flexible Installment Schedule",
    features: ["Main GT Road Access", "High Footfall Commercial Hub", "Ample Parking"],
    imagePath: "/assets/plans/artboard-284x-100.jpg",
  },
  {
    id: "res-5marla",
    category: "Residential",
    size: "5 Marla",
    installmentPeriod: "3.5 Years Flexible Plan",
    features: ["Corner & Main Boulevard Options", "24/7 Utilities Access", "Gated Security Zone"],
    imagePath: "/assets/plans/artboard-22x-100.webp",
  },
  {
    id: "res-7marla",
    category: "Residential",
    size: "7 Marla",
    installmentPeriod: "3.5 Years Flexible Plan",
    features: ["Mountain View Location", "Carpeted Road Access", "Underground Electricity"],
    imagePath: "/assets/plans/artboard-22x-100.webp",
  },
  {
    id: "res-10marla",
    category: "Residential",
    size: "10 Marla",
    installmentPeriod: "3.5 Years Flexible Plan",
    features: ["Near Grand Mosque & Park", "Potable Clean Water", "24/7 Security Patrol"],
    imagePath: "/assets/plans/artboard-22x-100.webp",
  },
  {
    id: "res-1kanal",
    category: "Residential",
    size: "1 Kanal",
    installmentPeriod: "3.5 Years Flexible Plan",
    features: ["Executive Block", "Scenic Panoramic Surroundings", "Spacious Street Frontage"],
    imagePath: "/assets/plans/artboard-22x-100.webp",
  },
];
