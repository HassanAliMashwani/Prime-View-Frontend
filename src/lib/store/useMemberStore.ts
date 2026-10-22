import { create } from 'zustand';
import { Customer } from '../mock/types';
import { EnrichedPlot, getMyPlots } from '../dal/plots';
import { getCustomerProfile } from '../dal/customers';
import { getPaymentSchedule, getPaymentHistory, PlotPaymentSchedule, PaymentTransaction, HeldPlotInfo } from '../dal/payments';
import { getMyDocuments, PlotDocuments } from '../dal/documents';
import { getActiveSession, handleMemberSessionExpired } from '../dal/auth';

import { clearCachePrefix, reconcileItems } from '../dal/apiCache';
import { runLane1, runLane2 } from '../requestLanes';

interface MemberState {
  profile: Customer | null;
  plots: EnrichedPlot[];
  schedules: PlotPaymentSchedule[];
  heldPlots: HeldPlotInfo[];
  transactions: PaymentTransaction[];
  documents: PlotDocuments[];
  isLoading: boolean;
  error: string | null;
  /**
   * Set when a non-401 fetch fails and there is no existing data to show.
   * Pages use this to render an error+retry state instead of the empty state.
   * Cleared on the next successful fetch.
   */
  fetchError: string | null;

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

let inFlightProfilePromise: Promise<void> | null = null;

export const useMemberStore = create<MemberState>((set, get) => ({
  profile: null,
  plots: [],
  schedules: [],
  heldPlots: [],
  transactions: [],
  documents: [],
  isLoading: false,
  error: null,
  fetchError: null,
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
          fn: async (signal) => {
            const [profileRes, plotsRes, schedulesRes] = await Promise.all([
              getCustomerProfile(signal),
              getMyPlots(signal),
              getPaymentSchedule(undefined, signal),
            ]);

            // 401 from any endpoint → purge session and send to login
            if (profileRes.error === 'UNAUTHORIZED' || plotsRes.error === 'UNAUTHORIZED' || schedulesRes.error === 'UNAUTHORIZED') {
              handleMemberSessionExpired();
              set({ isLoading: false, error: 'UNAUTHORIZED' });
              return;
            }

            // Non-401 failure with no existing data → show error state, don't clear
            const hasExistingData = get().plots.length > 0;
            if (!plotsRes.ok && !hasExistingData) {
              set({ isLoading: false, fetchError: 'Could not load your data. Please retry.' });
              return;
            }

            set((state) => ({
              profile: profileRes.data
                ? {
                    ...profileRes.data,
                    termsAccepted: Boolean(state.profile?.termsAccepted || profileRes.data.termsAccepted),
                  }
                : state.profile,
              plots: plotsRes.ok
                ? reconcileItems(state.plots, plotsRes.data || [], (p) => p.id)
                : state.plots, // Keep existing on failure
              schedules: schedulesRes.ok
                ? ((schedulesRes.data && schedulesRes.data.length > 0)
                    ? reconcileItems(state.schedules, schedulesRes.data, (s) => s.plotId)
                    : [])
                : state.schedules, // Keep existing on failure
              heldPlots: schedulesRes.ok
                ? ((schedulesRes as any)?.heldPlots || [])
                : state.heldPlots,
              isLoading: false,
              fetchError: null, // Clear on success
            }));
          },
        });
      } catch (err: any) {
        if (err?.message !== 'REQUEST_SUPERSEDED') {
          const hasData = get().plots.length > 0;
          set({
            isLoading: false,
            error: hasData ? null : 'Failed to load dashboard data',
            fetchError: hasData ? null : 'Could not load your data. Please retry.',
          });
        }
      }
    } else {
      try {
        await runLane2({
          screen: 'member-dashboard',
          key: 'member-dashboard-data',
          isRefresh: true,
          fn: async (signal) => {
            const [profileRes, plotsRes, schedulesRes] = await Promise.all([
              getCustomerProfile(signal),
              getMyPlots(signal),
              getPaymentSchedule(undefined, signal),
            ]);

            // 401 → sign out even in background
            if (profileRes.error === 'UNAUTHORIZED' || plotsRes.error === 'UNAUTHORIZED' || schedulesRes.error === 'UNAUTHORIZED') {
              handleMemberSessionExpired();
              return;
            }

            // Non-401 failure in background: silently keep existing data
            if (!plotsRes.ok) return;

            set((state) => ({
              profile: profileRes.data
                ? {
                    ...profileRes.data,
                    termsAccepted: Boolean(state.profile?.termsAccepted || profileRes.data.termsAccepted),
                  }
                : state.profile,
              plots: reconcileItems(state.plots, plotsRes.data || [], (p) => p.id),
              schedules: schedulesRes.ok
                ? ((schedulesRes.data && schedulesRes.data.length > 0)
                    ? reconcileItems(state.schedules, schedulesRes.data, (s) => s.plotId)
                    : [])
                : state.schedules,
              heldPlots: schedulesRes.ok
                ? ((schedulesRes as any)?.heldPlots || [])
                : state.heldPlots,
              fetchError: null,
            }));
          },
        });
      } catch {
        // Non-blocking in background
      }
    }
  },

  fetchProfile: async (isBackground = false) => {
    if (inFlightProfilePromise) {
      return inFlightProfilePromise;
    }
    inFlightProfilePromise = (async () => {
      try {
        if (!isBackground) {
          try {
            await runLane1({
              screen: 'member-profile',
              key: 'member-profile-data',
              fn: async (signal) => {
                const res = await getCustomerProfile(signal);
                if (res.error === 'UNAUTHORIZED') {
                  handleMemberSessionExpired();
                  return;
                }
                if (res.ok && res.data) {
                  const profileData: Customer = res.data;
                  set((state) => ({
                    profile: {
                      ...profileData,
                      termsAccepted: Boolean(state.profile?.termsAccepted || profileData.termsAccepted),
                    },
                    fetchError: null,
                  }));
                }
              },
            });
          } catch (err: any) {
            if (err?.message !== 'REQUEST_SUPERSEDED') {
              // ignore — profile failure is non-critical
            }
          }
        } else {
          try {
            await runLane2({
              screen: 'member-profile',
              key: 'member-profile-data',
              isRefresh: true,
              fn: async (signal) => {
                const res = await getCustomerProfile(signal);
                if (res.error === 'UNAUTHORIZED') {
                  handleMemberSessionExpired();
                  return;
                }
                if (res.ok && res.data) {
                  const profileData: Customer = res.data;
                  set((state) => ({
                    profile: {
                      ...profileData,
                      termsAccepted: Boolean(state.profile?.termsAccepted || profileData.termsAccepted),
                    },
                  }));
                }
              },
            });
          } catch {
            // non-blocking
          }
        }
      } finally {
        inFlightProfilePromise = null;
      }
    })();
    return inFlightProfilePromise;
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
          fn: async (signal) => {
            const res = await getMyPlots(signal);
            if (res.error === 'UNAUTHORIZED') {
              handleMemberSessionExpired();
              set({ isLoading: false });
              return;
            }
            if (res.ok) {
              set((state) => ({
                plots: reconcileItems(state.plots, res.data || [], (p) => p.id),
                isLoading: false,
                fetchError: null,
              }));
            } else {
              const hasData = get().plots.length > 0;
              set({
                isLoading: false,
                fetchError: hasData ? null : 'Could not load your properties. Please retry.',
              });
            }
          },
        });
      } catch (err: any) {
        if (err?.message !== 'REQUEST_SUPERSEDED') {
          const hasData = get().plots.length > 0;
          set({
            isLoading: false,
            fetchError: hasData ? null : 'Could not load your properties. Please retry.',
          });
        }
      }
    } else {
      try {
        await runLane2({
          screen: 'member-properties',
          key: 'member-plots-data',
          isRefresh: true,
          fn: async (signal) => {
            const res = await getMyPlots(signal);
            if (res.error === 'UNAUTHORIZED') {
              handleMemberSessionExpired();
              return;
            }
            if (res.ok && res.data) {
              set((state) => ({
                plots: reconcileItems(state.plots, res.data || [], (p) => p.id),
                fetchError: null,
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
          fn: async (signal) => {
            const [schedRes, histRes] = await Promise.all([
              getPaymentSchedule(filterPlotId, signal),
              getPaymentHistory(filterPlotId, signal),
            ]);

            if (schedRes.error === 'UNAUTHORIZED' || histRes.error === 'UNAUTHORIZED') {
              handleMemberSessionExpired();
              set({ isLoading: false });
              return;
            }

            if (!schedRes.ok) {
              const hasData = get().schedules.length > 0;
              set({
                isLoading: false,
                fetchError: hasData ? null : 'Could not load your payment data. Please retry.',
              });
              return;
            }

            set((state) => ({
              schedules: (schedRes.data && schedRes.data.length > 0)
                ? reconcileItems(state.schedules, schedRes.data, (s) => s.plotId)
                : [],
              heldPlots: (schedRes as any)?.heldPlots || [],
              transactions: histRes.ok ? (histRes.data || []) : state.transactions,
              isLoading: false,
              fetchError: null,
            }));
          },
        });
      } catch (err: any) {
        if (err?.message !== 'REQUEST_SUPERSEDED') {
          const hasData = get().schedules.length > 0;
          set({
            isLoading: false,
            error: hasData ? null : 'Failed to load payments',
            fetchError: hasData ? null : 'Could not load your payment data. Please retry.',
          });
        }
      }
    } else {
      try {
        await runLane2({
          screen: 'member-payments',
          key: `member-payments-${filterPlotId || 'all'}`,
          isRefresh: true,
          fn: async (signal) => {
            const [schedRes, histRes] = await Promise.all([
              getPaymentSchedule(filterPlotId, signal),
              getPaymentHistory(filterPlotId, signal),
            ]);

            if (schedRes.error === 'UNAUTHORIZED' || histRes.error === 'UNAUTHORIZED') {
              handleMemberSessionExpired();
              return;
            }

            // On background failure: keep existing data
            if (!schedRes.ok) return;

            set((state) => ({
              schedules: (schedRes.data && schedRes.data.length > 0)
                ? reconcileItems(state.schedules, schedRes.data, (s) => s.plotId)
                : [],
              heldPlots: (schedRes as any)?.heldPlots || [],
              transactions: histRes.ok ? (histRes.data || []) : state.transactions,
              fetchError: null,
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
          fn: async (signal) => {
            const histRes = await getPaymentHistory(filterPlotId, signal);
            if (histRes.error === 'UNAUTHORIZED') {
              handleMemberSessionExpired();
              set({ isLoading: false });
              return;
            }
            set((state) => ({
              transactions: histRes.ok ? (histRes.data || []) : state.transactions,
              isLoading: false,
              fetchError: null,
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
          fn: async (signal) => {
            const histRes = await getPaymentHistory(filterPlotId, signal);
            if (histRes.error === 'UNAUTHORIZED') {
              handleMemberSessionExpired();
              return;
            }
            if (histRes.ok) {
              set((state) => ({
                transactions: histRes.data || [],
              }));
            }
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
          fn: async (signal) => {
            const res = await getMyDocuments(signal);
            if (res.error === 'UNAUTHORIZED') {
              handleMemberSessionExpired();
              set({ isLoading: false });
              return;
            }
            set((state) => ({
              documents: res.ok
                ? reconcileItems(state.documents, res.data || [], (d) => d.plotId)
                : state.documents,
              isLoading: false,
              fetchError: res.ok ? null : state.fetchError,
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
          fn: async (signal) => {
            const res = await getMyDocuments(signal);
            if (res.error === 'UNAUTHORIZED') {
              handleMemberSessionExpired();
              return;
            }
            if (res.ok) {
              set((state) => ({
                documents: reconcileItems(state.documents, res.data || [], (d) => d.plotId),
              }));
            }
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
      fetchError: null,
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
