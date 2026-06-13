import { NavLink } from 'react-router-dom';
import { MONTH_NAMES } from '../types';

const NAV_ITEM = 'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors';
const ACTIVE = 'bg-blue-600 text-white';
const INACTIVE = 'text-gray-600 hover:bg-gray-100';

export default function Sidebar() {
  return (
    <aside className="w-52 shrink-0 h-screen sticky top-0 overflow-y-auto border-r border-gray-200 bg-white flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-lg font-bold text-gray-900">🍵 TeaBudget</h1>
      </div>

      <nav className="p-3 space-y-0.5 flex-1">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-2">Main</p>
        <NavLink
          to="/"
          end
          className={({ isActive }) => `${NAV_ITEM} ${isActive ? ACTIVE : INACTIVE}`}
        >
          Overview
        </NavLink>
        <NavLink
          to="/transactions"
          className={({ isActive }) => `${NAV_ITEM} ${isActive ? ACTIVE : INACTIVE}`}
        >
          Transactions
        </NavLink>
        <NavLink
          to="/recurring"
          className={({ isActive }) => `${NAV_ITEM} ${isActive ? ACTIVE : INACTIVE}`}
        >
          Recurring
        </NavLink>

        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-2 mt-4">2026</p>
        {MONTH_NAMES.map((name, i) => (
          <NavLink
            key={name}
            to={`/month/${i + 1}`}
            className={({ isActive }) => `${NAV_ITEM} ${isActive ? ACTIVE : INACTIVE}`}
          >
            {name}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
