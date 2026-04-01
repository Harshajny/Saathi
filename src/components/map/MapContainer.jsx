import { useState, useEffect, useRef, useCallback } from 'react'
import { MapContainer as LeafletMap, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import RoutingControl from './RoutingControl'
import RouteLegend from './RouteLegend'
import RouteInfo from './RouteInfo'
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

const DEFAULT_CENTER = [20.5937, 78.9629] // India fallback
const DEFAULT_ZOOM = 5

const violetIcon = new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'violet-marker',
})

const greenIcon = new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'green-marker',
})

/** Small helper — flies the map to a position */
function FlyTo({ position, zoom }) {
  const map = useMap()
  useEffect(() => {
    if (position) map.flyTo(position, zoom ?? 15)
  }, [map, position, zoom])
  return null
}

/** Reverse geocode lat/lng to an address string */
async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    )
    const data = await res.json()
    return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
  }
}

/** Forward geocode an address string to lat/lng */
async function forwardGeocode(query) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
  )
  const data = await res.json()
  if (data.length > 0) {
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  }
  return null
}

export default function MapContainer() {
  const [userPos, setUserPos] = useState(null)
  const [fromPos, setFromPos] = useState(null)
  const [destination, setDestination] = useState(null)
  const [fromQuery, setFromQuery] = useState('')
  const [toQuery, setToQuery] = useState('')
  const [searchingFrom, setSearchingFrom] = useState(false)
  const [searchingTo, setSearchingTo] = useState(false)
  const [selectedRouteInfo, setSelectedRouteInfo] = useState(null)
  const resetToSafestRef = useRef(null)

  const handleShowSafest = useCallback(() => {
    if (resetToSafestRef.current) resetToSafestRef.current()
  }, [])

  // Get user's current location and reverse geocode it
  useEffect(() => {
    const fallback = { lat: 10.1076, lng: 76.3520 } // Aluva fallback

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
        const address = await reverseGeocode(coords.lat, coords.lng)
        setFromQuery(address)
        console.log('[Saathi] GPS location:', coords)
      },
      () => {
        // Geolocation denied — use Aluva as fallback
        setUserPos(fallback)
        setFromPos(fallback)
        setFromQuery('Aluva, Ernakulam, Kerala')
        console.log('[Saathi] Geolocation denied, using Aluva fallback')
      }
    )
  }, [])

  const handleFromSearch = async (e) => {
    e.preventDefault()
    if (!fromQuery.trim()) return
    setSearchingFrom(true)
    try {
      const result = await forwardGeocode(fromQuery)
      if (result) {
        setFromPos(result)
        console.log('[Saathi] From set to:', result)
      }
    } catch (err) {
      console.error('From geocoding failed:', err)
    } finally {
      setSearchingFrom(false)
    }
  }

  const handleToSearch = async (e) => {
    e.preventDefault()
    if (!toQuery.trim()) return
    setSearchingTo(true)
    try {
      const result = await forwardGeocode(toQuery)
      if (result) {
        setDestination(result)
        console.log('[Saathi] Destination set to:', result)
      }
    } catch (err) {
      console.error('To geocoding failed:', err)
    } finally {
      setSearchingTo(false)
    }
  }

  const center = userPos ? [userPos.lat, userPos.lng] : DEFAULT_CENTER
  const zoom = userPos ? 15 : DEFAULT_ZOOM

  return (
    <div className="relative w-full h-full">
      {/* Search bars */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-md flex flex-col gap-2">
        {/* From input */}
        <form onSubmit={handleFromSearch}>
          <input
            type="text"
            value={fromQuery}
            onChange={(e) => setFromQuery(e.target.value)}
            placeholder="From: Current location..."
            className="w-full px-4 py-3 rounded-lg bg-zinc-900/90 border border-green-600/40 text-white placeholder-zinc-500 outline-none focus:border-green-500 focus:shadow-[0_0_16px_rgba(34,197,94,0.25)] backdrop-blur-sm transition-all text-sm"
          />
        </form>

        {/* To input */}
        <form onSubmit={handleToSearch} className="flex gap-2">
          <input
            type="text"
            value={toQuery}
            onChange={(e) => setToQuery(e.target.value)}
            placeholder="To: Search destination..."
            className="flex-1 px-4 py-3 rounded-lg bg-zinc-900/90 border border-violet-600/40 text-white placeholder-zinc-500 outline-none focus:border-violet-500 focus:shadow-[0_0_16px_rgba(139,92,246,0.25)] backdrop-blur-sm transition-all text-sm"
          />
          <button
            type="submit"
            disabled={searchingTo}
            className="px-4 py-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-all disabled:opacity-50 text-sm"
          >
            {searchingTo ? '...' : 'Go'}
          </button>
        </form>
      </div>

      {/* Route info (travel time) */}
      {selectedRouteInfo && <RouteInfo info={selectedRouteInfo} onShowSafest={handleShowSafest} />}

      {/* Legend */}
      <RouteLegend />

      <LeafletMap center={center} zoom={zoom} className="w-full h-full z-0">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {userPos && <FlyTo position={[userPos.lat, userPos.lng]} zoom={15} />}

        {/* From marker */}
        {fromPos && (
          <Marker position={[fromPos.lat, fromPos.lng]} icon={greenIcon}>
            <Popup>Start</Popup>
          </Marker>
        )}

        {/* Destination marker */}
        {destination && (
          <Marker position={[destination.lat, destination.lng]} icon={violetIcon}>
            <Popup>Destination</Popup>
          </Marker>
        )}

        {/* Routing (only when both points exist) */}
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
