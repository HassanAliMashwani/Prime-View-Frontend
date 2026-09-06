import { Block, Customer, Plot, Booking, PaymentRecord, SocietyDocument, AuditEntry, AdminUser, Reservation } from './types';
import { initialBlocks, initialCustomers, initialPlots, initialBookings, initialPayments, initialDocuments, initialAdminUsers, initialReservations } from './seed';

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
    | 'RESERVATION_UPDATED';
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
  public auditLog: AuditEntry[] = [];

  // In-memory rate limiting map: identifier -> { count, lockedUntil }
  private failedLoginAttempts: Map<string, { count: number; lockedUntil?: number }> = new Map();

  // In-memory lock auto-release timeouts (10 minutes)
  private lockTimeouts: Map<string, NodeJS.Timeout> = new Map();

  private channel: BroadcastChannel | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel('prime-view-sync');
      } catch (e) {
        console.warn('BroadcastChannel initialization failed:', e);
      }
    }
  }

  // Cross-tab broadcast dispatcher
  public broadcast(event: SyncEvent): void {
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

  // Audit Logging
  public addAuditEntry(entry: Omit<AuditEntry, 'id' | 'timestamp'>): void {
    const newEntry: AuditEntry = {
      ...entry,
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    this.auditLog.unshift(newEntry);
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
    this.auditLog = [];
    this.failedLoginAttempts.clear();
    this.lockTimeouts.forEach(t => clearTimeout(t));
    this.lockTimeouts.clear();
  }
}

// Global singleton instance across client modules
export const mockStore = new MockStore();

