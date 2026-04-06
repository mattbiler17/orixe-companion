import { Link, Outlet } from 'react-router-dom'
import './appShell.css'

export default function AppShell() {
  return (
    <div>
      <header style={{padding:12,borderBottom:'1px solid #eee'}}>
        <nav style={{display:'flex',gap:12}}>
          <Link to="/">Home</Link>
          <Link to="/setup">Setup</Link>
          <Link to="/table">Table</Link>
          <Link to="/bids">Bids</Link>
          <Link to="/results">Results</Link>
          <Link to="/summary">Summary</Link>
          <Link to="/rules">Rules</Link>
        </nav>
      </header>
      <main style={{padding:16}}>
        <Outlet />
      </main>
    </div>
  )
}
