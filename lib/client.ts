// Thin client-side fetchers for our own route handlers. The browser never calls
// api.weather.gov or RainViewer directly; it goes through /api/* so the required
// headers and caching stay server-side.

import type {
  NwsAlertCollection,
  NwsAlertFeature,
  PointInfo,
  ForecastResponse,
  RadarData,
  GeocodeResult,
  CurrentConditions,
} from "./types";

async function getJSON<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) msg = body.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  return (await res.json()) as T;
}

export async function fetchStateAlerts(
  state: string,
  signal?: AbortSignal,
): Promise<NwsAlertFeature[]> {
  const data = await getJSON<NwsAlertCollection>(
    `/api/alerts?area=${encodeURIComponent(state)}`,
    signal,
  );
  return data.features ?? [];
}

export async function fetchPointAlerts(
  lat: number,
  lon: number,
  signal?: AbortSignal,
): Promise<NwsAlertFeature[]> {
  const data = await getJSON<NwsAlertCollection>(
    `/api/alerts?point=${lat.toFixed(4)},${lon.toFixed(4)}`,
    signal,
  );
  return data.features ?? [];
}

export async function fetchPointInfo(
  lat: number,
  lon: number,
  signal?: AbortSignal,
): Promise<PointInfo> {
  return getJSON<PointInfo>(
    `/api/points/${lat.toFixed(4)}/${lon.toFixed(4)}`,
    signal,
  );
}

export async function fetchForecast(
  url: string,
  signal?: AbortSignal,
): Promise<ForecastResponse> {
  return getJSON<ForecastResponse>(
    `/api/forecast?url=${encodeURIComponent(url)}`,
    signal,
  );
}

export async function fetchObservation(
  observationStationsUrl: string,
  signal?: AbortSignal,
): Promise<CurrentConditions> {
  return getJSON<CurrentConditions>(
    `/api/observation?url=${encodeURIComponent(observationStationsUrl)}`,
    signal,
  );
}

export async function fetchRadar(signal?: AbortSignal): Promise<RadarData> {
  return getJSON<RadarData>("/api/radar", signal);
}

export async function geocode(
  q: string,
  signal?: AbortSignal,
): Promise<GeocodeResult[]> {
  const data = await getJSON<{ results: GeocodeResult[] }>(
    `/api/geocode?q=${encodeURIComponent(q)}`,
    signal,
  );
  return data.results ?? [];
}
