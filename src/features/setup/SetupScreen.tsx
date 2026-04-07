import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createSessionState } from '../../engine/sessionReducer'
import type { GameMode, Player } from '../../models/orixe'
import { nextId } from '../../lib/ids'
import useSession from '../../hooks/useSession'

const playerCountOptions = [2, 3, 4, 5]

function createPlayerDrafts(count: number): string[] {
  return Array.from({ length: count }, (_, index) => `Player ${index + 1}`)
}

export default function SetupScreen() {
  const navigate = useNavigate()
  const setSession = useSession((state) => state.setSession)
  const [mode, setMode] = useState<GameMode>('multiplayer')
  const [playerCount, setPlayerCount] = useState<number>(3)
  const [playerNames, setPlayerNames] = useState<string[]>(createPlayerDrafts(3))
  const [dealerSeat, setDealerSeat] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)

  const effectivePlayerCount = mode === 'duel' ? 2 : playerCount
  const dealerOptions = useMemo(
    () => Array.from({ length: effectivePlayerCount }, (_, index) => index),
    [effectivePlayerCount],
  )

  function updatePlayerCount(nextCount: number) {
    setPlayerCount(nextCount)
    setDealerSeat((currentSeat) => Math.min(currentSeat, nextCount - 1))
    setPlayerNames((currentNames) => {
      const nextNames = createPlayerDrafts(nextCount)
      return nextNames.map((fallbackName, index) => currentNames[index] ?? fallbackName)
    })
  }

  function handleModeChange(nextMode: GameMode) {
    setMode(nextMode)
    if (nextMode === 'duel') {
      updatePlayerCount(2)
    }
  }

  function handlePlayerNameChange(index: number, value: string) {
    setPlayerNames((currentNames) =>
      currentNames.map((currentName, currentIndex) => (currentIndex === index ? value : currentName)),
    )
  }

  function handleCreateSession() {
    const trimmedNames = playerNames.slice(0, effectivePlayerCount).map((name) => name.trim())

    if (trimmedNames.some((name) => name.length === 0)) {
      setError('Each player needs a name.')
      return
    }

    const players: Player[] = trimmedNames.map((name) => ({
      id: nextId('player'),
      name,
    }))

    try {
      const session = createSessionState({
        id: nextId('session'),
        mode,
        players,
        dealerSeat,
      })

      setSession(session)
      navigate('/table')
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to create session.')
    }
  }

  return (
    <section className="app-screen">
      <div className="orixe-braid-panel">
        <div className="orixe-panel-body app-stack">
          <p className="app-kicker">Session Setup</p>
          <h2 className="app-section-title">Seat The Table</h2>
          <p className="app-copy">Choose the mode, set the opening dealer, and name the players before the first hand.</p>
        </div>
      </div>

      <div className="orixe-grid-2">
        <div className="orixe-panel">
          <div className="orixe-panel-body app-stack">
            <p className="app-kicker">Game Shape</p>
            <div className="orixe-field-grid">
              <label className="orixe-field-group">
                <span className="orixe-label">Mode</span>
                <select value={mode} onChange={(event) => handleModeChange(event.target.value as GameMode)} className="orixe-select">
                  <option value="multiplayer">Multiplayer</option>
                  <option value="duel">Duel</option>
                </select>
              </label>

              <label className="orixe-field-group">
                <span className="orixe-label">Player Count</span>
                <select
                  value={effectivePlayerCount}
                  onChange={(event) => updatePlayerCount(Number(event.target.value))}
                  disabled={mode === 'duel'}
                  className="orixe-select"
                >
                  {playerCountOptions.map((count) => (
                    <option key={count} value={count}>
                      {count} Players
                    </option>
                  ))}
                </select>
              </label>

              <label className="orixe-field-group">
                <span className="orixe-label">Starting Dealer</span>
                <select
                  value={dealerSeat}
                  onChange={(event) => setDealerSeat(Number(event.target.value))}
                  className="orixe-select"
                >
                  {dealerOptions.map((seat) => (
                    <option key={seat} value={seat}>
                      Seat {seat + 1}: {playerNames[seat]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </div>

        <div className="orixe-panel">
          <div className="orixe-panel-body app-stack">
            <p className="app-kicker">Players</p>
            <div className="orixe-field-grid">
              {playerNames.slice(0, effectivePlayerCount).map((name, index) => (
                <label className="orixe-field-group" key={index}>
                  <span className="orixe-label">Player {index + 1}</span>
                  <input
                    value={name}
                    onChange={(event) => handlePlayerNameChange(index, event.target.value)}
                    className="orixe-input"
                  />
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="orixe-panel">
        <div className="orixe-panel-body app-stack">
          {error ? <p className="orixe-error app-copy">{error}</p> : <p className="app-copy">Session creation uses the current v1 flow and keeps the setup lightweight.</p>}
          <button onClick={handleCreateSession} className="orixe-button orixe-button-full">
            Create Session
          </button>
        </div>
      </div>
    </section>
  )
}
