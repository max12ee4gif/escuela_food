import { TIMEZONE } from "./types";
import type { Phase } from "./types";

export type Clock = {
  ymd: string;
  hour: number;
  minute: number;
  weekday: number;
  tz: string;
};

const WEEKDAY_SUN = 0;

function part(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
): string {
  return parts.find((p) => p.type === type)?.value ?? "";
}

export function readClock(date = new Date(), tz = TIMEZONE): Clock {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  }).formatToParts(date);

  const y = part(parts, "year");
  const m = part(parts, "month");
  const d = part(parts, "day");
  const weekdayName = part(parts, "weekday");
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return {
    ymd: `${y}-${m}-${d}`,
    hour: Number(part(parts, "hour")),
    minute: Number(part(parts, "minute")),
    weekday: map[weekdayName] ?? WEEKDAY_SUN,
    tz,
  };
}

export function addDaysYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const utc = Date.UTC(y, m - 1, d + days);
  const dt = new Date(utc);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function weekdayIndex(ymd: string): number {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function isWeekend(ymd: string): boolean {
  const w = weekdayIndex(ymd);
  return w === 0 || w === 6;
}

export function nextWeekday(fromYmd: string): string {
  let cursor = fromYmd;
  for (let i = 0; i < 8; i += 1) {
    if (!isWeekend(cursor)) return cursor;
    cursor = addDaysYmd(cursor, 1);
  }
  return fromYmd;
}

/** Next school-day to sell: today if weekday, else next Monday. */
export function nextServiceDate(clock: Clock): string {
  return nextWeekday(clock.ymd);
}

export function weekdayLabel(ymd: string, locale = "es-MX"): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    timeZone: "UTC",
  }).format(dt);
}

export function dateLabel(ymd: string, locale = "es-MX"): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(dt);
}

export function computePhase(opts: {
  clock: Clock;
  serviceDate: string | null;
  status: string | null;
  cutoffHour: number;
  leftoverEndHour: number;
  override?: "early" | "leftover" | null;
}): Phase {
  if (!opts.serviceDate) return "empty";
  if (opts.status === "cancelled") return "cancelled";
  if (opts.status === "closed") return "ended";

  if (opts.override === "early" || opts.override === "leftover") {
    return opts.override;
  }

  if (opts.clock.ymd < opts.serviceDate) return "early";
  if (opts.clock.ymd > opts.serviceDate) return "ended";

  if (opts.clock.hour < opts.cutoffHour) return "early";
  if (opts.clock.hour >= opts.leftoverEndHour) return "ended";
  return "leftover";
}

export function timeLabelFromIso(iso: string, tz = TIMEZONE): string {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
  }).format(dt);
}
