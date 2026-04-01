import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import { fetchDangerZones, filterSafestRoute, getDangerZonesOnRoute } from '../../lib/dangerZones'
import { haversineMetres } from '../../lib/geo'

const GREEN = '#22C55E'
const VIOLET = '#8B5CF6'
const VIOLET_DIM = 'rgba(139,92,246,0.6)'

const dangerIcon = L.divIcon({
  html: '<span style="font-size:20px;font-weight:bold;color:#EF4444;">✕</span>',
  className: 'danger-marker',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -14],
})

function findShortestIndex(routes) {
  let bestIdx = 0
  let bestDist = Infinity
  routes.forEach((r, i) => {
    if (r.distance < bestDist) {
      bestDist = r.distance
      bestIdx = i
    }
  })
  return bestIdx
}

/** Calculate walking time from distance (5 km/h average walking speed) */
function walkingTimeSeconds(distanceMetres) {
  return distanceMetres / (5000 / 3600) // 5 km/h = 1.389 m/s
}

function formatTime(seconds) {
  const mins = Math.round(seconds / 60)
  if (mins < 60) return `${mins} min`
  const hrs = Math.floor(mins / 60)
  const rem = mins % 60
  return rem > 0 ? `${hrs} hr ${rem} min` : `${hrs} hr`
}

function formatDistance(metres) {
  if (metres < 1000) return `${Math.round(metres)} m`
  return `${(metres / 1000).toFixed(1)} km`
}

function decodePolyline(encoded) {
  const coords = []
  let index = 0, lat = 0, lng = 0
  while (index < encoded.length) {
    let shift = 0, result = 0, byte
    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)
    lat += (result & 1) ? ~(result >> 1) : (result >> 1)
    shift = 0; result = 0
    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)
    lng += (result & 1) ? ~(result >> 1) : (result >> 1)
    coords.push({ lat: lat / 1e5, lng: lng / 1e5 })
  }
  return coords
}

async function fetchOSRMRoute(waypoints, signal) {
  const coordStr = waypoints.map((w) => `${w.lng},${w.lat}`).join(';')
  const url = `https://router.project-osrm.org/route/v1/foot/${coordStr}?overview=full&geometries=polyline`
  const res = await fetch(url, { signal })
  const data = await res.json()
  if (!data.routes || data.routes.length === 0) return null
  const r = data.routes[0]
  return {
    coordinates: decodePolyline(r.geometry),
    distance: r.distance,
  }
}

function generateAvoidanceWaypoints(from, to, dangerZones) {
  const midLat = (from.lat + to.lat) / 2
  const midLng = (from.lng + to.lng) / 2

  const nearbyDangers = dangerZones.filter(
    (z) => haversineMetres(midLat, midLng, z.lat, z.lng) < 2000
  )

  if (nearbyDangers.length === 0) {
    const dLat = to.lat - from.lat
    const dLng = to.lng - from.lng
    const perpLat = -dLng
    const perpLng = dLat
    const norm = Math.sqrt(perpLat * perpLat + perpLng * perpLng) || 1
    const offset = 0.006
    return [
      { lat: midLat + (perpLat / norm) * offset, lng: midLng + (perpLng / norm) * offset },
      { lat: midLat - (perpLat / norm) * offset, lng: midLng - (perpLng / norm) * offset },
    ]
  }

  let avgDLat = 0, avgDLng = 0
  nearbyDangers.forEach((z) => {
    avgDLat += z.lat - midLat
    avgDLng += z.lng - midLng
  })
  avgDLat /= nearbyDangers.length
  avgDLng /= nearbyDangers.length

  const norm = Math.sqrt(avgDLat * avgDLat + avgDLng * avgDLng) || 1
  const offset = 0.006

  return [
    { lat: midLat - (avgDLat / norm) * offset, lng: midLng - (avgDLng / norm) * offset },
    { lat: midLat + (avgDLng / norm) * offset, lng: midLng - (avgDLat / norm) * offset },
  ]
}

export default function RoutingControl({ from, to, onRouteSelect, resetRef }) {
  const map = useMap()
  const layerGroupRef = useRef(L.layerGroup())
  const dangerLayerRef = useRef(L.layerGroup())
  const abortRef = useRef(null)
  const onRouteSelectRef = useRef(onRouteSelect)
  onRouteSelectRef.current = onRouteSelect

  useEffect(() => {
    if (!from || !to) return

    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    layerGroupRef.current.remove()
    layerGroupRef.current = L.layerGroup()
    layerGroupRef.current.addTo(map)

    dangerLayerRef.current.remove()
    dangerLayerRef.current = L.layerGroup()
    dangerLayerRef.current.addTo(map)

    async function run() {
      try {
        const [dangerZones, directRoute] = await Promise.all([
          fetchDangerZones(),
          fetchOSRMRoute([from, to], controller.signal),
        ])

        if (controller.signal.aborted) return
        if (!directRoute) return

        const avoidWaypoints = generateAvoidanceWaypoints(from, to, dangerZones)

        const altResults = await Promise.all(
          avoidWaypoints.map((wp) =>
            fetchOSRMRoute([from, wp, to], controller.signal).catch(() => null)
          )
        )

        if (controller.signal.aborted) return

        const allRoutes = [directRoute]
        altResults.forEach((r) => {
          if (r && Math.abs(r.distance - directRoute.distance) > 50) {
            allRoutes.push(r)
          }
        })

        const routesForFilter = allRoutes.map((r) => ({ coordinates: r.coordinates }))
        const safestIdx = filterSafestRoute(routesForFilter, dangerZones)
        const shortestIdx = findShortestIndex(allRoutes)

        // Pre-compute danger zones for each route
        const dangersPerRoute = allRoutes.map((r) =>
          getDangerZonesOnRoute(r.coordinates, dangerZones)
        )

        function showDangerMarkers(routeIdx) {
          dangerLayerRef.current.clearLayers()
          dangersPerRoute[routeIdx].forEach((zone) => {
            const marker = L.marker([zone.lat, zone.lng], { icon: dangerIcon })
            marker.bindPopup(
              `<div style="color:#EF4444;font-weight:bold;">⚠ ${zone.label}</div>
               <div style="color:#999;font-size:12px;">Danger radius: ${zone.radius_m}m</div>`
            )
            dangerLayerRef.current.addLayer(marker)
          })
        }

        layerGroupRef.current.clearLayers()

        // Store route metadata for highlighting
        const routeLines = [] // { line, index, isSafest, isShortest, originalColor }

        // Helper to highlight clicked route and dim all others
        function highlightRoute(clickedIdx) {
          routeLines.forEach(({ line, index, isSafest, isShortest, originalColor }) => {
            if (index === clickedIdx) {
              // Brighten clicked route
              const activeColor = isSafest ? GREEN : isShortest ? VIOLET : originalColor
              line.setStyle({ color: activeColor, weight: 7, opacity: 1 })
              line.bringToFront()
            } else {
              // Reduce opacity of others but keep them visible
              line.setStyle({
                color: originalColor,
                weight: isSafest ? 6 : isShortest ? 5 : 4,
                opacity: isSafest ? 0.5 : 0.3,
              })
            }
          })
        }

        // Draw routes — safest last so it's on top initially
        const routeOrder = allRoutes.map((_, i) => i).sort((a, b) =>
          a === safestIdx ? 1 : b === safestIdx ? -1 : 0
        )

        routeOrder.forEach((i) => {
          const r = allRoutes[i]
          const isSafest = i === safestIdx
          const isShortest = i === shortestIdx && i !== safestIdx
          const dangerCount = dangersPerRoute[i].length

          let color = VIOLET_DIM
          let weight = 5
          let opacity = 0.65

          if (isSafest) {
            color = GREEN
            weight = 7
            opacity = 1
          } else if (isShortest) {
            color = VIOLET
            weight = 6
            opacity = 0.85
          }

          const latLngs = r.coordinates.map((c) => [c.lat, c.lng])
          const line = L.polyline(latLngs, {
            color, weight, opacity,
            className: isSafest ? 'safest-route-glow' : '',
            interactive: true,
          })

          routeLines.push({ line, index: i, isSafest, isShortest, originalColor: color })

          let routeLabel = 'Alternative'
          if (isSafest) routeLabel = 'Safest Route'
          else if (isShortest) routeLabel = 'Shortest Route'

          line.on('click', () => {
            // Highlight this route, dim others
            highlightRoute(i)
            // Show route info with danger count
            onRouteSelectRef.current({
              label: routeLabel,
              time: formatTime(walkingTimeSeconds(r.distance)),
              distance: formatDistance(r.distance),
              dangerCount,
              dangerZones: dangersPerRoute[i].map((z) => z.label),
              color: isSafest ? GREEN : isShortest ? VIOLET : VIOLET_DIM,
              routeCoordinates: r.coordinates,
              fromCoords: from,
              toCoords: to,
            })
            showDangerMarkers(i)
          })

          layerGroupRef.current.addLayer(line)
        })

        // Helper to reset to default safest route view
        function resetToSafest() {
          // Restore original styles
          routeLines.forEach(({ line, isSafest, isShortest, originalColor }) => {
            if (isSafest) {
              line.setStyle({ color: GREEN, weight: 7, opacity: 1 })
              line.bringToFront()
            } else if (isShortest) {
              line.setStyle({ color: VIOLET, weight: 6, opacity: 0.85 })
            } else {
              line.setStyle({ color: originalColor, weight: 5, opacity: 0.65 })
            }
          })
          showDangerMarkers(safestIdx)
          onRouteSelectRef.current({
            label: 'Safest Route',
            time: formatTime(walkingTimeSeconds(allRoutes[safestIdx].distance)),
            distance: formatDistance(allRoutes[safestIdx].distance),
            dangerCount: dangersPerRoute[safestIdx].length,
            dangerZones: dangersPerRoute[safestIdx].map((z) => z.label),
            color: GREEN,
            routeCoordinates: allRoutes[safestIdx].coordinates,
            fromCoords: from,
            toCoords: to,
          })
        }

        // Expose reset function via ref
        if (resetRef) resetRef.current = resetToSafest

        showDangerMarkers(safestIdx)

        // Fit map to safest route
        const safestLatLngs = allRoutes[safestIdx].coordinates.map((c) => [c.lat, c.lng])
        map.fitBounds(L.latLngBounds(safestLatLngs).pad(0.1))

        // Auto-show safest route info
        onRouteSelectRef.current({
          label: 'Safest Route',
          time: formatTime(walkingTimeSeconds(allRoutes[safestIdx].distance)),
          distance: formatDistance(allRoutes[safestIdx].distance),
          dangerCount: dangersPerRoute[safestIdx].length,
          dangerZones: dangersPerRoute[safestIdx].map((z) => z.label),
          color: GREEN,
          routeCoordinates: allRoutes[safestIdx].coordinates,
          fromCoords: from,
          toCoords: to,
        })
      } catch (err) {
        if (err.name !== 'AbortError') console.error('[Saathi] Routing error:', err)
      }
    }

    run()

    return () => {
      controller.abort()
      layerGroupRef.current.remove()
      dangerLayerRef.current.remove()
    }
  }, [map, from, to])

  return null
}
