# Saathi — Your Safety, Our Priority

A women's safety application that provides real-time safe routing, instant SOS alerts, and community-powered safety reporting.

## Features

### Safe Route Navigation
- **From / To inputs** — "From" auto-fills with your current GPS location. Both fields are editable.
- **Safest route (green)** — The route with the fewest nearby danger zones, highlighted in bright green.
- **Shortest route (violet)** — The fastest route by distance, shown in violet.
- **Alternative routes** — Additional routes shown for comparison.
- **Click any route** to see estimated walking time and distance.
- **Danger zone markers** — Red ✕ markers on the map for danger zones along the selected route. Click for details.
- **Navigate in Google Maps** — Open any selected route in Google Maps with waypoints for turn-by-turn navigation.

### SOS Emergency Button
- One-tap SOS button in the header.
- Finds the nearest police station instantly.
- **"Call Now" button** — opens the phone dialer directly. Falls back to India's emergency number (112) if needed.

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS
- **Mapping:** Leaflet, React Leaflet
- **Routing:** OSRM public API (pedestrian profile)
- **Geocoding:** Nominatim (OpenStreetMap)
- **Backend:** Supabase (PostgreSQL)
- **Navigation:** Google Maps Directions URL with waypoint support

## Setup

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

3. Create the `danger_zones` and `police_stations` tables in Supabase:

   **danger_zones:**
   | Column | Type | Description |
   |--------|------|-------------|
   | `id` | `bigint` (auto) | Primary key |
   | `lat` | `double precision` | Latitude |
   | `lng` | `double precision` | Longitude |
   | `label` | `text` | Description |
   | `radius_m` | `integer` | Danger radius in metres |

   **police_stations:**
   | Column | Type | Description |
   |--------|------|-------------|
   | `id` | `bigint` (auto) | Primary key |
   | `name` | `text` | Station name |
   | `lat` | `double precision` | Latitude |
   | `lng` | `double precision` | Longitude |
   | `phone` | `text` | Contact phone number |

4. Enable Row Level Security with public read access on both tables.

5. Seed the tables with data for your area.

6. Start the dev server:
   ```bash
   npm run dev
   ```

## How Safe Routing Works

1. User enters a destination in the "To" field.
2. The app fetches a direct pedestrian route from OSRM.
3. Danger zones are fetched from Supabase.
4. Alternative routes are generated using avoidance waypoints that steer around danger zones.
5. Each route is scored by counting nearby danger zones (within 500m).
6. The safest route is highlighted in green, the shortest in violet.
7. Walking time is calculated at 5 km/h average speed.

## License

MIT
