import { useState } from 'react'
import { fetchPoliceStations, findNearestStation } from '../../lib/policeStations'

export default function SOSButton() {
  const [active, setActive] = useState(false)
  const [nearest, setNearest] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSOS = () => {
    setActive(true)
    setError(null)
    setNearest(null)
    setLoading(true)

    if (!navigator.geolocation) {
      setError('Geolocation not supported by your browser.')
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        const stations = await fetchPoliceStations()
        const result = findNearestStation(latitude, longitude, stations)
        if (result) {
          setNearest(result)
        } else {
          setError('No police stations found in our database yet.')
        }
        setLoading(false)
      },
      () => {
        setError('Location access denied. Please enable GPS.')
        setLoading(false)
      }
    )
  }

  const handleClose = () => {
    setActive(false)
    setNearest(null)
    setError(null)
  }

  return (
    <>
      <button
        onClick={handleSOS}
        className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 hover:bg-red-500 text-white transition-all hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse hover:animate-none"
      >
        SOS
      </button>

      {active && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-red-600/50 rounded-xl p-6 w-[90%] max-w-sm text-center shadow-[0_0_40px_rgba(239,68,68,0.25)]">
            <h2 className="text-xl font-bold text-red-400 mb-4">SOS Activated</h2>

            {loading && (
              <p className="text-zinc-400 animate-pulse">Locating nearest police station...</p>
            )}

            {error && <p className="text-red-400">{error}</p>}

            {nearest && (
              <div className="space-y-2">
                <p className="text-white font-semibold text-lg">{nearest.station.name}</p>
                <p className="text-zinc-400 text-sm">
                  {(nearest.distanceMetres / 1000).toFixed(1)} km away
                </p>
                {nearest.station.phone && (
                  <a
                    href={`tel:${nearest.station.phone}`}
                    className="inline-block mt-2 px-5 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white font-semibold transition-all"
                  >
                    Call {nearest.station.phone}
                  </a>
                )}
                <p className="text-zinc-500 text-xs mt-2">
                  Lat: {nearest.station.lat}, Lng: {nearest.station.lng}
                </p>
              </div>
            )}

            <button
              onClick={handleClose}
              className="mt-6 px-5 py-2 rounded-lg border border-zinc-600 text-zinc-400 hover:text-white hover:border-zinc-400 transition-all text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}
