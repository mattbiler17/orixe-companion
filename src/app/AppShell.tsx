import { NavLink, Outlet } from 'react-router-dom'
import './appShell.css'

const NAV_ITEMS = [
  { to: '/', label: 'Home' },
  { to: '/setup', label: 'Setup' },
  { to: '/table', label: 'Table' },
  { to: '/summary', label: 'Summary' },
  { to: '/rules', label: 'Rules' },
] as const

export default function AppShell() {
  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <div className="app-shell__bar">
          <div className="app-shell__brand">
            <h1 className="app-shell__title">Orixe Ledger</h1>
            <p className="app-shell__subtitle">Orixe Labs</p>
          </div>
          <nav className="app-shell__nav">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'active' : undefined)} end={item.to === '/'}>
                <span className="app-shell__nav-label">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="app-shell__main">
        <Outlet />
      </main>
    </div>
  )
}
