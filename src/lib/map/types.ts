import { BlockId, PlotCategory } from '../mock/types';

export interface RegionLabel {
  x: number;
  y: number;
  fontSize?: number;
  anchor?: 'start' | 'middle' | 'end' | 'inherit';
  rotate?: number;
  lines?: string[];
}

export interface Region {
  id: number;
  name: string;
  blockId: BlockId | string;
  color: string;
  darkColor: string;
  area: string;
  units: number;
  priceRange: string;
  status: string;
  description: string;
  features: string[];
  image: string;
  mapPath: string;
  fill: string;
  hatch?: boolean;
  leaderLine?: string;
  label: RegionLabel;
}

export interface TracedPlotArea {
  slug: string;
  blockId: string;
  category: PlotCategory;
  amenityType?: string;
  plotNumber: string | null;
  isGroupedRange: boolean;
  rangeSpan?: string;
  sizeLabel: string;
  points: { x: number; y: number }[];
}

export interface BlockMapConfig {
  blockId: string;
  blockName: string;
  imageSrc: string;
  naturalWidth: number;
  naturalHeight: number;
  areas: TracedPlotArea[];
}
