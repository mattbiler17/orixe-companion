import type {
  DuelHandInput,
  DuelHandResult,
  GameMode,
  MultiplayerHandInput,
  MultiplayerHandResult,
  Player,
  Suit,
} from '../models/orixe'
import { getRungSequence } from './rungs'

export type CurrentMultiplayerHandDraft = {
  mode: 'multiplayer'
  handId: string
  handSize: number
  dealerId?: string
  trump: Suit
  players: Array<{
    playerId: string
    bid: number
  }>
}

export type CurrentDuelHandDraft = {
  mode: 'duel'
  handId: string
  handSize: number
  dealerId?: string
  trump: Suit
  declarerId: string
  defenderId: string
  declarerContract: number
}

export type CurrentHandDraft = CurrentMultiplayerHandDraft | CurrentDuelHandDraft

export type SessionHistoryEntry = {
  handId: string
  mode: GameMode
  timestamp: string
  summary: string
  input: MultiplayerHandInput | DuelHandInput
  result: MultiplayerHandResult | DuelHandResult
}

export type Session = {
  id: string
  mode: GameMode | null
  players: Player[]
  rungSequence: number[]
  currentRungIndex: number
  currentHandSize: number | null
  dealerSeat: number
  trump: Suit | null
  currentHand: CurrentHandDraft | null
  scoresByPlayer: Record<string, number>
  bagsByPlayer: Record<string, number>
  history: SessionHistoryEntry[]
  isComplete: boolean
}

export type CreateSessionPayload = {
  id: string
  mode: GameMode
  players: Player[]
  dealerSeat?: number
  trump?: Suit | null
}

export type SessionAction =
  | { type: 'CREATE_SESSION'; payload: CreateSessionPayload }
  | { type: 'LOAD_SESSION'; payload: Session }
  | { type: 'SAVE_CURRENT_HAND'; payload: CurrentHandDraft }
  | { type: 'CLEAR_CURRENT_HAND' }
  | {
      type: 'APPLY_MULTIPLAYER_HAND'
      payload: { input: MultiplayerHandInput; result: MultiplayerHandResult; timestamp: string }
    }
  | {
      type: 'APPLY_DUEL_HAND'
      payload: { input: DuelHandInput; result: DuelHandResult; timestamp: string }
    }
  | { type: 'ADVANCE_RUNG' }
  | { type: 'ROTATE_DEALER' }
  | { type: 'SET_TRUMP'; payload: Suit | null }
  | { type: 'RESET_SESSION' }

export const initialSession: Session = {
  id: '',
  mode: null,
  players: [],
  rungSequence: [],
  currentRungIndex: 0,
  currentHandSize: null,
  dealerSeat: 0,
  trump: null,
  currentHand: null,
  scoresByPlayer: {},
  bagsByPlayer: {},
  history: [],
  isComplete: false,
}

function normalizeDealerSeat(dealerSeat: number | undefined, playerCount: number): number {
  if (playerCount === 0) {
    return 0
  }

  const rawSeat = Number.isInteger(dealerSeat) ? (dealerSeat as number) : 0
  return ((rawSeat % playerCount) + playerCount) % playerCount
}

function createZeroMap(players: Player[]): Record<string, number> {
  return Object.fromEntries(players.map((player) => [player.id, 0]))
}

function getHandSizeAtIndex(rungSequence: number[], rungIndex: number): number | null {
  return rungIndex >= 0 && rungIndex < rungSequence.length ? rungSequence[rungIndex] : null
}

function rotateDealerSeat(state: Session): Session {
  if (state.players.length === 0) {
    return state
  }

  return {
    ...state,
    dealerSeat: (state.dealerSeat + 1) % state.players.length,
  }
}

function advanceRung(state: Session): Session {
  if (state.isComplete || state.rungSequence.length === 0) {
    return state
  }

  const nextRungIndex = state.currentRungIndex + 1
  if (nextRungIndex >= state.rungSequence.length) {
    return {
      ...state,
      currentRungIndex: state.rungSequence.length - 1,
      currentHandSize: null,
      isComplete: true,
    }
  }

  return {
    ...state,
    currentRungIndex: nextRungIndex,
    currentHandSize: state.rungSequence[nextRungIndex],
  }
}

function appendHistoryEntry(state: Session, entry: SessionHistoryEntry): Session {
  return {
    ...state,
    history: [...state.history, entry],
  }
}

function applyMultiplayerScores(
  state: Session,
  result: MultiplayerHandResult,
): Pick<Session, 'scoresByPlayer' | 'bagsByPlayer'> {
  const scoresByPlayer = { ...state.scoresByPlayer }
  const bagsByPlayer = { ...state.bagsByPlayer }

  result.breakdowns.forEach((breakdown) => {
    scoresByPlayer[breakdown.playerId] = (scoresByPlayer[breakdown.playerId] ?? 0) + breakdown.totalDelta
    bagsByPlayer[breakdown.playerId] = breakdown.newBagTotal
  })

  return { scoresByPlayer, bagsByPlayer }
}

function applyDuelScores(
  state: Session,
  result: DuelHandResult,
): Pick<Session, 'scoresByPlayer' | 'bagsByPlayer'> {
  const scoresByPlayer = { ...state.scoresByPlayer }
  const bagsByPlayer = { ...state.bagsByPlayer }

  scoresByPlayer[result.declarer.playerId] =
    (scoresByPlayer[result.declarer.playerId] ?? 0) + result.declarer.totalDelta
  scoresByPlayer[result.defender.playerId] =
    (scoresByPlayer[result.defender.playerId] ?? 0) + result.defender.totalDelta
  bagsByPlayer[result.declarer.playerId] = result.declarer.newBagTotal

  return { scoresByPlayer, bagsByPlayer }
}

function progressAfterHand(state: Session): Session {
  return advanceRung(
    rotateDealerSeat({
      ...state,
      trump: null,
      currentHand: null,
    }),
  )
}

function createMultiplayerSummary(input: MultiplayerHandInput): string {
  return `Multiplayer hand ${input.handId} completed`
}

function createDuelSummary(input: DuelHandInput): string {
  return `Duel hand ${input.handId} completed`
}

export function createSessionState(payload: CreateSessionPayload): Session {
  const normalizedPlayers =
    payload.mode === 'duel'
      ? payload.players.slice(0, 2)
      : payload.players.length === 2
        ? payload.players.slice(0, 2)
        : payload.players

  if (payload.mode === 'duel' && normalizedPlayers.length !== 2) {
    throw new Error('Duel mode requires exactly 2 players.')
  }

  if (payload.mode === 'multiplayer' && normalizedPlayers.length < 3) {
    throw new Error('Multiplayer mode requires at least 3 players.')
  }

  const rungSequence = getRungSequence(normalizedPlayers.length)

  return {
    id: payload.id,
    mode: payload.mode,
    players: normalizedPlayers,
    rungSequence,
    currentRungIndex: 0,
    currentHandSize: getHandSizeAtIndex(rungSequence, 0),
    dealerSeat: normalizeDealerSeat(payload.dealerSeat, normalizedPlayers.length),
    trump: null,
    currentHand: null,
    scoresByPlayer: createZeroMap(normalizedPlayers),
    bagsByPlayer: createZeroMap(normalizedPlayers),
    history: [],
    isComplete: false,
  }
}

export function sessionReducer(state: Session, action: SessionAction): Session {
  switch (action.type) {
    case 'CREATE_SESSION':
      return createSessionState(action.payload)

    case 'LOAD_SESSION':
      return action.payload

    case 'SAVE_CURRENT_HAND':
      return {
        ...state,
        trump: action.payload.trump,
        currentHand: action.payload,
      }

    case 'CLEAR_CURRENT_HAND':
      return {
        ...state,
        trump: null,
        currentHand: null,
      }

    case 'APPLY_MULTIPLAYER_HAND': {
      const updatedTotals = applyMultiplayerScores(state, action.payload.result)
      const withHistory = appendHistoryEntry(
        {
          ...state,
          ...updatedTotals,
        },
        {
          handId: action.payload.input.handId,
          mode: 'multiplayer',
          timestamp: action.payload.timestamp,
          summary: createMultiplayerSummary(action.payload.input),
          input: action.payload.input,
          result: action.payload.result,
        },
      )

      return progressAfterHand(withHistory)
    }

    case 'APPLY_DUEL_HAND': {
      const updatedTotals = applyDuelScores(state, action.payload.result)
      const withHistory = appendHistoryEntry(
        {
          ...state,
          ...updatedTotals,
        },
        {
          handId: action.payload.input.handId,
          mode: 'duel',
          timestamp: action.payload.timestamp,
          summary: createDuelSummary(action.payload.input),
          input: action.payload.input,
          result: action.payload.result,
        },
      )

      return progressAfterHand(withHistory)
    }

    case 'ADVANCE_RUNG':
      return advanceRung(state)

    case 'ROTATE_DEALER':
      return rotateDealerSeat(state)

    case 'SET_TRUMP':
      return {
        ...state,
        trump: action.payload,
      }

    case 'RESET_SESSION':
      return initialSession

    default:
      return state
  }
}
