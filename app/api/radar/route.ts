// GET /api/radar
//
// Proxies RainViewer's weather-maps.json index and returns ready-to-use radar
// tile URL templates (past frames + short-range nowcast). The PNG tiles
// themselves load directly from RainViewer's CDN (public, keyless, high volume)
// using the templates we return here — only the small JSON index is proxied.

import { NextResponse } from "next/server";
import type { RainViewerResponse, RadarData, RadarFrame } from "@/lib/types";

export const dynamic = "force-dynamic";

const RAINVIEWER_URL =
  "https://api.rainviewer.com/public/weather-maps.json";

// Tile options: 256px tiles, color scheme 4 (Universal Blue/“TWC”-ish dark),
// smoothing on (1), snow detection on (1).
const TILE_SIZE = 256;
const COLOR_SCHEME = 4;
const SMOOTH = 1;
const SNOW = 1;

function buildTemplate(host: string, path: string): string {
  // RainViewer tile URL shape:
  //   {host}{path}/{size}/{z}/{x}/{y}/{color}/{smooth}_{snow}.png
  return `${host}${path}/${TILE_SIZE}/{z}/{x}/{y}/${COLOR_SCHEME}/${SMOOTH}_${SNOW}.png`;
}

export async function GET() {
  try {
    const res = await fetch(RAINVIEWER_URL, {
      headers: { Accept: "application/json" },
      next: { revalidate: 45 },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `RainViewer request failed (${res.status})` },
        { status: 502 },
      );
    }
    const data = (await res.json()) as RainViewerResponse;
    const host = data.host;

    const frames: RadarFrame[] = [
      ...(data.radar?.past ?? []).map((f) => ({
        time: f.time,
        urlTemplate: buildTemplate(host, f.path),
        kind: "past" as const,
      })),
      ...(data.radar?.nowcast ?? []).map((f) => ({
        time: f.time,
        urlTemplate: buildTemplate(host, f.path),
        kind: "nowcast" as const,
      })),
    ];

    const body: RadarData = { generated: data.generated, frames };
    return NextResponse.json(body, {
      headers: {
        "Cache-Control": "public, s-maxage=45, stale-while-revalidate=120",
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load radar";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
