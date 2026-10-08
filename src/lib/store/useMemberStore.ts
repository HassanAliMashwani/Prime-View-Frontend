import { create } from 'zustand';
import { Customer } from '../mock/types';
import { EnrichedPlot, getMyPlots } from '../dal/plots';
import { getCustomerProfile } from '../dal/customers';
import { getPaymentSchedule, getPaymentHistory, PlotPaymentSchedule, PaymentTransaction } from '../dal/payments';
import { getMyDocuments, PlotDocuments } from '../dal/documents';
import { getActiveSession } from '../dal/auth';

import { clearCachePrefix, reconcileItems } from '../dal/apiCache';

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
  termsModalOpen: boolean;
  openTermsModal: () => void;
  closeTermsModal: () => void;
  fetchPlots: () => Promise<void>;
  fetchPayments: (filterPlotId?: string) => Promise<void>;
  fetchPaymentHistory: (filterPlotId?: string) => Promise<void>;
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
  termsModalOpen: false,
  openTermsModal: () => set({ termsModalOpen: true }),
  closeTermsModal: () => set({ termsModalOpen: false }),

  fetchDashboardData: async () => {
    const hasData = get().plots.length > 0;
    if (!hasData) {
      set({ isLoading: true, error: null });
    }
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

      set((state) => ({
        profile: profileRes.data || state.profile,
        plots: reconcileItems(state.plots, plotsRes.data || [], (p) => p.id),
        schedules: reconcileItems(state.schedules, schedulesRes.data || [], (s) => s.plotId),
        isLoading: false,
      }));
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
    if (get().plots.length === 0) {
      set({ isLoading: true });
    }
    const res = await getMyPlots();
    if (res.ok) {
      set((state) => ({
        plots: reconcileItems(state.plots, res.data || [], (p) => p.id),
        isLoading: false,
      }));
    } else {
      set({ isLoading: false });
    }
  },

  fetchPayments: async (filterPlotId?: string) => {
    if (get().schedules.length === 0) {
      set({ isLoading: true });
    }
    try {
      const [schedRes, histRes] = await Promise.all([
        getPaymentSchedule(filterPlotId),
        getPaymentHistory(filterPlotId),
      ]);
      set((state) => ({
        schedules: reconcileItems(state.schedules, schedRes.data || [], (s) => s.plotId),
        transactions: histRes.data || [],
        isLoading: false,
      }));
    } catch (e) {
      set({ isLoading: false, error: 'Failed to load payments' });
    }
  },

  fetchPaymentHistory: async (filterPlotId?: string) => {
    if (get().transactions.length === 0) {
      set({ isLoading: true });
    }
    try {
      const histRes = await getPaymentHistory(filterPlotId);
      set((state) => ({
        transactions: histRes.data || [],
        isLoading: false,
      }));
    } catch (e) {
      set({ isLoading: false, error: 'Failed to load payment history' });
    }
  },

  fetchDocuments: async () => {
    if (get().documents.length === 0) {
      set({ isLoading: true });
    }
    try {
      const res = await getMyDocuments();
      set((state) => ({
        documents: reconcileItems(state.documents, res.data || [], (d) => d.plotId),
        isLoading: false,
      }));
    } catch (e) {
      set({ isLoading: false, error: 'Failed to load documents' });
    }
  },

  reset: () => {
    clearCachePrefix('/me/');
    clearCachePrefix('/customers/');
    set({
      profile: null,
      plots: [],
      schedules: [],
      transactions: [],
      documents: [],
      isLoading: false,
      error: null,
      termsModalOpen: false,
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
          data.type === 'PROFILE_UPDATED' ||
          data.type === 'PLOT_BOOKED' ||
          data.type === 'CUSTOMER_CREATED'
        ) {
          get().fetchDashboardData();
          get().fetchPayments();
          get().fetchDocuments();
        }
      };
    } catch {
      // BroadcastChannel unavailable
    }

    return () => {
      if (channel) {
        channel.close();
      }
    };
  },
}));
