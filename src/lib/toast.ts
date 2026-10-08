'use client';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

export type ToastListener = (toast: ToastItem) => void;

const listeners: Set<ToastListener> = new Set();

/**
 * Global toast dispatcher usable in any client component, DAL callback, or form handler.
 * Renders an accessible, beautifully styled popup in the bottom right corner of the screen.
 */
export const toast = {
  show: (type: ToastType, message: string, title?: string, duration = 4500) => {
    if (!message) return;
    const item: ToastItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      title: title || (type === 'success' ? 'Success' : type === 'error' ? 'Notice' : 'Information'),
      message,
      duration,
    };

    listeners.forEach((listener) => {
      try {
        listener(item);
      } catch (err) {
        console.error('Toast listener error:', err);
      }
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pv-toast-event', { detail: item }));
    }
  },

  success: (message: string, title?: string, duration = 4500) => {
    toast.show('success', message, title || 'Success', duration);
  },

  error: (message: string, title?: string, duration = 5000) => {
    toast.show('error', message, title || 'Error', duration);
  },

  info: (message: string, title?: string, duration = 4500) => {
    toast.show('info', message, title || 'Notice', duration);
  },

  warning: (message: string, title?: string, duration = 4500) => {
    toast.show('warning', message, title || 'Warning', duration);
  },

  subscribe: (listener: ToastListener) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
