import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserDataProvider } from './contexts/UserDataContext';
import LandingPage from './pages/LandingPage';
import SelectionPage from './pages/SelectionPage';
import ChatPage from './pages/ChatPage';
import PlanPage from './pages/PlanPage';

export default function App() {
  return (
    <Router>
      <UserDataProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/selection" element={<SelectionPage />} />
          <Route path="/chat/:category" element={<ChatPage />} />
          <Route path="/plan" element={<PlanPage />} />
        </Routes>
      </UserDataProvider>
    </Router>
  );
}