// GET /api/geocode?q=Milwaukee
//
// US location search for the dashboard search box. Uses OpenStreetMap's Nominatim
// (no key, handles city names / "City, ST" / ZIP) restricted to the US. Server-side
// so we can attach a descriptive User-Agent (Nominatim's usage policy requires one)
// and cache results. Returns a small list of { label, lat, lon }.

import { NextResponse } from "next/server";
import { nwsUserAgent } from "@/lib/nws";
import type { GeocodeResult } from "@/lib/types";

export const dynamic = "force-dynamic";

interface NominatimItem {
  lat: string;
  lon: string;
  display_name: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] satisfies GeocodeResult[] });
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("countrycodes", "us");
  url.searchParams.set("limit", "6");
  url.searchParams.set("addressdetails", "0");

  try {
    const res = await fetch(url, {
      headers: {
        // Nominatim requires an identifying UA; reuse the app's contact string.
        "User-Agent": nwsUserAgent(),
        Accept: "application/json",
      },
      next: { revalidate: 86400 }, // place lookups are very stable
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `geocoder failed (${res.status})`, results: [] },
        { status: 502 },
      );
    }
    const items = (await res.json()) as NominatimItem[];
    const results: GeocodeResult[] = items
      .map((it) => ({
        label: it.display_name,
        lat: Number(it.lat),
        lon: Number(it.lon),
      }))
      .filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lon));

    return NextResponse.json(
      { results },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=86400, stale-while-revalidate=604800",
        },
      },
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Geocoding failed";
    return NextResponse.json({ error: message, results: [] }, { status: 502 });
  }
}
