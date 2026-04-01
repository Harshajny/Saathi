function buildGoogleMapsUrl(fromCoords, toCoords, routeCoordinates) {
  const coords = routeCoordinates || []
  const waypoints = []

  if (coords.length > 4) {
    const step = Math.floor(coords.length / 4)
    waypoints.push(coords[step])
    waypoints.push(coords[step * 2])
    waypoints.push(coords[step * 3])
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
    <div className="absolute top-28 right-4 z-[1000] bg-zinc-900/90 backdrop-blur-sm border border-zinc-700/50 rounded-lg text-sm
      px-3 py-2 min-w-[120px]
      md:px-4 md:py-3 md:min-w-[200px] md:max-w-[280px] md:top-32"
    >
      {/* Compact: phone/tablet */}
      <div className="md:hidden">
        <div className="font-semibold text-xs" style={{ color: info.color }}>
          {info.label}
        </div>
        <div className="text-white text-base font-bold">{info.time}</div>
        <div className="text-zinc-400 text-xs">{info.distance}</div>
        {info.routeCoordinates && (
          <button
            onClick={() => window.open(buildGoogleMapsUrl(info.fromCoords, info.toCoords, info.routeCoordinates), '_blank')}
            className="mt-2 w-full px-2 py-1.5 rounded-md bg-blue-600/20 border border-blue-500/40 text-blue-400 text-xs font-semibold hover:bg-blue-600/30 transition-all"
          >
            Navigate in Google Maps
          </button>
        )}
        {showResetButton && (
          <button
            onClick={onShowSafest}
            className="mt-2 w-full px-2 py-1.5 rounded-md bg-green-600/20 border border-green-500/40 text-green-400 text-xs font-semibold hover:bg-green-600/30 transition-all"
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
        <div className="text-zinc-400 text-xs mb-2">{info.distance}</div>

        {info.dangerCount > 0 ? (
          <div>
            <div className="text-red-400 font-semibold text-xs flex items-center gap-1 mb-1">
              <span className="font-bold">✕</span> {info.dangerCount} danger zone{info.dangerCount !== 1 ? 's' : ''} nearby
            </div>
            <ul className="text-zinc-500 text-xs space-y-0.5 max-h-32 overflow-y-auto">
              {info.dangerZones.map((name, i) => (
                <li key={i} className="truncate">• {name}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="text-green-400 text-xs font-semibold flex items-center gap-1">
            <span>✓</span> No danger zones on this route
          </div>
        )}

        {info.routeCoordinates && (
          <button
            onClick={() => window.open(buildGoogleMapsUrl(info.fromCoords, info.toCoords, info.routeCoordinates), '_blank')}
            className="mt-3 w-full px-3 py-2 rounded-md bg-blue-600/20 border border-blue-500/40 text-blue-400 text-xs font-semibold hover:bg-blue-600/30 transition-all"
          >
            Navigate in Google Maps
          </button>
        )}

        {showResetButton && (
          <button
            onClick={onShowSafest}
            className="mt-3 w-full px-3 py-2 rounded-md bg-green-600/20 border border-green-500/40 text-green-400 text-xs font-semibold hover:bg-green-600/30 transition-all"
          >
            Show Safe Route
          </button>
        )}
      </div>
    </div>
  )
}
