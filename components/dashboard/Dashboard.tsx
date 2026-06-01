"use client";

// Top-level dashboard: composes the map, sidebar, alert panel, radar controls,
// conditions, and toolbar, and owns the cross-cutting UI state (selection, radar
// playback, mobile sidebar). Data lives in useWeather; notifications in useNotifier.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { WarningCircle, X } from "@phosphor-icons/react";
import { useWeather, loadSavedPoint, type Bounds } from "@/hooks/useWeather";
import { useNotifier } from "@/hooks/useNotifier";
import { featureBounds } from "@/lib/alerts";
import type { NwsAlertFeature } from "@/lib/types";
import type { MapHandle } from "./MapView";
import { Toolbar } from "./Toolbar";
import { AlertSidebar } from "./AlertSidebar";
import { AlertPanel } from "./AlertPanel";
import { RadarControls } from "./RadarControls";
import { ConditionsCard } from "./ConditionsCard";

// MapLibre touches window; load it client-only.
const MapView = dynamic(() => import("./MapView").then((m) => m.MapView), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-ink-950">
      <div className="bg-grid absolute inset-0 opacity-40" />
      <p className="relative animate-pulse text-sm text-slate-500">
        Loading map…
      </p>
    </div>
  ),
});

const RADAR_FRAME_MS = 500;

export function Dashboard() {
  const w = useWeather();
  const notifier = useNotifier();
  const mapApi = useRef<MapHandle | null>(null);
  // Center the map on the saved point from the very first paint (MapView is
  // client-only, so reading localStorage here causes no hydration mismatch).
  const initialCenter = useRef(loadSavedPoint()).current;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile
  const [geolocating, setGeolocating] = useState(false);

  // Radar playback.
  const [frameIndex, setFrameIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [radarVisible, setRadarVisible] = useState(true);
  const [radarOpacity, setRadarOpacity] = useState(0.8);

  const frames = w.radar?.frames ?? [];

  // When radar loads/refreshes, jump to the latest observed frame.
  useEffect(() => {
    if (!frames.length) return;
    const lastPast = frames.map((f) => f.kind).lastIndexOf("past");
    setFrameIndex(lastPast >= 0 ? lastPast : frames.length - 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w.radar]);

  // Advance frames while playing.
  useEffect(() => {
    if (!playing || !radarVisible || frames.length < 2) return;
    const id = setInterval(() => {
      setFrameIndex((i) => (i + 1) % frames.length);
    }, RADAR_FRAME_MS);
    return () => clearInterval(id);
  }, [playing, radarVisible, frames.length]);

  const radarTemplate = frames[frameIndex]?.urlTemplate ?? null;

  // Fire notifications when new warnings appear at the saved point.
  useEffect(() => {
    if (w.newWarnings.length) {
      notifier.notify(w.newWarnings);
      w.clearNewWarnings();
    }
  }, [w.newWarnings, notifier, w]);

  // ---- Map interactions ----------------------------------------------------

  const selectedFeature: NwsAlertFeature | null = useMemo(() => {
    if (!selectedId) return null;
    return (
      w.allAlerts.find((f) => f.properties.id === selectedId) ??
      w.pointAlerts.find((f) => f.properties.id === selectedId) ??
      null
    );
  }, [selectedId, w.allAlerts, w.pointAlerts]);

  const flyToFeature = useCallback((f: NwsAlertFeature) => {
    const b = featureBounds(f);
    if (!b) return;
    const sameSpot = b[0] === b[2] && b[1] === b[3];
    if (sameSpot) {
      mapApi.current?.flyTo(b[1], b[0], 9);
    } else {
      mapApi.current?.fitBounds(b);
    }
  }, []);

  const pickAlert = useCallback(
    (f: NwsAlertFeature) => {
      setSelectedId(f.properties.id);
      flyToFeature(f);
      setSidebarOpen(false);
    },
    [flyToFeature],
  );

  // Debounced "load alerts for the state under the map center" on pan/zoom.
  const moveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onMoveEnd = useCallback(
    (lat: number, lon: number, bounds: Bounds) => {
      w.setBounds(bounds);
      if (moveTimer.current) clearTimeout(moveTimer.current);
      moveTimer.current = setTimeout(() => {
        void w.ensureStateForCenter(lat, lon);
      }, 600);
    },
    [w],
  );

  const handlePick = useCallback(
    (lat: number, lon: number) => {
      w.setSavedPoint({ lat, lon });
      mapApi.current?.flyTo(lat, lon, 9);
    },
    [w],
  );

  const geolocate = useCallback(() => {
    if (!("geolocation" in navigator)) return;
    setGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        w.setSavedPoint({ lat: latitude, lon: longitude });
        mapApi.current?.flyTo(latitude, longitude, 9);
        setGeolocating(false);
      },
      () => setGeolocating(false),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  }, [w]);

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-ink-950">
      <Toolbar
        onPick={handlePick}
        onGeolocate={geolocate}
        onRefresh={w.refreshAll}
        onToggleSidebar={() => setSidebarOpen((s) => !s)}
        loading={w.loading}
        geolocating={geolocating}
        notifier={notifier}
      />

      <div className="relative flex min-h-0 flex-1">
        {/* Map */}
        <div className="relative flex-1">
          <MapView
            alerts={w.allAlerts}
            savedPoint={w.savedPoint}
            selectedId={selectedId}
            radarTemplate={radarTemplate}
            radarVisible={radarVisible}
            radarOpacity={radarOpacity}
            onSelect={setSelectedId}
            onMoveEnd={onMoveEnd}
            initialCenter={initialCenter}
            controllerRef={mapApi}
          />

          {/* Error toast */}
          {w.error && (
            <div className="pointer-events-auto absolute left-1/2 top-4 z-20 flex max-w-[90%] -translate-x-1/2 items-center gap-2 rounded-full border border-warn-tornado/30 bg-ink-900/95 px-4 py-2 text-xs text-slate-200 shadow-xl">
              <WarningCircle size={15} className="text-warn-tornado" />
              {w.error}
            </div>
          )}

          {/* Conditions card (top-left) */}
          <div className="absolute left-3 top-3 z-10 w-[260px] max-w-[calc(100%-1.5rem)]">
            <ConditionsCard
              pointInfo={w.pointInfo}
              forecast={w.forecast}
              conditions={w.conditions}
            />
          </div>

          {/* Alert detail panel (right, above radar bar) */}
          {selectedFeature && (
            <div className="absolute right-3 top-3 z-20 hidden max-h-[calc(100%-6rem)] lg:block">
              <AlertPanel
                feature={selectedFeature}
                onClose={() => setSelectedId(null)}
              />
            </div>
          )}

          {/* Radar controls (bottom center) */}
          <div className="absolute bottom-4 left-1/2 z-10 w-[min(640px,calc(100%-1.5rem))] -translate-x-1/2">
            <RadarControls
              frames={frames}
              index={frameIndex}
              playing={playing}
              visible={radarVisible}
              opacity={radarOpacity}
              onIndex={(i) => {
                setFrameIndex(i);
                setPlaying(false);
              }}
              onPlayToggle={() => setPlaying((p) => !p)}
              onVisibleToggle={() => setRadarVisible((v) => !v)}
              onOpacity={setRadarOpacity}
            />
          </div>
        </div>

        {/* Sidebar (desktop) */}
        <aside className="hidden w-[320px] shrink-0 border-l border-white/5 bg-ink-900/60 lg:block">
          <AlertSidebar
            alerts={w.visibleAlerts}
            selectedId={selectedId}
            onPick={pickAlert}
            lastUpdated={w.lastUpdated}
          />
        </aside>
      </div>

      {/* Sidebar (mobile drawer) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute right-0 top-0 flex h-full w-[85%] max-w-sm flex-col border-l border-white/10 bg-ink-900">
            <button
              onClick={() => setSidebarOpen(false)}
              aria-label="Close list"
              className="absolute right-3 top-3 z-10 rounded-full p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>
            <AlertSidebar
              alerts={w.visibleAlerts}
              selectedId={selectedId}
              onPick={pickAlert}
              lastUpdated={w.lastUpdated}
            />
          </aside>
        </div>
      )}

      {/* Alert panel (mobile bottom sheet) */}
      {selectedFeature && (
        <div className="fixed inset-x-0 bottom-0 z-40 max-h-[70vh] p-3 lg:hidden">
          <AlertPanel
            feature={selectedFeature}
            onClose={() => setSelectedId(null)}
          />
        </div>
      )}
    </div>
  );
}
