import { Link } from 'react-router-dom'
import { getRungName } from '../../engine/rungs'
import useSession from '../../hooks/useSession'

export default function TableScreen() {
  const session = useSession((state) => state.session)

  if (!session.id || session.players.length === 0) {
    return (
      <section className="app-screen">
        <div className="orixe-braid-panel">
          <div className="orixe-panel-body app-stack">
            <p className="app-kicker">No Active Session</p>
            <h2 className="app-section-title">Open A Table First</h2>
            <p className="app-copy">Create a session before using the command center.</p>
            <Link to="/setup" className="orixe-button">
              Go To Setup
            </Link>
          </div>
        </div>
      </section>
    )
  }

  const dealerName = session.players[session.dealerSeat]?.name ?? 'Unknown'
  const rungName = getRungName(session.currentRungIndex)

  return (
    <section className="app-screen">
      <div className="orixe-braid-panel orixe-hero">
        <div className="orixe-panel-body">
          <div className="orixe-grid-2">
            <div className="app-stack">
              <p className="app-kicker">Command Center</p>
              <h2 className="app-section-title">Current Table</h2>
              <div className="orixe-inline-meta">
                <span className="orixe-meta-chip">Mode {session.mode}</span>
                <span className="orixe-meta-chip">{rungName}</span>
                <span className="orixe-meta-chip">Hand Size {session.currentHandSize ?? 'Complete'}</span>
              </div>
            </div>

            <div className="orixe-detail-grid">
              <div className="orixe-detail-row">
                <span className="orixe-detail-label">Dealer</span>
                <span>{dealerName}</span>
              </div>
              <div className="orixe-detail-row">
                <span className="orixe-detail-label">Status</span>
                <span>{session.isComplete ? 'Complete' : 'In Progress'}</span>
              </div>
              <div className="orixe-detail-row">
                <span className="orixe-detail-label">Current Hand</span>
                <span>{session.currentHand ? 'Pre-hand recorded' : 'Not started'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="orixe-grid-2">
        <div className="orixe-braid-panel">
          <div className="orixe-panel-body app-stack">
            <p className="app-kicker">Scores & Bags</p>
            <div className="orixe-scoreboard">
              {session.players.map((player) => (
                <div key={player.id} className="orixe-score-row">
                  <strong>{player.name}</strong>
                  <span className="orixe-score-value">Score {session.scoresByPlayer[player.id] ?? 0}</span>
                  <span className="orixe-score-value">Bags {session.bagsByPlayer[player.id] ?? 0}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="orixe-panel">
          <div className="orixe-panel-body app-stack">
            <p className="app-kicker">Actions</p>
            <div className="orixe-action-row">
              {!session.isComplete ? (
                <Link to={session.currentHand ? '/results' : '/bids'} className="orixe-button">
                  {session.currentHand ? 'Enter Tricks And Primes' : 'Begin Hand'}
                </Link>
              ) : null}
              <Link to="/rules" className="orixe-button-secondary">
                View Rules
              </Link>
            </div>
            <p className="app-copy">
              The table view stays focused on durable information only, so Trump stays out of sight until the hand has
              been named.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
