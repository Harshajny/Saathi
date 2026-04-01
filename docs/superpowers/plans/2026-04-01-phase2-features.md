# Phase 2 Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace dummy police station data with real OpenStreetMap data, add Google Maps navigation for selected routes, and improve the SOS call experience with a fallback to 112.

**Architecture:** Three independent changes — (1) seed real police station data into Supabase, (2) pass route coordinates through to RouteInfo and add a Google Maps button that opens directions with waypoints, (3) enhance the SOS modal with a prominent Call button and 112 fallback.

**Tech Stack:** React, Leaflet, Supabase, Nominatim (OpenStreetMap), Google Maps Directions URL

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/components/map/RouteInfo.jsx` | Modify | Add "Navigate in Google Maps" button |
| `src/components/map/RoutingControl.jsx` | Modify | Pass route coordinates in `onRouteSelect` callback |
| `src/components/sos/SOSButton.jsx` | Modify | Add prominent Call button, phone display, 112 fallback |
| `README.md` | Modify | Document new features |

---

### Task 1: Seed Real Police Station Data in Supabase

**Files:**
- No code files changed — this is a data-only task via Supabase SQL Editor

The following real police stations were found via Nominatim for the Aluva/Ernakulam area. Phone numbers are sourced where available; "112" (India's national emergency number) is used as fallback.

- [ ] **Step 1: Delete existing dummy data**

Run in Supabase SQL Editor:

```sql
DELETE FROM police_stations;
```

- [ ] **Step 2: Insert real police station data**

Run in Supabase SQL Editor:

```sql
INSERT INTO police_stations (name, lat, lng, phone) VALUES
('Aluva Police Station', 10.1512194, 76.3383666, '112'),
('Aluva East Police Station', 10.1526488, 76.3398370, '112'),
('Binanipuram Police Station', 10.0743052, 76.3005447, '112'),
('Mulavukadu Police Station', 10.0136246, 76.2559479, '112'),
('Chellanam Police Station', 9.8860700, 76.2610911, '112'),
('Fort Kochi Police Station', 9.9671068, 76.2442738, '112'),
('Pallipuram Police Station', 10.1687822, 76.1807646, '112'),
('Kothamangalam Police Station', 10.0645910, 76.6251445, '112'),
('Kuruppampady Police Station', 10.1120063, 76.5181412, '112'),
('Willingdon Island Police Station', 9.9606430, 76.2682069, '112');
```

- [ ] **Step 3: Verify the data is readable**

Run via curl or browser console:

```bash
curl -s "https://vxrispnqbyadefaeahqm.supabase.co/rest/v1/police_stations?select=id,name,lat,lng,phone" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

Expected: JSON array with 10 police stations.

---

### Task 2: Pass Route Coordinates to RouteInfo

**Files:**
- Modify: `src/components/map/RoutingControl.jsx` (the `onRouteSelect` call sites)

Currently `onRouteSelect` sends `{ label, time, distance, dangerCount, dangerZones, color }`. We need to also pass `fromCoords`, `toCoords`, and `routeCoordinates` so RouteInfo can build the Google Maps URL.

- [ ] **Step 1: Update onRouteSelect calls in the click handler**

In `src/components/map/RoutingControl.jsx`, find the `line.on('click', ...)` handler inside the `routeOrder.forEach` loop. Update the `onRouteSelectRef.current(...)` call to include coordinates:

```js
line.on('click', () => {
  highlightRoute(i)
  onRouteSelectRef.current({
    label: routeLabel,
    time: formatTime(r.duration),
    distance: formatDistance(r.distance),
    dangerCount,
    dangerZones: dangersPerRoute[i].map((z) => z.label),
    color: isSafest ? GREEN : isShortest ? VIOLET : VIOLET_DIM,
    routeCoordinates: r.coordinates,
    fromCoords: from,
    toCoords: to,
  })
  showSkullsForRoute(i)
})
```

- [ ] **Step 2: Update the auto-select safest route call**

Find the `onRouteSelectRef.current(...)` call at the end of `run()` (the auto-show safest route info block) and the one inside `resetToSafest()`. Update both to include the same three new fields:

```js
// In resetToSafest():
onRouteSelectRef.current({
  label: 'Safest Route',
  time: formatTime(allRoutes[safestIdx].duration),
  distance: formatDistance(allRoutes[safestIdx].distance),
  dangerCount: dangersPerRoute[safestIdx].length,
  dangerZones: dangersPerRoute[safestIdx].map((z) => z.label),
  color: GREEN,
  routeCoordinates: allRoutes[safestIdx].coordinates,
  fromCoords: from,
  toCoords: to,
})
```

```js
// Auto-show safest route info (at end of run()):
onRouteSelectRef.current({
  label: 'Safest Route',
  time: formatTime(allRoutes[safestIdx].duration),
  distance: formatDistance(allRoutes[safestIdx].distance),
  dangerCount: dangersPerRoute[safestIdx].length,
  dangerZones: dangersPerRoute[safestIdx].map((z) => z.label),
  color: GREEN,
  routeCoordinates: allRoutes[safestIdx].coordinates,
  fromCoords: from,
  toCoords: to,
})
```

- [ ] **Step 3: Verify no errors**

Refresh the app, search a destination, confirm routes still render and clicking them still shows the RouteInfo panel without errors. Check browser console for any warnings.

- [ ] **Step 4: Commit**

```bash
git add src/components/map/RoutingControl.jsx
git commit -m "feat: pass route coordinates to RouteInfo for Google Maps integration"
```

---

### Task 3: Add "Navigate in Google Maps" Button to RouteInfo

**Files:**
- Modify: `src/components/map/RouteInfo.jsx`

- [ ] **Step 1: Add the Google Maps URL builder function**

Add this function at the top of `src/components/map/RouteInfo.jsx`, before the component:

```js
function buildGoogleMapsUrl(fromCoords, toCoords, routeCoordinates) {
  // Pick 2-3 intermediate waypoints evenly spaced along the route
  const coords = routeCoordinates || []
  const waypoints = []

  if (coords.length > 4) {
    const step = Math.floor(coords.length / 4)
    waypoints.push(coords[step])
    waypoints.push(coords[step * 2])
    waypoints.push(coords[step * 3])
  }

  // Build Google Maps directions URL
  let url = `https://www.google.com/maps/dir/${fromCoords.lat},${fromCoords.lng}`
  waypoints.forEach((wp) => {
    url += `/${wp.lat},${wp.lng}`
  })
  url += `/${toCoords.lat},${toCoords.lng}`

  return url
}
```

- [ ] **Step 2: Add the button to the compact (mobile) view**

In the `md:hidden` div, add the Google Maps button after the distance line and before the "Show Safe Route" button:

```jsx
<div className="text-zinc-400 text-xs">{info.distance}</div>

{info.routeCoordinates && (
  <button
    onClick={() => window.open(buildGoogleMapsUrl(info.fromCoords, info.toCoords, info.routeCoordinates), '_blank')}
    className="mt-2 w-full px-2 py-1.5 rounded-md bg-blue-600/20 border border-blue-500/40 text-blue-400 text-xs font-semibold hover:bg-blue-600/30 transition-all"
  >
    Navigate in Google Maps
  </button>
)}

{showResetButton && (
```

- [ ] **Step 3: Add the button to the full (desktop) view**

In the `hidden md:block` div, add the Google Maps button after the danger zone section and before the "Show Safe Route" button:

```jsx
{info.routeCoordinates && (
  <button
    onClick={() => window.open(buildGoogleMapsUrl(info.fromCoords, info.toCoords, info.routeCoordinates), '_blank')}
    className="mt-3 w-full px-3 py-2 rounded-md bg-blue-600/20 border border-blue-500/40 text-blue-400 text-xs font-semibold hover:bg-blue-600/30 transition-all"
  >
    Navigate in Google Maps
  </button>
)}

{showResetButton && (
```

- [ ] **Step 4: Test**

Refresh the app, select a route, verify the "Navigate in Google Maps" button appears. Click it — it should open Google Maps in a new tab with the route pre-filled including waypoints.

- [ ] **Step 5: Commit**

```bash
git add src/components/map/RouteInfo.jsx
git commit -m "feat: add Navigate in Google Maps button with waypoints"
```

---

### Task 4: Enhance SOS Modal with Call Button and 112 Fallback

**Files:**
- Modify: `src/components/sos/SOSButton.jsx`

The current SOS button already has a `tel:` link, but we need to improve it with a 112 fallback and more prominent layout.

- [ ] **Step 1: Update the nearest station display section**

In `src/components/sos/SOSButton.jsx`, replace the `{nearest && (...)}` block (lines 67-85) with:

```jsx
{nearest && (
  <div className="space-y-3">
    <div>
      <p className="text-zinc-400 text-xs uppercase tracking-wide mb-1">Nearest Station</p>
      <p className="text-white font-semibold text-lg">📍 {nearest.station.name}</p>
      <p className="text-zinc-400 text-sm">
        {(nearest.distanceMetres / 1000).toFixed(1)} km away
      </p>
    </div>

    <div className="text-zinc-300 text-sm font-mono">
      📞 {nearest.station.phone || '112'}
    </div>

    <a
      href={`tel:${nearest.station.phone || '112'}`}
      className="block w-full py-3 rounded-lg bg-green-600 hover:bg-green-500 text-white font-bold text-lg text-center transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)]"
    >
      📞 Call Now
    </a>

    {(!nearest.station.phone || nearest.station.phone === '112') && (
      <p className="text-zinc-500 text-xs">
        Station phone unavailable — calling India Emergency (112)
      </p>
    )}
  </div>
)}
```

- [ ] **Step 2: Add 112 fallback when no stations are found**

Replace the `{error && ...}` block (line 65) with:

```jsx
{error && (
  <div className="space-y-3">
    <p className="text-red-400">{error}</p>
    <a
      href="tel:112"
      className="block w-full py-3 rounded-lg bg-green-600 hover:bg-green-500 text-white font-bold text-lg text-center transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)]"
    >
      📞 Call 112 (Emergency)
    </a>
  </div>
)}
```

- [ ] **Step 3: Test**

1. Refresh the app and click SOS
2. Verify the modal shows the nearest station with the "Call Now" button
3. Verify the phone number is displayed
4. If on mobile, verify tapping "Call Now" opens the dialer

- [ ] **Step 4: Commit**

```bash
git add src/components/sos/SOSButton.jsx
git commit -m "feat: enhance SOS with prominent Call button and 112 fallback"
```

---

### Task 5: Update README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update the features section**

Add these under the existing features in `README.md`:

Under **Safe Route Navigation**, add:
```markdown
- **Navigate in Google Maps** — click the button on any selected route to open it in Google Maps with waypoints, following approximately the same path.
```

Under **SOS Emergency Button**, update to:
```markdown
### SOS Emergency Button
- One-tap SOS button in the header.
- Finds the nearest police station from the Supabase database (real OpenStreetMap data).
- Shows station name, distance, and phone number.
- **"Call Now" button** — uses `tel:` to open the phone dialer directly. Falls back to India's emergency number (112) if station phone is unavailable or no stations are found.
```

- [ ] **Step 2: Update the Tech Stack section**

Add to the Tech Stack list:
```markdown
- **Navigation:** Google Maps Directions URL with waypoint support
```

- [ ] **Step 3: Update the Seed Data Disclaimer**

Update the police stations paragraph to note they are now real:
```markdown
- **Police stations:** Sourced from OpenStreetMap (Nominatim) with real coordinates. Phone numbers default to "112" (India's national emergency number) where station-specific numbers are unavailable in OSM data.
```

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: update README with Phase 2 features"
```
