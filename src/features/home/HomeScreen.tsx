import { JewelButton } from '../../components/ui'

export default function HomeScreen() {
  return (
    <section className="app-screen app-screen--centered">
      <div className="orixe-home-actions">
        <JewelButton to="/setup">Start New Game</JewelButton>
        <JewelButton to="/table">Resume Game</JewelButton>
      </div>
    </section>
  )
}
