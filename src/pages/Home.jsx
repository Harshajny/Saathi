import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-6">
      <h1 className="text-5xl font-bold tracking-tight mb-4">
        Your Safety, <span className="text-sky-400">Our Priority</span>
      </h1>
      <p className="text-slate-400 text-lg max-w-md mb-8 leading-relaxed">
        Real-time safe routes, instant SOS alerts, and community-powered safety reporting.
      </p>
      <Link to="/map" className="px-6 py-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold transition-all hover:shadow-[0_0_24px_rgba(14,165,233,0.35)]">
        Open Map
      </Link>
    </div>
  )
}
