export default function RouteLegend() {
  return (
    <div className="absolute bottom-6 left-4 z-[1000] bg-slate-950/90 backdrop-blur-sm border border-slate-700/50 rounded-lg px-4 py-3 text-sm">
      <div className="text-slate-400 font-semibold mb-2 text-xs uppercase tracking-wide">Routes</div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="w-6 h-1 rounded-full bg-emerald-400 inline-block"></span>
          <span className="text-emerald-400">Safest Route</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-6 h-1 rounded-full bg-amber-400 inline-block"></span>
          <span className="text-amber-400">Shortest Route</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-6 h-1 rounded-full bg-sky-500/60 inline-block"></span>
          <span className="text-slate-500">Alternative</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-rose-500">✕</span>
          <span className="text-rose-400">Danger Zone</span>
        </div>
      </div>
    </div>
  )
}
