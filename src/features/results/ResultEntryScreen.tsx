import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { scoreDuelHand } from '../../engine/duelScoring'
import { scoreMultiplayerHand } from '../../engine/multiplayerScoring'
import { sessionReducer } from '../../engine/sessionReducer'
import type { CacheWinner, DuelHandInput, MultiplayerHandInput } from '../../models/orixe'
import { CACHE_CAP } from '../../models/orixe'
import useSession from '../../hooks/useSession'

type MultiplayerPostHandDraft = {
  tricksWon: string
  primesCount: string
}

function createMultiplayerDraft(playerCount: number): MultiplayerPostHandDraft[] {
  return Array.from({ length: playerCount }, () => ({
    tricksWon: '0',
    primesCount: '0',
  }))
}

function parseWholeNumber(value: string): number {
  if (value.trim() === '') {
    return Number.NaN
  }

  return Number(value)
}

export default function ResultEntryScreen() {
  const navigate = useNavigate()
  const session = useSession((state) => state.session)
  const setSession = useSession((state) => state.setSession)
  const currentHand = session.currentHand
  const [error, setError] = useState<string | null>(null)
  const [multiplayerDraft, setMultiplayerDraft] = useState<MultiplayerPostHandDraft[]>(
    () => createMultiplayerDraft(session.players.length || 2),
  )
  const [declarerTricksWon, setDeclarerTricksWon] = useState<string>('0')
  const [declarerPrimesCount, setDeclarerPrimesCount] = useState<string>('0')
  const [defenderPrimesCount, setDefenderPrimesCount] = useState<string>('0')
  const [cacheWinner, setCacheWinner] = useState<CacheWinner>('None')
  const [cachePrimes, setCachePrimes] = useState<string>('0')

  if (!session.id || session.players.length === 0 || session.currentHandSize === null) {
    return (
      <section className="app-screen">
        <div className="orixe-braid-panel">
          <div className="orixe-panel-body app-stack">
            <h2 className="app-section-title">No Hand Ready</h2>
            <p className="app-copy">Create or resume a session before entering results.</p>
          </div>
        </div>
      </section>
    )
  }

  if (!currentHand) {
    return (
      <section className="app-screen">
        <div className="orixe-braid-panel">
          <div className="orixe-panel-body app-stack">
            <h2 className="app-section-title">Finish Pre-Hand Entry First</h2>
            <p className="app-copy">Save Trump and bids before entering tricks and primes.</p>
          </div>
        </div>
      </section>
    )
  }

  const handSize = session.currentHandSize
  const activeHand = currentHand
  const declarer =
    activeHand.mode === 'duel'
      ? session.players.find((player) => player.id === activeHand.declarerId) ?? session.players[0]
      : session.players[0]
  const defender =
    activeHand.mode === 'duel'
      ? session.players.find((player) => player.id === activeHand.defenderId) ?? null
      : null

  function submitMultiplayerResult() {
    if (activeHand.mode !== 'multiplayer') {
      setError('Current hand does not match multiplayer entry.')
      return
    }

    try {
      const input: MultiplayerHandInput = {
        handId: activeHand.handId,
        dealerId: activeHand.dealerId,
        handSize,
        trump: activeHand.trump,
        players: activeHand.players.map((player, index) => ({
          playerId: player.playerId,
          bid: player.bid,
          tricksWon: parseWholeNumber(multiplayerDraft[index]?.tricksWon ?? ''),
          primesCount: parseWholeNumber(multiplayerDraft[index]?.primesCount ?? ''),
          previousBags: session.bagsByPlayer[player.playerId] ?? 0,
          previousTotalPoints: session.scoresByPlayer[player.playerId] ?? 0,
        })),
      }

      const result = scoreMultiplayerHand(input)
      const nextSession = sessionReducer(session, {
        type: 'APPLY_MULTIPLAYER_HAND',
        payload: {
          input,
          result,
          timestamp: new Date().toISOString(),
        },
      })

      setSession(nextSession)
      navigate('/summary')
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to score hand.')
    }
  }

  function submitDuelResult() {
    if (activeHand.mode !== 'duel') {
      setError('Current hand does not match duel entry.')
      return
    }

    if (!defender) {
      setError('Duel mode requires exactly two players.')
      return
    }

    try {
      const input: DuelHandInput = {
        handId: activeHand.handId,
        declarerId: activeHand.declarerId,
        defenderId: activeHand.defenderId,
        declarerContract: activeHand.declarerContract,
        declarerTricksWon: parseWholeNumber(declarerTricksWon),
        declarerPrimesCount: parseWholeNumber(declarerPrimesCount),
        defenderPrimesCount: parseWholeNumber(defenderPrimesCount),
        cacheWinner,
        cachePrimes: parseWholeNumber(cachePrimes),
        previousBags: session.bagsByPlayer[activeHand.declarerId] ?? 0,
        handSize,
        trump: activeHand.trump,
      }

      const result = scoreDuelHand(input)
      const nextSession = sessionReducer(session, {
        type: 'APPLY_DUEL_HAND',
        payload: {
          input,
          result,
          timestamp: new Date().toISOString(),
        },
      })

      setSession(nextSession)
      navigate('/summary')
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to score hand.')
    }
  }

  return (
    <section className="app-screen">
      <div className="orixe-braid-panel">
        <div className="orixe-panel-body app-stack">
          <p className="app-kicker">Post-Hand Entry</p>
          <h2 className="app-section-title">Capture Tricks And Primes</h2>
          <div className="orixe-inline-meta">
            <span className="orixe-meta-chip">Mode {session.mode}</span>
            <span className="orixe-meta-chip">Hand Size {handSize}</span>
          </div>
        </div>
      </div>

      <div className="orixe-trump-panel">
        <div className="orixe-panel-body app-stack">
          <p className="app-kicker">Saved Trump</p>
          <div className="orixe-badge-row">
            <span className={`orixe-badge suit-badge suit-${activeHand.trump}`}>{activeHand.trump}</span>
          </div>
        </div>
      </div>

      {activeHand.mode === 'multiplayer' ? (
        <div className="orixe-panel">
          <div className="orixe-panel-body app-stack">
            <p className="app-kicker">Multiplayer Results</p>
            <div className="orixe-list">
              {activeHand.players.map((handPlayer, index) => {
                const player = session.players.find((currentPlayer) => currentPlayer.id === handPlayer.playerId)

                return (
                  <div key={handPlayer.playerId} className="orixe-row-card orixe-compact-row">
                    <div className="app-stack" style={{ gap: '6px' }}>
                      <strong>{player?.name ?? handPlayer.playerId}</strong>
                      <span className="orixe-badge">Saved Bid {handPlayer.bid}</span>
                    </div>
                    <label className="orixe-field-group">
                      <span className="orixe-label">Tricks Won</span>
                      <input
                        inputMode="numeric"
                        value={multiplayerDraft[index]?.tricksWon ?? '0'}
                        onChange={(event) =>
                          setMultiplayerDraft((currentDraft) =>
                            currentDraft.map((entry, currentIndex) =>
                              currentIndex === index ? { ...entry, tricksWon: event.target.value } : entry,
                            ),
                          )
                        }
                        className="orixe-input"
                      />
                    </label>
                    <label className="orixe-field-group">
                      <span className="orixe-label">Primes Captured</span>
                      <input
                        inputMode="numeric"
                        value={multiplayerDraft[index]?.primesCount ?? '0'}
                        onChange={(event) =>
                          setMultiplayerDraft((currentDraft) =>
                            currentDraft.map((entry, currentIndex) =>
                              currentIndex === index ? { ...entry, primesCount: event.target.value } : entry,
                            ),
                          )
                        }
                        className="orixe-input"
                      />
                    </label>
                  </div>
                )
              })}
            </div>

            <button onClick={submitMultiplayerResult} className="orixe-button orixe-button-full">
              Score Hand
            </button>
          </div>
        </div>
      ) : (
        <div className="orixe-panel">
          <div className="orixe-panel-body app-stack">
            <p className="app-kicker">Duel Results</p>
            <div className="orixe-detail-grid">
              <div className="orixe-detail-row">
                <span className="orixe-detail-label">Declarer</span>
                <span>{declarer.name}</span>
              </div>
              <div className="orixe-detail-row">
                <span className="orixe-detail-label">Saved Contract</span>
                <span>{activeHand.declarerContract}</span>
              </div>
            </div>
            <div className="orixe-field-grid">
              <label className="orixe-field-group">
                <span className="orixe-label">Declarer Tricks Won</span>
                <input inputMode="numeric" value={declarerTricksWon} onChange={(event) => setDeclarerTricksWon(event.target.value)} className="orixe-input" />
              </label>
              <label className="orixe-field-group">
                <span className="orixe-label">Declarer Primes Captured</span>
                <input inputMode="numeric" value={declarerPrimesCount} onChange={(event) => setDeclarerPrimesCount(event.target.value)} className="orixe-input" />
              </label>
              <label className="orixe-field-group">
                <span className="orixe-label">Defender Primes Captured</span>
                <input inputMode="numeric" value={defenderPrimesCount} onChange={(event) => setDefenderPrimesCount(event.target.value)} className="orixe-input" />
              </label>
              <label className="orixe-field-group">
                <span className="orixe-label">Cache Winner</span>
                <select value={cacheWinner} onChange={(event) => setCacheWinner(event.target.value as CacheWinner)} className="orixe-select">
                  <option value="None">None</option>
                  <option value="Declarer">Declarer</option>
                  <option value="Defender">Defender</option>
                </select>
              </label>
              <label className="orixe-field-group">
                <span className="orixe-label">Cache Primes</span>
                <input inputMode="numeric" value={cachePrimes} onChange={(event) => setCachePrimes(event.target.value)} className="orixe-input" />
              </label>
            </div>
            <p className="app-copy">Cache cap is {CACHE_CAP}. Validation beyond current scoring rules is still TODO.</p>

            <button onClick={submitDuelResult} className="orixe-button orixe-button-full">
              Score Hand
            </button>
          </div>
        </div>
      )}

      {error ? (
        <div className="orixe-panel">
          <div className="orixe-panel-body">
            <p className="orixe-error app-copy">{error}</p>
          </div>
        </div>
      ) : null}
    </section>
  )
}
