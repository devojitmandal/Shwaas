/**
 * Formats an ISO timestamp string into a concise 12-hour clock label (e.g. "1 PM").
 * Falls back safely to HH:MM slice when Date parsing fails.
 */
export function formatHourLabel(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return isoString.split('T')[1]?.substring(0, 5) || isoString;
  }
  return date.toLocaleTimeString([], { hour: 'numeric', hour12: true });
}

/**
 * Formats an ISO timestamp string into a localized HH:MM clock label.
 */
export function formatClockTime(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return isoString.split('T')[1]?.substring(0, 5) || isoString;
  }
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Formats a [start, end] ISO timestamp pair into a display range (e.g. "1 PM – 3 PM").
 */
export function formatTimeRange(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return `${start.substring(11, 16)} – ${end.substring(11, 16)}`;
  }
  const s = startDate.toLocaleTimeString([], { hour: 'numeric', hour12: true });
  const e = endDate.toLocaleTimeString([], { hour: 'numeric', hour12: true });
  return `${s} – ${e}`;
}
