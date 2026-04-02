import { Link } from 'react-router-dom'
import SOSButton from '../sos/SOSButton'

export default function Header() {
  return (
    <header className="relative z-10 flex items-center justify-between px-8 py-5">
      <Link to="/" className="text-xl font-bold tracking-tight">
        <span className="text-white">Saa</span>
        <span className="text-sky-400">thi</span>
      </Link>

      <nav className="flex items-center gap-6">
        <Link to="/map" className="text-sm text-slate-400 hover:text-sky-400 transition-colors">
          Map
        </Link>
        <SOSButton />
      </nav>
    </header>
  )
}
