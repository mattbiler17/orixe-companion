import type {
  CompletedGameRecord,
  CompletedGameSummaries,
  DuelHeadToHeadSummary,
  MultiplayerCountSummary,
  MultiplayerPlayerSummary,
  WinStreakSummary,
} from '../models/stats'

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100
}

export function getDuelPairKey(playerA: string, playerB: string): string {
  return [playerA, playerB].sort((left, right) => left.localeCompare(right)).join(' vs ')
}

function getDuelWinner(record: CompletedGameRecord): string | null {
  if (record.mode !== 'duel' || record.finishingPositions.length < 2) {
    return null
  }

  const [first, second] = record.finishingPositions
  return first.score === second.score ? null : first.name
}

function getMargin(record: CompletedGameRecord): number {
  const [first, second] = record.finishingPositions
  if (!first || !second) {
    return 0
  }

  return Math.abs(first.score - second.score)
}

function getLongestStreak(winners: Array<string | null>): WinStreakSummary | null {
  let best: WinStreakSummary | null = null
  let currentPlayer: string | null = null
  let currentCount = 0

  winners.forEach((winner) => {
    if (!winner) {
      currentPlayer = null
      currentCount = 0
      return
    }

    if (winner === currentPlayer) {
      currentCount += 1
    } else {
      currentPlayer = winner
      currentCount = 1
    }

    if (!best || currentCount > best.count) {
      best = {
        playerName: winner,
        count: currentCount,
      }
    }
  })

  return best
}

function getCurrentStreak(winners: Array<string | null>): WinStreakSummary | null {
  const latestWinner = winners[winners.length - 1]
  if (!latestWinner) {
    return null
  }

  let count = 0
  for (let index = winners.length - 1; index >= 0; index -= 1) {
    if (winners[index] !== latestWinner) {
      break
    }

    count += 1
  }

  return {
    playerName: latestWinner,
    count,
  }
}

export function summarizeDuelHeadToHead(records: CompletedGameRecord[]): Record<string, DuelHeadToHeadSummary> {
  const duelGroups = records
    .filter((record) => record.mode === 'duel' && record.playerCount === 2)
    .reduce<Record<string, CompletedGameRecord[]>>((groups, record) => {
      const [playerA, playerB] = [...record.playerNames].sort((left, right) => left.localeCompare(right))
      const pairKey = getDuelPairKey(playerA, playerB)
      groups[pairKey] = [...(groups[pairKey] ?? []), record]
      return groups
    }, {})

  return Object.fromEntries(
    Object.entries(duelGroups).map(([pairKey, pairRecords]) => {
      const sortedRecords = [...pairRecords].sort((left, right) => left.completedAt.localeCompare(right.completedAt))
      const players = [...sortedRecords[0].playerNames].sort((left, right) => left.localeCompare(right)) as [string, string]
      const winsByPlayer = Object.fromEntries(players.map((player) => [player, 0])) as Record<string, number>
      const winners = sortedRecords.map(getDuelWinner)
      const margins = sortedRecords.map(getMargin)

      winners.forEach((winner) => {
        if (winner) {
          winsByPlayer[winner] = (winsByPlayer[winner] ?? 0) + 1
        }
      })

      const totalGames = sortedRecords.length

      return [
        pairKey,
        {
          pairKey,
          players,
          totalGames,
          winsByPlayer,
          winRateByPlayer: Object.fromEntries(
            players.map((player) => [player, totalGames === 0 ? 0 : roundToTwo((winsByPlayer[player] / totalGames) * 100)]),
          ) as Record<string, number>,
          averageMargin: totalGames === 0 ? 0 : roundToTwo(margins.reduce((sum, margin) => sum + margin, 0) / totalGames),
          largestMargin: margins.length === 0 ? 0 : Math.max(...margins),
          currentStreak: getCurrentStreak(winners),
          longestStreak: getLongestStreak(winners),
          mostRecentWinner: winners[winners.length - 1] ?? null,
        },
      ]
    }),
  )
}

function summarizeMultiplayerCount(records: CompletedGameRecord[], playerCount: 3 | 4 | 5): MultiplayerCountSummary {
  const matchingRecords = records.filter((record) => record.mode === 'multiplayer' && record.playerCount === playerCount)
  const playerStats = matchingRecords.reduce<
    Record<string, { totalGames: number; wins: number; positionSum: number; scoreSum: number; bestScore: number }>
  >((totals, record) => {
    record.finishingPositions.forEach((result) => {
      const current = totals[result.name] ?? {
        totalGames: 0,
        wins: 0,
        positionSum: 0,
        scoreSum: 0,
        bestScore: Number.NEGATIVE_INFINITY,
      }

      totals[result.name] = {
        totalGames: current.totalGames + 1,
        wins: current.wins + (result.position === 1 ? 1 : 0),
        positionSum: current.positionSum + result.position,
        scoreSum: current.scoreSum + result.score,
        bestScore: Math.max(current.bestScore, result.score),
      }
    })

    return totals
  }, {})

  const players: MultiplayerPlayerSummary[] = Object.entries(playerStats)
    .map(([playerName, totals]) => ({
      playerName,
      totalGames: totals.totalGames,
      wins: totals.wins,
      winRate: totals.totalGames === 0 ? 0 : roundToTwo((totals.wins / totals.totalGames) * 100),
      averageFinishingPosition: roundToTwo(totals.positionSum / totals.totalGames),
      averageScore: roundToTwo(totals.scoreSum / totals.totalGames),
      bestScore: totals.bestScore,
    }))
    .sort((left, right) => {
      if (right.wins !== left.wins) {
        return right.wins - left.wins
      }

      if (left.averageFinishingPosition !== right.averageFinishingPosition) {
        return left.averageFinishingPosition - right.averageFinishingPosition
      }

      return left.playerName.localeCompare(right.playerName)
    })

  return {
    playerCount,
    totalGames: matchingRecords.length,
    players,
  }
}

export function summarizeCompletedGames(records: CompletedGameRecord[]): CompletedGameSummaries {
  return {
    totalGames: records.length,
    duelHeadToHead: summarizeDuelHeadToHead(records),
    multiplayerByPlayerCount: {
      3: summarizeMultiplayerCount(records, 3),
      4: summarizeMultiplayerCount(records, 4),
      5: summarizeMultiplayerCount(records, 5),
    },
  }
}
