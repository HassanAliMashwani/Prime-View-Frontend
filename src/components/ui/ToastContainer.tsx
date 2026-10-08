'use client';

import React, { useEffect, useState, useRef } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { toast, ToastItem } from '@/lib/toast';

interface ActiveToast extends ToastItem {
  createdAt: number;
  remaining: number;
  paused: boolean;
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ActiveToast[]>([]);
  const toastsRef = useRef<ActiveToast[]>([]);
  toastsRef.current = toasts;

  useEffect(() => {
    const handleNewToast = (item: ToastItem) => {
      const activeItem: ActiveToast = {
        ...item,
        createdAt: Date.now(),
        remaining: item.duration || 4500,
        paused: false,
      };

      setToasts((prev) => {
        // Limit max concurrent toasts to 5, deduplicating identical consecutive messages
        const filtered = prev.filter(
          (t) => !(t.message === item.message && Date.now() - t.createdAt < 2000),
        );
        return [activeItem, ...filtered].slice(0, 5);
      });
    };

    // Subscribe to toast store
    const unsubscribe = toast.subscribe(handleNewToast);

    // Also listen to window custom event if dispatched elsewhere
    const handleWindowEvent = (e: Event) => {
      const customEvent = e as CustomEvent<ToastItem>;
      if (customEvent.detail) {
        handleNewToast(customEvent.detail);
      }
    };
    window.addEventListener('pv-toast-event', handleWindowEvent);

    return () => {
      unsubscribe();
      window.removeEventListener('pv-toast-event', handleWindowEvent);
    };
  }, []);

  // Interval timer for auto-dismissing toasts
  useEffect(() => {
    if (toasts.length === 0) return;

    const interval = setInterval(() => {
      setToasts((prev) =>
        prev
          .map((t) => {
            if (t.paused) return t;
            return { ...t, remaining: t.remaining - 100 };
          })
          .filter((t) => t.remaining > 0),
      );
    }, 100);

    return () => clearInterval(interval);
  }, [toasts.length]);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const setPaused = (id: string, paused: boolean) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, paused } : t)),
    );
  };

  if (toasts.length === 0) return null;

  return (
    <div
      role="region"
      aria-live="polite"
      aria-label="Notifications"
      className="fixed bottom-5 right-5 left-5 sm:left-auto z-[999999] pointer-events-none flex flex-col-reverse gap-3 max-w-md w-full"
    >
      {toasts.map((item) => {
        const isError = item.type === 'error';
        const isSuccess = item.type === 'success';
        const isWarning = item.type === 'warning';

        const totalDuration = item.duration || 4500;
        const progressPercent = Math.max(0, Math.min(100, (item.remaining / totalDuration) * 100));

        return (
          <div
            key={item.id}
            onMouseEnter={() => setPaused(item.id, true)}
            onMouseLeave={() => setPaused(item.id, false)}
            className={`pointer-events-auto rounded-2xl p-4 shadow-2xl transition-all duration-300 transform translate-y-0 opacity-100 flex flex-col gap-2 relative overflow-hidden backdrop-blur-xs border-2 ${
              isError
                ? 'bg-white border-rose-500 shadow-rose-950/20 text-slate-900 ring-4 ring-rose-500/10'
                : isSuccess
                ? 'bg-white border-emerald-500 shadow-emerald-950/20 text-slate-900 ring-4 ring-emerald-500/10'
                : isWarning
                ? 'bg-white border-amber-500 shadow-amber-950/20 text-slate-900 ring-4 ring-amber-500/10'
                : 'bg-white border-slate-700 shadow-slate-950/20 text-slate-900 ring-4 ring-slate-500/10'
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Type Icon */}
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                  isError
                    ? 'bg-rose-100 border-rose-200 text-rose-700'
                    : isSuccess
                    ? 'bg-emerald-100 border-emerald-200 text-emerald-700'
                    : isWarning
                    ? 'bg-amber-100 border-amber-200 text-amber-700'
                    : 'bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                {isError ? (
                  <AlertCircle className="w-5 h-5 stroke-[2.2]" />
                ) : isSuccess ? (
                  <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
                ) : isWarning ? (
                  <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
                ) : (
                  <Info className="w-5 h-5 stroke-[2.2]" />
                )}
              </div>

              {/* Message Content */}
              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span
                    className={`text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-full ${
                      isError
                        ? 'bg-rose-100 text-rose-800'
                        : isSuccess
                        ? 'bg-emerald-100 text-emerald-800'
                        : isWarning
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {item.title || (isError ? 'Error Notice' : isSuccess ? 'Success' : 'Notice')}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Just now</span>
                </div>
                <p className="text-xs font-semibold text-slate-900 leading-snug break-words">
                  {item.message}
                </p>
              </div>

              {/* Dismiss Button */}
              <button
                type="button"
                onClick={() => removeToast(item.id)}
                aria-label="Dismiss notification"
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Countdown Progress Bar */}
            <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden mt-1">
              <div
                className={`h-full transition-all duration-100 ease-linear ${
                  isError
                    ? 'bg-rose-500'
                    : isSuccess
                    ? 'bg-emerald-500'
                    : isWarning
                    ? 'bg-amber-500'
                    : 'bg-slate-600'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
