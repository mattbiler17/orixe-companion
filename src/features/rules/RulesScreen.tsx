import { CACHE_CAP } from '../../models/orixe'

export default function RulesScreen() {
  return (
    <section className="app-screen">
      <div className="orixe-panel">
        <div className="orixe-panel-body app-stack">
          <p className="app-kicker">Reference</p>
          <h2 className="app-section-title">Current V1 Rules</h2>
        </div>
      </div>

      <div className="orixe-grid-2">
        <div className="orixe-panel">
          <div className="orixe-panel-body orixe-rules-section">
            <h3>Multiplayer</h3>
            <ul className="orixe-bullet-list">
              <li>Made bid: +3 per bid.</li>
              <li>Missed bid: -3 per bid and primes are zeroed.</li>
              <li>Zero bid succeeds only at 0 tricks and still scores 0 primes.</li>
              <li>Bags are overtricks only, with one -21 penalty at 7 bags.</li>
            </ul>
          </div>
        </div>

        <div className="orixe-panel">
          <div className="orixe-panel-body orixe-rules-section">
            <h3>Duel</h3>
            <ul className="orixe-bullet-list">
              <li>Only the Declarer receives contract scoring.</li>
              <li>Failed contracts zero the Declarer primes and Declarer cache primes.</li>
              <li>The Defender still scores counted primes.</li>
              <li>Cache cap remains {CACHE_CAP}.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
