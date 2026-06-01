"use client";

// Severity-sorted list of alerts in the current viewport. Clicking an item flies
// the map to that polygon and selects it. Handles the zero-alerts case.

import { CheckCircle, CaretRight } from "@phosphor-icons/react";
import { styleForEvent, expiryLabel } from "@/lib/alerts";
import type { NwsAlertFeature } from "@/lib/types";

export function AlertSidebar({
  alerts,
  selectedId,
  onPick,
  lastUpdated,
}: {
  alerts: NwsAlertFeature[];
  selectedId: string | null;
  onPick: (f: NwsAlertFeature) => void;
  lastUpdated: number | null;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">
            Active alerts
          </h2>
          <p className="text-xs text-slate-500">
            {alerts.length} in view
            {lastUpdated
              ? ` · updated ${new Date(lastUpdated).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`
              : ""}
          </p>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
          <CheckCircle size={36} weight="duotone" className="text-warn-flood" />
          <p className="text-sm font-medium text-slate-200">
            No active alerts in view
          </p>
          <p className="max-w-[220px] text-xs text-slate-500">
            Nothing severe is happening here right now. Pan or search elsewhere to
            check another area.
          </p>
        </div>
      ) : (
        <ul className="min-h-0 flex-1 divide-y divide-white/5 overflow-y-auto">
          {alerts.map((f) => {
            const p = f.properties;
            const s = styleForEvent(p.event);
            const active = p.id === selectedId;
            return (
              <li key={p.id}>
                <button
                  onClick={() => onPick(f)}
                  className={`group flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.04] ${active ? "bg-white/[0.06]" : ""}`}
                  style={
                    active
                      ? { boxShadow: `inset 3px 0 0 ${s.color}` }
                      : undefined
                  }
                >
                  <span
                    className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${s.emphatic ? "animate-pulse-ring" : ""}`}
                    style={{ background: s.color }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-100">
                      {p.event}
                    </span>
                    <span className="block truncate text-xs text-slate-400">
                      {p.areaDesc}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-slate-500">
                      {expiryLabel(p.expires)}
                    </span>
                  </span>
                  <CaretRight
                    size={14}
                    className="mt-1 shrink-0 text-slate-600 transition-colors group-hover:text-slate-300"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
