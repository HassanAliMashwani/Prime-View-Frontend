import { BlockMapConfig } from './types';

/**
 * Supported interactive block identifiers.
 * Area files are loaded dynamically so the initial bundle
 * does not pull in all block shape definitions.
 */
const SUPPORTED_BLOCKS = new Set([
  'elite',
  'npf-phase-1',
  'commercial',
  'royal',
  'overseas',
  'abbott',
]);

const cache: Record<string, BlockMapConfig> = {};

export const blockMapRegistry: Record<string, BlockMapConfig> = cache;

export function hasBlockMap(blockId: string): boolean {
  if (!blockId) return false;
  return SUPPORTED_BLOCKS.has(blockId.toLowerCase().trim());
}

export function getBlockMapConfig(blockId: string): BlockMapConfig | undefined {
  if (!blockId) return undefined;
  return cache[blockId.toLowerCase().trim()];
}

export async function loadBlockMapConfig(blockId: string): Promise<BlockMapConfig | undefined> {
  if (!blockId) return undefined;
  const key = blockId.toLowerCase().trim();
  if (cache[key]) return cache[key];
  if (!SUPPORTED_BLOCKS.has(key)) return undefined;

  let loaded: BlockMapConfig | undefined;
  switch (key) {
    case 'elite': {
      const mod = await import('./eliteBlockAreas');
      loaded = mod.eliteBlockConfig;
      break;
    }
    case 'npf-phase-1': {
      const mod = await import('./npfPhase1BlockAreas');
      loaded = mod.npfPhase1BlockConfig;
      break;
    }
    case 'commercial': {
      const mod = await import('./commercialBlockAreas');
      loaded = mod.commercialBlockConfig;
      break;
    }
    case 'royal': {
      const mod = await import('./royalBlockAreas');
      loaded = mod.royalBlockConfig;
      break;
    }
    case 'overseas': {
      const mod = await import('./overseasBlockAreas');
      loaded = mod.overseasBlockConfig;
      break;
    }
    case 'abbott': {
      const mod = await import('./abbottBlockAreas');
      loaded = mod.abbottBlockConfig;
      break;
    }
  }

  if (loaded) {
    cache[key] = loaded;
  }
  return loaded;
}
