import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-slate-800">
          AyurAI
        </Link>
        <nav className="flex items-center space-x-6">
          <Link
            to="/selection"
            className="text-slate-600 hover:text-slate-800 transition-colors"
          >
            Get Started
          </Link>
          <Link
            to="/plan"
            className="text-slate-600 hover:text-slate-800 transition-colors"
          >
            My Plan
          </Link>
        </nav>
      </div>
    </header>
  );
}