# Hook Echo

A map-centric **severe weather dashboard**: live National Weather Service (NWS)
alerts, animated radar, current conditions, and browser notifications for new
warnings near a saved location. Defaults to the Milwaukee area and works for any
location in the United States.

> A *hook echo* is the hook-shaped radar return of a rotating, often tornadic
> supercell. That signature is the app's namesake and logo.

## Features

- **Full-screen alert map** with color-coded NWS warning polygons. Tornado and
  severe thunderstorm warnings are styled most prominently.
- **Click a polygon** for the full headline, description, call-to-action
  instruction, and expiration time.
- **Severity-sorted sidebar** of alerts in the current view; click to fly to a
  polygon.
- **Geolocation** and **US location search** (city / town / ZIP).
- **Animated radar** (RainViewer) with a timeline scrubber, play/pause, and
  opacity control.
- **Auto-refresh** of alerts every 60 seconds.
- **Browser notifications** when a new warning appears for your saved point, with
  an optional **audio alarm**.
- A polished **landing page** at `/` with an Open Graph card that unfurls in
  Discord, Slack, iMessage, and X.

## Stack

- Next.js (App Router) + React + TypeScript
- MapLibre GL JS (CARTO dark basemap, no API key)
- Tailwind CSS
- All external API calls run through **server-side route handlers** in `app/api/*`

## Architecture

The browser never calls `api.weather.gov` or RainViewer directly. Every external
request goes through a Next.js route handler so the required headers and caching
live server-side:

| Route | Purpose |
| --- | --- |
| `GET /api/alerts?area=WI` / `?point=lat,lon` | Active NWS alerts (GeoJSON) |
| `GET /api/points/{lat}/{lon}` | Forecast URLs, county warning area (CWA), radar station, city/state |
| `GET /api/forecast?url=...` | Forecast/current conditions (URL allowlisted to `api.weather.gov`) |
| `GET /api/radar` | RainViewer frame timestamps + tile URL templates |
| `GET /api/geocode?q=...` | US location search (Nominatim) |

`lib/nws.ts` centralizes the NWS `User-Agent` header (required, or NWS returns
403) and a ~45s revalidate window. Radar **tiles** load directly from RainViewer's
CDN using the templates returned by `/api/radar` (only the small JSON index is
proxied). Client state is kept in React + `localStorage`; there is no database.

```
app/
  page.tsx                       landing page
  dashboard/page.tsx             the dashboard
  opengraph-image.tsx            social/Discord embed card
  api/                           route handlers (alerts, points, forecast, radar, geocode)
components/
  dashboard/                     MapView, sidebar, panel, radar controls, search, toolbar, conditions
  landing/                       hero radar scope, scroll reveal
lib/                             nws fetch helper, alert styling, types, client fetchers
hooks/                           useWeather (data + 60s refresh + notify diff), useNotifier
```

## Local development

```bash
npm install
cp .env.local.example .env.local   # then edit NWS_USER_AGENT with your contact
npm run dev                        # http://localhost:3000
```

### Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `NWS_USER_AGENT` | recommended | Identifies the app + a contact to NWS, e.g. `"Hook-Echo Severe Weather Dashboard (you@example.com)"`. A default is baked in, but set your own contact before deploying. |
| `NEXT_PUBLIC_SITE_URL` | optional | Absolute site URL for Open Graph tags. On Vercel this is inferred automatically. |
| `NEXT_PUBLIC_DEFAULT_LAT` / `NEXT_PUBLIC_DEFAULT_LON` | optional | Override the default map start (defaults to Milwaukee, 42.96 / -88.01). |

## Deploying to Vercel

1. Push this repo to GitHub and import it in Vercel (framework auto-detected as
   Next.js).
2. Add the `NWS_USER_AGENT` environment variable with your real contact.
3. Deploy. The Open Graph image and route handlers work on Vercel with no extra
   configuration; caching uses Next.js `revalidate`, so no database is needed.

## Notes & limits

- Handles the **zero-active-alerts** case gracefully (empty-state in the sidebar,
  no polygons).
- Zone-based alerts (e.g. some Air Quality Alerts) have no polygon geometry; they
  appear in the sidebar list but not on the map.
- This is an informational tool. **Always follow official NWS guidance and local
  emergency instructions.**

## Roadmap (not yet built)

SPC convective outlook layer, Local Storm Reports (IEM) points, multiple saved
locations, and a "my local office" CWA-focused mode. The map uses a layer-registry
pattern to keep these additions straightforward.
