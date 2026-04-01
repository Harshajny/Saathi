import { Outlet } from 'react-router-dom'
import Header from './Header'
import PerspectiveGrid from './PerspectiveGrid'

export default function AppLayout() {
  return (
    <div className="min-h-screen relative">
      <PerspectiveGrid />
      <div className="relative z-10">
        <Header />
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
