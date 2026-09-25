import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const HTML_PATH = resolve(__dirname, 'public/Maps/NPF-Phase-1/npf-phase-1-map.html');
const OUT_PATH  = resolve(__dirname, 'src/lib/map/npfPhase1BlockAreas.ts');

// Saleable ranges from npf-phase-1-plots.txt
const RESIDENTIAL_RANGES = [[1,44],[82,218],[220,233],[235,245],[248,253]];
const COMMERCIAL_RANGES  = [[46,73]];
// Plots listed under Amenities in the txt file that may appear with "saleable" HTML prefix
const AMENITY_OVERRIDES  = new Set([4, 45, 74, 75, 76, 77, 78, 79, 80, 81, 219, 234, 247, 254]);

function inRanges(n, ranges) { return ranges.some(([lo,hi]) => n >= lo && n <= hi); }

function getCategory(plotNum) {
  const n = parseInt(plotNum, 10);
  if (AMENITY_OVERRIDES.has(n))        return 'amenity';
  if (inRanges(n, RESIDENTIAL_RANGES)) return 'residential';
  if (inRanges(n, COMMERCIAL_RANGES))  return 'commercial';
  return 'amenity';
}

function parseSizeLabel(s) {
  const k = s.match(/^(\d+(?:\.\d+)?)k$/i); if (k) return `${k[1]} Kanal`;
  const m = s.match(/^(\d+(?:\.\d+)?)M$/);  if (m) return `${m[1]} Marla`;
  return s;
}

const AMENITY_NAMES = {
  4: 'Graveyard',
  45: 'Commercial Park',
  74: 'Apartment Block',
  75: 'Community Park',
  76: 'T-Plant',
  77: 'School',
  78: 'Playground',
  79: 'Mosque',
  80: 'Hospital',
  81: 'Community Center',
  219: 'Filtration Plant',
  234: 'Open Garden',
  247: 'Grid Station',
  254: 'Amenity'
};

function getAmenityType(plotNum) {
  const n = parseInt(plotNum, 10);
  return AMENITY_NAMES[n] || 'Amenity';
}

const html = readFileSync(HTML_PATH, 'utf-8');

// Match each <area .../>
const AREA_RE = /<area\b([\s\S]*?)\/>/g;
const ID_RE     = /\bid="([^"]+)"/;
const COORDS_RE = /\bcoords="([^"]+)"/;

const areas = [];
let m;
while ((m = AREA_RE.exec(html)) !== null) {
  const block = m[1];
  const idM     = ID_RE.exec(block);
  const coordsM = COORDS_RE.exec(block);
  if (!idM || !coordsM) continue;

  const rawId = idM[1];
  // strip "saleable" prefix, then split on "_"
  const clean = rawId.replace(/^saleable/, '');
  const parts = clean.split('_');
  if (parts.length < 4) { console.warn('Unexpected id, skipping:', rawId); continue; }

  const rawSize   = parts[parts.length - 1];           // e.g. "1k", "4M", "2.01k"
  const plotNumber = String(parseInt(parts[parts.length - 2], 10)); // strip leading zeros
  const sizeLabel  = parseSizeLabel(rawSize);
  const category   = getCategory(plotNumber);
  const typeSegment = category === 'residential' ? 'plot' : category;
  const slug = `npf-phase-1_${typeSegment}_${plotNumber}_${rawSize.toLowerCase()}`;

  // Parse coords into points array
  const nums = coordsM[1].split(',').map(Number);
  const points = [];
  for (let i = 0; i < nums.length - 1; i += 2) {
    points.push({ x: nums[i], y: nums[i + 1] });
  }

  const entry = { slug, blockId: 'npf-phase-1', category, plotNumber, isGroupedRange: false, sizeLabel, points };
  if (category === 'amenity') entry.amenityType = getAmenityType(plotNumber);
  areas.push(entry);
}

console.log('Total areas:', areas.length);
const counts = {};
for (const a of areas) counts[a.category] = (counts[a.category] || 0) + 1;
console.log('By category:', counts);

// Emit TypeScript
const linesInner = areas.map(a => {
  let s = `  {\n    "slug": "${a.slug}",\n    "blockId": "${a.blockId}",\n    "category": "${a.category}",`;
  if (a.amenityType) s += `\n    "amenityType": "${a.amenityType}",`;
  s += `\n    "plotNumber": "${a.plotNumber}",\n    "isGroupedRange": ${a.isGroupedRange},\n    "sizeLabel": "${a.sizeLabel}",\n    "points": [\n`;
  s += a.points.map(p => `      { "x": ${p.x}, "y": ${p.y} }`).join(',\n');
  s += `\n    ]\n  }`;
  return s;
});

const output = `import { BlockMapConfig, TracedPlotArea } from './types';

export const npfPhase1BlockAreas: TracedPlotArea[] = [
${linesInner.join(',\n')}
];

export const npfPhase1BlockConfig: BlockMapConfig = {
  blockId: 'npf-phase-1',
  blockName: 'NPF Phase 1',
  imageSrc: '/Maps/NPF-Phase-1/npf-phase-1-map.png',
  naturalWidth: 1457,
  naturalHeight: 1366,
  areas: npfPhase1BlockAreas,
};
`;

writeFileSync(OUT_PATH, output, 'utf-8');
console.log('Written:', OUT_PATH);
