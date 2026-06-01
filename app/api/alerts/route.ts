// GET /api/alerts?area=WI   -> active alerts for a state (2-letter code)
// GET /api/alerts?point=42.96,-88.01 -> active alerts covering a point
//
// Proxies api.weather.gov/alerts/active so the browser never calls NWS directly
// and the required User-Agent + caching live server-side. Returns the GeoJSON
// FeatureCollection unchanged. Empty results (features: []) are passed through.

import { NextResponse } from "next/server";
import { nwsFetch, NwsError } from "@/lib/nws";
import type { NwsAlertCollection } from "@/lib/types";

export const dynamic = "force-dynamic"; // route decides caching via nwsFetch revalidate

const STATE_RE = /^[A-Z]{2}$/;
const POINT_RE = /^-?\d{1,3}(\.\d+)?,-?\d{1,3}(\.\d+)?$/;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const area = searchParams.get("area");
  const point = searchParams.get("point");

  let query: string;
  if (area) {
    const code = area.toUpperCase();
    if (!STATE_RE.test(code)) {
      return NextResponse.json(
        { error: "area must be a 2-letter state code" },
        { status: 400 },
      );
    }
    query = `area=${code}`;
  } else if (point) {
    if (!POINT_RE.test(point)) {
      return NextResponse.json(
        { error: "point must be 'lat,lon'" },
        { status: 400 },
      );
    }
    query = `point=${point}`;
  } else {
    return NextResponse.json(
      { error: "provide ?area=STATE or ?point=lat,lon" },
      { status: 400 },
    );
  }

  try {
    const data = await nwsFetch<NwsAlertCollection>(
      `/alerts/active?${query}&status=actual&message_type=alert,update`,
      { revalidate: 45 },
    );
    // Normalize: ensure features is always an array.
    const features = Array.isArray(data.features) ? data.features : [];
    return NextResponse.json(
      { type: "FeatureCollection", features, updated: data.updated },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=45, stale-while-revalidate=120",
        },
      },
    );
  } catch (err) {
    const status = err instanceof NwsError ? err.status : 502;
    const message =
      err instanceof Error ? err.message : "Failed to load alerts";
    return NextResponse.json({ error: message }, { status });
  }
}
