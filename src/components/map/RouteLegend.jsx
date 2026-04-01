export default function RouteLegend() {
  return (
    <div className="absolute bottom-6 left-4 z-[1000] bg-zinc-900/90 backdrop-blur-sm border border-zinc-700/50 rounded-lg px-4 py-3 text-sm">
      <div className="text-zinc-400 font-semibold mb-2 text-xs uppercase tracking-wide">Routes</div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="w-6 h-1 rounded-full bg-green-500 inline-block"></span>
          <span className="text-green-400">Safest Route</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-6 h-1 rounded-full bg-violet-500 inline-block"></span>
          <span className="text-violet-400">Shortest Route</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-6 h-1 rounded-full bg-violet-500/60 inline-block"></span>
          <span className="text-zinc-500">Alternative</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-base">💀</span>
          <span className="text-red-400">Danger Zone</span>
        </div>
      </div>
    </div>
  )
}
