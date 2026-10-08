'use client';

import { useEffect } from 'react';
import { toast } from '@/lib/toast';

export interface AdminToastFeedback {
  type: 'success' | 'error';
  message: string;
}

/**
 * Compatibility wrapper: bridges local admin feedback states directly to the
 * global bottom-right corner popup notification system.
 */
export function AdminActionToast({
  feedback,
  onClose,
}: {
  feedback: AdminToastFeedback | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (feedback) {
      if (feedback.type === 'error') {
        toast.error(feedback.message);
      } else {
        toast.success(feedback.message);
      }
      onClose();
    }
  }, [feedback, onClose]);

  return null;
}
