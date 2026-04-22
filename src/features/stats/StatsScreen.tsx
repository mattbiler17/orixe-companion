import { JewelBox } from '../../components/ui'
import { loadCompletedGameRecords } from '../../lib/completedGamesStorage'
import { summarizeCompletedGames } from '../../lib/stats'

function formatPercent(value: number): string {
  return `${value.toFixed(value % 1 === 0 ? 0 : 2)}%`
}

function formatNumber(value: number): string {
  return value.toFixed(value % 1 === 0 ? 0 : 2)
}

function formatStreak(playerName: string, count: number): string {
  return `${playerName} (${count})`
}

export default function StatsScreen() {
  const records = loadCompletedGameRecords()
  const summaries = summarizeCompletedGames(records)
  const duelSummaries = Object.values(summaries.duelHeadToHead).sort((left, right) => right.totalGames - left.totalGames)
  const multiplayerCounts = [3, 4, 5] as const

  if (records.length === 0) {
    return (
      <section className="app-screen">
        <JewelBox className="orixe-screen-header">
          <div className="app-stack">
            <p className="app-kicker">Stats</p>
            <h2 className="app-section-title">Completed Games</h2>
          </div>
        </JewelBox>

        <JewelBox className="orixe-stats-empty">
          <div className="app-stack">
            <p className="app-kicker">No History</p>
            <h2 className="app-section-title">No completed games yet</h2>
            <p className="app-copy">Finish a game and the results will appear here automatically.</p>
          </div>
        </JewelBox>
      </section>
    )
  }

  const totalDuelGames = duelSummaries.reduce((sum, summary) => sum + summary.totalGames, 0)

  return (
    <section className="app-screen">
      <JewelBox className="orixe-screen-header">
        <div className="orixe-screen-header-row">
          <div className="app-stack">
            <p className="app-kicker">Stats</p>
            <h2 className="app-section-title">Completed Games</h2>
          </div>
          <div className="orixe-summary-total">
            <span className="orixe-summary-total-label">Total Games</span>
            <span className="orixe-summary-total-value">{summaries.totalGames}</span>
          </div>
        </div>
      </JewelBox>

      <JewelBox>
        <div className="app-stack">
          <div className="orixe-screen-header-row">
            <div className="app-stack">
              <p className="app-kicker">Duel</p>
              <h3 className="orixe-summary-section-title">Head To Head</h3>
            </div>
            <div className="orixe-badge-row">
              <span className="orixe-badge">Games {totalDuelGames}</span>
            </div>
          </div>

          {duelSummaries.length > 0 ? (
            <div className="orixe-stats-stack">
              {duelSummaries.map((summary) => (
                <div key={summary.pairKey} className="orixe-judgment-card">
                  <div className="orixe-summary-card-accent">
                    <strong>{summary.players.join(' vs ')}</strong>
                    <span className="orixe-badge">Games {summary.totalGames}</span>
                  </div>

                  <div className="orixe-stats-grid orixe-stats-grid--duel">
                    {summary.players.map((playerName) => (
                      <div key={playerName} className="orixe-jewel-subbox">
                        <span className="orixe-jewel-subbox-label">{playerName}</span>
                        <div className="orixe-summary-stat">
                          <span className="orixe-summary-stat-value">{summary.winsByPlayer[playerName]}</span>
                          <span className="app-muted">Wins</span>
                        </div>
                        <div className="orixe-summary-stat">
                          <span className="orixe-summary-stat-label">Win Rate</span>
                          <span className="orixe-entry-player">{formatPercent(summary.winRateByPlayer[playerName])}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="orixe-stats-grid orixe-stats-grid--meta">
                    <div className="orixe-jewel-subbox">
                      <span className="orixe-jewel-subbox-label">Average Margin</span>
                      <span className="orixe-entry-player">{formatNumber(summary.averageMargin)}</span>
                    </div>
                    <div className="orixe-jewel-subbox">
                      <span className="orixe-jewel-subbox-label">Largest Margin</span>
                      <span className="orixe-entry-player">{formatNumber(summary.largestMargin)}</span>
                    </div>
                    <div className="orixe-jewel-subbox">
                      <span className="orixe-jewel-subbox-label">Current Streak</span>
                      <span className="orixe-entry-player">
                        {summary.currentStreak
                          ? formatStreak(summary.currentStreak.playerName, summary.currentStreak.count)
                          : 'None'}
                      </span>
                    </div>
                    <div className="orixe-jewel-subbox">
                      <span className="orixe-jewel-subbox-label">Longest Streak</span>
                      <span className="orixe-entry-player">
                        {summary.longestStreak
                          ? formatStreak(summary.longestStreak.playerName, summary.longestStreak.count)
                          : 'None'}
                      </span>
                    </div>
                  </div>

                  {summary.mostRecentWinner ? (
                    <div className="orixe-badge-row">
                      <span className="orixe-badge suit-badge suit-wheels">Most Recent {summary.mostRecentWinner}</span>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="orixe-jewel-subbox">
              <span className="orixe-jewel-subbox-label">Duel</span>
              <span className="app-copy">No completed duel games yet.</span>
            </div>
          )}
        </div>
      </JewelBox>

      {multiplayerCounts.map((playerCount) => {
        const summary = summaries.multiplayerByPlayerCount[playerCount]

        return (
          <JewelBox key={playerCount}>
            <div className="app-stack">
              <div className="orixe-screen-header-row">
                <div className="app-stack">
                  <p className="app-kicker">Multiplayer</p>
                  <h3 className="orixe-summary-section-title">{playerCount} Players</h3>
                </div>
                <div className="orixe-badge-row">
                  <span className="orixe-badge">Games {summary.totalGames}</span>
                </div>
              </div>

              {summary.players.length > 0 ? (
                <div className="orixe-stats-stack">
                  {summary.players.map((player) => (
                    <div key={`${playerCount}-${player.playerName}`} className="orixe-judgment-card">
                      <div className="orixe-summary-card-accent">
                        <strong>{player.playerName}</strong>
                        <span className="orixe-summary-stat-value">{player.wins}</span>
                      </div>

                      <div className="orixe-stats-grid orixe-stats-grid--multiplayer">
                        <div className="orixe-jewel-subbox">
                          <span className="orixe-jewel-subbox-label">Win Rate</span>
                          <span className="orixe-entry-player">{formatPercent(player.winRate)}</span>
                        </div>
                        <div className="orixe-jewel-subbox">
                          <span className="orixe-jewel-subbox-label">Avg Finish</span>
                          <span className="orixe-entry-player">{formatNumber(player.averageFinishingPosition)}</span>
                        </div>
                        <div className="orixe-jewel-subbox">
                          <span className="orixe-jewel-subbox-label">Avg Score</span>
                          <span className="orixe-entry-player">{formatNumber(player.averageScore)}</span>
                        </div>
                        <div className="orixe-jewel-subbox">
                          <span className="orixe-jewel-subbox-label">Best Score</span>
                          <span className="orixe-entry-player">{formatNumber(player.bestScore)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="orixe-jewel-subbox">
                  <span className="orixe-jewel-subbox-label">{playerCount} Players</span>
                  <span className="app-copy">No completed {playerCount}-player multiplayer games yet.</span>
                </div>
              )}
            </div>
          </JewelBox>
        )
      })}
    </section>
  )
}
