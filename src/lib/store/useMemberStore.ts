import { create } from 'zustand';
import { Customer } from '../mock/types';
import { EnrichedPlot, getMyPlots } from '../dal/plots';
import { getCustomerProfile } from '../dal/customers';
import { getPaymentSchedule, getPaymentHistory, PlotPaymentSchedule, PaymentTransaction } from '../dal/payments';
import { getMyDocuments, PlotDocuments } from '../dal/documents';
import { getActiveSession } from '../dal/auth';

import { clearCachePrefix, reconcileItems } from '../dal/apiCache';
import { runLane1, runLane2 } from '../requestLanes';

interface MemberState {
  profile: Customer | null;
  plots: EnrichedPlot[];
  schedules: PlotPaymentSchedule[];
  transactions: PaymentTransaction[];
  documents: PlotDocuments[];
  isLoading: boolean;
  error: string | null;

  fetchDashboardData: (isBackground?: boolean) => Promise<void>;
  fetchProfile: (isBackground?: boolean) => Promise<void>;
  termsModalOpen: boolean;
  openTermsModal: () => void;
  closeTermsModal: () => void;
  fetchPlots: (isBackground?: boolean) => Promise<void>;
  fetchPayments: (filterPlotId?: string, isBackground?: boolean) => Promise<void>;
  fetchPaymentHistory: (filterPlotId?: string, isBackground?: boolean) => Promise<void>;
  fetchDocuments: (isBackground?: boolean) => Promise<void>;
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

  fetchDashboardData: async (isBackground = false) => {
    if (!isBackground) {
      const hasData = get().plots.length > 0;
      if (!hasData) {
        set({ isLoading: true, error: null });
      }
      try {
        await runLane1({
          screen: 'member-dashboard',
          key: 'member-dashboard-data',
          fn: async () => {
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
          },
        });
      } catch (err: any) {
        if (err?.message !== 'REQUEST_SUPERSEDED') {
          set({ isLoading: false, error: 'Failed to load dashboard data' });
        }
      }
    } else {
      try {
        await runLane2({
          screen: 'member-dashboard',
          key: 'member-dashboard-data',
          isRefresh: true,
          fn: async () => {
            const [profileRes, plotsRes, schedulesRes] = await Promise.all([
              getCustomerProfile(),
              getMyPlots(),
              getPaymentSchedule(),
            ]);

            if (profileRes.error === 'UNAUTHORIZED' || plotsRes.error === 'UNAUTHORIZED') {
              return;
            }

            set((state) => ({
              profile: profileRes.data || state.profile,
              plots: reconcileItems(state.plots, plotsRes.data || [], (p) => p.id),
              schedules: reconcileItems(state.schedules, schedulesRes.data || [], (s) => s.plotId),
            }));
          },
        });
      } catch {
        // Non-blocking in background
      }
    }
  },

  fetchProfile: async (isBackground = false) => {
    if (!isBackground) {
      try {
        await runLane1({
          screen: 'member-profile',
          key: 'member-profile-data',
          fn: async () => {
            const res = await getCustomerProfile();
            if (res.ok && res.data) {
              set({ profile: res.data });
            }
          },
        });
      } catch (err: any) {
        if (err?.message !== 'REQUEST_SUPERSEDED') {
          // ignore
        }
      }
    } else {
      try {
        await runLane2({
          screen: 'member-profile',
          key: 'member-profile-data',
          isRefresh: true,
          fn: async () => {
            const res = await getCustomerProfile();
            if (res.ok && res.data) {
              set({ profile: res.data });
            }
          },
        });
      } catch {
        // non-blocking
      }
    }
  },

  fetchPlots: async (isBackground = false) => {
    if (!isBackground) {
      if (get().plots.length === 0) {
        set({ isLoading: true });
      }
      try {
        await runLane1({
          screen: 'member-properties',
          key: 'member-plots-data',
          fn: async () => {
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
        });
      } catch (err: any) {
        if (err?.message !== 'REQUEST_SUPERSEDED') {
          set({ isLoading: false });
        }
      }
    } else {
      try {
        await runLane2({
          screen: 'member-properties',
          key: 'member-plots-data',
          isRefresh: true,
          fn: async () => {
            const res = await getMyPlots();
            if (res.ok && res.data) {
              set((state) => ({
                plots: reconcileItems(state.plots, res.data || [], (p) => p.id),
              }));
            }
          },
        });
      } catch {
        // non-blocking
      }
    }
  },

  fetchPayments: async (filterPlotId?: string, isBackground = false) => {
    if (!isBackground) {
      if (get().schedules.length === 0) {
        set({ isLoading: true });
      }
      try {
        await runLane1({
          screen: 'member-payments',
          key: `member-payments-${filterPlotId || 'all'}`,
          fn: async () => {
            const [schedRes, histRes] = await Promise.all([
              getPaymentSchedule(filterPlotId),
              getPaymentHistory(filterPlotId),
            ]);
            set((state) => ({
              schedules: reconcileItems(state.schedules, schedRes.data || [], (s) => s.plotId),
              transactions: histRes.data || [],
              isLoading: false,
            }));
          },
        });
      } catch (err: any) {
        if (err?.message !== 'REQUEST_SUPERSEDED') {
          set({ isLoading: false, error: 'Failed to load payments' });
        }
      }
    } else {
      try {
        await runLane2({
          screen: 'member-payments',
          key: `member-payments-${filterPlotId || 'all'}`,
          isRefresh: true,
          fn: async () => {
            const [schedRes, histRes] = await Promise.all([
              getPaymentSchedule(filterPlotId),
              getPaymentHistory(filterPlotId),
            ]);
            set((state) => ({
              schedules: reconcileItems(state.schedules, schedRes.data || [], (s) => s.plotId),
              transactions: histRes.data || [],
            }));
          },
        });
      } catch {
        // non-blocking
      }
    }
  },

  fetchPaymentHistory: async (filterPlotId?: string, isBackground = false) => {
    if (!isBackground) {
      if (get().transactions.length === 0) {
        set({ isLoading: true });
      }
      try {
        await runLane1({
          screen: 'member-payment-history',
          key: `member-payment-history-${filterPlotId || 'all'}`,
          fn: async () => {
            const histRes = await getPaymentHistory(filterPlotId);
            set((state) => ({
              transactions: histRes.data || [],
              isLoading: false,
            }));
          },
        });
      } catch (err: any) {
        if (err?.message !== 'REQUEST_SUPERSEDED') {
          set({ isLoading: false, error: 'Failed to load payment history' });
        }
      }
    } else {
      try {
        await runLane2({
          screen: 'member-payment-history',
          key: `member-payment-history-${filterPlotId || 'all'}`,
          isRefresh: true,
          fn: async () => {
            const histRes = await getPaymentHistory(filterPlotId);
            set((state) => ({
              transactions: histRes.data || [],
            }));
          },
        });
      } catch {
        // non-blocking
      }
    }
  },

  fetchDocuments: async (isBackground = false) => {
    if (!isBackground) {
      if (get().documents.length === 0) {
        set({ isLoading: true });
      }
      try {
        await runLane1({
          screen: 'member-documents',
          key: 'member-documents',
          fn: async () => {
            const res = await getMyDocuments();
            set((state) => ({
              documents: reconcileItems(state.documents, res.data || [], (d) => d.plotId),
              isLoading: false,
            }));
          },
        });
      } catch (err: any) {
        if (err?.message !== 'REQUEST_SUPERSEDED') {
          set({ isLoading: false, error: 'Failed to load documents' });
        }
      }
    } else {
      try {
        await runLane2({
          screen: 'member-documents',
          key: 'member-documents',
          isRefresh: true,
          fn: async () => {
            const res = await getMyDocuments();
            set((state) => ({
              documents: reconcileItems(state.documents, res.data || [], (d) => d.plotId),
            }));
          },
        });
      } catch {
        // non-blocking
      }
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
        // If event affects payments or bookings or plots, re-fetch via Lane 2
        if (
          data.type === 'PAYMENT_RECORD_UPDATED' ||
          data.type === 'PLOT_STATUS_CHANGED' ||
          data.type === 'BOOKING_CREATED' ||
          data.type === 'PROFILE_UPDATED' ||
          data.type === 'PLOT_BOOKED' ||
          data.type === 'CUSTOMER_CREATED'
        ) {
          get().fetchDashboardData(true);
          get().fetchPayments(undefined, true);
          get().fetchDocuments(true);
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
