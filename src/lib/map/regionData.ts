import { Region } from './types';
import { BlockId } from '../mock/types';

export const CHALET_PATH = "M124,128 L138,128 L134,142 L128,142 L123,155 L126,160 L116,190 L105,211 L81,271 L70,265 L90,195 L102,160 L115,135 Z";

export const BLOCK_ID_BY_REGION_NAME: Record<string, BlockId> = {
  'Chalet Block': 'chalet',
  'Elite Block': 'elite',
  'Commercial Area': 'commercial',
  'Overseas Block': 'overseas',
  'Abbott Block': 'abbott',
  'Royal Block': 'royal',
  'NPF Phase 1': 'npf-phase-1',
  'NPF Phase 2': 'npf-phase-2',
};

export const REGION_NAME_BY_BLOCK_ID: Record<string, string> = {
  chalet: 'Chalet Block',
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

export const regionData: Region[] = [
  {
    id: 1,
    name: 'Chalet Block',
    blockId: 'chalet',
    color: '#AFD9AA',
    darkColor: '#2d5a3d',
    area: '45,000 sq ft',
    units: 12,
    priceRange: '$500,000 - $800,000',
    status: 'Available',
    description:
      'Premium residential chalet community with scenic mountain views and private access roads. Exclusive gated community with luxury finishing.',
    features: [
      'Mountain View Access',
      'Private Entrance Gate',
      'Luxury Finishing',
      'Premium Location',
    ],
    image: '/images/chalet-block.jpg',
    mapPath: CHALET_PATH,
    fill: '#AFD9AA',
    hatch: true,
    leaderLine: 'M115,115 L126,132',
    label: { x: 58, y: 111, anchor: 'start', fontSize: 15 },
  },
  {
    id: 2,
    name: 'Elite Block',
    blockId: 'elite',
    color: '#7AAFDF',
    darkColor: '#1e3a8a',
    area: '120,000 sq ft',
    units: 45,
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
      'M324,22 L312,17 L307,18 L287,40 L268,46 L245,65 L228,69 L215,90 L192,107 L139,128 L134,142 L128,142 L123,155 L126,160 L116,190 L105,211 L81,271 L81,274 L89,278 L95,287 L126,296 L130,295 L130,297 L156,304 L158,286 L165,270 L165,258 L170,247 L178,239 L196,250 L216,249 L216,251 L198,251 L215,259 L223,259 L229,257 L258,233 L264,225 L275,219 L289,242 L294,242 L303,228 L331,203 L342,198 L357,196 L363,192 L367,186 L365,174 L349,151 L344,135 L344,114 L340,106 L340,102 L359,86 L356,75 L357,55 L345,50 L330,50 L323,43 L326,29 Z',
    fill: '#7AAFDF',
    label: { x: 226, y: 159, fontSize: 17 },
  },
  {
    id: 3,
    name: 'Commercial Area',
    blockId: 'commercial',
    color: '#AFD9AA',
    darkColor: '#7cb342',
    area: '18,000 sq ft',
    units: 8,
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
      'M93,289 L157,307 L153,329 L149,349 L146,367 L139,384 L129,392 L116,397 L99,398 L85,393 L81,381 L80,364 L82,342 L84,319 Z',
    fill: '#AFD9AA',
    label: { x: 112, y: 337, fontSize: 13, lines: ['Commercial', 'Area'] },
  },
  {
    id: 4,
    name: 'Overseas Block',
    blockId: 'overseas',
    color: '#F7F281',
    darkColor: '#f59e0b',
    area: '95,000 sq ft',
    units: 30,
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
      'M157,370 L181,407 L213,437 L249,461 L327,494 L332,498 L339,499 L346,479 L364,407 L375,381 L315,329 L311,333 L328,355 L316,363 L312,361 L299,343 L293,348 L287,348 L243,366 L209,365 Z',
    fill: '#F7F281',
    label: { x: 264, y: 410, fontSize: 16 },
  },
  {
    id: 5,
    name: 'Abbott Block',
    blockId: 'abbott',
    color: '#EDEE99',
    darkColor: '#d4af37',
    area: '72,000 sq ft',
    units: 25,
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
      'M144,372 L140,380 L153,404 L181,429 L186,443 L186,471 L179,480 L169,482 L127,470 L118,472 L107,484 L117,534 L115,591 L121,613 L127,618 L144,615 L157,616 L168,621 L182,633 L209,647 L212,667 L218,670 L243,673 L266,671 L255,517 L252,516 L255,515 L253,483 L249,481 L252,480 L251,474 L239,457 L208,437 L182,413 L170,398 L154,371 Z',
    fill: '#EDEE99',
    label: { x: 183, y: 539, fontSize: 15 },
  },
  {
    id: 6,
    name: 'Royal Block',
    blockId: 'royal',
    color: '#DDB3D4',
    darkColor: '#9d4edd',
    area: '48,000 sq ft',
    units: 15,
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
      'M249,464 L256,481 L269,671 L317,670 L352,648 L367,632 L372,619 L356,545 L337,517 L335,511 L337,503 Z',
    fill: '#DDB3D4',
    label: { x: 309, y: 566, fontSize: 15, lines: ['Royal', 'Block'] },
  },
  {
    id: 7,
    name: 'NPF Phase 1',
    blockId: 'npf-phase-1',
    color: '#FF7575',
    darkColor: '#c41e3a',
    area: '68,000 sq ft',
    units: 40,
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
      'M378,383 L367,408 L348,483 L341,501 L344,503 L341,504 L360,512 L383,509 L442,523 L442,529 L499,555 L534,579 L540,566 L587,586 L601,547 L599,544 L603,541 L617,501 L576,495 L563,489 L567,485 L574,463 L585,466 L596,433 L553,431 L512,426 L452,413 L411,396 L384,396 L384,394 L406,394 Z',
    fill: '#FF7575',
    label: { x: 470, y: 472, rotate: 18, fontSize: 16 },
  },
  {
    id: 8,
    name: 'NPF Phase 2',
    blockId: 'npf-phase-2',
    color: '#A3A3FF',
    darkColor: '#4c0519',
    area: '145,000 sq ft',
    units: 60,
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
      'M599,434 L588,467 L584,469 L576,466 L568,489 L618,498 L620,500 L590,588 L587,590 L541,570 L537,581 L555,594 L584,638 L717,689 L806,481 L785,472 L731,474 Z',
    fill: '#A3A3FF',
    label: { x: 699, y: 559, rotate: 18, fontSize: 16 },
  },
];

export function getRegionByBlockId(blockId: string): Region | undefined {
  const norm = blockId.trim().toLowerCase();
  return regionData.find((r) => r.blockId === norm);
}
