import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { JewelBox, JewelButton } from '../../components/ui'
import { createSessionState } from '../../engine/sessionReducer'
import type { GameMode, Player } from '../../models/orixe'
import { nextId } from '../../lib/ids'
import useSession from '../../hooks/useSession'

const MULTIPLAYER_PLAYER_COUNT_OPTIONS = [3, 4, 5] as const
const DUEL_PLAYER_COUNT = 2

function getValidPlayerCount(mode: GameMode, requestedCount: number): number {
  if (mode === 'duel') {
    return DUEL_PLAYER_COUNT
  }

  return MULTIPLAYER_PLAYER_COUNT_OPTIONS.includes(requestedCount as (typeof MULTIPLAYER_PLAYER_COUNT_OPTIONS)[number])
    ? requestedCount
    : MULTIPLAYER_PLAYER_COUNT_OPTIONS[0]
}

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

  const effectivePlayerCount = getValidPlayerCount(mode, playerCount)
  const playerCountOptions = mode === 'duel' ? [DUEL_PLAYER_COUNT] : MULTIPLAYER_PLAYER_COUNT_OPTIONS
  const dealerOptions = useMemo(
    () => Array.from({ length: effectivePlayerCount }, (_, index) => index),
    [effectivePlayerCount],
  )

  function updatePlayerCount(nextCount: number, nextMode: GameMode = mode) {
    const validCount = getValidPlayerCount(nextMode, nextCount)

    setPlayerCount(validCount)
    setDealerSeat((currentSeat) => Math.min(currentSeat, validCount - 1))
    setPlayerNames((currentNames) => {
      const nextNames = createPlayerDrafts(validCount)
      return nextNames.map((fallbackName, index) => currentNames[index] ?? fallbackName)
    })
  }

  function handleModeChange(nextMode: GameMode) {
    setMode(nextMode)
    updatePlayerCount(playerCount, nextMode)
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
      <div className="orixe-panel">
        <div className="orixe-panel-body app-stack">
          <h2 className="app-section-title" style={{ letterSpacing: '-0.01em' }}>
            SETUP
          </h2>
        </div>
      </div>

      <div className="orixe-grid-2">
        <div className="orixe-panel">
          <div className="orixe-panel-body app-stack">
            <p className="app-kicker">Game Shape</p>
            <div className="orixe-setup-stack">
              <div className="orixe-setup-control">
                <span className="orixe-label">Mode</span>
                <div className="orixe-setup-mode-grid">
                  {(['multiplayer', 'duel'] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleModeChange(option)}
                      className={`orixe-jewel-box orixe-jewel-box--interactive orixe-setup-choice${mode === option ? ' is-selected' : ''}`}
                    >
                      <span className="orixe-jewel-box__content">
                        <span className="orixe-setup-choice-label">{option}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="orixe-setup-control">
                <span className="orixe-label">Player Count</span>
                <div className="orixe-setup-count-grid">
                  {playerCountOptions.map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => updatePlayerCount(count)}
                      className={`orixe-jewel-box orixe-jewel-box--interactive orixe-setup-choice orixe-setup-choice--compact${effectivePlayerCount === count ? ' is-selected' : ''}`}
                    >
                      <span className="orixe-jewel-box__content">
                        <span className="orixe-setup-choice-value">{count}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="orixe-setup-control">
                <span className="orixe-label">Starting Dealer</span>
                <div className="orixe-setup-dealer-grid">
                  {dealerOptions.map((seat) => (
                    <button
                      key={seat}
                      type="button"
                      onClick={() => setDealerSeat(seat)}
                      className={`orixe-jewel-box orixe-jewel-box--interactive orixe-setup-choice${dealerSeat === seat ? ' is-selected' : ''}`}
                    >
                      <span className="orixe-jewel-box__content">
                        <span className="orixe-setup-choice-label">Player {seat + 1}</span>
                        <span className="orixe-setup-choice-meta">{playerNames[seat]}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="orixe-panel">
          <div className="orixe-panel-body app-stack">
            <div className="orixe-setup-name-list">
              {playerNames.slice(0, effectivePlayerCount).map((name, index) => (
                <JewelBox key={index} className="orixe-setup-name-box">
                  <label className="orixe-jewel-subbox">
                    <span className="orixe-jewel-subbox-label">Player {index + 1}</span>
                    <input
                      value={name}
                      onChange={(event) => handlePlayerNameChange(index, event.target.value)}
                      className="orixe-input orixe-input-jewel orixe-input-jewel-plain"
                    />
                  </label>
                </JewelBox>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="orixe-panel">
        <div className="orixe-panel-body app-stack">
          {error ? <p className="orixe-error app-copy">{error}</p> : null}
          <JewelButton onClick={handleCreateSession}>
            Start
          </JewelButton>
        </div>
      </div>
    </section>
  )
}
