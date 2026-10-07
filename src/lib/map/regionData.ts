import { Region } from './types';
import { BlockId } from '../mock/types';

export const BLOCK_ID_BY_REGION_NAME: Record<string, BlockId> = {
  'Elite Block': 'elite',
  'Commercial Area': 'commercial',
  'Overseas Block': 'overseas',
  'Abbott Block': 'abbott',
  'Royal Block': 'royal',
  'NPF Phase 1': 'npf-phase-1',
  'NPF Phase 2': 'npf-phase-2',
};

export const REGION_NAME_BY_BLOCK_ID: Record<string, string> = {
  elite: 'Elite Block',
  commercial: 'Commercial Block',
  overseas: 'Overseas Block',
  abbott: 'Abbott Block',
  royal: 'Royal Block',
  'npf-phase-1': 'NPF Phase 1',
  'npf-phase-2': 'NPF Phase 2',
};

export function getBlockDisplayName(blockId: string): string {
  return REGION_NAME_BY_BLOCK_ID[blockId] || `${blockId.charAt(0).toUpperCase() + blockId.slice(1)} Block`;
}

export const MASTER_PLAN_TOTAL_PLOTS: Record<string, number> = {
  elite: 254,
  commercial: 108,
  overseas: 293,
  abbott: 467,
  royal: 253,
  'npf-phase-1': 254,
  'npf-phase-2': 0,
};

export const regionData: Region[] = [
  {
    id: 1,
    name: 'Elite Block',
    blockId: 'elite',
    color: '#7AAFDF',
    darkColor: '#1e3a8a',
    area: '120,000 sq ft',
    units: 254,
    priceRange: '$300,000 - $600,000',
    status: 'Available',
    description:
      'Modern housing society with world-class amenities. Premium residential development featuring state-of-the-art facilities and architecture.',
    features: [
      'Swimming Pool & Gym',
      '24/7 Security',
      'Modern Architecture',
      'Community Center',
    ],
    image: '/images/elite-block.jpg',
    mapPath:
      'M142,528 L148,505 L153,489 L163,468 L170,457 L175,439 L175,425 L184,413 L192,389 L204,377 L218,343 L222,313 L246,253 L256,242 L269,237 L287,230 L294,220 L307,209 L318,209 L330,210 L376,198 L405,176 L415,161 L425,156 L436,154 L469,145 L499,119 L519,105 L545,100 L560,86 L573,66 L589,54 L607,60 L621,68 L624,80 L620,96 L618,105 L628,116 L640,119 L658,118 L681,127 L678,162 L685,188 L650,217 L652,230 L657,238 L657,276 L667,306 L693,341 L700,371 L692,386 L682,393 L657,397 L636,404 L614,421 L584,447 L563,478 L559,492 L526,438 L506,449 L501,458 L443,507 L419,514 L400,505 L347,475 L336,485 L325,507 L325,526 L311,564 L308,597 L186,561 L185,551 Z',
    fill: '#7AAFDF',
    label: { x: 421, y: 326, fontSize: 17 },
  },
  {
    id: 3,
    name: 'Commercial Area',
    blockId: 'commercial',
    color: '#AFD9AA',
    darkColor: '#7cb342',
    area: '18,000 sq ft',
    units: 108,
    priceRange: '$50,000 - $200,000',
    status: 'Available',
    description:
      'Prime commercial retail space in high-traffic location. Perfect for businesses, retail shops, and service centers.',
    features: [
      'High Foot Traffic',
      'Parking Available',
      'Flexible Space Options',
      'Ground Floor Access',
    ],
    image: '/images/commercial-area.jpg',
    mapPath:
      'M188,562 L178,574 L171,587 L171,603 L171,627 L171,638 L166,649 L168,661 L167,677 L163,710 L163,728 L163,739 L170,758 L188,764 L209,764 L232,760 L271,731 L289,708 L301,652 L307,598 Z',
    fill: '#AFD9AA',
    label: { x: 235, y: 663, fontSize: 13, lines: ['Commercial', 'Area'] },
  },
  {
    id: 4,
    name: 'Overseas Block',
    blockId: 'overseas',
    color: '#F7F281',
    darkColor: '#f59e0b',
    area: '95,000 sq ft',
    units: 293,
    priceRange: '$400,000 - $900,000',
    status: 'Selling Fast',
    description:
      'International investment zone designed for overseas investors. Premium plots with guaranteed returns and professional management.',
    features: [
      'Foreign Investment Zone',
      'Currency Flexibility',
      'Guaranteed ROI',
      'Professional Management',
    ],
    image: '/images/overseas-block.jpg',
    mapPath:
      'M333,708 L409,704 L459,706 L476,702 L499,689 L531,678 L545,674 L559,670 L574,660 L600,699 L621,689 L591,646 L593,638 L599,635 L613,648 L620,652 L624,657 L632,663 L710,728 L715,738 L696,782 L656,937 L643,962 L469,882 L454,869 L411,843 L383,819 L350,786 L326,756 L303,714 Z',
    fill: '#F7F281',
    label: { x: 509, y: 799, fontSize: 16 },
  },
  {
    id: 5,
    name: 'Abbott Block',
    blockId: 'abbott',
    color: '#EDEE99',
    darkColor: '#d4af37',
    area: '72,000 sq ft',
    units: 467,
    priceRange: '$250,000 - $500,000',
    status: 'Available',
    description:
      'Family-oriented residential community with spacious plots. Ideal for growing families seeking peaceful neighborhood living.',
    features: [
      'Family Community',
      'School Nearby',
      'Parks & Recreation',
      'Spacious Plots',
    ],
    image: '/images/abbott-block.jpg',
    mapPath:
      'M303,715 L283,717 L272,732 L297,780 L346,821 L358,851 L357,902 L347,916 L329,920 L265,900 L251,898 L232,902 L211,926 L218,967 L227,1013 L231,1038 L225,1068 L229,1088 L225,1120 L231,1150 L238,1169 L249,1178 L260,1179 L281,1174 L301,1175 L325,1185 L351,1205 L400,1230 L400,1243 L409,1271 L429,1279 L440,1277 L473,1282 L513,1277 L487,924 L483,904 L467,880 L454,870 L413,844 L382,818 L350,786 L326,757 Z',
    fill: '#EDEE99',
    label: { x: 362, y: 999, fontSize: 15 },
  },
  {
    id: 6,
    name: 'Royal Block',
    blockId: 'royal',
    color: '#DDB3D4',
    darkColor: '#9d4edd',
    area: '48,000 sq ft',
    units: 253,
    priceRange: '$600,000 - $1,200,000',
    status: 'Limited Availability',
    description:
      'Ultra-luxury residential plots with premium amenities. Exclusive address for high-net-worth individuals and elite community.',
    features: [
      'Ultra-Luxury Finishing',
      'Exclusive Access',
      'Premium Location',
      'Concierge Service',
    ],
    image: '/images/royal-block.jpg',
    mapPath:
      'M469,882 L483,906 L487,921 L514,1277 L532,1277 L584,1280 L606,1276 L639,1256 L672,1233 L700,1204 L710,1177 L678,1037 L647,990 L640,975 L642,961 Z',
    fill: '#DDB3D4',
    label: { x: 590, y: 1081, fontSize: 15, lines: ['Royal', 'Block'] },
  },
  {
    id: 7,
    name: 'NPF Phase 1',
    blockId: 'npf-phase-1',
    color: '#FF7575',
    darkColor: '#c41e3a',
    area: '68,000 sq ft',
    units: 254,
    priceRange: '$150,000 - $350,000',
    status: 'Available',
    description:
      'Affordable housing phase 1 with quality construction. Designed for middle-income families with flexible payment options.',
    features: [
      'Affordable Pricing',
      'Flexible Payments',
      'Quality Construction',
      'Easy Financing',
    ],
    image: '/images/npf-phase-1.jpg',
    mapPath:
      'M717,736 L851,791 L964,815 L1027,824 L1128,831 L1104,898 L1085,889 L1068,938 L1088,945 L1166,957 L1107,1122 L1017,1083 L1009,1109 L942,1064 L834,1013 L693,977 L690,983 L643,964 L656,938 L696,784 Z',
    fill: '#FF7575',
    label: { x: 905, y: 929, rotate: 18, fontSize: 16 },
  },
  {
    id: 8,
    name: 'NPF Phase 2',
    blockId: 'npf-phase-2',
    color: '#A3A3FF',
    darkColor: '#4c0519',
    area: '145,000 sq ft',
    units: 0,
    priceRange: '$200,000 - $500,000',
    status: 'Launching Soon',
    description:
      'Large-scale mixed-use development with diverse housing options. Phase 2 expansion with modern amenities and community spaces.',
    features: [
      'Mixed-Use Development',
      'Modern Amenities',
      'Community Spaces',
      'Coming Soon',
    ],
    image: '/images/npf-phase-2.jpg',
    mapPath:
      'M1128,830 L1378,907 L1474,901 L1517,921 L1349,1315 L1101,1217 L1042,1131 L1009,1109 L1017,1084 L1108,1121 L1165,956 L1090,945 L1068,938 L1085,888 L1104,898 Z',
    fill: '#A3A3FF',
    label: { x: 1263, y: 1073, rotate: 18, fontSize: 16 },
  },
];

export function getRegionByBlockId(blockId: string): Region | undefined {
  const norm = blockId.trim().toLowerCase();
  return regionData.find((r) => r.blockId === norm);
}

export interface BlockTheme {
  blockId: string;
  name: string;
  color: string;
  darkColor: string;
  badgeStyle: React.CSSProperties;
  cardBorderStyle: React.CSSProperties;
  titleStyle: React.CSSProperties;
  btnStyle: React.CSSProperties;
  barStyle: React.CSSProperties;
}

export function getBlockTheme(blockId: string): BlockTheme {
  const region = getRegionByBlockId(blockId);
  const color = region?.color || '#AFD9AA';
  const darkColor = region?.darkColor || '#2d5a3d';
  const name = region?.name || getBlockDisplayName(blockId);

  return {
    blockId,
    name,
    color,
    darkColor,
    badgeStyle: {
      backgroundColor: `${color}40`,
      color: darkColor,
      borderColor: `${color}`,
    },
    cardBorderStyle: {
      borderColor: `${color}99`,
    },
    titleStyle: {
      color: darkColor,
    },
    btnStyle: {
      backgroundColor: darkColor,
      color: '#ffffff',
    },
    barStyle: {
      backgroundColor: color,
    },
  };
}

