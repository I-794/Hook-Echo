// Server-only helpers for talking to api.weather.gov.
//
// NWS REQUIRES a descriptive User-Agent identifying the application and a contact;
// requests without one can be rejected with HTTP 403. We centralize that header
// (and a short revalidate window) here so every route handler is consistent.
//
// This module must never be imported into client components.

import "server-only";

const NWS_BASE = "https://api.weather.gov";

const DEFAULT_UA =
  "Hook-Echo Severe Weather Dashboard (cplichterman@proton.me)";

/** The User-Agent sent on every NWS request (env-overridable). */
export function nwsUserAgent(): string {
  return process.env.NWS_USER_AGENT?.trim() || DEFAULT_UA;
}

export interface NwsFetchOptions {
  /** Seconds the Next.js data cache should hold this response. Default 45. */
  revalidate?: number;
  /** Override the Accept header (defaults to GeoJSON). */
  accept?: string;
  /** Abort signal forwarded to fetch. */
  signal?: AbortSignal;
}

export class NwsError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "NwsError";
    this.status = status;
  }
}

/**
 * Fetch a path (or absolute api.weather.gov URL) from NWS with the required
 * headers and caching. Returns parsed JSON. Throws NwsError on non-2xx.
 */
export async function nwsFetch<T = unknown>(
  pathOrUrl: string,
  opts: NwsFetchOptions = {},
): Promise<T> {
  const url = pathOrUrl.startsWith("http")
    ? pathOrUrl
    : `${NWS_BASE}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;

  const doFetch = () =>
    fetch(url, {
      headers: {
        "User-Agent": nwsUserAgent(),
        Accept: opts.accept ?? "application/geo+json",
      },
      signal: opts.signal,
      next: { revalidate: opts.revalidate ?? 45 },
    });

  // The NWS gridpoint forecast endpoint intermittently 5xx's; one quick retry
  // turns most of those transient failures into a success.
  let res = await doFetch();
  if (res.status >= 500) {
    await new Promise((r) => setTimeout(r, 400));
    res = await doFetch();
  }

  if (!res.ok) {
    let detail = "";
    try {
      const body = (await res.json()) as { detail?: string; title?: string };
      detail = body.detail || body.title || "";
    } catch {
      /* ignore non-JSON error bodies */
    }
    throw new NwsError(
      detail || `NWS request failed (${res.status})`,
      res.status,
    );
  }

  return (await res.json()) as T;
}

/** True if a URL is on the api.weather.gov host (used to allowlist proxy targets). */
export function isNwsUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "https:" && u.hostname === "api.weather.gov";
  } catch {
    return false;
  }
}

/** Format a lat,lon pair the way NWS expects (4 decimal places, no spaces). */
export function formatPoint(lat: number, lon: number): string {
  return `${lat.toFixed(4)},${lon.toFixed(4)}`;
}
