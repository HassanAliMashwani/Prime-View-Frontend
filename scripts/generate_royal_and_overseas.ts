import fs from 'fs';
import path from 'path';
import { parseImageMapHtml } from '../src/lib/map/parseImageMap';
import { REGION_NAME_BY_BLOCK_ID } from '../src/lib/map/regionData';

const FRONTEND_ROOT = path.resolve(__dirname, '..');

// 1. Ensure target directories exist
const royalDir = path.join(FRONTEND_ROOT, 'public/Maps/Royal');
const overseasDir = path.join(FRONTEND_ROOT, 'public/Maps/Overseas');

fs.mkdirSync(royalDir, { recursive: true });
fs.mkdirSync(overseasDir, { recursive: true });

// 2. Check source files exist
const royalSrcDir = path.join(FRONTEND_ROOT, 'public/Maps/Royal Block');
const overseasSrcDir = path.join(FRONTEND_ROOT, 'public/Maps/OverSeas Block');

const royalHtmlSrc = path.join(royalSrcDir, 'RoyalBlock.html');
const royalPngSrc = path.join(royalSrcDir, 'Royal Block.png');

const overseasHtmlSrc = path.join(overseasSrcDir, 'Overseas_block.html');
const overseasPngSrc = path.join(overseasSrcDir, 'OverSeas Block-1.png');

if (!fs.existsSync(royalHtmlSrc)) {
  console.error(`Missing HTML map file: ${royalHtmlSrc}`);
  process.exit(1);
}
if (!fs.existsSync(royalPngSrc)) {
  console.error(`Missing PNG map file: ${royalPngSrc}`);
  process.exit(1);
}
if (!fs.existsSync(overseasHtmlSrc)) {
  console.error(`Missing HTML map file: ${overseasHtmlSrc}`);
  process.exit(1);
}
if (!fs.existsSync(overseasPngSrc)) {
  console.error(`Missing PNG map file: ${overseasPngSrc}`);
  process.exit(1);
}

// 3. Copy files to public/Maps/Royal and public/Maps/Overseas
// Copy both original filenames and standardized names
fs.copyFileSync(royalPngSrc, path.join(royalDir, 'royal-block-map.png'));
fs.copyFileSync(royalPngSrc, path.join(royalDir, 'Royal Block.png'));
fs.copyFileSync(royalHtmlSrc, path.join(royalDir, 'royal-map.html'));
fs.copyFileSync(royalHtmlSrc, path.join(royalDir, 'RoyalBlock.html'));

fs.copyFileSync(overseasPngSrc, path.join(overseasDir, 'overseas-block-map.png'));
fs.copyFileSync(overseasPngSrc, path.join(overseasDir, 'OverSeas Block-1.png'));
fs.copyFileSync(overseasHtmlSrc, path.join(overseasDir, 'overseas-map.html'));
fs.copyFileSync(overseasHtmlSrc, path.join(overseasDir, 'Overseas_block.html'));

console.log('Files copied to public/Maps/Royal and public/Maps/Overseas successfully.');

// 4. Verify PNG dimensions from real file headers
function getPngDimensions(filePath: string) {
  const buf = fs.readFileSync(filePath);
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
  };
}

const royalDims = getPngDimensions(royalPngSrc);
const overseasDims = getPngDimensions(overseasPngSrc);

console.log('Royal PNG dimensions:', royalDims);
console.log('Overseas PNG dimensions:', overseasDims);

// 5. Parse Royal Block areas
const royalHtml = fs.readFileSync(royalHtmlSrc, 'utf8');
const royalAreas = parseImageMapHtml(royalHtml, 'royal');

const royalSaleable = royalAreas.filter(a => a.category !== 'amenity' && !a.isGroupedRange);
const royalAmenities = royalAreas.filter(a => a.category === 'amenity');
const royalResidential = royalAreas.filter(a => a.category === 'residential');
const royalCommercial = royalAreas.filter(a => a.category === 'commercial');

console.log(`\n=== ROYAL BLOCK ===`);
console.log(`Total areas: ${royalAreas.length}`);
console.log(`Residential plots: ${royalResidential.length}`);
console.log(`Commercial plots: ${royalCommercial.length}`);
console.log(`Total saleable plots: ${royalSaleable.length}`);
console.log(`Amenities: ${royalAmenities.length}`);

const royalBlockName = REGION_NAME_BY_BLOCK_ID['royal'] || 'Royal Block';

const royalTs = `import { BlockMapConfig, TracedPlotArea } from './types';

export const royalBlockAreas: TracedPlotArea[] = ${JSON.stringify(royalAreas, null, 2)};

export const royalBlockConfig: BlockMapConfig = {
  blockId: 'royal',
  blockName: '${royalBlockName}',
  imageSrc: '/Maps/Royal/royal-block-map.png',
  naturalWidth: ${royalDims.width},
  naturalHeight: ${royalDims.height},
  areas: royalBlockAreas,
};
`;

const royalOutPath = path.join(FRONTEND_ROOT, 'src/lib/map/royalBlockAreas.ts');
fs.writeFileSync(royalOutPath, royalTs, 'utf8');
console.log(`Generated ${royalOutPath}`);

// 6. Parse Overseas Block areas
const overseasHtml = fs.readFileSync(overseasHtmlSrc, 'utf8');
const overseasAreas = parseImageMapHtml(overseasHtml, 'overseas');

const overseasSaleable = overseasAreas.filter(a => a.category !== 'amenity' && !a.isGroupedRange);
const overseasAmenities = overseasAreas.filter(a => a.category === 'amenity');
const overseasResidential = overseasAreas.filter(a => a.category === 'residential');
const overseasCommercial = overseasAreas.filter(a => a.category === 'commercial');

console.log(`\n=== OVERSEAS BLOCK ===`);
console.log(`Total areas: ${overseasAreas.length}`);
console.log(`Residential plots: ${overseasResidential.length}`);
console.log(`Commercial plots: ${overseasCommercial.length}`);
console.log(`Total saleable plots: ${overseasSaleable.length}`);
console.log(`Amenities: ${overseasAmenities.length}`);

const overseasBlockName = REGION_NAME_BY_BLOCK_ID['overseas'] || 'Overseas Block';

const overseasTs = `import { BlockMapConfig, TracedPlotArea } from './types';

export const overseasBlockAreas: TracedPlotArea[] = ${JSON.stringify(overseasAreas, null, 2)};

export const overseasBlockConfig: BlockMapConfig = {
  blockId: 'overseas',
  blockName: '${overseasBlockName}',
  imageSrc: '/Maps/Overseas/overseas-block-map.png',
  naturalWidth: ${overseasDims.width},
  naturalHeight: ${overseasDims.height},
  areas: overseasBlockAreas,
};
`;

const overseasOutPath = path.join(FRONTEND_ROOT, 'src/lib/map/overseasBlockAreas.ts');
fs.writeFileSync(overseasOutPath, overseasTs, 'utf8');
console.log(`Generated ${overseasOutPath}`);
