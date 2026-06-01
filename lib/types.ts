// Shared types for NWS alerts, point metadata, RainViewer radar, and geocoding.
// Kept intentionally loose where the upstream payloads are large; we only type
// the fields the app actually reads.

import type {
  Feature,
  FeatureCollection,
  Geometry,
  Polygon,
  MultiPolygon,
} from "geojson";

export type AlertSeverity =
  | "Extreme"
  | "Severe"
  | "Moderate"
  | "Minor"
  | "Unknown";

export type AlertCertainty =
  | "Observed"
  | "Likely"
  | "Possible"
  | "Unlikely"
  | "Unknown";

export type AlertUrgency =
  | "Immediate"
  | "Expected"
  | "Future"
  | "Past"
  | "Unknown";

/** Properties block of a single NWS alert feature (subset we use). */
export interface NwsAlertProperties {
  id: string;
  areaDesc: string;
  event: string;
  headline: string | null;
  description: string | null;
  instruction: string | null;
  severity: AlertSeverity;
  certainty: AlertCertainty;
  urgency: AlertUrgency;
  sent: string;
  effective: string;
  onset: string | null;
  expires: string;
  ends: string | null;
  status: string;
  messageType: string;
  category: string;
  senderName: string;
  // Present on many alerts; helps when geometry is null (we can fall back to zones).
  affectedZones?: string[];
  parameters?: Record<string, unknown>;
}

export type NwsAlertFeature = Feature<
  Polygon | MultiPolygon | Geometry | null,
  NwsAlertProperties
>;

export interface NwsAlertCollection
  extends FeatureCollection<Geometry | null, NwsAlertProperties> {
  features: NwsAlertFeature[];
  title?: string;
  updated?: string;
}

/** Subset of api.weather.gov/points/{lat},{lon} response. */
export interface NwsPointMeta {
  gridId: string; // CWA, e.g. "MKX" for Milwaukee/Sullivan
  gridX: number;
  gridY: number;
  forecast: string;
  forecastHourly: string;
  forecastGridData: string;
  observationStations: string;
  radarStation: string;
  // NWS nests this as a GeoJSON feature: relativeLocation.properties.{city,state}
  relativeLocation: {
    properties: {
      city: string;
      state: string;
    };
  };
  timeZone: string;
}

/** Normalized point metadata returned by our /api/points route. */
export interface PointInfo {
  lat: number;
  lon: number;
  cwa: string;
  radarStation: string;
  forecastUrl: string;
  forecastHourlyUrl: string;
  city: string;
  state: string;
  timeZone: string;
}

/** A single forecast period from the NWS forecast endpoint. */
export interface ForecastPeriod {
  number: number;
  name: string;
  startTime: string;
  endTime: string;
  isDaytime: boolean;
  temperature: number;
  temperatureUnit: string;
  windSpeed: string;
  windDirection: string;
  shortForecast: string;
  detailedForecast: string;
  icon: string;
  probabilityOfPrecipitation?: { value: number | null };
}

export interface ForecastResponse {
  periods: ForecastPeriod[];
  updated: string;
}

/** RainViewer weather-maps.json (subset). */
export interface RainViewerFrame {
  time: number; // unix seconds
  path: string; // e.g. /v2/radar/1700000000
}

export interface RainViewerResponse {
  version: string;
  generated: number;
  host: string; // e.g. https://tilecache.rainviewer.com
  radar: {
    past: RainViewerFrame[];
    nowcast: RainViewerFrame[];
  };
}

/** Normalized radar payload returned by our /api/radar route. */
export interface RadarFrame {
  time: number;
  /** Fully-formed tile URL template with {z}/{x}/{y}. */
  urlTemplate: string;
  kind: "past" | "nowcast";
}

export interface RadarData {
  generated: number;
  frames: RadarFrame[];
}

/** A geocoding search result returned by /api/geocode. */
export interface GeocodeResult {
  label: string;
  lat: number;
  lon: number;
}
