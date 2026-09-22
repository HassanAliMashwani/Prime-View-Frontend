import { PlotStatus } from '@/lib/mock/types';

export interface PlotStyleConfig {
  key: string;
  label: string;
  fill: string;
  stroke: string;
  strokeWidth: number;
  textColor: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  isHatched?: boolean;
}

export const PLOT_STATUS_STYLES: Record<PlotStatus, PlotStyleConfig> = {
  booked: {
    key: 'booked',
    label: 'Booked',
    fill: '#ef4444',
    stroke: '#dc2626',
    strokeWidth: 1.5,
    textColor: '#ffffff',
    badgeBg: 'bg-red-50',
    badgeText: 'text-red-700',
    badgeBorder: 'border-red-200',
  },
  reserved: {
    key: 'reserved',
    label: 'Reserved',
    fill: '#f59e0b',
    stroke: '#d97706',
    strokeWidth: 1.5,
    textColor: '#1e293b',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-200',
  },
  allotted: {
    key: 'allotted',
    label: 'Allotted',
    fill: '#0f172a',
    stroke: '#020617',
    strokeWidth: 1.5,
    textColor: '#ffffff',
    badgeBg: 'bg-slate-900',
    badgeText: 'text-white',
    badgeBorder: 'border-slate-700',
  },
  available: {
    key: 'available',
    label: 'Available',
    fill: '#10b981',
    stroke: '#059669',
    strokeWidth: 1.5,
    textColor: '#0f172a',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
  },
  disputed: {
    key: 'disputed',
    label: 'Disputed',
    fill: 'url(#disputedHatch)',
    stroke: '#dc2626',
    strokeWidth: 2,
    textColor: '#ffffff',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-900',
    badgeBorder: 'border-rose-300',
    isHatched: true,
  },
};

export const SPECIAL_PLOT_STYLES = {
  amenity: {
    key: 'amenity',
    label: 'Amenity',
    fill: '#a855f7',
    stroke: '#9333ea',
    strokeWidth: 1.5,
    textColor: '#ffffff',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
    badgeBorder: 'border-purple-200',
  },
  adjustment: {
    key: 'adjustment',
    label: 'Adjustment',
    fill: '#2563eb',
    stroke: '#1d4ed8',
    strokeWidth: 1.5,
    textColor: '#ffffff',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200',
  },
  commercialAvailable: {
    key: 'commercial',
    label: 'Commercial',
    fill: '#ffffff',
    stroke: '#1e293b',
    strokeWidth: 2,
    textColor: '#0f172a',
    badgeBg: 'bg-slate-50',
    badgeText: 'text-slate-800',
    badgeBorder: 'border-slate-300',
  },
};

/**
 * Resolves the display style for a plot.
 * Follows precedence:
 * 1. Adjustment flag -> Blue
 * 2. Amenity category -> Purple
 * 3. Commercial available (category === 'commercial' AND status === 'available') -> White + dark border (D3)
 * 4. Stored/derived status -> Booked (Red), Reserved (Yellow), Allotted (Black), Available (Green), Disputed (Hatch)
 * 5. Unknown status -> Throws Error immediately (fails loudly).
 */
export function getPlotStyle(plot: {
  status: string;
  displayStatus?: string;
  category?: string;
  isAdjustment?: boolean;
}): PlotStyleConfig {
  if (plot.isAdjustment) {
    return SPECIAL_PLOT_STYLES.adjustment;
  }

  if (plot.category === 'amenity') {
    return SPECIAL_PLOT_STYLES.amenity;
  }

  const effectiveStatus = plot.displayStatus || plot.status;

  // D3: Available commercial plots render with white fill + visible dark border
  if (plot.category === 'commercial' && effectiveStatus === 'available') {
    return SPECIAL_PLOT_STYLES.commercialAvailable;
  }

  const validStatuses: PlotStatus[] = ['available', 'reserved', 'booked', 'allotted', 'disputed'];
  if (!validStatuses.includes(effectiveStatus as PlotStatus)) {
    throw new Error(`Unknown plot status: "${effectiveStatus}". Allowed values: ${validStatuses.join(', ')}`);
  }

  return PLOT_STATUS_STYLES[effectiveStatus as PlotStatus];
}
