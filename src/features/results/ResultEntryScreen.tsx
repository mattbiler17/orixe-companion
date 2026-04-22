import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { JewelBox, JewelButton, JewelChoiceButton, NumericInput } from '../../components/ui'
import { normalizeWholeNumberInput } from '../../components/ui/NumericInput.utils'
import { scoreDuelHand } from '../../engine/duelScoring'
import { scoreMultiplayerHand } from '../../engine/multiplayerScoring'
import { sessionReducer } from '../../engine/sessionReducer'
import type { CacheWinner, DuelHandInput, MultiplayerHandInput } from '../../models/orixe'
import useSession from '../../hooks/useSession'

type RequiredCacheWinner = Exclude<CacheWinner, 'None'>

type MultiplayerPostHandDraft = {
  tricksWon: string
  primesCount: string
}

function createMultiplayerDraft(playerCount: number): MultiplayerPostHandDraft[] {
  return Array.from({ length: playerCount }, () => ({
    tricksWon: '',
    primesCount: '',
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
  const [declarerTricksWon, setDeclarerTricksWon] = useState<string>('')
  const [declarerPrimesCount, setDeclarerPrimesCount] = useState<string>('')
  const [defenderPrimesCount, setDefenderPrimesCount] = useState<string>('')
  const [cacheWinner, setCacheWinner] = useState<RequiredCacheWinner | ''>('')
  const [cachePrimes, setCachePrimes] = useState<string>('')

  if (!session.id || session.players.length === 0 || session.currentHandSize === null) {
    return (
      <section className="app-screen">
        <div className="orixe-panel">
          <div className="orixe-panel-body app-stack">
            <h2 className="app-section-title">No Hand Ready</h2>
          </div>
        </div>
      </section>
    )
  }

  if (!currentHand) {
    return (
      <section className="app-screen">
        <div className="orixe-panel">
          <div className="orixe-panel-body app-stack">
            <h2 className="app-section-title">Finish Pre-Hand Entry First</h2>
            <p className="app-copy">Save Trump and bids first.</p>
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

    if (!cacheWinner) {
      setError('Choose a Cache Winner before starting.')
      return
    }

    const parsedCachePrimes = parseWholeNumber(cachePrimes)

    if (cachePrimes.trim() === '' || Number.isNaN(parsedCachePrimes)) {
      setError('Cache Primes must be ≥ 0')
      return
    }

    if (parsedCachePrimes < 0) {
      setError('Cache Primes must be ≥ 0')
      return
    }

    try {
      const derivedDefenderTricks = handSize - parseWholeNumber(declarerTricksWon)

      if (Number.isNaN(derivedDefenderTricks) || derivedDefenderTricks < 0) {
        setError('Declarer Tricks must be between 0 and hand size.')
        return
      }

      const input: DuelHandInput = {
        handId: activeHand.handId,
        declarerId: activeHand.declarerId,
        defenderId: activeHand.defenderId,
        declarerContract: activeHand.declarerContract,
        declarerTricksWon: parseWholeNumber(declarerTricksWon),
        declarerPrimesCount: parseWholeNumber(declarerPrimesCount),
        defenderPrimesCount: parseWholeNumber(defenderPrimesCount),
        cacheWinner,
        cachePrimes: parsedCachePrimes,
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
      <JewelBox className="orixe-screen-header">
        <div className="app-stack">
          <p className="app-kicker">Post-Hand Entry</p>
          <div className="orixe-screen-header-row">
            <div className="app-stack">
              <h2 className="app-section-title">Capture Tricks And Primes</h2>
              <div className="orixe-inline-meta">
                <span className="orixe-meta-chip">Mode {session.mode}</span>
                <span className="orixe-meta-chip">Hand Size {handSize}</span>
              </div>
            </div>
            <div className="orixe-badge-row">
              <span className={`orixe-badge suit-badge suit-${activeHand.trump}`}>{activeHand.trump}</span>
            </div>
          </div>
        </div>
      </JewelBox>

      {activeHand.mode === 'multiplayer' ? (
        <JewelBox>
          <div className="app-stack">
            <p className="app-kicker">Enter Results</p>
            <div className="orixe-results-list">
              {activeHand.players.map((handPlayer, index) => {
                const player = session.players.find((currentPlayer) => currentPlayer.id === handPlayer.playerId)
                const enteredTricks = Number(multiplayerDraft[index]?.tricksWon || '0')
                const missedBid = handPlayer.bid === 0 ? enteredTricks > 0 : enteredTricks < handPlayer.bid

                return (
                  <JewelBox key={handPlayer.playerId} className={missedBid ? 'is-muted' : undefined}>
                    <div className="orixe-results-row-grid">
                      <div className="orixe-jewel-subbox">
                        <span className="orixe-jewel-subbox-label">Player</span>
                        <strong className="orixe-entry-player">{player?.name ?? handPlayer.playerId}</strong>
                        <span className={`orixe-badge orixe-results-saved-bid${missedBid ? ' orixe-badge-warning' : ''}`}>
                          Saved Bid {handPlayer.bid}
                        </span>
                      </div>
                      <label className="orixe-jewel-subbox">
                        <span className="orixe-jewel-subbox-label">Tricks</span>
                        <NumericInput
                          aria-label={`${player?.name ?? handPlayer.playerId} tricks`}
                          placeholder="0"
                          value={multiplayerDraft[index]?.tricksWon ?? ''}
                          onValueChange={(value) =>
                            setMultiplayerDraft((currentDraft) =>
                              currentDraft.map((entry, currentIndex) =>
                                currentIndex === index ? { ...entry, tricksWon: value } : entry,
                              ),
                            )
                          }
                          normalizeOnBlur={normalizeWholeNumberInput}
                          className="orixe-input orixe-input-jewel orixe-input-jewel-plain orixe-entry-value"
                        />
                      </label>
                      <label className="orixe-jewel-subbox">
                        <span className="orixe-jewel-subbox-label">Primes</span>
                        <NumericInput
                          aria-label={`${player?.name ?? handPlayer.playerId} primes`}
                          placeholder="0"
                          value={multiplayerDraft[index]?.primesCount ?? ''}
                          onValueChange={(value) =>
                            setMultiplayerDraft((currentDraft) =>
                              currentDraft.map((entry, currentIndex) =>
                                currentIndex === index ? { ...entry, primesCount: value } : entry,
                              ),
                            )
                          }
                          normalizeOnBlur={normalizeWholeNumberInput}
                          className="orixe-input orixe-input-jewel orixe-input-jewel-plain orixe-entry-value"
                        />
                      </label>
                    </div>
                  </JewelBox>
                )
              })}
            </div>
          </div>
        </JewelBox>
      ) : (
        <JewelBox>
          <div className="app-stack">
            <p className="app-kicker">Enter Results</p>
            <div className="orixe-results-list">
              <JewelBox>
                <div className="orixe-results-row-grid">
                  <div className="orixe-jewel-subbox">
                    <span className="orixe-jewel-subbox-label">Player</span>
                    <strong className="orixe-entry-player">DECLARER</strong>
                    <span className="app-muted">{declarer.name}</span>
                  </div>
                  <label className="orixe-jewel-subbox">
                    <span className="orixe-jewel-subbox-label">Tricks</span>
                    <NumericInput
                      aria-label="Declarer tricks"
                      placeholder="0"
                      value={declarerTricksWon}
                      onValueChange={setDeclarerTricksWon}
                      normalizeOnBlur={normalizeWholeNumberInput}
                      className="orixe-input orixe-input-jewel orixe-input-jewel-plain orixe-entry-value"
                    />
                  </label>
                  <label className="orixe-jewel-subbox">
                    <span className="orixe-jewel-subbox-label">Primes</span>
                    <NumericInput
                      aria-label="Declarer primes"
                      placeholder="0"
                      value={declarerPrimesCount}
                      onValueChange={setDeclarerPrimesCount}
                      normalizeOnBlur={normalizeWholeNumberInput}
                      className="orixe-input orixe-input-jewel orixe-input-jewel-plain orixe-entry-value"
                    />
                  </label>
                </div>
              </JewelBox>

              <JewelBox>
                <div className="orixe-results-row-grid orixe-results-row-grid--duel-defender">
                  <div className="orixe-jewel-subbox">
                    <span className="orixe-jewel-subbox-label">Player</span>
                    <strong className="orixe-entry-player">DEFENDER</strong>
                    <span className="app-muted">{defender?.name ?? 'Unassigned'}</span>
                  </div>
                  <label className="orixe-jewel-subbox">
                    <span className="orixe-jewel-subbox-label">Primes</span>
                    <NumericInput
                      aria-label="Defender primes"
                      placeholder="0"
                      value={defenderPrimesCount}
                      onValueChange={setDefenderPrimesCount}
                      normalizeOnBlur={normalizeWholeNumberInput}
                      className="orixe-input orixe-input-jewel orixe-input-jewel-plain orixe-entry-value"
                    />
                  </label>
                </div>
              </JewelBox>

              <div className="orixe-results-cache-grid">
                <div className="orixe-jewel-subbox">
                  <span className="orixe-jewel-subbox-label">Cache Winner</span>
                  <div className="orixe-results-choice-grid">
                    {(['Declarer', 'Defender'] as const).map((option) => (
                      <JewelChoiceButton
                        key={option}
                        onClick={() => setCacheWinner(option)}
                        isSelected={cacheWinner === option}
                        className="orixe-results-choice"
                      >
                        <span className="orixe-results-choice-label">{option}</span>
                      </JewelChoiceButton>
                    ))}
                  </div>
                </div>
                <label className="orixe-jewel-subbox">
                  <span className="orixe-jewel-subbox-label">Cache Primes</span>
                  <NumericInput
                    aria-label="Cache primes"
                    placeholder="0"
                    value={cachePrimes}
                    onValueChange={setCachePrimes}
                    normalizeOnBlur={normalizeWholeNumberInput}
                    className="orixe-input orixe-input-jewel orixe-input-jewel-plain orixe-entry-value"
                  />
                </label>
              </div>
            </div>
          </div>
        </JewelBox>
      )}

      <JewelButton onClick={activeHand.mode === 'multiplayer' ? submitMultiplayerResult : submitDuelResult}>Score Hand</JewelButton>

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
