// GET /api/observation?url=<observationStations url>
//
// Real current conditions: the nearest observation station's latest report.
// (The forecast endpoint returns 12-hour forecast periods, NOT what it is doing
// right now, which is why showing a forecast period as "current" looks wrong.)
//
// The stations URL comes from /api/points and is allowlisted to api.weather.gov.
// Stations sometimes report null temperature, so we walk the first few stations
// until one has a usable observation.

import { NextResponse } from "next/server";
import { nwsFetch, NwsError, isNwsUrl } from "@/lib/nws";
import type { CurrentConditions } from "@/lib/types";

export const dynamic = "force-dynamic";

interface StationsResponse {
  features: Array<{ id: string }>;
}

interface ObservationResponse {
  properties: {
    timestamp: string;
    textDescription: string | null;
    temperature: { value: number | null };
    windSpeed: { value: number | null }; // km/h
    windDirection: { value: number | null }; // degrees
    relativeHumidity: { value: number | null };
  };
}

const COMPASS = [
  "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
  "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
];

function toCompass(deg: number | null): string {
  if (deg === null || !Number.isFinite(deg)) return "";
  return COMPASS[Math.round(deg / 22.5) % 16];
}

const cToF = (c: number) => Math.round((c * 9) / 5 + 32);
const kmhToMph = (k: number) => Math.round(k * 0.621371);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url || !isNwsUrl(url)) {
    return NextResponse.json(
      { error: "url must be an api.weather.gov observationStations URL" },
      { status: 400 },
    );
  }

  try {
    const stations = await nwsFetch<StationsResponse>(url, { revalidate: 3600 });
    const ids = (stations.features ?? [])
      .map((f) => f.id)
      .filter(Boolean)
      .slice(0, 4);

    if (!ids.length) {
      return NextResponse.json(
        { error: "no observation stations near this point" },
        { status: 404 },
      );
    }

    // Try stations in order until one has a non-null temperature.
    for (const stationUrl of ids) {
      try {
        const obs = await nwsFetch<ObservationResponse>(
          `${stationUrl}/observations/latest`,
          { revalidate: 300 },
        );
        const p = obs.properties;
        if (p.temperature?.value === null || p.temperature?.value === undefined) {
          continue;
        }
        const body: CurrentConditions = {
          tempF: cToF(p.temperature.value),
          conditions: p.textDescription || "",
          windMph:
            p.windSpeed?.value != null ? kmhToMph(p.windSpeed.value) : null,
          windDir: toCompass(p.windDirection?.value ?? null),
          humidity:
            p.relativeHumidity?.value != null
              ? Math.round(p.relativeHumidity.value)
              : null,
          observedAt: p.timestamp,
          station: stationUrl.split("/").pop() ?? "",
        };
        return NextResponse.json(body, {
          headers: {
            "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
          },
        });
      } catch {
        continue; // try the next station
      }
    }

    return NextResponse.json(
      { error: "no recent observation available" },
      { status: 404 },
    );
  } catch (err) {
    const status = err instanceof NwsError ? err.status : 502;
    const message =
      err instanceof Error ? err.message : "Failed to load conditions";
    return NextResponse.json({ error: message }, { status });
  }
}
