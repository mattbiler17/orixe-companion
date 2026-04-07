export default function RulesScreen() {
  return (
    <section className="app-screen">
      <div className="orixe-braid-panel">
        <div className="orixe-panel-body app-stack">
          <p className="app-kicker">Reference</p>
          <h2 className="app-section-title">Current V1 Rules</h2>
          <p className="app-copy">A concise dark-theme reference for live play. Flow stays table, pre-hand, post-hand, summary.</p>
        </div>
      </div>

      <div className="orixe-grid-2">
        <div className="orixe-panel">
          <div className="orixe-panel-body app-stack">
            <p className="app-kicker">Multiplayer</p>
            <div className="orixe-detail-grid">
              <div className="orixe-detail-row">
                <span className="orixe-detail-label">Made Bid</span>
                <span>+3 per bid</span>
              </div>
              <div className="orixe-detail-row">
                <span className="orixe-detail-label">Missed Bid</span>
                <span>-3 per bid, primes zeroed</span>
              </div>
              <div className="orixe-detail-row">
                <span className="orixe-detail-label">Zero Bid</span>
                <span>Only succeeds at 0 tricks and still counts 0 primes</span>
              </div>
              <div className="orixe-detail-row">
                <span className="orixe-detail-label">Bags</span>
                <span>Overtricks only, one -21 penalty when reaching 7</span>
              </div>
            </div>
          </div>
        </div>

        <div className="orixe-panel">
          <div className="orixe-panel-body app-stack">
            <p className="app-kicker">Duel</p>
            <div className="orixe-detail-grid">
              <div className="orixe-detail-row">
                <span className="orixe-detail-label">Contract</span>
                <span>Only Declarer receives contract scoring</span>
              </div>
              <div className="orixe-detail-row">
                <span className="orixe-detail-label">Failed Contract</span>
                <span>Declarer primes and declarer cache primes become 0</span>
              </div>
              <div className="orixe-detail-row">
                <span className="orixe-detail-label">Defender</span>
                <span>Prime scoring stays unchanged</span>
              </div>
              <div className="orixe-detail-row">
                <span className="orixe-detail-label">Cache</span>
                <span>Cache cap is still TODO for strict enforcement</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="orixe-panel">
        <div className="orixe-panel-body app-stack">
          <p className="app-kicker">Notes</p>
          <p className="app-copy">Trump is chosen during pre-hand entry and shown again on the completed hand summary.</p>
          <p className="app-copy">Wild penalty logic is intentionally absent in v1.</p>
        </div>
      </div>
    </section>
  )
}
