import fs from 'fs';
import path from 'path';
import { parseImageMapHtml } from '../src/lib/map/parseImageMap';
import { REGION_NAME_BY_BLOCK_ID } from '../src/lib/map/regionData';

const FRONTEND_ROOT = path.resolve(__dirname, '..');

// 1. Target directory
const abbottDir = path.join(FRONTEND_ROOT, 'public/Maps/Abbott');
fs.mkdirSync(abbottDir, { recursive: true });

// 2. Source files
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
function getPngDimensions(filePath: string) {
  const buf = fs.readFileSync(filePath);
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
  };
}

const abbottDims = getPngDimensions(abbottPngSrc);
console.log('Abbott PNG dimensions:', abbottDims);

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

const abbottBlockName = REGION_NAME_BY_BLOCK_ID['abbott'] || 'Abbott Block';

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
