import { Link } from 'react-router-dom'
import SOSButton from '../sos/SOSButton'

export default function Header() {
  return (
    <header className="relative z-10 flex items-center justify-between px-8 py-5">
      <Link to="/" className="text-xl font-bold tracking-tight">
        <span className="text-white">Saa</span>
        <span className="text-violet-400">thi</span>
      </Link>

      <nav className="flex items-center gap-6">
        <Link to="/map" className="text-sm text-zinc-400 hover:text-violet-400 transition-colors">
          Map
        </Link>
        <Link to="/report" className="text-sm text-zinc-400 hover:text-violet-400 transition-colors">
          Report
        </Link>
        <SOSButton />
      </nav>
    </header>
  )
}
