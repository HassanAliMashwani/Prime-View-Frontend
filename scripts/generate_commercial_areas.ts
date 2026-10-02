import fs from 'fs';
import path from 'path';
import { parseImageMapHtml } from '../src/lib/map/parseImageMap';
import { REGION_NAME_BY_BLOCK_ID } from '../src/lib/map/regionData';

const htmlPath = path.resolve('public/Maps/Commercial Block/CommercialArea_ImageMap.html');
if (!fs.existsSync(htmlPath)) {
  console.error(`Missing HTML map file at ${htmlPath}`);
  process.exit(1);
}

const html = fs.readFileSync(htmlPath, 'utf8');
const areas = parseImageMapHtml(html, 'commercial');
console.log(`Parsed ${areas.length} area elements for Commercial Block.`);

const saleable = areas.filter(a => a.category !== 'amenity' && !a.isGroupedRange);
const amenities = areas.filter(a => a.category === 'amenity');
const grouped = areas.filter(a => a.isGroupedRange);

console.log(`- Area count: ${areas.length}`);
console.log(`- Saleable count: ${saleable.length}`);
console.log(`- Amenity count: ${amenities.length}`);
console.log(`- Grouped range count: ${grouped.length}`);

// Verify real PNG pixel dimensions
const pngPath = path.resolve('public/Maps/Commercial Block/Commercial_Block.png');
const buf = fs.readFileSync(pngPath);
const naturalWidth = buf.readUInt32BE(16);
const naturalHeight = buf.readUInt32BE(20);
console.log(`- Image dimensions: ${naturalWidth}x${naturalHeight}`);

const blockName = REGION_NAME_BY_BLOCK_ID['commercial'] || 'Commercial Block';

const outTs = `import { BlockMapConfig, TracedPlotArea } from './types';

export const commercialBlockAreas: TracedPlotArea[] = ${JSON.stringify(areas, null, 2)};

export const commercialBlockConfig: BlockMapConfig = {
  blockId: 'commercial',
  blockName: '${blockName}',
  imageSrc: '/Maps/Commercial/commercial-map.png',
  naturalWidth: ${naturalWidth},
  naturalHeight: ${naturalHeight},
  areas: commercialBlockAreas,
};
`;

const targetPath = path.resolve('src/lib/map/commercialBlockAreas.ts');
fs.writeFileSync(targetPath, outTs, 'utf8');
console.log(`Successfully generated ${targetPath}`);
