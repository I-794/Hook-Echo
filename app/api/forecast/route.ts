// GET /api/forecast?url=<api.weather.gov forecast url>
//
// The /api/points response hands the client a forecast URL. Rather than let the
// browser hit NWS directly (it would miss our User-Agent), the client passes the
// URL here and we fetch it. The url MUST be on api.weather.gov — validated to
// prevent this route from being used as an open proxy.

import { NextResponse } from "next/server";
import { nwsFetch, NwsError, isNwsUrl } from "@/lib/nws";
import type { ForecastPeriod, ForecastResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

interface ForecastEnvelope {
  properties: {
    updated: string;
    periods: ForecastPeriod[];
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "missing url" }, { status: 400 });
  }
  if (!isNwsUrl(url)) {
    return NextResponse.json(
      { error: "url must be on api.weather.gov" },
      { status: 400 },
    );
  }

  try {
    const data = await nwsFetch<ForecastEnvelope>(url, { revalidate: 300 });
    const body: ForecastResponse = {
      updated: data.properties.updated,
      periods: data.properties.periods ?? [],
    };
    return NextResponse.json(body, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (err) {
    const status = err instanceof NwsError ? err.status : 502;
    const message =
      err instanceof Error ? err.message : "Failed to load forecast";
    return NextResponse.json({ error: message }, { status });
  }
}
