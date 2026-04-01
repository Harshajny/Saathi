import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-6">
      <h1 className="text-5xl font-bold tracking-tight mb-4">
        Your Safety, <span className="text-violet-400">Our Priority</span>
      </h1>
      <p className="text-zinc-400 text-lg max-w-md mb-8 leading-relaxed">
        Real-time safe routes, instant SOS alerts, and community-powered safety reporting.
      </p>
      <div className="flex gap-4">
        <Link to="/map" className="px-6 py-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-all hover:shadow-[0_0_24px_rgba(139,92,246,0.35)]">
          Open Map
        </Link>
        <button className="px-6 py-3 rounded-lg border border-violet-600/40 text-violet-400 font-semibold hover:bg-violet-600/10 transition-all">
          Learn More
        </button>
      </div>
    </div>
  )
}
