# Phase 2 Features Design Spec

**Date:** 2026-04-01
**Scope:** Real police station data, Google Maps navigation, SOS call functionality

---

## 1. Real Police Station Data

### Goal
Replace dummy police station data in Supabase with real locations sourced from OpenStreetMap (Nominatim).

### Approach
- Query Nominatim for police stations in the Aluva/Ernakulam/Kochi area
- Collect real names and coordinates
- Phone numbers: use real numbers where available from OSM data. For stations without phone data, use "112" (India's national emergency number) as fallback
- Update the `police_stations` table in Supabase with the real data via the SQL Editor or REST API

### Table Schema (unchanged)
| Column | Type | Description |
|--------|------|-------------|
| `id` | `bigint` (auto) | Primary key |
| `name` | `text` | Station name |
| `lat` | `double precision` | Latitude |
| `lng` | `double precision` | Longitude |
| `phone` | `text` | Contact phone number |

### Data Source
- Primary: OpenStreetMap via Nominatim search API
- Coverage: ~10km radius around Aluva (10.1076, 76.3520)
- Stations without OSM phone data get "112" as the phone value

---

## 2. Open Selected Route in Google Maps

### Goal
Allow users to navigate the selected route in Google Maps, following approximately the same path shown in Saathi.

### Trigger
A **"Navigate in Google Maps"** button in the `RouteInfo` panel. Appears in both mobile (compact) and desktop (full) views. Present for all route types (safest, shortest, alternative).

### URL Construction
Google Maps supports waypoints in the directions URL:
```
https://www.google.com/maps/dir/{from_lat},{from_lng}/{wp1_lat},{wp1_lng}/{wp2_lat},{wp2_lng}/{to_lat},{to_lng}/
```

**Waypoint extraction:**
1. Take the selected route's coordinate array
2. Pick 2-3 evenly spaced intermediate points (e.g., at 25%, 50%, 75% of the array length)
3. Build the Google Maps URL with these waypoints
4. Open in a new tab via `window.open(url, '_blank')`

This forces Google Maps to route through the same corridor rather than its own default path. It won't be pixel-perfect but will follow the same general route.

### Files Changed
- `src/components/map/RouteInfo.jsx` — add "Navigate in Google Maps" button
- `src/components/map/RoutingControl.jsx` — pass route coordinates to the RouteInfo via `onRouteSelect`

### Data Flow
1. User clicks a route on the map
2. `onRouteSelect` fires with route info including the coordinate array
3. `RouteInfo` renders the "Navigate in Google Maps" button
4. On button click, extract waypoints from coordinates, build URL, open in new tab

---

## 3. SOS Call to Nearest Police Station

### Goal
When the user taps SOS, find the nearest police station and provide a one-tap call button.

### Current Flow (unchanged)
1. User clicks SOS button in header
2. Modal opens
3. App fetches police stations from Supabase
4. Finds nearest station using Haversine distance
5. Displays station name, distance

### New Additions
- **"Call" button** — prominent red/green button using `<a href="tel:{phone}">`. On mobile, this opens the phone dialer. On desktop, it may open a calling app or do nothing (acceptable since SOS is primarily a mobile feature).
- **Phone number display** — show the number as visible text next to the Call button so users can manually dial if needed
- **Fallback** — if the nearest station has no phone number, show "Call 112" with `tel:112` (India's national emergency number)

### Files Changed
- `src/components/sos/SOSButton.jsx` — add Call button and phone display to the modal

### UI Layout (in modal)
```
┌─────────────────────────────┐
│  Nearest Police Station     │
│  ─────────────────────────  │
│  📍 Aluva Police Station    │
│     1.2 km away             │
│                             │
│  📞 0484-2624100            │
│                             │
│  ┌───────────────────────┐  │
│  │      📞 Call Now       │  │
│  └───────────────────────┘  │
│                             │
│        [ Close ]            │
└─────────────────────────────┘
```

---

## Implementation Order

1. **Real police station data** — seed Supabase first, since SOS and other features depend on it
2. **SOS call functionality** — update SOSButton with call button (uses the real data)
3. **Google Maps navigation** — add button to RouteInfo, pass coordinates through

---

## Out of Scope

- Real-time police station data fetching (rejected for latency reasons — emergencies need instant response)
- Danger zone user reporting (future feature)
- Turn-by-turn navigation within Saathi (delegated to Google Maps)
