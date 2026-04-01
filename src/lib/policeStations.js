import { supabase } from './supabase'
import { haversineMetres } from './geo'

/**
 * Fetch all police stations from Supabase.
 */
export async function fetchPoliceStations() {
  const { data, error } = await supabase
    .from('police_stations')
    .select('id, name, lat, lng, phone')

  if (error) {
    console.error('Failed to fetch police stations:', error.message)
    return []
  }
  return data
}

/**
 * Find the nearest police station to the given coordinates.
 * Returns { station, distanceMetres } or null if no stations available.
 */
export function findNearestStation(lat, lng, stations) {
  if (!stations.length) return null

  let nearest = null
  let minDist = Infinity

  for (const s of stations) {
    const d = haversineMetres(lat, lng, s.lat, s.lng)
    if (d < minDist) {
      minDist = d
      nearest = s
    }
  }

  return { station: nearest, distanceMetres: Math.round(minDist) }
}
