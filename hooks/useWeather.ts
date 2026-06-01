"use client";

// Central data hook for the dashboard. Owns alert state (accumulated per state as
// the user pans), the saved point (for conditions + notifications), radar frames,
// 60s auto-refresh, and the new-warning diff that drives browser notifications.
// All network access goes through lib/client (which hits our /api/* handlers).

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchStateAlerts,
  fetchPointAlerts,
  fetchPointInfo,
  fetchForecast,
  fetchObservation,
  fetchRadar,
} from "@/lib/client";
import { sortAlerts, isWarning, featureBounds } from "@/lib/alerts";
import type {
  NwsAlertFeature,
  PointInfo,
  ForecastResponse,
  RadarData,
  CurrentConditions,
} from "@/lib/types";

export interface LatLon {
  lat: number;
  lon: number;
}

export const DEFAULT_POINT: LatLon = {
  lat: Number(process.env.NEXT_PUBLIC_DEFAULT_LAT) || 42.96,
  lon: Number(process.env.NEXT_PUBLIC_DEFAULT_LON) || -88.01,
};

const REFRESH_MS = 60_000;
const RADAR_REFRESH_MS = 5 * 60_000;
const SAVED_POINT_KEY = "hookecho.savedPoint";

export type Bounds = [number, number, number, number]; // [w, s, e, n]

export function loadSavedPoint(): LatLon {
  if (typeof window === "undefined") return DEFAULT_POINT;
  try {
    const raw = window.localStorage.getItem(SAVED_POINT_KEY);
    if (raw) {
      const p = JSON.parse(raw) as LatLon;
      if (Number.isFinite(p.lat) && Number.isFinite(p.lon)) return p;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_POINT;
}

/** Do two bboxes intersect? Used to filter alerts to the current viewport. */
function intersects(a: Bounds, b: Bounds): boolean {
  return a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];
}

export interface NewWarning {
  id: string;
  event: string;
  headline: string;
}

export function useWeather() {
  const [savedPoint, setSavedPointState] = useState<LatLon>(DEFAULT_POINT);
  const [pointInfo, setPointInfo] = useState<PointInfo | null>(null);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [conditions, setConditions] = useState<CurrentConditions | null>(null);

  // Alerts accumulated per state code as the user pans the map.
  const [alertsByState, setAlertsByState] = useState<
    Record<string, NwsAlertFeature[]>
  >({});
  const [pointAlerts, setPointAlerts] = useState<NwsAlertFeature[]>([]);

  const [radar, setRadar] = useState<RadarData | null>(null);
  const [bounds, setBounds] = useState<Bounds | null>(null);

  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Notification diff: warning IDs seen at the saved point on the previous poll.
  const prevWarningIds = useRef<Set<string> | null>(null);
  const [newWarnings, setNewWarnings] = useState<NewWarning[]>([]);

  const loadedStates = useRef<Set<string>>(new Set());

  // Hydrate saved point from localStorage on mount (client-only).
  useEffect(() => {
    setSavedPointState(loadSavedPoint());
  }, []);

  // ---- Alert loading -------------------------------------------------------

  const loadState = useCallback(async (state: string) => {
    const code = state.toUpperCase();
    try {
      const features = await fetchStateAlerts(code);
      setAlertsByState((prev) => ({ ...prev, [code]: features }));
      loadedStates.current.add(code);
      setLastUpdated(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load alerts");
    }
  }, []);

  /** Given a map center, resolve its state via /points and load that state. */
  const ensureStateForCenter = useCallback(
    async (lat: number, lon: number) => {
      try {
        const info = await fetchPointInfo(lat, lon);
        if (info.state && !loadedStates.current.has(info.state)) {
          await loadState(info.state);
        }
      } catch {
        // Outside the US / over water: no NWS point. Silently ignore.
      }
    },
    [loadState],
  );

  // ---- Saved point: info, conditions, point alerts (for notifications) -----

  const refreshPoint = useCallback(
    async (pt: LatLon, isInitial: boolean) => {
      try {
        const [info, alerts] = await Promise.all([
          fetchPointInfo(pt.lat, pt.lon).catch(() => null),
          fetchPointAlerts(pt.lat, pt.lon).catch(
            () => [] as NwsAlertFeature[],
          ),
        ]);

        if (info) {
          setPointInfo(info);
          if (info.state) await loadState(info.state);
          // Current conditions come from the nearest observation station's
          // latest report (NOT a forecast period).
          if (info.observationStationsUrl) {
            fetchObservation(info.observationStationsUrl)
              .then(setConditions)
              .catch(() => setConditions(null));
          }
          // Forecast (used for the short "next period" line).
          fetchForecast(info.forecastUrl)
            .then(setForecast)
            .catch(() => setForecast(null));
        }

        setPointAlerts(alerts);

        // Notification diff over WARNINGS only.
        const warningIds = new Set(
          alerts
            .filter((a) => isWarning(a.properties.event))
            .map((a) => a.properties.id),
        );
        if (prevWarningIds.current && !isInitial) {
          const fresh: NewWarning[] = alerts
            .filter(
              (a) =>
                isWarning(a.properties.event) &&
                !prevWarningIds.current!.has(a.properties.id),
            )
            .map((a) => ({
              id: a.properties.id,
              event: a.properties.event,
              headline: a.properties.headline ?? a.properties.event,
            }));
          if (fresh.length) setNewWarnings(fresh);
        }
        prevWarningIds.current = warningIds;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load location",
        );
      }
    },
    [loadState],
  );

  const setSavedPoint = useCallback(
    (pt: LatLon) => {
      setSavedPointState(pt);
      try {
        window.localStorage.setItem(SAVED_POINT_KEY, JSON.stringify(pt));
      } catch {
        /* ignore */
      }
      // New point: reset the notification baseline so we don't fire for
      // pre-existing warnings at the new location.
      prevWarningIds.current = null;
      void refreshPoint(pt, true);
    },
    [refreshPoint],
  );

  // ---- Radar ---------------------------------------------------------------

  const loadRadar = useCallback(async () => {
    try {
      const data = await fetchRadar();
      setRadar(data);
    } catch {
      setRadar(null);
    }
  }, []);

  // ---- Initial load + timers ----------------------------------------------

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const pt = loadSavedPoint();
    Promise.all([refreshPoint(pt, true), loadRadar()]).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    const states = Array.from(loadedStates.current);
    await Promise.all([
      ...states.map((s) => fetchStateAlerts(s).then(
        (features) => setAlertsByState((prev) => ({ ...prev, [s]: features })),
      ).catch(() => {})),
      refreshPoint(savedPoint, false),
    ]);
    setLastUpdated(Date.now());
    setLoading(false);
  }, [refreshPoint, savedPoint]);

  // 60s alert auto-refresh.
  useEffect(() => {
    const id = setInterval(() => void refreshAll(), REFRESH_MS);
    return () => clearInterval(id);
  }, [refreshAll]);

  // Radar refresh (frames roll over every ~10 min upstream).
  useEffect(() => {
    const id = setInterval(() => void loadRadar(), RADAR_REFRESH_MS);
    return () => clearInterval(id);
  }, [loadRadar]);

  // ---- Derived -------------------------------------------------------------

  const allAlerts = useMemo(
    () => sortAlerts(Object.values(alertsByState).flat()),
    [alertsByState],
  );

  // Alerts whose geometry intersects the current viewport (for the sidebar).
  const visibleAlerts = useMemo(() => {
    if (!bounds) return allAlerts;
    return allAlerts.filter((f) => {
      const b = featureBounds(f);
      if (!b) return true; // keep geometry-less alerts (zone-based) in the list
      return intersects(b, bounds);
    });
  }, [allAlerts, bounds]);

  const clearNewWarnings = useCallback(() => setNewWarnings([]), []);

  return {
    savedPoint,
    setSavedPoint,
    pointInfo,
    forecast,
    conditions,
    allAlerts,
    visibleAlerts,
    pointAlerts,
    radar,
    bounds,
    setBounds,
    ensureStateForCenter,
    refreshAll,
    loadRadar,
    lastUpdated,
    loading,
    error,
    newWarnings,
    clearNewWarnings,
  };
}
