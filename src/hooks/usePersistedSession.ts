import { useEffect, useReducer } from 'react'
import type {
  DuelHandInput,
  DuelHandResult,
  GameMode,
  MultiplayerHandInput,
  MultiplayerHandResult,
  Player,
  Suit,
} from '../models/orixe'
import {
  initialSession,
  sessionReducer,
  type Session,
  type SessionAction,
} from '../engine/sessionReducer'
import { nextId } from '../lib/ids'
import { clearActiveSession, loadActiveSession, saveActiveSession } from '../lib/storage'

type CreateSessionInput = {
  id?: string
  mode: GameMode
  players: Player[]
  dealerSeat?: number
  trump?: Suit | null
}

function createTimestamp(): string {
  return new Date().toISOString()
}

function getInitialSessionState(): Session {
  return loadActiveSession() ?? initialSession
}

export function usePersistedSession() {
  const [session, dispatch] = useReducer(sessionReducer, initialSession, getInitialSessionState)

  useEffect(() => {
    if (!session.id) {
      clearActiveSession()
      return
    }

    saveActiveSession(session)
  }, [session])

  function createSession(input: CreateSessionInput) {
    dispatch({
      type: 'CREATE_SESSION',
      payload: {
        ...input,
        id: input.id ?? nextId('session'),
      },
    })
  }

  function loadSession(sessionToLoad: Session) {
    dispatch({ type: 'LOAD_SESSION', payload: sessionToLoad })
  }

  function applyMultiplayerHand(input: MultiplayerHandInput, result: MultiplayerHandResult) {
    dispatch({
      type: 'APPLY_MULTIPLAYER_HAND',
      payload: {
        input,
        result,
        timestamp: createTimestamp(),
      },
    })
  }

  function applyDuelHand(input: DuelHandInput, result: DuelHandResult) {
    dispatch({
      type: 'APPLY_DUEL_HAND',
      payload: {
        input,
        result,
        timestamp: createTimestamp(),
      },
    })
  }

  function advanceToNextRung() {
    dispatch({ type: 'ADVANCE_RUNG' })
  }

  function rotateDealer() {
    dispatch({ type: 'ROTATE_DEALER' })
  }

  function setTrump(trump: Suit | null) {
    dispatch({ type: 'SET_TRUMP', payload: trump })
  }

  function resetSession() {
    dispatch({ type: 'RESET_SESSION' })
  }

  return {
    session,
    dispatch: dispatch as (action: SessionAction) => void,
    createSession,
    loadSession,
    applyMultiplayerHand,
    applyDuelHand,
    advanceToNextRung,
    rotateDealer,
    setTrump,
    resetSession,
  }
}

export default usePersistedSession
