import { TracedPlotArea, BlockMapConfig } from './types';
import { PlotCategory } from '../mock/types';

export function formatSizeLabel(rawSize: string): string {
  const clean = rawSize.trim();
  if (clean.includes('##')) return 'Unspecified';
  if (/m\/p$/i.test(clean)) {
    const val = clean.replace(/m\/p$/i, '').trim();
    return `${val} Marla / plot`;
  }
  if (/k$/i.test(clean)) {
    const val = clean.replace(/k$/i, '').trim();
    return `${val} Kanal`;
  }
  if (/m$/i.test(clean)) {
    const val = clean.replace(/m$/i, '').trim();
    return `${val} Marla`;
  }
  return clean;
}

export function parseSlug(
  rawSlug: string,
  defaultBlockId: string = 'elite'
): {
  category: PlotCategory;
  amenityType?: string;
  plotNumber: string | null;
  isGroupedRange: boolean;
  rangeSpan?: string;
  sizeLabel: string;
} {
  let clean = rawSlug.trim();
  // Handle cases like elite_parkWithChalets_170..232##
  if (clean.includes('##') && !clean.includes('_##')) {
    clean = clean.replace('##', '_##');
  }

  const parts = clean.split('_');
  // Expected parts: [blockName, type, numberOrRange, size]
  // In case blockName is missing (e.g. commercial_59..65_4M/p):
  let type = '';
  let numberOrRange = '';
  let rawSize = '';

  if (parts.length >= 4) {
    type = parts[1];
    numberOrRange = parts[2];
    rawSize = parts.slice(3).join('_');
  } else if (parts.length === 3) {
    type = parts[0];
    numberOrRange = parts[1];
    rawSize = parts[2];
  } else if (parts.length === 2) {
    type = parts[0];
    numberOrRange = parts[1];
    rawSize = '##';
  } else {
    type = 'plot';
    numberOrRange = clean;
    rawSize = '##';
  }

  let category: PlotCategory = 'residential';
  let amenityType: string | undefined = undefined;

  const lowerType = type.toLowerCase();
  if (lowerType === 'plot') {
    category = 'residential';
  } else if (lowerType === 'commercial') {
    category = 'commercial';
  } else if (lowerType === 'farm_house') {
    category = 'farm_house';
  } else {
    category = 'amenity';
    amenityType = type;
  }

  const isGroupedRange = numberOrRange.includes('..');
  const plotNumber = isGroupedRange ? null : numberOrRange;
  const rangeSpan = isGroupedRange ? numberOrRange : undefined;
  const sizeLabel = formatSizeLabel(rawSize);

  return {
    category,
    amenityType,
    plotNumber,
    isGroupedRange,
    rangeSpan,
    sizeLabel,
  };
}

export function parseCoords(coordsStr: string): { x: number; y: number }[] {
  const nums = coordsStr
    .split(',')
    .map((s) => parseFloat(s.trim()))
    .filter((n) => !isNaN(n));

  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < nums.length - 1; i += 2) {
    points.push({ x: nums[i], y: nums[i + 1] });
  }
  return points;
}

export function parseAreaElement(
  areaHtml: string,
  blockId: string = 'elite'
): TracedPlotArea | null {
  // Extract alt, title, coords
  const altMatch = areaHtml.match(/alt=["']([^"']+)["']/i);
  const titleMatch = areaHtml.match(/title=["']([^"']+)["']/i);
  const coordsMatch = areaHtml.match(/coords=["']([^"']+)["']/i);

  const slug = altMatch ? altMatch[1] : titleMatch ? titleMatch[1] : null;
  if (!slug || !coordsMatch) return null;

  const coords = coordsMatch[1];
  const points = parseCoords(coords);
  if (points.length < 3) return null;

  const parsedSlug = parseSlug(slug, blockId);

  return {
    slug,
    blockId,
    category: parsedSlug.category,
    amenityType: parsedSlug.amenityType,
    plotNumber: parsedSlug.plotNumber,
    isGroupedRange: parsedSlug.isGroupedRange,
    rangeSpan: parsedSlug.rangeSpan,
    sizeLabel: parsedSlug.sizeLabel,
    points,
  };
}

export function parseImageMapHtml(
  html: string,
  blockId: string = 'elite'
): TracedPlotArea[] {
  const areaMatches = html.match(/<area\b[^>]*>/gi);
  if (!areaMatches) return [];

  const results: TracedPlotArea[] = [];
  for (const tag of areaMatches) {
    const parsed = parseAreaElement(tag, blockId);
    if (parsed) {
      results.push(parsed);
    }
  }
  return results;
}
