import type { Session } from '../engine/sessionReducer'
import type { CompletedGamePlayerResult, CompletedGameRecord } from '../models/stats'
import { load, save } from './storage'

export const COMPLETED_GAMES_STORAGE_KEY = 'completedGames'

function getCompletedAt(session: Session): string {
  return session.history[session.history.length - 1]?.timestamp ?? new Date().toISOString()
}

function getDurationMs(session: Session, completedAt: string): number | undefined {
  if (!session.createdAt) {
    return undefined
  }

  const startedAtMs = Date.parse(session.createdAt)
  const completedAtMs = Date.parse(completedAt)

  if (Number.isNaN(startedAtMs) || Number.isNaN(completedAtMs) || completedAtMs < startedAtMs) {
    return undefined
  }

  return completedAtMs - startedAtMs
}

function getFinishingPositions(session: Session): CompletedGamePlayerResult[] {
  const playerRows = session.players.map((player) => ({
    name: player.name,
    score: session.scoresByPlayer[player.id] ?? 0,
  }))

  const sortedRows = [...playerRows].sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score
    }

    return left.name.localeCompare(right.name)
  })

  let previousPosition = 0

  return sortedRows.map((row, index) => {
    const previousRow = sortedRows[index - 1]
    const position = previousRow && previousRow.score === row.score ? previousPosition : index + 1
    previousPosition = position

    return {
      name: row.name,
      score: row.score,
      position,
    }
  })
}

function getWinnerName(finishingPositions: CompletedGamePlayerResult[]): string {
  const winningScore = finishingPositions[0]?.score
  const winners = finishingPositions.filter((player) => player.score === winningScore).map((player) => player.name)
  return winners.join(' / ')
}

export function createCompletedGameRecord(session: Session): CompletedGameRecord | null {
  if (!session.id || !session.isComplete || !session.mode || session.players.length === 0 || session.history.length === 0) {
    return null
  }

  const completedAt = getCompletedAt(session)
  const finishingPositions = getFinishingPositions(session)

  return {
    id: session.id,
    completedAt,
    mode: session.mode,
    playerCount: session.players.length,
    playerNames: session.players.map((player) => player.name),
    winnerName: getWinnerName(finishingPositions),
    finalScores: Object.fromEntries(session.players.map((player) => [player.name, session.scoresByPlayer[player.id] ?? 0])),
    finishingPositions,
    totalRungsPlayed: session.history.length,
    durationMs: getDurationMs(session, completedAt),
  }
}

export function loadCompletedGameRecords(): CompletedGameRecord[] {
  return load<CompletedGameRecord[]>(COMPLETED_GAMES_STORAGE_KEY) ?? []
}

export function saveCompletedGameRecords(records: CompletedGameRecord[]): boolean {
  return save(COMPLETED_GAMES_STORAGE_KEY, records)
}

function isSameCompletedGameRecord(left: CompletedGameRecord, right: CompletedGameRecord): boolean {
  return (
    left.completedAt === right.completedAt &&
    left.mode === right.mode &&
    left.playerCount === right.playerCount &&
    left.winnerName === right.winnerName &&
    left.totalRungsPlayed === right.totalRungsPlayed &&
    left.durationMs === right.durationMs &&
    JSON.stringify(left.playerNames) === JSON.stringify(right.playerNames) &&
    JSON.stringify(left.finalScores) === JSON.stringify(right.finalScores) &&
    JSON.stringify(left.finishingPositions) === JSON.stringify(right.finishingPositions)
  )
}

function createCollisionSafeRecord(record: CompletedGameRecord, currentRecords: CompletedGameRecord[]): CompletedGameRecord {
  if (!currentRecords.some((currentRecord) => currentRecord.id === record.id)) {
    return record
  }

  const completedAtKey = record.completedAt.replace(/[^a-zA-Z0-9]/g, '')
  const baseId = `${record.id}-${completedAtKey}`
  let nextId = baseId
  let suffix = 2

  while (currentRecords.some((currentRecord) => currentRecord.id === nextId)) {
    nextId = `${baseId}-${suffix}`
    suffix += 1
  }

  return {
    ...record,
    id: nextId,
  }
}

export function appendCompletedGameRecord(record: CompletedGameRecord): CompletedGameRecord | null {
  const currentRecords = loadCompletedGameRecords()
  const duplicateIdRecord = currentRecords.find((currentRecord) => currentRecord.id === record.id)

  if (duplicateIdRecord && isSameCompletedGameRecord(duplicateIdRecord, record)) {
    return duplicateIdRecord
  }

  const recordToSave = createCollisionSafeRecord(record, currentRecords)
  const saved = saveCompletedGameRecords([...currentRecords, recordToSave])

  if (!saved) {
    console.warn('completed game save failed', recordToSave)
    return null
  }

  return recordToSave
}

export function persistCompletedGameIfNeeded(previousSession: Session, nextSession: Session): CompletedGameRecord | null {
  if (previousSession.isComplete || !nextSession.isComplete) {
    return null
  }

  const record = createCompletedGameRecord(nextSession)
  if (!record) {
    return null
  }

  return appendCompletedGameRecord(record)
}
