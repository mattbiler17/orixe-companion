import { Link } from 'react-router-dom'
import type { DuelHandInput, DuelHandResult, MultiplayerHandInput, MultiplayerHandResult } from '../../models/orixe'
import useSession from '../../hooks/useSession'

type SummaryRow = {
  playerId: string
  label: string
  bidLabel: string
  tricksLabel: string
  enteredPrimes: number
  countedPrimes: number
  primeStatus: string
  scoreDelta: number
  bagGain: number
  bagPenaltyApplied: boolean
  newBagTotal: number
}

function getPlayerName(playerId: string, sessionPlayers: { id: string; name: string }[]): string {
  return sessionPlayers.find((player) => player.id === playerId)?.name ?? playerId
}

export default function HandSummaryScreen() {
  const session = useSession((state) => state.session)
  const latestEntry = session.history[session.history.length - 1]

  if (!latestEntry || !latestEntry.result) {
    return (
      <section className="app-screen">
        <div className="orixe-braid-panel">
          <div className="orixe-panel-body app-stack">
            <h2 className="app-section-title">No Hand Summary Yet</h2>
            <p className="app-copy">Enter a hand result to see the summary screen.</p>
          </div>
        </div>
      </section>
    )
  }

  const summaryRows: SummaryRow[] =
    latestEntry.mode === 'multiplayer'
      ? (() => {
          const input = latestEntry.input as MultiplayerHandInput
          const result = latestEntry.result as MultiplayerHandResult

          return result.breakdowns.map((breakdown) => {
            const playerInput = input.players.find((player) => player.playerId === breakdown.playerId)
            const bid = playerInput?.bid ?? 0
            const tricksWon = playerInput?.tricksWon ?? 0
            const enteredPrimes = playerInput?.primesCount ?? 0
            const primeStatus =
              breakdown.primePoints === 0 && enteredPrimes > 0
                ? bid === 0 && tricksWon === 0
                  ? 'Zeroed (zero bid, no tricks)'
                  : 'Zeroed (missed bid)'
                : 'Counted'

            return {
              playerId: breakdown.playerId,
              label: getPlayerName(breakdown.playerId, session.players),
              bidLabel: String(bid),
              tricksLabel: String(tricksWon),
              enteredPrimes,
              countedPrimes: breakdown.primePoints,
              primeStatus,
              scoreDelta: breakdown.totalDelta,
              bagGain: breakdown.bagGain,
              bagPenaltyApplied: breakdown.bagPenaltyApplied,
              newBagTotal: breakdown.newBagTotal,
            }
          })
        })()
      : (() => {
          const input = latestEntry.input as DuelHandInput
          const result = latestEntry.result as DuelHandResult

          return [
            {
              playerId: result.declarer.playerId,
              label: getPlayerName(result.declarer.playerId, session.players),
              bidLabel: String(input.declarerContract),
              tricksLabel: String(input.declarerTricksWon),
              enteredPrimes: input.declarerPrimesCount,
              countedPrimes: result.declarer.primePoints,
              primeStatus:
                result.declarer.primePoints === 0 && input.declarerPrimesCount > 0
                  ? 'Zeroed (failed contract)'
                  : 'Counted',
              scoreDelta: result.declarer.totalDelta,
              bagGain: result.declarer.bagGain,
              bagPenaltyApplied: result.declarer.bagPenaltyApplied,
              newBagTotal: result.declarer.newBagTotal,
            },
            {
              playerId: result.defender.playerId,
              label: getPlayerName(result.defender.playerId, session.players),
              bidLabel: 'Defender',
              tricksLabel: '-',
              enteredPrimes: input.defenderPrimesCount,
              countedPrimes: result.defender.primePoints,
              primeStatus: 'Counted',
              scoreDelta: result.defender.totalDelta,
              bagGain: 0,
              bagPenaltyApplied: false,
              newBagTotal: session.bagsByPlayer[result.defender.playerId] ?? 0,
            },
          ]
        })()

  return (
    <section className="app-screen">
      <div className="orixe-braid-panel">
        <div className="orixe-panel-body app-stack">
          <p className="app-kicker">Hand Summary</p>
          <h2 className="app-section-title">Completed Hand Review</h2>
          <div className="orixe-inline-meta">
            <span className="orixe-meta-chip">Hand {latestEntry.handId}</span>
            <span className="orixe-meta-chip">{session.isComplete ? 'Session Complete' : 'Next Hand Ready'}</span>
          </div>
        </div>
      </div>

      <div className="orixe-trump-panel">
        <div className="orixe-panel-body app-stack">
          <p className="app-kicker">Trump Used</p>
          <div className="orixe-badge-row">
            {latestEntry.input.trump ? (
              <span className={`orixe-badge suit-badge suit-${latestEntry.input.trump}`}>{latestEntry.input.trump}</span>
            ) : (
              <span className="orixe-badge">Unset</span>
            )}
          </div>
        </div>
      </div>

      <div className="orixe-summary-grid">
        {summaryRows.map((row) => (
          <div key={row.playerId} className="orixe-summary-card">
            <strong>{row.label}</strong>
            <div className="orixe-badge-row">
              <span className="orixe-badge">Bid / Role {row.bidLabel}</span>
              <span className="orixe-badge">Tricks {row.tricksLabel}</span>
            </div>
            <div className="orixe-detail-grid">
              <div className="orixe-detail-row">
                <span className="orixe-detail-label">Primes Entered</span>
                <span>{row.enteredPrimes}</span>
              </div>
              <div className="orixe-detail-row">
                <span className="orixe-detail-label">Primes Counted</span>
                <span>{row.countedPrimes}</span>
              </div>
              <div className="orixe-detail-row">
                <span className="orixe-detail-label">Updated Total</span>
                <span>{session.scoresByPlayer[row.playerId] ?? 0}</span>
              </div>
              <div className="orixe-detail-row">
                <span className="orixe-detail-label">Updated Bags</span>
                <span>{row.newBagTotal}</span>
              </div>
            </div>
            <div className="orixe-badge-row">
              <span className={`orixe-badge ${row.scoreDelta >= 0 ? 'orixe-badge-positive' : 'orixe-badge-danger'}`}>
                Delta {row.scoreDelta >= 0 ? `+${row.scoreDelta}` : row.scoreDelta}
              </span>
              <span className={`orixe-badge ${row.primeStatus.startsWith('Zeroed') ? 'orixe-badge-warning' : ''}`}>
                {row.primeStatus}
              </span>
              <span className="orixe-badge">Bag Change +{row.bagGain}</span>
              {row.bagPenaltyApplied ? <span className="orixe-badge orixe-badge-danger">Bag Penalty Applied</span> : null}
            </div>
          </div>
        ))}
      </div>

      {latestEntry.mode === 'duel' ? (
        <div className="orixe-panel">
          <div className="orixe-panel-body app-stack">
            <p className="app-kicker">Cache Detail</p>
            <div className="orixe-detail-grid">
              <div className="orixe-detail-row">
                <span className="orixe-detail-label">Cache Winner</span>
                <span>{(latestEntry.input as DuelHandInput).cacheWinner ?? 'None'}</span>
              </div>
              <div className="orixe-detail-row">
                <span className="orixe-detail-label">Cache Primes Entered</span>
                <span>{(latestEntry.input as DuelHandInput).cachePrimes ?? 0}</span>
              </div>
              <div className="orixe-detail-row">
                <span className="orixe-detail-label">Declarer Cache Counted</span>
                <span>{(latestEntry.result as DuelHandResult).declarer.cachePrimePoints}</span>
              </div>
              <div className="orixe-detail-row">
                <span className="orixe-detail-label">Defender Cache Counted</span>
                <span>{(latestEntry.result as DuelHandResult).defender.cachePrimePoints}</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <Link to="/table" className="orixe-button">
        {session.isComplete ? 'Back To Final Table' : 'Back To Table'}
      </Link>
    </section>
  )
}
