// Alert styling + ranking logic shared by the map and the sidebar.
// Pure functions, safe to import on client or server.

import type { NwsAlertFeature, AlertSeverity } from "./types";

export interface EventStyle {
  /** Fill/line color (hex). */
  color: string;
  /** Higher renders on top and sorts first. */
  priority: number;
  /** Most prominent events get a thicker outline + glow on the map. */
  emphatic?: boolean;
}

// Color-coded by event type. Tornado + Severe Thunderstorm warnings are the most
// prominent. Falls back by keyword, then to a neutral color.
const EVENT_STYLES: Record<string, EventStyle> = {
  "Tornado Warning": { color: "#ff2e63", priority: 100, emphatic: true },
  "Tornado Emergency": { color: "#ff0044", priority: 110, emphatic: true },
  "Flash Flood Emergency": { color: "#ff3b3b", priority: 95, emphatic: true },
  "Severe Thunderstorm Warning": { color: "#ff7b29", priority: 90, emphatic: true },
  "Extreme Wind Warning": { color: "#ff1493", priority: 92, emphatic: true },
  "Flash Flood Warning": { color: "#22c55e", priority: 80 },
  "Flood Warning": { color: "#16a34a", priority: 60 },
  "Tornado Watch": { color: "#ffd23f", priority: 70 },
  "Severe Thunderstorm Watch": { color: "#facc15", priority: 65 },
  "Winter Storm Warning": { color: "#818cf8", priority: 55 },
  "Ice Storm Warning": { color: "#a78bfa", priority: 56 },
  "Blizzard Warning": { color: "#c4b5fd", priority: 58 },
  "Winter Weather Advisory": { color: "#7aa2ff", priority: 30 },
  "High Wind Warning": { color: "#fb923c", priority: 50 },
  "Wind Advisory": { color: "#fdba74", priority: 25 },
  "Flood Advisory": { color: "#34d399", priority: 28 },
  "Excessive Heat Warning": { color: "#f97316", priority: 52 },
  "Heat Advisory": { color: "#fb923c", priority: 26 },
  "Special Weather Statement": { color: "#94a3b8", priority: 15 },
};

const KEYWORD_FALLBACKS: Array<[RegExp, EventStyle]> = [
  [/tornado/i, { color: "#ff2e63", priority: 88, emphatic: true }],
  [/(severe thunderstorm|extreme wind)/i, { color: "#ff7b29", priority: 84, emphatic: true }],
  [/flash flood/i, { color: "#22c55e", priority: 78 }],
  [/flood/i, { color: "#16a34a", priority: 58 }],
  [/(winter|snow|ice|blizzard|freeze|frost)/i, { color: "#7aa2ff", priority: 40 }],
  [/(heat|fire|red flag)/i, { color: "#f97316", priority: 42 }],
  [/wind/i, { color: "#fb923c", priority: 35 }],
  [/(watch)/i, { color: "#ffd23f", priority: 45 }],
  [/(warning)/i, { color: "#ff7b29", priority: 48 }],
];

const NEUTRAL: EventStyle = { color: "#9aa6b2", priority: 10 };

export function styleForEvent(event: string): EventStyle {
  if (EVENT_STYLES[event]) return EVENT_STYLES[event];
  for (const [re, style] of KEYWORD_FALLBACKS) {
    if (re.test(event)) return style;
  }
  return NEUTRAL;
}

const SEVERITY_RANK: Record<AlertSeverity, number> = {
  Extreme: 4,
  Severe: 3,
  Moderate: 2,
  Minor: 1,
  Unknown: 0,
};

/**
 * Sort key for an alert. Sorts by event priority first (so Tornado Warnings lead),
 * then by NWS severity, then by soonest expiry. Returns a comparable tuple via a
 * single numeric score plus expiry tiebreak handled in the comparator.
 */
export function alertScore(feature: NwsAlertFeature): number {
  const { event, severity } = feature.properties;
  const evPriority = styleForEvent(event).priority;
  const sev = SEVERITY_RANK[severity] ?? 0;
  return evPriority * 10 + sev;
}

/** Comparator: most severe / highest priority first; soonest expiry breaks ties. */
export function compareAlerts(a: NwsAlertFeature, b: NwsAlertFeature): number {
  const diff = alertScore(b) - alertScore(a);
  if (diff !== 0) return diff;
  const ea = Date.parse(a.properties.expires) || Infinity;
  const eb = Date.parse(b.properties.expires) || Infinity;
  return ea - eb;
}

/** Stable, de-duplicated, severity-sorted list of features. */
export function sortAlerts(features: NwsAlertFeature[]): NwsAlertFeature[] {
  const seen = new Set<string>();
  const unique = features.filter((f) => {
    const id = f.properties.id;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
  return unique.sort(compareAlerts);
}

/** A short human label for time-until-expiry, e.g. "expires in 42m". */
export function expiryLabel(expires: string, now = Date.now()): string {
  const t = Date.parse(expires);
  if (!Number.isFinite(t)) return "";
  const ms = t - now;
  if (ms <= 0) return "expired";
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `expires in ${mins}m`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  if (hrs < 24) return `expires in ${hrs}h${rem ? ` ${rem}m` : ""}`;
  const days = Math.floor(hrs / 24);
  return `expires in ${days}d`;
}

/** True when the alert is an actively-dangerous warning (used for notifications). */
export function isWarning(event: string): boolean {
  return /warning|emergency/i.test(event);
}

/** Bounding box [west, south, east, north] of a feature's geometry, or null. */
export function featureBounds(
  feature: NwsAlertFeature,
): [number, number, number, number] | null {
  const geom = feature.geometry;
  if (!geom || geom.type === "GeometryCollection") return null;

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  const visit = (coords: unknown): void => {
    if (typeof (coords as number[])[0] === "number") {
      const [x, y] = coords as number[];
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
      return;
    }
    for (const c of coords as unknown[]) visit(c);
  };

  if ("coordinates" in geom) {
    visit(geom.coordinates);
  }
  if (!Number.isFinite(minX)) return null;
  return [minX, minY, maxX, maxY];
}
