export interface PlotPlan {
  id: string;
  category: "Residential" | "Commercial";
  size: string;
  totalPrice?: string;
  downPayment?: string;
  possession?: string;
  monthlyInstallment?: string;
  installmentPeriod: string;
  features: string[];
  imagePath: string;
}

export const propertyPlans: PlotPlan[] = [
  {
    id: "res-5marla",
    category: "Residential",
    size: "5 Marla (25×50)",
    totalPrice: "2,500,000",
    downPayment: "625,000",
    possession: "200,000",
    monthlyInstallment: "24,500",
    installmentPeriod: "39 Months",
    features: ["Target Possession 1-3 Years", "24/7 Utilities Access", "Gated Security Zone"],
    imagePath: "/assets/plans/artboard-22x-100.webp",
  },
  {
    id: "res-7-5marla",
    category: "Residential",
    size: "7.5 Marla (30×60)",
    totalPrice: "3,600,000",
    downPayment: "900,000",
    possession: "295,000",
    monthlyInstallment: "35,000",
    installmentPeriod: "39 Months",
    features: ["Mountain View Location", "Target Possession 1-3 Years", "Underground Electricity"],
    imagePath: "/assets/plans/artboard-22x-100.webp",
  },
  {
    id: "res-10marla",
    category: "Residential",
    size: "10 Marla (35×70)",
    totalPrice: "4,900,000",
    downPayment: "1,225,000",
    possession: "400,000",
    monthlyInstallment: "48,000",
    installmentPeriod: "39 Months",
    features: ["Near Grand Mosque & Park", "Target Possession 1-3 Years", "24/7 Security Patrol"],
    imagePath: "/assets/plans/artboard-22x-100.webp",
  },
  {
    id: "res-13marla",
    category: "Residential",
    size: "13 Marla (40×80)",
    totalPrice: "6,400,000",
    downPayment: "1,600,000",
    possession: "620,000",
    monthlyInstallment: "60,000",
    installmentPeriod: "39 Months",
    features: ["Scenic Panoramic Surroundings", "Target Possession 1-3 Years", "Spacious Street Frontage"],
    imagePath: "/assets/plans/artboard-22x-100.webp",
  },
  {
    id: "res-1kanal",
    category: "Residential",
    size: "1 Kanal (50×100)",
    totalPrice: "10,000,000",
    downPayment: "2,500,000",
    possession: "800,000",
    monthlyInstallment: "98,000",
    installmentPeriod: "39 Months",
    features: ["Executive Block", "Target Possession 1-3 Years", "Premium Views"],
    imagePath: "/assets/plans/artboard-22x-100.webp",
  },
  {
    id: "farm-2kanal",
    category: "Residential",
    size: "2 Kanal Farm House",
    totalPrice: "30,000,000",
    downPayment: "9,000,000",
    installmentPeriod: "Available in Elite Block",
    features: ["Exclusive Lifestyle", "Large Private Retreat", "Prime Nature Views"],
    imagePath: "/assets/plans/artboard-22x-100.webp",
  },
  {
    id: "com-111sqyds",
    category: "Commercial",
    size: "111 Sq Yds Commercial",
    totalPrice: "7,000,000",
    installmentPeriod: "Commercial Block",
    features: ["Main Commercial Road", "Neighbourhood Retail", "High Footfall Hub"],
    imagePath: "/assets/plans/artboard-284x-100.jpg",
  },
];
