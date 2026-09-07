import { Block, Customer, Plot, Booking, PaymentRecord, SocietyDocument, AuditEntry, AdminUser, Reservation, ContentBlock } from './types';
import { initialBlocks, initialCustomers, initialPlots, initialBookings, initialPayments, initialDocuments, initialAdminUsers, initialReservations, initialContentBlocks } from './seed';

export interface SyncEvent {
  type:
    | 'PAYMENT_RECORD_UPDATED'
    | 'PLOT_STATUS_CHANGED'
    | 'BOOKING_CREATED'
    | 'PROFILE_UPDATED'
    | 'PLOT_LOCKED'
    | 'PLOT_UNLOCKED'
    | 'PLOT_RESERVED'
    | 'PLOT_BOOKED'
    | 'RESERVATION_UPDATED'
    | 'SUB_ADMIN_CREATED'
    | 'SUB_ADMIN_UPDATED'
    | 'CONTENT_LOCKED'
    | 'CONTENT_UNLOCKED'
    | 'CONTENT_SAVED'
    | 'CUSTOMER_CREATED';
  timestamp: string;
  [key: string]: unknown;
}

class MockStore {
  public blocks: Block[] = [...initialBlocks];
  public customers: Customer[] = [...initialCustomers];
  public plots: Plot[] = [...initialPlots];
  public bookings: Booking[] = [...initialBookings];
  public payments: PaymentRecord[] = [...initialPayments];
  public documents: SocietyDocument[] = [...initialDocuments];
  public adminUsers: AdminUser[] = [...initialAdminUsers];
  public reservations: Reservation[] = [...initialReservations];
  public contentBlocks: ContentBlock[] = [...initialContentBlocks];
  public auditLog: AuditEntry[] = [];

  // In-memory rate limiting map: identifier -> { count, lockedUntil }
  private failedLoginAttempts: Map<string, { count: number; lockedUntil?: number }> = new Map();

  // In-memory lock auto-release timeouts (10 minutes for plots, 30 minutes for content)
  private lockTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private contentLockTimeouts: Map<string, NodeJS.Timeout> = new Map();

  private channel: BroadcastChannel | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadFromStorage();

      if ('BroadcastChannel' in window) {
        try {
          this.channel = new BroadcastChannel('prime-view-sync');
          this.channel.onmessage = () => {
            this.loadFromStorage();
          };
        } catch (e) {
          console.warn('BroadcastChannel initialization failed:', e);
        }
      }

      window.addEventListener('storage', (e) => {
        if (e.key === 'pv_mock_store') {
          this.loadFromStorage();
        }
      });
    }
  }

  public saveToStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const state = {
        plots: this.plots,
        reservations: this.reservations,
        bookings: this.bookings,
        payments: this.payments,
        customers: this.customers,
        adminUsers: this.adminUsers,
        contentBlocks: this.contentBlocks,
        auditLog: this.auditLog,
      };
      localStorage.setItem('pv_mock_store', JSON.stringify(state));
    } catch (e) {
      console.warn('Failed saving mockStore to localStorage:', e);
    }
  }

  public loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('pv_mock_store');
      if (raw) {
        const state = JSON.parse(raw);
        if (state.plots && state.plots.length > 0) this.plots = state.plots;
        if (state.reservations && state.reservations.length > 0) {
          this.reservations = state.reservations;
        } else {
          this.reservations = [...initialReservations];
        }
        if (state.bookings && state.bookings.length > 0) this.bookings = state.bookings;
        if (state.payments && state.payments.length > 0) this.payments = state.payments;
        if (state.customers && state.customers.length > 0) this.customers = state.customers;
        if (state.adminUsers && state.adminUsers.length > 0) this.adminUsers = state.adminUsers;
        if (state.contentBlocks && state.contentBlocks.length > 0) this.contentBlocks = state.contentBlocks;
        if (state.auditLog) this.auditLog = state.auditLog;
      } else {
        this.saveToStorage();
      }
    } catch (e) {
      console.warn('Failed loading mockStore from localStorage:', e);
    }
  }

  // Cross-tab broadcast dispatcher
  public broadcast(event: SyncEvent): void {
    this.saveToStorage();
    if (this.channel) {
      try {
        this.channel.postMessage(event);
      } catch (e) {
        console.warn('Failed to broadcast event:', e);
      }
    }
  }

  public getBroadcastChannel(): BroadcastChannel | null {
    return this.channel;
  }

  public onBroadcast(listener: (event: SyncEvent) => void): () => void {
    if (!this.channel) return () => {};
    const handler = (e: MessageEvent) => {
      if (e.data) {
        listener(e.data as SyncEvent);
      }
    };
    this.channel.addEventListener('message', handler);
    return () => {
      this.channel?.removeEventListener('message', handler);
    };
  }

  // Lock Auto-Release Management (10 simulated minutes)
  public scheduleLockTimeout(plotId: string, durationMs: number = 10 * 60 * 1000): void {
    this.clearLockTimeout(plotId);
    const timeout = setTimeout(() => {
      const plot = this.plots.find(p => p.id === plotId);
      if (plot && plot.lockedBy) {
        plot.lockedBy = undefined;
        plot.lockedByName = undefined;
        plot.lockedAt = undefined;
        this.broadcast({
          type: 'PLOT_UNLOCKED',
          timestamp: new Date().toISOString(),
          plotId,
          reason: 'LOCK_EXPIRED',
        });
      }
      this.lockTimeouts.delete(plotId);
    }, durationMs);

    if (typeof timeout.unref === 'function') {
      timeout.unref();
    }
    this.lockTimeouts.set(plotId, timeout);
  }

  public clearLockTimeout(plotId: string): void {
    const timeout = this.lockTimeouts.get(plotId);
    if (timeout) {
      clearTimeout(timeout);
      this.lockTimeouts.delete(plotId);
    }
  }

  public cleanExpiredLocks(): void {
    this.loadFromStorage();
    const now = Date.now();
    const lockExpiryMs = 10 * 60 * 1000;
    this.plots.forEach(plot => {
      if (plot.lockedBy && plot.lockedAt && now - plot.lockedAt > lockExpiryMs) {
        plot.lockedBy = undefined;
        plot.lockedByName = undefined;
        plot.lockedAt = undefined;
        this.clearLockTimeout(plot.id);
      }
    });
  }

  // Rate Limiting implementation (Exception 5.3)
  public checkRateLimit(identifier: string): { allowed: boolean; remainingLockoutSeconds?: number } {
    const key = identifier.trim().toLowerCase();
    const record = this.failedLoginAttempts.get(key);
    if (!record) return { allowed: true };

    const now = Date.now();
    if (record.lockedUntil && record.lockedUntil > now) {
      const remaining = Math.ceil((record.lockedUntil - now) / 1000);
      return { allowed: false, remainingLockoutSeconds: remaining };
    }

    if (record.lockedUntil && record.lockedUntil <= now) {
      // Lock expired
      this.failedLoginAttempts.delete(key);
      return { allowed: true };
    }

    return { allowed: true };
  }

  public recordFailedLogin(identifier: string): { locked: boolean; remainingLockoutSeconds?: number } {
    const key = identifier.trim().toLowerCase();
    const record = this.failedLoginAttempts.get(key) || { count: 0 };
    record.count += 1;

    // After 5 attempts, lock for 5 minutes (300 seconds)
    if (record.count >= 5) {
      const lockDurationMs = 5 * 60 * 1000;
      record.lockedUntil = Date.now() + lockDurationMs;
      this.failedLoginAttempts.set(key, record);
      return { locked: true, remainingLockoutSeconds: 300 };
    }

    this.failedLoginAttempts.set(key, record);
    return { locked: false };
  }

  public resetFailedLogins(identifier: string): void {
    const key = identifier.trim().toLowerCase();
    this.failedLoginAttempts.delete(key);
  }

  // Content Lock Auto-Release Management (30 simulated minutes)
  public scheduleContentLockTimeout(blockId: string, durationMs: number = 30 * 60 * 1000): void {
    this.clearContentLockTimeout(blockId);
    const timeout = setTimeout(() => {
      const block = this.contentBlocks.find(b => b.id === blockId);
      if (block && block.lockedBy) {
        block.lockedBy = undefined;
        block.lockedByName = undefined;
        block.lockedAt = undefined;
        this.broadcast({
          type: 'CONTENT_UNLOCKED',
          timestamp: new Date().toISOString(),
          contentBlockId: blockId,
          reason: 'LOCK_EXPIRED',
        });
      }
      this.contentLockTimeouts.delete(blockId);
    }, durationMs);

    if (typeof timeout.unref === 'function') {
      timeout.unref();
    }
    this.contentLockTimeouts.set(blockId, timeout);
  }

  public clearContentLockTimeout(blockId: string): void {
    const timeout = this.contentLockTimeouts.get(blockId);
    if (timeout) {
      clearTimeout(timeout);
      this.contentLockTimeouts.delete(blockId);
    }
  }

  public cleanExpiredContentLocks(): void {
    this.loadFromStorage();
    const now = Date.now();
    const lockExpiryMs = 30 * 60 * 1000;
    this.contentBlocks.forEach(block => {
      if (block.lockedBy && block.lockedAt && now - block.lockedAt > lockExpiryMs) {
        block.lockedBy = undefined;
        block.lockedByName = undefined;
        block.lockedAt = undefined;
        this.clearContentLockTimeout(block.id);
      }
    });
  }

  // Audit Logging
  public addAuditEntry(entry: Omit<AuditEntry, 'id' | 'timestamp'>): void {
    const newEntry: AuditEntry = {
      ...entry,
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    this.auditLog.unshift(newEntry);
    this.saveToStorage();
  }

  // Reset helper
  public resetStore(): void {
    this.blocks = [...initialBlocks];
    this.customers = [...initialCustomers];
    this.plots = [...initialPlots];
    this.bookings = [...initialBookings];
    this.payments = [...initialPayments];
    this.documents = [...initialDocuments];
    this.adminUsers = [...initialAdminUsers];
    this.reservations = [...initialReservations];
    this.contentBlocks = [...initialContentBlocks];
    this.auditLog = [];
    this.failedLoginAttempts.clear();
    this.lockTimeouts.forEach(t => clearTimeout(t));
    this.lockTimeouts.clear();
    this.contentLockTimeouts.forEach(t => clearTimeout(t));
    this.contentLockTimeouts.clear();
  }
}

// Global singleton instance across client modules
export const mockStore = new MockStore();

