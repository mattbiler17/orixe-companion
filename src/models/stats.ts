import type { GameMode } from './orixe'

export type CompletedGamePlayerResult = {
  name: string
  score: number
  position: number
}

export type CompletedGameRecord = {
  id: string
  completedAt: string
  mode: GameMode
  playerCount: number
  playerNames: string[]
  winnerName: string
  finalScores: Record<string, number>
  finishingPositions: CompletedGamePlayerResult[]
  totalRungsPlayed: number
  durationMs?: number
}

export type WinStreakSummary = {
  playerName: string
  count: number
}

export type DuelHeadToHeadSummary = {
  pairKey: string
  players: [string, string]
  totalGames: number
  winsByPlayer: Record<string, number>
  winRateByPlayer: Record<string, number>
  averageMargin: number
  largestMargin: number
  currentStreak: WinStreakSummary | null
  longestStreak: WinStreakSummary | null
  mostRecentWinner: string | null
}

export type MultiplayerPlayerSummary = {
  playerName: string
  totalGames: number
  wins: number
  winRate: number
  averageFinishingPosition: number
  averageScore: number
  bestScore: number
}

export type MultiplayerCountSummary = {
  playerCount: 3 | 4 | 5
  totalGames: number
  players: MultiplayerPlayerSummary[]
}

export type CompletedGameSummaries = {
  totalGames: number
  duelHeadToHead: Record<string, DuelHeadToHeadSummary>
  multiplayerByPlayerCount: Record<3 | 4 | 5, MultiplayerCountSummary>
}
