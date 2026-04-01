import { supabase } from './supabase'
import { haversineMetres } from './geo'

let cachedDangerZones = null

/**
 * Fetch all danger zones from Supabase (cached per session).
 */
export async function fetchDangerZones() {
  if (cachedDangerZones) return cachedDangerZones

  const { data, error } = await supabase
    .from('danger_zones')
    .select('id, lat, lng, label, radius_m')

  if (error) {
    console.error('Failed to fetch danger zones:', error.message)
    return []
  }
  cachedDangerZones = data
  return data
}

/**
 * Count how many danger zones fall within `thresholdMetres` of any point on a route.
 */
function countDangersOnRoute(routeCoords, dangerZones, thresholdMetres = 500) {
  let count = 0
  for (const zone of dangerZones) {
    for (const pt of routeCoords) {
      if (haversineMetres(pt.lat, pt.lng, zone.lat, zone.lng) <= thresholdMetres) {
        count++
        break
      }
    }
  }
  return count
}

/**
 * Return the index of the safest route (fewest danger zones within 500 m).
 */
export function filterSafestRoute(routes, dangerZones) {
  if (!routes.length) return 0

  let bestIndex = 0
  let bestCount = Infinity

  routes.forEach((route, i) => {
    const coords = route.coordinates || []
    const dangerCount = countDangersOnRoute(coords, dangerZones)
    if (dangerCount < bestCount) {
      bestCount = dangerCount
      bestIndex = i
    }
  })

  return bestIndex
}
