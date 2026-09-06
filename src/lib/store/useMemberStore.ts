import { create } from 'zustand';
import { Customer } from '../mock/types';
import { EnrichedPlot, getMyPlots } from '../dal/plots';
import { getCustomerProfile } from '../dal/customers';
import { getPaymentSchedule, getPaymentHistory, PlotPaymentSchedule, PaymentTransaction } from '../dal/payments';
import { getMyDocuments, PlotDocuments } from '../dal/documents';
import { getActiveSession } from '../dal/auth';

interface MemberState {
  profile: Customer | null;
  plots: EnrichedPlot[];
  schedules: PlotPaymentSchedule[];
  transactions: PaymentTransaction[];
  documents: PlotDocuments[];
  isLoading: boolean;
  error: string | null;

  fetchDashboardData: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  fetchPlots: () => Promise<void>;
  fetchPayments: (filterPlotId?: string) => Promise<void>;
  fetchDocuments: () => Promise<void>;
  reset: () => void;
  initSync: () => () => void;
}

export const useMemberStore = create<MemberState>((set, get) => ({
  profile: null,
  plots: [],
  schedules: [],
  transactions: [],
  documents: [],
  isLoading: false,
  error: null,

  fetchDashboardData: async () => {
    set({ isLoading: true, error: null });
    try {
      const [profileRes, plotsRes, schedulesRes] = await Promise.all([
        getCustomerProfile(),
        getMyPlots(),
        getPaymentSchedule(),
      ]);

      if (profileRes.error === 'UNAUTHORIZED' || plotsRes.error === 'UNAUTHORIZED') {
        set({ isLoading: false, error: 'UNAUTHORIZED' });
        return;
      }

      set({
        profile: profileRes.data || null,
        plots: plotsRes.data || [],
        schedules: schedulesRes.data || [],
        isLoading: false,
      });
    } catch (err) {
      set({ isLoading: false, error: 'Failed to load dashboard data' });
    }
  },

  fetchProfile: async () => {
    const res = await getCustomerProfile();
    if (res.ok && res.data) {
      set({ profile: res.data });
    }
  },

  fetchPlots: async () => {
    const res = await getMyPlots();
    if (res.ok) {
      set({ plots: res.data });
    }
  },

  fetchPayments: async (filterPlotId?: string) => {
    set({ isLoading: true });
    try {
      const [schedRes, histRes] = await Promise.all([
        getPaymentSchedule(filterPlotId),
        getPaymentHistory(filterPlotId),
      ]);
      set({
        schedules: schedRes.data || [],
        transactions: histRes.data || [],
        isLoading: false,
      });
    } catch (e) {
      set({ isLoading: false, error: 'Failed to load payments' });
    }
  },

  fetchDocuments: async () => {
    set({ isLoading: true });
    try {
      const res = await getMyDocuments();
      set({ documents: res.data || [], isLoading: false });
    } catch (e) {
      set({ isLoading: false, error: 'Failed to load documents' });
    }
  },

  reset: () => {
    set({
      profile: null,
      plots: [],
      schedules: [],
      transactions: [],
      documents: [],
      isLoading: false,
      error: null,
    });
  },

  // Real-time synchronization across browser tabs (Section 4 & Exception 5.5)
  initSync: () => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) {
      return () => {};
    }

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('prime-view-sync');
      channel.onmessage = (event) => {
        const session = getActiveSession();
        if (!session) return;

        const data = event.data;
        // If event affects payments or bookings or plots, re-fetch
        if (
          data.type === 'PAYMENT_RECORD_UPDATED' ||
          data.type === 'PLOT_STATUS_CHANGED' ||
          data.type === 'BOOKING_CREATED' ||
          data.type === 'PROFILE_UPDATED'
        ) {
          get().fetchDashboardData();
          get().fetchPayments();
          get().fetchDocuments();
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel sync init error:', e);
    }

    return () => {
      if (channel) {
        channel.close();
      }
    };
  },
}));
