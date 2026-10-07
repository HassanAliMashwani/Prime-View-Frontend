import fs from 'fs';
import path from 'path';
import { parseImageMapHtml } from '../src/lib/map/parseImageMap';

const mapHtmlPath = path.resolve('public/Maps/Elite/elite_block_updated.html');
const mapHtml = fs.readFileSync(mapHtmlPath, 'utf8');
const areas = parseImageMapHtml(mapHtml, 'elite');
console.log(`Successfully parsed ${areas.length} area elements for Elite Block.`);

const grouped = areas.filter(a => a.isGroupedRange);
const discrete = areas.filter(a => !a.isGroupedRange);
console.log(`- Discrete individual plots/amenities: ${discrete.length}`);
console.log(`- Grouped unplotted ranges: ${grouped.length} (${grouped.map(g => g.slug).join(', ')})`);

const outTs = `import { BlockMapConfig, TracedPlotArea } from './types';

export const eliteBlockAreas: TracedPlotArea[] = ${JSON.stringify(areas, null, 2)};

export const eliteBlockConfig: BlockMapConfig = {
  blockId: 'elite',
  blockName: 'Elite Block',
  imageSrc: '/master-plan/elite-block-map.png',
  naturalWidth: 2033,
  naturalHeight: 1637,
  areas: eliteBlockAreas,
};
`;

const targetPath = path.resolve('src/lib/map/eliteBlockAreas.ts');
fs.writeFileSync(targetPath, outTs, 'utf8');
console.log(`Written to ${targetPath}`);
