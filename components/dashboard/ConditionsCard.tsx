"use client";

// Current conditions for the saved point, from the NWS forecast endpoint (the
// nearest period). Compact; collapses to a single row on small screens.

import { Wind, Drop, MapPin } from "@phosphor-icons/react";
import type { PointInfo, ForecastResponse } from "@/lib/types";

export function ConditionsCard({
  pointInfo,
  forecast,
}: {
  pointInfo: PointInfo | null;
  forecast: ForecastResponse | null;
}) {
  const period = forecast?.periods?.[0];
  if (!pointInfo && !period) return null;

  const place = pointInfo
    ? [pointInfo.city, pointInfo.state].filter(Boolean).join(", ")
    : "";

  return (
    <div className="pointer-events-auto rounded-2xl border border-white/10 bg-ink-900/90 px-4 py-3 shadow-2xl backdrop-blur">
      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        <MapPin size={13} weight="fill" className="text-storm-400" />
        <span className="truncate">{place || "Saved location"}</span>
        {pointInfo?.cwa && (
          <span className="ml-auto rounded bg-ink-700 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
            {pointInfo.cwa}
          </span>
        )}
      </div>

      {period ? (
        <div className="mt-2 flex items-center gap-3">
          <div className="text-3xl font-semibold tabular-nums text-slate-50">
            {period.temperature}
            <span className="text-base text-slate-400">
              °{period.temperatureUnit}
            </span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm text-slate-200">
              {period.shortForecast}
            </p>
            <p className="mt-0.5 flex items-center gap-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <Wind size={12} /> {period.windDirection} {period.windSpeed}
              </span>
              {typeof period.probabilityOfPrecipitation?.value === "number" && (
                <span className="inline-flex items-center gap-1">
                  <Drop size={12} />
                  {period.probabilityOfPrecipitation.value}%
                </span>
              )}
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-2 text-sm text-slate-500">Conditions unavailable</p>
      )}
    </div>
  );
}
