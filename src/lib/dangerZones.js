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
 * Return danger zones that fall within `thresholdMetres` of any point on a route.
 */
export function getDangerZonesOnRoute(routeCoords, dangerZones, thresholdMetres = 500) {
  const matched = []
  for (const zone of dangerZones) {
    for (const pt of routeCoords) {
      if (haversineMetres(pt.lat, pt.lng, zone.lat, zone.lng) <= thresholdMetres) {
        matched.push(zone)
        break
      }
    }
  }
  return matched
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
    const dangerCount = getDangerZonesOnRoute(coords, dangerZones).length
    if (dangerCount < bestCount) {
      bestCount = dangerCount
      bestIndex = i
    }
  })

  return bestIndex
}
