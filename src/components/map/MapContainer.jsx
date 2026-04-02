import { useState, useEffect, useRef, useCallback } from 'react'
import { MapContainer as LeafletMap, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import RoutingControl from './RoutingControl'
import RouteLegend from './RouteLegend'
import RouteInfo from './RouteInfo'
import { haversineMetres } from '../../lib/geo'
import 'leaflet/dist/leaflet.css'

// Fix default marker icon paths broken by bundlers
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

const DEFAULT_CENTER = [20.5937, 78.9629]
const DEFAULT_ZOOM = 5

const ICON_OPTS = {
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
}

const startIcon = new L.Icon({ ...ICON_OPTS, className: 'start-marker' })
const destIcon = new L.Icon({ ...ICON_OPTS, className: 'dest-marker' })

function FlyTo({ position, zoom }) {
  const map = useMap()
  useEffect(() => {
    if (position) map.flyTo(position, zoom ?? 15)
  }, [map, position, zoom])
  return null
}

async function reverseGeocode(lat, lng) {
  const fallback = `${lat.toFixed(4)}, ${lng.toFixed(4)}`
  try {
    const res = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`)
    const data = await res.json()
    const f = data.features?.[0]?.properties
    if (!f) return fallback
    return [f.name, f.street, f.city, f.state].filter(Boolean).join(', ')
  } catch {
    return fallback
  }
}

const NOISE_WORDS = new Set(['station', 'road', 'street', 'lane', 'junction', 'stop', 'near', 'bus', 'the'])

export default function MapContainer() {
  const [userPos, setUserPos] = useState(null)
  const [fromPos, setFromPos] = useState(null)
  const [destination, setDestination] = useState(null)
  const [fromQuery, setFromQuery] = useState('')
  const [toQuery, setToQuery] = useState('')
  const [fromSearch, setFromSearch] = useState({ loading: false, results: [], open: false })
  const [toSearch, setToSearch] = useState({ loading: false, results: [], open: false })
  const [selectedRouteInfo, setSelectedRouteInfo] = useState(null)
  const resetToSafestRef = useRef(null)
  const fromDebounceRef = useRef(null)
  const toDebounceRef = useRef(null)

  const handleShowSafest = useCallback(() => {
    if (resetToSafestRef.current) resetToSafestRef.current()
  }, [])

  useEffect(() => () => {
    clearTimeout(fromDebounceRef.current)
    clearTimeout(toDebounceRef.current)
  }, [])

  useEffect(() => {
    const fallback = { lat: 10.1076, lng: 76.3520 }
    if (!navigator.geolocation) {
      setUserPos(fallback)
      setFromPos(fallback)
      setFromQuery('Aluva, Ernakulam, Kerala')
      return
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserPos(coords)
        setFromPos(coords)
        setFromQuery(await reverseGeocode(coords.lat, coords.lng))
      },
      () => {
        setUserPos(fallback)
        setFromPos(fallback)
        setFromQuery('Aluva, Ernakulam, Kerala')
      }
    )
  }, [])

  const fetchPhoton = useCallback(async (query) => {
    const loc = fromPos || userPos
    let url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=10&lang=en`
    if (loc) url += `&lat=${loc.lat}&lon=${loc.lng}`
    const res = await fetch(url)
    const data = await res.json()
    const results = (data.features || [])
      .filter((f) => f.properties.country === 'India')
      .map((f) => {
        const p = f.properties
        const coords = f.geometry.coordinates
        return {
          id: p.osm_id,
          name: p.name || '',
          displayName: [p.name, p.street, p.city, p.state].filter(Boolean).join(', '),
          lat: coords[1],
          lng: coords[0],
        }
      })
    if (loc && results.length > 0) {
      results.sort((a, b) =>
        haversineMetres(loc.lat, loc.lng, a.lat, a.lng)
        - haversineMetres(loc.lat, loc.lng, b.lat, b.lng)
      )
    }
    return results
  }, [fromPos, userPos])

  const searchWithFallback = useCallback(async (query) => {
    let results = await fetchPhoton(query)
    if (results.length === 0) {
      const words = query.trim().split(/\s+/)
      const meaningful = words.filter((w) => w.length > 2 && !NOISE_WORDS.has(w.toLowerCase()))
      const noise = words.filter((w) => w.length > 2 && NOISE_WORDS.has(w.toLowerCase()))
      const allWords = [...meaningful, ...noise]
      if (allWords.length > 0) {
        const wordResults = await Promise.all(allWords.map((w) => fetchPhoton(w)))
        results = wordResults.find((r) => r.length > 0) || []
      }
    }
    return results.slice(0, 5)
  }, [fetchPhoton])

  const fetchSuggestions = useCallback(async (query, setSearch) => {
    if (!query.trim()) {
      setSearch({ loading: false, results: [], open: false })
      return
    }
    setSearch((s) => ({ ...s, loading: true }))
    try {
      const results = await searchWithFallback(query)
      setSearch({ loading: false, results, open: true })
    } catch {
      setSearch({ loading: false, results: [], open: false })
    }
  }, [searchWithFallback])

  const handleInputChange = (value, setQuery, debounceRef, setSearch, fetchFn) => {
    setQuery(value)
    clearTimeout(debounceRef.current)
    if (!value.trim()) {
      setSearch({ loading: false, results: [], open: false })
      return
    }
    debounceRef.current = setTimeout(() => fetchFn(value, setSearch), 500)
  }

  const handleFromSelect = (s) => {
    setFromQuery(s.displayName)
    setFromPos({ lat: s.lat, lng: s.lng })
    setFromSearch({ loading: false, results: [], open: false })
  }

  const handleToSelect = (s) => {
    setToQuery(s.displayName)
    setDestination({ lat: s.lat, lng: s.lng })
    setToSearch({ loading: false, results: [], open: false })
  }

  const center = userPos ? [userPos.lat, userPos.lng] : DEFAULT_CENTER
  const zoom = userPos ? 15 : DEFAULT_ZOOM

  const renderDropdown = (search, setSearch, onSelect, borderClass, accentClass) => (
    (search.loading || search.open) && (
      <ul className={`absolute top-full left-0 right-0 mt-1 rounded-lg bg-slate-950/95 border ${borderClass} backdrop-blur-sm overflow-hidden z-[1001] max-h-60 overflow-y-auto`}>
        {search.loading ? (
          <li className={`px-4 py-2.5 text-sm ${accentClass} animate-pulse`}>Searching...</li>
        ) : search.results.length > 0 ? search.results.map((s, i) => (
          <li
            key={`${s.id}-${i}`}
            onMouseDown={() => onSelect(s)}
            className={`px-4 py-2.5 text-sm text-slate-200 hover:${accentClass.replace('text-', 'bg-').replace('400', '500/30')} cursor-pointer border-b border-slate-800 last:border-b-0 transition-colors`}
          >
            {s.displayName}
          </li>
        )) : (
          <li className="px-4 py-2.5 text-sm text-slate-500 italic">
            No results found — try adding more context
          </li>
        )}
      </ul>
    )
  )

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-md flex flex-col gap-2">
        {/* From input */}
        <div className="relative">
          <input
            type="text"
            value={fromQuery}
            onChange={(e) => handleInputChange(e.target.value, setFromQuery, fromDebounceRef, setFromSearch, fetchSuggestions)}
            onFocus={() => fromSearch.results.length > 0 && setFromSearch((s) => ({ ...s, open: true }))}
            onBlur={() => setTimeout(() => setFromSearch((s) => ({ ...s, open: false })), 200)}
            placeholder="From: Current location..."
            className="w-full px-4 py-3 rounded-lg bg-slate-950/90 border border-emerald-500/40 text-white placeholder-slate-500 outline-none focus:border-emerald-400 focus:shadow-[0_0_16px_rgba(52,211,153,0.25)] backdrop-blur-sm transition-all text-sm"
          />
          {renderDropdown(fromSearch, setFromSearch, handleFromSelect, 'border-emerald-500/40', 'text-emerald-400')}
        </div>

        {/* To input */}
        <div className="relative">
          <input
            type="text"
            value={toQuery}
            onChange={(e) => handleInputChange(e.target.value, setToQuery, toDebounceRef, setToSearch, fetchSuggestions)}
            onFocus={() => toSearch.results.length > 0 && setToSearch((s) => ({ ...s, open: true }))}
            onBlur={() => setTimeout(() => setToSearch((s) => ({ ...s, open: false })), 200)}
            placeholder="To: Search destination..."
            className="w-full px-4 py-3 rounded-lg bg-slate-950/90 border border-sky-500/40 text-white placeholder-slate-500 outline-none focus:border-sky-400 focus:shadow-[0_0_16px_rgba(14,165,233,0.25)] backdrop-blur-sm transition-all text-sm"
          />
          {renderDropdown(toSearch, setToSearch, handleToSelect, 'border-sky-500/40', 'text-sky-400')}
        </div>
      </div>

      {selectedRouteInfo && <RouteInfo info={selectedRouteInfo} onShowSafest={handleShowSafest} />}
      <RouteLegend />

      <LeafletMap center={center} zoom={zoom} className="w-full h-full z-0">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {userPos && <FlyTo position={[userPos.lat, userPos.lng]} zoom={15} />}

        {fromPos && (
          <Marker position={[fromPos.lat, fromPos.lng]} icon={startIcon}>
            <Tooltip direction="top" offset={[0, -36]} className="saathi-tooltip saathi-tooltip-from">
              {fromQuery || 'Start'}
            </Tooltip>
          </Marker>
        )}

        {destination && (
          <Marker position={[destination.lat, destination.lng]} icon={destIcon}>
            <Tooltip direction="top" offset={[0, -36]} className="saathi-tooltip saathi-tooltip-to">
              {toQuery || 'Destination'}
            </Tooltip>
          </Marker>
        )}

        {fromPos && destination && (
          <RoutingControl
            from={fromPos}
            to={destination}
            onRouteSelect={setSelectedRouteInfo}
            resetRef={resetToSafestRef}
          />
        )}
      </LeafletMap>
    </div>
  )
}
