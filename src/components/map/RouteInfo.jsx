function buildGoogleMapsUrl(fromCoords, toCoords, routeCoordinates) {
  const coords = routeCoordinates || []

  // Use path-based format: /maps/dir/origin/wp1/wp2/.../destination
  // The api=1 format does NOT support waypoints — only the path format does
  const maxWaypoints = 8
  const waypoints = []
  if (coords.length > 2) {
    const step = coords.length / (maxWaypoints + 1)
    for (let i = 1; i <= maxWaypoints; i++) {
      const idx = Math.min(Math.floor(step * i), coords.length - 1)
      waypoints.push(coords[idx])
    }
  }

  let url = `https://www.google.com/maps/dir/${fromCoords.lat},${fromCoords.lng}`
  waypoints.forEach((wp) => {
    url += `/${wp.lat},${wp.lng}`
  })
  url += `/${toCoords.lat},${toCoords.lng}`

  return url
}

export default function RouteInfo({ info, onShowSafest }) {
  const showResetButton = info.label !== 'Safest Route' && onShowSafest

  return (
    <div className="absolute top-28 right-4 z-[1000] bg-slate-950/90 backdrop-blur-sm border border-slate-700/50 rounded-lg text-sm
      px-3 py-2 min-w-[120px]
      md:px-4 md:py-3 md:min-w-[200px] md:max-w-[280px] md:top-32"
    >
      {/* Compact: phone/tablet */}
      <div className="md:hidden">
        <div className="font-semibold text-xs" style={{ color: info.color }}>
          {info.label}
        </div>
        <div className="text-white text-base font-bold">{info.time}</div>
        <div className="text-slate-400 text-xs">{info.distance}</div>
        {info.routeCoordinates && (
          <button
            onClick={() => window.open(buildGoogleMapsUrl(info.fromCoords, info.toCoords, info.routeCoordinates), '_blank')}
            className="mt-2 w-full px-2 py-1.5 rounded-md bg-sky-600/20 border border-sky-500/40 text-sky-400 text-xs font-semibold hover:bg-sky-600/30 transition-all"
          >
            Navigate in Google Maps
          </button>
        )}
        {showResetButton && (
          <button
            onClick={onShowSafest}
            className="mt-2 w-full px-2 py-1.5 rounded-md bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 text-xs font-semibold hover:bg-emerald-600/30 transition-all"
          >
            Show Safe Route
          </button>
        )}
      </div>

      {/* Full: desktop */}
      <div className="hidden md:block">
        <div className="font-semibold mb-1" style={{ color: info.color }}>
          {info.label}
        </div>
        <div className="text-white text-lg font-bold">{info.time}</div>
        <div className="text-slate-400 text-xs mb-2">{info.distance}</div>

        {info.dangerCount > 0 ? (
          <div>
            <div className="text-rose-400 font-semibold text-xs flex items-center gap-1 mb-1">
              <span className="font-bold">✕</span> {info.dangerCount} danger zone{info.dangerCount !== 1 ? 's' : ''} nearby
            </div>
            <ul className="text-slate-500 text-xs space-y-0.5 max-h-32 overflow-y-auto">
              {info.dangerZones.map((name, i) => (
                <li key={i} className="truncate">• {name}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="text-emerald-400 text-xs font-semibold flex items-center gap-1">
            <span>✓</span> No danger zones on this route
          </div>
        )}

        {info.routeCoordinates && (
          <button
            onClick={() => window.open(buildGoogleMapsUrl(info.fromCoords, info.toCoords, info.routeCoordinates), '_blank')}
            className="mt-3 w-full px-3 py-2 rounded-md bg-sky-600/20 border border-sky-500/40 text-sky-400 text-xs font-semibold hover:bg-sky-600/30 transition-all"
          >
            Navigate in Google Maps
          </button>
        )}

        {showResetButton && (
          <button
            onClick={onShowSafest}
            className="mt-3 w-full px-3 py-2 rounded-md bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 text-xs font-semibold hover:bg-emerald-600/30 transition-all"
          >
            Show Safe Route
          </button>
        )}
      </div>
    </div>
  )
}
