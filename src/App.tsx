import { Navigate, Route, Routes } from 'react-router-dom';
import { Shell } from './components/shell/Shell';
import { Home } from './pages/Home';
import { Live } from './pages/Live';
import { SportPage } from './pages/SportPage';
import { MatchPage } from './pages/MatchPage';
import { BetsPage } from './pages/BetsPage';
import { FootballPage } from './pages/FootballPage';

export default function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Navigate to="/sports" replace />} />
        <Route path="/sports" element={<Home />} />
        <Route path="/sports/live" element={<Live />} />
        <Route path="/sports/bets" element={<BetsPage />} />
        <Route path="/sports/match/:id" element={<MatchPage />} />
        <Route path="/sports/football" element={<FootballPage />} />
        <Route path="/sports/:sport" element={<SportPage />} />
        <Route path="*" element={<Navigate to="/sports" replace />} />
      </Routes>
    </Shell>
  );
}
