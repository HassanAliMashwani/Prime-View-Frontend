/**
 * Formats remaining hold duration for a reservation based on validUntil timestamp.
 */
export function formatRemainingHoldTime(validUntil: string | Date | undefined | null): {
  text: string;
  isExpired: boolean;
  isUrgent: boolean;
} {
  if (!validUntil) {
    return { text: 'Unknown', isExpired: false, isUrgent: false };
  }

  const expiryTime = new Date(validUntil).getTime();
  if (isNaN(expiryTime)) {
    return { text: 'Invalid Date', isExpired: false, isUrgent: false };
  }

  const now = Date.now();
  const diffMs = expiryTime - now;

  if (diffMs <= 0) {
    return { text: 'Expired', isExpired: true, isUrgent: true };
  }

  const totalMinutes = Math.floor(diffMs / (60 * 1000));
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  const isUrgent = totalHours < 4;

  if (days > 0) {
    return {
      text: `${days}d ${hours}h left`,
      isExpired: false,
      isUrgent,
    };
  }

  if (hours > 0) {
    return {
      text: `${hours}h ${remainingMinutes}m left`,
      isExpired: false,
      isUrgent,
    };
  }

  return {
    text: `${totalMinutes}m left`,
    isExpired: false,
    isUrgent: true,
  };
}
