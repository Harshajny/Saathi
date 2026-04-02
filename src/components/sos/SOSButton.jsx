import { useState } from 'react'
import { createPortal } from 'react-dom'
import { fetchPoliceStations, findNearestStation } from '../../lib/policeStations'

export default function SOSButton() {
  const [active, setActive] = useState(false)
  const [nearest, setNearest] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSOS = () => {
    setActive(true)
    document.getElementById('root').classList.add('sos-blur')
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
    document.getElementById('root').classList.remove('sos-blur')
  }

  return (
    <>
      <button
        onClick={handleSOS}
        className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 hover:bg-red-500 text-white transition-all hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse hover:animate-none"
      >
        SOS
      </button>

      {active && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70">
          <div className="bg-slate-950 border border-red-600/50 rounded-xl p-6 w-[90%] max-w-sm text-center shadow-[0_0_40px_rgba(239,68,68,0.25)]">
            <h2 className="text-xl font-bold text-red-400 mb-4">SOS Activated</h2>

            {loading && (
              <p className="text-slate-400 animate-pulse">Locating nearest police station...</p>
            )}

            {error && (
              <div className="space-y-3">
                <p className="text-red-400">{error}</p>
                <a
                  href="tel:112"
                  className="block w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg text-center transition-all shadow-[0_0_20px_rgba(52,211,153,0.3)]"
                >
                  Call 112 (Emergency)
                </a>
              </div>
            )}

            {nearest && (
              <div className="space-y-3">
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Nearest Station</p>
                  <p className="text-white font-semibold text-lg">{nearest.station.name}</p>
                  <p className="text-slate-400 text-sm">
                    {(nearest.distanceMetres / 1000).toFixed(1)} km away
                  </p>
                </div>

                <div className="text-slate-300 text-sm font-mono">
                  {nearest.station.phone || '112'}
                </div>

                <a
                  href={`tel:${nearest.station.phone || '112'}`}
                  className="block w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg text-center transition-all shadow-[0_0_20px_rgba(52,211,153,0.3)]"
                >
                  Call Now
                </a>

                {(!nearest.station.phone || nearest.station.phone === '112') && (
                  <p className="text-slate-500 text-xs">
                    Station phone unavailable — calling India Emergency (112)
                  </p>
                )}
              </div>
            )}

            <button
              onClick={handleClose}
              className="mt-6 px-5 py-2 rounded-lg border border-slate-600 text-slate-400 hover:text-white hover:border-slate-400 transition-all text-sm"
            >
              Close
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
