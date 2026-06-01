// GET /api/points/42.96/-88.01
//
// Proxies api.weather.gov/points/{lat},{lon} and returns a normalized PointInfo
// with the forecast URLs, county warning area (CWA), radar station, and the
// relative location (city/state) used in the UI.

import { NextResponse } from "next/server";
import { nwsFetch, NwsError, formatPoint } from "@/lib/nws";
import type { NwsPointMeta, PointInfo } from "@/lib/types";

export const dynamic = "force-dynamic";

interface PointsEnvelope {
  properties: NwsPointMeta;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ lat: string; lon: string }> },
) {
  const { lat, lon } = await context.params;
  const latN = Number(lat);
  const lonN = Number(lon);

  if (
    !Number.isFinite(latN) ||
    !Number.isFinite(lonN) ||
    latN < -90 ||
    latN > 90 ||
    lonN < -180 ||
    lonN > 180
  ) {
    return NextResponse.json(
      { error: "invalid lat/lon" },
      { status: 400 },
    );
  }

  try {
    const data = await nwsFetch<PointsEnvelope>(
      `/points/${formatPoint(latN, lonN)}`,
      { revalidate: 3600 }, // point metadata is stable; cache longer
    );
    const p = data.properties;
    const info: PointInfo = {
      lat: latN,
      lon: lonN,
      cwa: p.gridId,
      radarStation: p.radarStation,
      forecastUrl: p.forecast,
      forecastHourlyUrl: p.forecastHourly,
      observationStationsUrl: p.observationStations,
      city: p.relativeLocation?.properties?.city ?? "",
      state: p.relativeLocation?.properties?.state ?? "",
      timeZone: p.timeZone,
    };
    return NextResponse.json(info, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    const status = err instanceof NwsError ? err.status : 502;
    const message =
      err instanceof Error ? err.message : "Failed to load point metadata";
    return NextResponse.json({ error: message }, { status });
  }
}
