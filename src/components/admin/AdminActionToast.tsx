'use client';

import React from 'react';

export interface AdminToastFeedback {
  type: 'success' | 'error';
  message: string;
}

export function AdminActionToast({
  feedback,
  onClose,
}: {
  feedback: AdminToastFeedback | null;
  onClose: () => void;
}) {
  if (!feedback) return null;
  return (
    <div
      role="status"
      className="fixed bottom-4 right-4 left-4 sm:left-auto z-50 max-w-md rounded-xl shadow-lg border px-4 py-3 text-sm font-medium"
      style={{
        background: feedback.type === 'error' ? '#fff1f2' : '#ecfdf5',
        borderColor: feedback.type === 'error' ? '#fecdd3' : '#a7f3d0',
        color: feedback.type === 'error' ? '#9f1239' : '#065f46',
      }}
    >
      <div className="flex items-start gap-2">
        <p className="flex-1">{feedback.message}</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss"
          className="text-lg leading-none opacity-60 hover:opacity-100 transition-opacity ml-2"
        >
          ×
        </button>
      </div>
    </div>
  );
}
