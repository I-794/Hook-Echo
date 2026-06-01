"use client";

// Current conditions for the saved point. The big number is the LIVE observed
// temperature from the nearest station (not a forecast). A secondary line shows
// the nearest forecast period so you get "now" and "next" at a glance.

import { Wind, Drop, MapPin, ThermometerSimple } from "@phosphor-icons/react";
import type { PointInfo, ForecastResponse, CurrentConditions } from "@/lib/types";

function observedAgo(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  const mins = Math.round((Date.now() - t) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  return `${h}h ago`;
}

export function ConditionsCard({
  pointInfo,
  forecast,
  conditions,
}: {
  pointInfo: PointInfo | null;
  forecast: ForecastResponse | null;
  conditions: CurrentConditions | null;
}) {
  const period = forecast?.periods?.[0];
  if (!pointInfo && !conditions && !period) return null;

  const place = pointInfo
    ? [pointInfo.city, pointInfo.state].filter(Boolean).join(", ")
    : "";

  const hasObs = conditions && conditions.tempF !== null;

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

      {hasObs ? (
        <>
          <div className="mt-2 flex items-center gap-3">
            <div className="text-3xl font-semibold tabular-nums text-slate-50">
              {conditions!.tempF}
              <span className="text-base text-slate-400">°F</span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm text-slate-200">
                {conditions!.conditions || "Current conditions"}
              </p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
                {conditions!.windMph !== null && (
                  <span className="inline-flex items-center gap-1">
                    <Wind size={12} />
                    {conditions!.windMph === 0
                      ? "Calm"
                      : `${conditions!.windDir} ${conditions!.windMph} mph`}
                  </span>
                )}
                {conditions!.humidity !== null && (
                  <span className="inline-flex items-center gap-1">
                    <Drop size={12} />
                    {conditions!.humidity}%
                  </span>
                )}
              </p>
            </div>
          </div>
          <p className="mt-2 flex items-center gap-1.5 border-t border-white/5 pt-2 text-[11px] text-slate-500">
            <ThermometerSimple size={12} className="text-slate-600" />
            <span className="truncate">
              {period
                ? `${period.name}: ${period.shortForecast}`
                : `Observed ${observedAgo(conditions!.observedAt)}`}
            </span>
          </p>
        </>
      ) : period ? (
        // Observation unavailable: fall back to the forecast period.
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
            <p className="mt-0.5 text-xs text-slate-500">{period.name} forecast</p>
          </div>
        </div>
      ) : (
        <p className="mt-2 text-sm text-slate-500">Conditions unavailable</p>
      )}
    </div>
  );
}
