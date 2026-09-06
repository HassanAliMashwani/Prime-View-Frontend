import { mockStore } from '../mock/store';
import { SocietyDocument } from '../mock/types';
import { requireMemberSession } from './auth';

export interface PlotDocuments {
  plotId: string;
  plotNumber: string;
  size: string;
  documents: SocietyDocument[];
}

export async function getMyDocuments(): Promise<{ ok: boolean; data: PlotDocuments[]; error?: string }> {
  try {
    const session = requireMemberSession();
    const userBookings = mockStore.bookings.filter((b) => b.customerId === session.customerId);

    const result: PlotDocuments[] = [];

    for (const booking of userBookings) {
      const plot = mockStore.plots.find((p) => p.id === booking.plotId);
      const plotNumber = plot ? plot.plotNumber : 'Unknown Plot';
      const size = plot ? plot.size : '';

      // Find documents for this booking
      const docs = mockStore.documents.filter((d) => d.bookingId === booking.id);

      result.push({
        plotId: booking.plotId,
        plotNumber,
        size,
        documents: [...docs],
      });
    }

    return { ok: true, data: result };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return { ok: false, data: [], error: 'UNAUTHORIZED' };
    }
    return { ok: false, data: [], error: 'UNKNOWN_ERROR' };
  }
}
