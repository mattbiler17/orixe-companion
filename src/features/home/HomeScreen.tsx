import { Link } from 'react-router-dom'
import useSession from '../../hooks/useSession'

export default function HomeScreen() {
  const session = useSession((state) => state.session)
  const hasSession = Boolean(session.id)
  const dealerName =
    hasSession && session.players.length > 0 ? session.players[session.dealerSeat]?.name ?? 'Unknown' : null

  return (
    <section className="app-screen">
      <div className="orixe-braid-panel orixe-hero">
        <div className="orixe-panel-body app-stack">
          <p className="app-kicker">Fast Table Companion</p>
          <h2 className="app-section-title">Track The Hand, Keep The Table Moving</h2>
          <p className="app-copy" style={{ maxWidth: '54rem' }}>
            Built for live Orixe scoring with dark-table readability, quick hand entry, and a summary that matches the flow
            of real play.
          </p>
          <div className="orixe-inline-meta">
            <span className="orixe-meta-chip">Matte Black Table Mode</span>
            <span className="orixe-meta-chip">Pre-Hand To Post-Hand Flow</span>
            <span className="orixe-meta-chip">Scores And Bags Always Visible</span>
          </div>
          <div className="orixe-action-row">
            <Link to="/setup" className="orixe-button">
              Start New Session
            </Link>
            {hasSession ? (
              <Link to="/table" className="orixe-button-secondary">
                Resume Active Session
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      {hasSession ? (
        <div className="orixe-braid-panel">
          <div className="orixe-panel-body">
            <p className="app-kicker">Active Session</p>
            <div className="orixe-grid-2">
              <div className="app-stack">
                <h3 className="app-section-title" style={{ fontSize: '1.3rem' }}>Current Table State</h3>
                <div className="orixe-detail-grid">
                  <div className="orixe-detail-row">
                    <span className="orixe-detail-label">Mode</span>
                    <span>{session.mode}</span>
                  </div>
                  <div className="orixe-detail-row">
                    <span className="orixe-detail-label">Players</span>
                    <span>{session.players.map((player) => player.name).join(', ')}</span>
                  </div>
                  <div className="orixe-detail-row">
                    <span className="orixe-detail-label">Dealer</span>
                    <span>{dealerName}</span>
                  </div>
                  <div className="orixe-detail-row">
                    <span className="orixe-detail-label">Hand Size</span>
                    <span>{session.currentHandSize ?? 'Complete'}</span>
                  </div>
                </div>
              </div>

              <div className="app-stack">
                <h3 className="app-section-title" style={{ fontSize: '1.3rem' }}>Quick Status</h3>
                <div className="orixe-summary-grid">
                  {session.players.slice(0, 2).map((player) => (
                    <div key={player.id} className="orixe-summary-card">
                      <strong>{player.name}</strong>
                      <span className="app-muted">Score {session.scoresByPlayer[player.id] ?? 0}</span>
                      <span className="app-muted">Bags {session.bagsByPlayer[player.id] ?? 0}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
