"use client";

// MapLibre map: CARTO dark basemap (no API key), animated radar raster underlay,
// and color-coded NWS alert polygons on top. Exposes an imperative handle so the
// sidebar / search / geolocation can fly the map to a polygon or point.

import { useCallback, useEffect, useRef, type MutableRefObject } from "react";
import maplibregl, {
  Map as MlMap,
  Marker,
  type StyleSpecification,
  type GeoJSONSource,
  type RasterTileSource,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { styleForEvent } from "@/lib/alerts";
import type { NwsAlertFeature } from "@/lib/types";
import type { Bounds, LatLon } from "@/hooks/useWeather";

const CARTO_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    carto: {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
      ],
      tileSize: 256,
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
    },
  },
  layers: [
    { id: "bg", type: "background", paint: { "background-color": "#05070d" } },
    { id: "carto", type: "raster", source: "carto" },
  ],
};

const ALERT_SOURCE = "alerts";
const RADAR_SOURCE = "radar";

export interface MapHandle {
  flyTo: (lat: number, lon: number, zoom?: number) => void;
  fitBounds: (b: Bounds) => void;
}

interface MapViewProps {
  alerts: NwsAlertFeature[];
  savedPoint: LatLon;
  selectedId: string | null;
  radarTemplate: string | null;
  radarVisible: boolean;
  radarOpacity: number;
  onSelect: (id: string | null) => void;
  onMoveEnd: (lat: number, lon: number, bounds: Bounds) => void;
  initialCenter: LatLon;
  // Set by the map on init so parents can drive it (next/dynamic drops refs).
  controllerRef: MutableRefObject<MapHandle | null>;
}

/** Inject per-feature style props so the map can data-drive color/width. */
function toStyledCollection(alerts: NwsAlertFeature[]): FeatureCollection {
  const features: Feature[] = [];
  for (const f of alerts) {
    if (!f.geometry) continue; // only mappable geometries
    const s = styleForEvent(f.properties.event);
    features.push({
      type: "Feature",
      geometry: f.geometry as Geometry,
      properties: {
        id: f.properties.id,
        event: f.properties.event,
        _color: s.color,
        _priority: s.priority,
        _emphatic: s.emphatic ? 1 : 0,
      },
    });
  }
  return { type: "FeatureCollection", features };
}

export function MapView({
  alerts,
  savedPoint,
  selectedId,
  radarTemplate,
  radarVisible,
  radarOpacity,
  onSelect,
  onMoveEnd,
  initialCenter,
  controllerRef,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const readyRef = useRef(false);
  const onMoveEndRef = useRef(onMoveEnd);
  const onSelectRef = useRef(onSelect);
  onMoveEndRef.current = onMoveEnd;
  onSelectRef.current = onSelect;

  // Latest prop snapshot, so the one-time map "load" handler applies the current
  // state (alerts/radar may arrive before OR after the map finishes loading).
  const latest = useRef({
    alerts,
    selectedId,
    radarTemplate,
    radarVisible,
    radarOpacity,
  });
  latest.current = {
    alerts,
    selectedId,
    radarTemplate,
    radarVisible,
    radarOpacity,
  };

  // Expose an imperative handle to the parent without forwardRef.
  useEffect(() => {
    controllerRef.current = {
      flyTo: (lat, lon, zoom) => {
        const m = mapRef.current;
        if (!m) return;
        m.flyTo({
          center: [lon, lat],
          zoom: zoom ?? Math.max(m.getZoom(), 8),
          duration: 900,
        });
      },
      fitBounds: (b) => {
        mapRef.current?.fitBounds(
          [
            [b[0], b[1]],
            [b[2], b[3]],
          ],
          { padding: 80, maxZoom: 11, duration: 900 },
        );
      },
    };
    return () => {
      controllerRef.current = null;
    };
  }, [controllerRef]);

  // Create/update the radar raster layer below the alert layers. Always created
  // with a real tile template (never empty), and idempotent so it can be called
  // both on map-ready and whenever the frame / visibility / opacity changes.
  const applyRadar = useCallback(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    if (!radarTemplate) {
      if (map.getLayer("radar")) {
        map.setLayoutProperty("radar", "visibility", "none");
      }
      return;
    }
    const src = map.getSource(RADAR_SOURCE) as RasterTileSource | undefined;
    if (!src) {
      map.addSource(RADAR_SOURCE, {
        type: "raster",
        tiles: [radarTemplate],
        tileSize: 256,
      });
    } else {
      src.setTiles([radarTemplate]);
    }
    if (!map.getLayer("radar")) {
      map.addLayer(
        {
          id: "radar",
          type: "raster",
          source: RADAR_SOURCE,
          paint: { "raster-opacity": radarOpacity },
        },
        map.getLayer("alert-fill") ? "alert-fill" : undefined, // keep under alerts
      );
    }
    map.setLayoutProperty(
      "radar",
      "visibility",
      radarVisible ? "visible" : "none",
    );
    map.setPaintProperty("radar", "raster-opacity", radarOpacity);
  }, [radarTemplate, radarVisible, radarOpacity]);
  const applyRadarRef = useRef(applyRadar);
  applyRadarRef.current = applyRadar;

  // Initialize the map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: CARTO_STYLE,
      center: [initialCenter.lon, initialCenter.lat],
      zoom: 7,
      attributionControl: { compact: true },
      maxZoom: 14,
      minZoom: 3,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");

    map.on("load", () => {
      const init = latest.current;

      // Alert polygons. (Radar is added below these by applyRadar, once a tile
      // template exists, so it never gets created with an empty tiles array.)
      map.addSource(ALERT_SOURCE, {
        type: "geojson",
        data: toStyledCollection(init.alerts),
      });
      map.addLayer({
        id: "alert-fill",
        type: "fill",
        source: ALERT_SOURCE,
        paint: {
          "fill-color": ["get", "_color"],
          "fill-opacity": [
            "case",
            ["==", ["get", "_emphatic"], 1],
            0.32,
            0.16,
          ],
        },
      });
      map.addLayer({
        id: "alert-line",
        type: "line",
        source: ALERT_SOURCE,
        paint: {
          "line-color": ["get", "_color"],
          "line-width": ["case", ["==", ["get", "_emphatic"], 1], 2.4, 1.2],
          "line-opacity": 0.9,
        },
      });
      // Selected outline (filter set later).
      map.addLayer({
        id: "alert-selected",
        type: "line",
        source: ALERT_SOURCE,
        filter: ["==", ["get", "id"], init.selectedId ?? ""],
        paint: {
          "line-color": "#ffffff",
          "line-width": 3,
          "line-blur": 0.4,
        },
      });

      // Interactions.
      const pick = (e: maplibregl.MapLayerMouseEvent) => {
        const f = e.features?.[0];
        if (f) onSelectRef.current(String(f.properties?.id ?? ""));
      };
      map.on("click", "alert-fill", pick);
      map.on("mouseenter", "alert-fill", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "alert-fill", () => {
        map.getCanvas().style.cursor = "";
      });
      // Click empty map clears selection.
      map.on("click", (e) => {
        const hits = map.queryRenderedFeatures(e.point, {
          layers: ["alert-fill"],
        });
        if (!hits.length) onSelectRef.current(null);
      });

      readyRef.current = true;
      applyRadarRef.current(); // draw radar now if a template is already loaded

      const emit = () => {
        const c = map.getCenter();
        const b = map.getBounds();
        onMoveEndRef.current(c.lat, c.lng, [
          b.getWest(),
          b.getSouth(),
          b.getEast(),
          b.getNorth(),
        ]);
      };
      map.on("moveend", emit);
      emit(); // initial bounds
    });

    return () => {
      map.remove();
      mapRef.current = null;
      readyRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update alert data when it changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    const src = map.getSource(ALERT_SOURCE) as GeoJSONSource | undefined;
    src?.setData(toStyledCollection(alerts));
  }, [alerts]);

  // Selected outline filter.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    map.setFilter("alert-selected", ["==", ["get", "id"], selectedId ?? ""]);
  }, [selectedId]);

  // Radar tile template / visibility / opacity changes.
  useEffect(() => {
    applyRadar();
  }, [applyRadar]);

  // Saved-point marker.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!markerRef.current) {
      const el = document.createElement("div");
      el.className = "he-marker";
      el.innerHTML = `<span class="he-marker-dot"></span><span class="he-marker-pulse"></span>`;
      markerRef.current = new maplibregl.Marker({ element: el, anchor: "center" });
    }
    markerRef.current.setLngLat([savedPoint.lon, savedPoint.lat]).addTo(map);
  }, [savedPoint]);

  return <div ref={containerRef} className="absolute inset-0" />;
}
