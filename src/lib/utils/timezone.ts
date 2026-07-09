export function formatTimeInTimezone(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

/** Today's calendar date (YYYY-MM-DD) as seen in the given IANA timezone. */
export function todayInTimezone(timezone: string, now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Current wall-clock "HH:MM" as seen in the given IANA timezone. */
export function currentTimeInTimezone(timezone: string, now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(now);
}

function timezoneOffsetMinutes(instant: Date, timezone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);

  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);

  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );

  return (asUtc - instant.getTime()) / 60000;
}

/**
 * Converts a local wall-clock date + time in the given IANA timezone to the
 * corresponding UTC instant. Handles DST correctly by resolving the
 * timezone's actual offset for that date rather than assuming a fixed one.
 */
export function zonedTimeToUtc(dateStr: string, timeStr: string, timezone: string): Date {
  const naive = new Date(`${dateStr}T${timeStr}:00.000Z`);
  const offsetMinutes = timezoneOffsetMinutes(naive, timezone);
  return new Date(naive.getTime() - offsetMinutes * 60000);
}

/** Day of week (0=Sun..6=Sat) for a plain YYYY-MM-DD calendar date. */
export function dayOfWeekForDate(dateStr: string): number {
  return new Date(`${dateStr}T00:00:00.000Z`).getUTCDay();
}

/** Whole-day difference between two YYYY-MM-DD calendar dates (b - a). */
export function daysBetween(dateStrA: string, dateStrB: string): number {
  const a = new Date(`${dateStrA}T00:00:00.000Z`).getTime();
  const b = new Date(`${dateStrB}T00:00:00.000Z`).getTime();
  return Math.round((b - a) / (24 * 60 * 60 * 1000));
}
