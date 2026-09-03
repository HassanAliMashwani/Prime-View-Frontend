export interface TeamMemberProfile {
  id: string;
  name: string;
  title: string;
  role: string;
  email: string;
  category: "Managing Committee" | "Marketing Partner" | "Legal Team" | "Society Members";
  photoPath: string | null;
  photoDiscovered: boolean;
  facebookUrl?: string;
  twitterUrl?: string;
  instagramUrl?: string;
  bio?: string;
  bioBullets?: string[];
}

export const executiveTeamProfiles: TeamMemberProfile[] = [
  // 1. Managing Committee & Owners (/owners)
  // Row 1: Liaqat Khan Jadoon, Dr. Roman Gul, Ahmed Nawaz Khan Jadoon
  {
    id: "mc-2",
    name: "Liaqat Khan Jadoon",
    title: "President",
    role: "Beneficial owner & Director",
    email: "president@primeview.pk",
    category: "Managing Committee",
    photoPath: "/new assests/team/team new/president.jpg",
    photoDiscovered: true,
    bio: "Liaqat Khan Jadoon serves as President of Prime View Co-Operative Housing Society Ltd. With a distinguished background in specialized operations, advanced tactical instruction, and engineering discipline, he provides strategic direction and steadfast governance to ensure Prime View remains a symbol of integrity and excellence.",
    bioBullets: [
      "Sky diver International",
      "Deep Sea Diver International",
      "Master in technique with all Kinds of small arms safeties",
      "Nuclear Biological Damage Control fire fighter :- Special operations Submarines Chief Engineer",
      "Jump master with all Kinds of Sky diving",
    ],
  },
  {
    id: "mc-5",
    name: "Dr. Roman Gul",
    title: "General Secretary",
    role: "Beneficial owner & Director",
    email: "secretary@primeview.pk",
    category: "Managing Committee",
    photoPath: "/new assests/team/team new/secretary.jpg",
    photoDiscovered: true,
  },
  {
    id: "mc-3",
    name: "Ahmed Nawaz Khan Jadoon",
    title: "Vice President",
    role: "Beneficial owner & Director",
    email: "vp@primeview.pk",
    category: "Managing Committee",
    photoPath: "/new assests/team/team new/vice-president.jpg",
    photoDiscovered: true,
  },
  // Row 2: Chaudhary Mohsin Azad, Qazi Safeer Hashmi Qureshi
  {
    id: "mc-1",
    name: "Chaudhary Mohsin Azad",
    title: "Chairman",
    role: "Beneficial owner & Director",
    email: "Chairman@primeview.pk",
    category: "Managing Committee",
    photoPath: "/new assests/team/team new/chairman.jpg",
    photoDiscovered: true,
  },
  {
    id: "mc-4",
    name: "Qazi Safeer Hashmi Qureshi",
    title: "Director Management",
    role: "Planning & operation",
    email: "info@primeview.pk",
    category: "Managing Committee",
    photoPath: "/new assests/team/team new/director.jpg",
    photoDiscovered: true,
  },

  // 2. Marketing & Sales Partners (/marketing-sales-partner)
  {
    id: "mkt-1",
    name: "Muhammad Aleem",
    title: "Exclusive Marketing & Sales Partner",
    role: "CEO-Sign Marketing",
    email: "info@primeview.pk",
    category: "Marketing Partner",
    photoPath: "/new assests/team/team new/Muhammad aleem.jpg",
    photoDiscovered: true,
  },
  {
    id: "mkt-2",
    name: "Malik Kamran Munir",
    title: "Exclusive Marketing & Sales Partner",
    role: "Director-Sign Marketing",
    email: "info@primeview.pk",
    category: "Marketing Partner",
    photoPath: "/new assests/team/team new/Malik kamaran munir.jpg",
    photoDiscovered: true,
  },
  {
    id: "mkt-3",
    name: "Huzaifa Zahid",
    title: "Marketing & Sales Partner",
    role: "Hz markings SMC Pvt Ltd",
    email: "info@primeview.pk",
    category: "Marketing Partner",
    photoPath: "/new assests/team/team new/Huzaifa Zahid.jpg",
    photoDiscovered: true,
  },

  // 3. Legal Team (/legal-team)
  {
    id: "leg-1",
    name: "Justice (R) Arshad Manzoor Khan",
    title: "Director Legal",
    role: "Legal Counsel & Director",
    email: "info@primeview.pk",
    category: "Legal Team",
    photoPath: "/new assests/team/team new/Justice (R) Arshad Manzoor Khan.jpg",
    photoDiscovered: true,
  },
  {
    id: "leg-2",
    name: "Advocate Raja Gulfam Kiani",
    title: "Legal Advisor",
    role: "Advocate & Legal Counsel",
    email: "info@primeview.pk",
    category: "Legal Team",
    photoPath: "/new assests/team/team new/Advocate Raja Gulfam Kiani.jpg",
    photoDiscovered: true,
  },
];

export const membershipCriteriaList: string[] = [
  "Should be of more than 18 years of age, unless he/she is a minor nominee of a deceased member.",
  "Must possess good moral character.",
  "Purchase at least one share.",
  "Has applied for membership or his/her membership is approved, as a nominee or legal representative of deceased member.",
  "Is in accordance with the directions issued by the Prime View Co-operative Housing Society Ltd Hazara Division Revise by-Laws, & Co-operative Society Act 1925 Amended 2020 & Co-operative societies rules 1927, from time to time.",
];
