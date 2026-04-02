# Saathi — Your Safety, Our Priority

A women's safety application that provides real-time safe routing, instant SOS alerts, and danger zone awareness powered by real crowdsourced incident data.

## Features

### Safe Route Navigation
- **From / To autocomplete** — Both fields have debounced search with proximity-ranked suggestions. "From" auto-fills with your GPS location.
- **Safest route (emerald)** — The route with the fewest nearby danger zones, highlighted with a glow effect.
- **Shortest route (amber)** — The fastest route by distance.
- **Alternative routes** — Additional routes shown for comparison.
- **Click any route** to see estimated walking time and distance.
- **Danger zone markers** — Rose X markers for reported incidents along the selected route.
- **Navigate in Google Maps** — Open any selected route in Google Maps with waypoints following the safe path.

### SOS Emergency Button
- One-tap SOS button in the header.
- Finds the nearest police station with real phone numbers.
- **"Call Now" button** — opens the phone dialer directly. Falls back to India's emergency number (112) if needed.

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS
- **Mapping:** Leaflet, React Leaflet
- **Routing:** OSRM public API (pedestrian profile)
- **Geocoding:** Photon (by Komoot), powered by OpenStreetMap data
- **Backend:** Supabase (PostgreSQL)
- **Data:** Safecity.in crowdsourced incident reports (11,057 locations), OpenStreetMap police stations

## How Safe Routing Works

1. User types a destination — autocomplete shows nearby suggestions via Photon.
2. The app fetches a direct pedestrian route from OSRM.
3. Danger zones are fetched from Supabase (real Safecity.in data, cached per session).
4. Alternative routes are generated using avoidance waypoints that steer around danger zones.
5. Each route is scored by counting nearby danger zones (within 500m).
6. The safest route is highlighted in emerald, the shortest in amber.
7. Walking time is calculated at 4.5 km/h (matching Google Maps).

## License

MIT
