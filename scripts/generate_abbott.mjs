import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_ROOT = path.resolve(__dirname, '..');

// 1. Ensure target directory exists
const abbottDir = path.join(FRONTEND_ROOT, 'public/Maps/Abbott');
fs.mkdirSync(abbottDir, { recursive: true });

// 2. Source files in Abbott B
const abbottSrcDir = path.join(FRONTEND_ROOT, 'public/Maps/Abbott B');
const abbottHtmlSrc = path.join(abbottSrcDir, 'abbott_block.html');
const abbottPngSrc = path.join(abbottSrcDir, 'Abbott block withput background.png');

if (!fs.existsSync(abbottHtmlSrc)) {
  console.error(`Missing HTML map file: ${abbottHtmlSrc}`);
  process.exit(1);
}
if (!fs.existsSync(abbottPngSrc)) {
  console.error(`Missing PNG map file: ${abbottPngSrc}`);
  process.exit(1);
}

// 3. Copy files to public/Maps/Abbott
fs.copyFileSync(abbottPngSrc, path.join(abbottDir, 'abbott-block-map.png'));
fs.copyFileSync(abbottPngSrc, path.join(abbottDir, 'Abbott block withput background.png'));
fs.copyFileSync(abbottHtmlSrc, path.join(abbottDir, 'abbott-map.html'));
fs.copyFileSync(abbottHtmlSrc, path.join(abbottDir, 'abbott_block.html'));

console.log('Files copied to public/Maps/Abbott successfully.');

// 4. Verify PNG dimensions from real file headers
function getPngDimensions(filePath) {
  const buf = fs.readFileSync(filePath);
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
  };
}

const abbottDims = getPngDimensions(abbottPngSrc);
console.log('Abbott PNG dimensions:', abbottDims);

// Parser logic matching parseImageMap.ts
function formatSizeLabel(rawSize) {
  const clean = rawSize.trim();
  if (clean.includes('##') || clean.toLowerCase() === 'notmentioned') return 'Unspecified';
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

function parseSlug(rawSlug, defaultBlockId = 'abbott') {
  let clean = rawSlug.trim();
  if (clean.includes('##') && !clean.includes('_##')) {
    clean = clean.replace('##', '_##');
  }

  const parts = clean.split('_');
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

  let category = 'residential';
  let amenityType = undefined;

  const lowerType = type.toLowerCase();
  if (lowerType === 'plot' || lowerType === 'residential') {
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
  const plotNumber = isGroupedRange
    ? null
    : numberOrRange.toLowerCase() === 'notmentioned'
    ? null
    : /^\d+$/.test(numberOrRange)
    ? String(parseInt(numberOrRange, 10))
    : numberOrRange;
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

function parseCoords(coordsStr) {
  const nums = coordsStr
    .split(',')
    .map((s) => parseFloat(s.trim()))
    .filter((n) => !isNaN(n));

  const points = [];
  for (let i = 0; i < nums.length - 1; i += 2) {
    points.push({ x: nums[i], y: nums[i + 1] });
  }
  return points;
}

function parseAreaElement(areaHtml, blockId = 'abbott') {
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
    amenityName: parsedSlug.amenityType,
    plotNumber: parsedSlug.plotNumber,
    isGroupedRange: parsedSlug.isGroupedRange,
    rangeSpan: parsedSlug.rangeSpan,
    sizeLabel: parsedSlug.sizeLabel,
    points,
  };
}

function parseImageMapHtml(html, blockId = 'abbott') {
  const areaMatches = html.match(/<area\b[^>]*>/gi);
  if (!areaMatches) return [];

  const results = [];
  for (const tag of areaMatches) {
    const parsed = parseAreaElement(tag, blockId);
    if (parsed) {
      results.push(parsed);
    }
  }
  return results;
}

// 5. Parse Abbott Block areas
const abbottHtml = fs.readFileSync(abbottHtmlSrc, 'utf8');
const abbottAreas = parseImageMapHtml(abbottHtml, 'abbott');

const abbottSaleable = abbottAreas.filter(a => a.category !== 'amenity' && !a.isGroupedRange);
const abbottAmenities = abbottAreas.filter(a => a.category === 'amenity');
const abbottResidential = abbottAreas.filter(a => a.category === 'residential');
const abbottCommercial = abbottAreas.filter(a => a.category === 'commercial');

console.log(`\n=== ABBOTT BLOCK ===`);
console.log(`Total areas: ${abbottAreas.length}`);
console.log(`Residential plots: ${abbottResidential.length}`);
console.log(`Commercial plots: ${abbottCommercial.length}`);
console.log(`Total saleable plots: ${abbottSaleable.length}`);
console.log(`Amenities: ${abbottAmenities.length}`);

const abbottBlockName = 'Abbott Block';

const abbottTs = `import { BlockMapConfig, TracedPlotArea } from './types';

export const abbottBlockAreas: TracedPlotArea[] = ${JSON.stringify(abbottAreas, null, 2)};

export const abbottBlockConfig: BlockMapConfig = {
  blockId: 'abbott',
  blockName: '${abbottBlockName}',
  imageSrc: '/Maps/Abbott/abbott-block-map.png',
  naturalWidth: ${abbottDims.width},
  naturalHeight: ${abbottDims.height},
  areas: abbottBlockAreas,
};
`;

const abbottOutPath = path.join(FRONTEND_ROOT, 'src/lib/map/abbottBlockAreas.ts');
fs.writeFileSync(abbottOutPath, abbottTs, 'utf8');
console.log(`Generated ${abbottOutPath}`);
