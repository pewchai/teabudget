import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { MONTH_NAMES } from '../types';

const NAV = 'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors';
const ACTIVE = 'bg-blue-600 text-white';
const INACTIVE = 'text-gray-600 hover:bg-gray-100';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const monthMatch = location.pathname.match(/^\/month\/(\d+)/);
  const selectedMonth = monthMatch ? monthMatch[1] : '';

  return (
    <aside className="w-48 shrink-0 h-screen sticky top-0 overflow-y-auto border-r border-gray-200 bg-white flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-base font-bold text-gray-900">Krind Budget</h1>
      </div>
      <nav className="p-3 space-y-0.5 flex-1">
        <NavLink to="/" end className={({ isActive }) => `${NAV} ${isActive ? ACTIVE : INACTIVE}`}>Overview</NavLink>
        <NavLink to="/transactions" className={({ isActive }) => `${NAV} ${isActive ? ACTIVE : INACTIVE}`}>Transactions</NavLink>
        <NavLink to="/recurring" className={({ isActive }) => `${NAV} ${isActive ? ACTIVE : INACTIVE}`}>Recurring</NavLink>

        <div className="pt-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 pb-2">Month</p>
          <select
            value={selectedMonth}
            onChange={e => e.target.value && navigate(`/month/${e.target.value}`)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select month…</option>
            {MONTH_NAMES.map((name, i) => <option key={name} value={i + 1}>{name}</option>)}
          </select>
        </div>

        <div className="pt-4 border-t border-gray-100 mt-4">
          <NavLink to="/settings" className={({ isActive }) => `${NAV} ${isActive ? ACTIVE : INACTIVE}`}>⚙ Settings</NavLink>
        </div>
      </nav>
    </aside>
  );
}
