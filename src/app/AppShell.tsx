import { Link, Outlet } from 'react-router-dom'
import './appShell.css'

export default function AppShell() {
  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <div className="app-shell__bar">
          <div className="app-shell__brand">
            <p className="app-shell__subtitle">Orixe Product Family</p>
            <h1 className="app-shell__title">Orixe Companion</h1>
          </div>
          <nav className="app-shell__nav">
            <Link to="/">Home</Link>
            <Link to="/setup">Setup</Link>
            <Link to="/table">Table</Link>
            <Link to="/bids">Pre-Hand</Link>
            <Link to="/results">Post-Hand</Link>
            <Link to="/summary">Summary</Link>
            <Link to="/rules">Rules</Link>
          </nav>
        </div>
      </header>
      <main className="app-shell__main">
        <Outlet />
      </main>
    </div>
  )
}
