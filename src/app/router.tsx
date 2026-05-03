import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AppShell from './AppShell'
import HomeScreen from '../features/home/HomeScreen'
import SetupScreen from '../features/setup/SetupScreen'
import TableScreen from '../features/table/TableScreen'
import BidEntryScreen from '../features/bids/BidEntryScreen'
import ResultEntryScreen from '../features/results/ResultEntryScreen'
import HandSummaryScreen from '../features/summary/HandSummaryScreen'
import RulesScreen from '../features/rules/RulesScreen'
import StatsScreen from '../features/stats/StatsScreen'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<HomeScreen />} />
          <Route path="setup" element={<SetupScreen />} />
          <Route path="table" element={<TableScreen />} />
          <Route path="bids" element={<BidEntryScreen />} />
          <Route path="results" element={<ResultEntryScreen />} />
          <Route path="post-hand" element={<ResultEntryScreen />} />
          <Route path="summary" element={<HandSummaryScreen />} />
          <Route path="stats" element={<StatsScreen />} />
          <Route path="rules" element={<RulesScreen />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
