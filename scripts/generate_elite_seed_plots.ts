import fs from 'fs';
import path from 'path';
import { eliteBlockAreas } from '../src/lib/map/eliteBlockAreas';
import { Plot } from '../src/lib/mock/types';

const AMENITY_NAMES: Record<string, string> = {
  office: 'Society Administrative Office',
  graveYard: 'Grave Yard',
  masjid: 'Community Mosque',
  communityCentre: 'Community Centre',
  school: 'School',
  primeViewClub: 'Prime View Club',
  hospital: 'Hospital',
  amenities: 'Public Utility & Amenities',
  parkWithChalets: 'Park & Recreation Grounds',
};

const discreteAreas = eliteBlockAreas.filter((a) => !a.isGroupedRange && a.plotNumber);

const eliteSeedPlots: Plot[] = discreteAreas.map((area, index) => {
  const isAmenity = area.category === 'amenity';
  let price = 0;
  let plotType = '1_kanal';

  if (!isAmenity) {
    if (area.sizeLabel.includes('Kanal')) {
      const match = area.sizeLabel.match(/([\d.]+)/);
      const val = match ? parseFloat(match[1]) : 1;
      if (val >= 2) {
        plotType = '2_kanal';
        price = Math.round((val * 12500000) / 100000) * 100000;
      } else {
        plotType = '1_kanal';
        price = Math.round((val * 13000000) / 100000) * 100000;
      }
    } else if (area.sizeLabel.includes('Marla')) {
      const match = area.sizeLabel.match(/([\d.]+)/);
      const val = match ? parseFloat(match[1]) : 10;
      if (val >= 40) {
        plotType = '2_kanal';
        price = Math.round((val * 625000) / 100000) * 100000;
      } else if (val >= 20) {
        plotType = '1_kanal';
        price = Math.round((val * 650000) / 100000) * 100000;
      } else if (val >= 10) {
        plotType = '10_marla';
        price = Math.round((val * 700000) / 100000) * 100000;
      } else {
        plotType = '5_marla';
        price = Math.round((val * 720000) / 100000) * 100000;
      }
    } else {
      plotType = '1_kanal';
      price = 13000000;
    }
  } else {
    plotType = `amenity_${area.amenityType || 'general'}`;
  }

  // Assign statuses: make a small realistic distribution for visual demonstration
  let status: 'available' | 'reserved' | 'booked' = 'available';
  let currentOwnerId: string | undefined = undefined;

  if (!isAmenity) {
    if (index === 10 || index === 25 || index === 50 || index === 75 || index === 110) {
      status = 'reserved';
    } else if (index === 5 || index === 30 || index === 60 || index === 90 || index === 140) {
      status = 'booked';
      currentOwnerId = 'cust-1';
    }
  }

  return {
    id: `plot-el-${area.plotNumber}`,
    blockId: 'elite',
    plotNumber: area.plotNumber!,
    size: area.sizeLabel,
    category: area.category,
    plotType,
    price,
    status,
    currentOwnerId,
    amenityName: isAmenity ? (AMENITY_NAMES[area.amenityType || ''] || 'Amenity') : undefined,
  };
});

const content = `import { Plot } from '../mock/types';

export const eliteSeedPlots: Plot[] = ${JSON.stringify(eliteSeedPlots, null, 2)};
`;

const targetPath = path.resolve('src/lib/map/eliteSeedPlots.ts');
fs.writeFileSync(targetPath, content, 'utf8');
console.log(`Generated ${eliteSeedPlots.length} real Elite Block seed plots in ${targetPath}`);
