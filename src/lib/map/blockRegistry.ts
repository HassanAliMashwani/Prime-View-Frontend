import { BlockMapConfig } from './types';
import { eliteBlockConfig } from './eliteBlockAreas';

/**
 * Central registry of all interactive traced block maps.
 * To add a new block:
 * 1. Place [blockId]-block-map.png in public/master-plan/
 * 2. Generate [blockId]BlockAreas.ts using parseImageMap.ts
 * 3. Add one entry below.
 * Zero changes required in InteractiveBlockMap.tsx!
 */
export const blockMapRegistry: Record<string, BlockMapConfig> = {
  elite: eliteBlockConfig,
};

export function getBlockMapConfig(blockId: string): BlockMapConfig | undefined {
  return blockMapRegistry[blockId.toLowerCase().trim()];
}

export function hasBlockMap(blockId: string): boolean {
  return Boolean(blockMapRegistry[blockId.toLowerCase().trim()]);
}
