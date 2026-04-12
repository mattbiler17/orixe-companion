import { JewelBox, JewelButton } from '../../components/ui'
import type { DuelHandInput, DuelHandResult, MultiplayerHandInput, MultiplayerHandResult } from '../../models/orixe'
import useSession from '../../hooks/useSession'

type SummaryRow = {
  playerId: string
  label: string
  bidLabel: string
  tricksLabel: string
  contractStatus: string
  showBags: boolean
  bagPenaltyApplied: boolean
  newBagTotal: number
  updatedTotal: number
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
        <div className="orixe-panel">
          <div className="orixe-panel-body app-stack">
            <h2 className="app-section-title">No Hand Summary Yet</h2>
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

            return {
              playerId: breakdown.playerId,
              label: getPlayerName(breakdown.playerId, session.players),
              bidLabel: String(bid),
              tricksLabel: String(tricksWon),
              contractStatus:
                bid === 0 ? (tricksWon === 0 ? 'Held' : 'Failed') : tricksWon >= bid ? 'Made' : 'Missed',
              showBags: true,
              bagPenaltyApplied: breakdown.bagPenaltyApplied,
              newBagTotal: breakdown.newBagTotal,
              updatedTotal: session.scoresByPlayer[breakdown.playerId] ?? 0,
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
              contractStatus: result.declarer.contractMade ? 'Made' : 'Failed',
              showBags: true,
              bagPenaltyApplied: result.declarer.bagPenaltyApplied,
              newBagTotal: result.declarer.newBagTotal,
              updatedTotal: session.scoresByPlayer[result.declarer.playerId] ?? 0,
            },
            {
              playerId: result.defender.playerId,
              label: getPlayerName(result.defender.playerId, session.players),
              bidLabel: 'Defender',
              tricksLabel: '-',
              contractStatus: 'Defended',
              showBags: false,
              bagPenaltyApplied: false,
              newBagTotal: session.bagsByPlayer[result.defender.playerId] ?? 0,
              updatedTotal: session.scoresByPlayer[result.defender.playerId] ?? 0,
            },
          ]
        })()

  return (
    <section className="app-screen">
      <JewelBox>
        <div className="app-stack">
          <h2 className="app-section-title">Summary</h2>
          <div className="orixe-inline-meta">
            <span className="orixe-meta-chip">Rung {latestEntry.input.handSize ?? latestEntry.handId}</span>
          </div>
        </div>
      </JewelBox>

      <JewelBox className="orixe-summary-trump-box">
        <div className="app-stack">
          <p className="orixe-summary-section-kicker">Trump</p>
          <div className="orixe-badge-row">
            {latestEntry.input.trump ? (
              <span className={`orixe-badge suit-badge suit-${latestEntry.input.trump} orixe-summary-trump-badge`}>
                {latestEntry.input.trump}
              </span>
            ) : (
              <span className="orixe-badge">Unset</span>
            )}
          </div>
        </div>
      </JewelBox>

      <JewelBox>
        <div className="app-stack">
          <p className="app-kicker">Bids</p>
          <div className="orixe-judgment-grid">
            {summaryRows.map((row) => (
              <div key={`${row.playerId}-contract`} className="orixe-judgment-card">
                <strong>{row.label}</strong>
                <div className="orixe-badge-row">
                  <span className="orixe-badge">Bid {row.bidLabel}</span>
                  <span className="orixe-badge">Tricks {row.tricksLabel}</span>
                </div>
                <div className="orixe-summary-stat">
                  <span className="orixe-summary-stat-label">Verdict</span>
                  <span className="orixe-summary-stat-value">{row.contractStatus}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </JewelBox>

      <JewelBox>
        <div className="app-stack">
          <p className="app-kicker">Score</p>
          <div className="orixe-judgment-grid">
            {summaryRows.map((row) => (
              <div key={`${row.playerId}-score`} className="orixe-judgment-card">
                <strong>{row.label}</strong>
                <div className="orixe-summary-stat">
                  <span className="orixe-summary-stat-label">Total Score</span>
                  <span className="orixe-summary-stat-value">{row.updatedTotal}</span>
                </div>
                {(row.showBags || row.bagPenaltyApplied) && (
                  <div className="orixe-badge-row">
                    {row.showBags ? <span className="orixe-badge">Bags {row.newBagTotal}</span> : null}
                    {row.bagPenaltyApplied ? <span className="orixe-badge orixe-badge-danger">Bag Penalty</span> : null}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </JewelBox>

      <JewelButton to="/table">Next Hand</JewelButton>
    </section>
  )
}
