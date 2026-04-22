import { Link } from 'react-router-dom'
import { JewelButton } from '../../components/ui'
import useSession from '../../hooks/useSession'

export default function TableScreen() {
  const session = useSession((state) => state.session)

  if (!session.id || session.players.length === 0) {
    return (
      <section className="app-screen">
        <div className="orixe-panel">
          <div className="orixe-panel-body app-stack">
            <p className="app-kicker">No Active Session</p>
            <h2 className="app-section-title">Open A Table First</h2>
            <Link to="/setup" className="orixe-button">
              Go To Setup
            </Link>
          </div>
        </div>
      </section>
    )
  }

  const activeHand = session.currentHand
  const activeDeclarerId = activeHand?.mode === 'duel' ? activeHand.declarerId : null

  return (
    <section className="app-screen">
      <div className="orixe-panel orixe-table-gradient-panel">
        <div className="orixe-panel-body orixe-table-gradient-fill" />
      </div>

      <div className="orixe-grid-2">
        <div className="orixe-panel">
          <div className="orixe-panel-body app-stack">
            <div className="orixe-table-strips">
              {session.players.map((player, index) => {
                const isDealer = session.players[session.dealerSeat]?.id === player.id
                const isDeclarer = activeDeclarerId === player.id
                const isActive = isDealer || isDeclarer

                return (
                  <div key={player.id} className={`orixe-score-strip${isActive ? ' is-active' : ''}`}>
                    <div className="orixe-score-strip-name">
                      <strong className="orixe-score-strip-player">{player.name}</strong>
                      <span className="orixe-score-strip-meta">Seat {index + 1}</span>
                    </div>
                    <div className="orixe-score-strip-score">
                      <span>Score</span>
                      <strong>{session.scoresByPlayer[player.id] ?? 0}</strong>
                    </div>
                    <div className="orixe-score-strip-bags">Bags {session.bagsByPlayer[player.id] ?? 0}</div>
                    <div className="orixe-status-row">
                      {isDealer ? <span className="orixe-badge suit-badge suit-shields">Dealer</span> : null}
                      {isDeclarer ? <span className="orixe-badge suit-badge suit-swords">Declarer</span> : null}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="orixe-panel">
          <div className="orixe-panel-body orixe-table-action-panel">
            {!session.isComplete ? (
              <JewelButton to={session.currentHand ? '/results' : '/bids'}>
                {session.currentHand ? 'Post Hand' : 'Lock Bid'}
              </JewelButton>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
