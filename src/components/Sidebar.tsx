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
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-48 shrink-0 h-screen sticky top-0 overflow-y-auto border-r border-gray-200 bg-white flex-col">
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

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 flex h-14">
        <NavLink to="/" end className={({ isActive }) =>
          `flex flex-col items-center justify-center flex-1 text-xs font-medium gap-0.5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          Overview
        </NavLink>
        <NavLink to="/transactions" className={({ isActive }) =>
          `flex flex-col items-center justify-center flex-1 text-xs font-medium gap-0.5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          Transactions
        </NavLink>
        <NavLink to="/recurring" className={({ isActive }) =>
          `flex flex-col items-center justify-center flex-1 text-xs font-medium gap-0.5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Recurring
        </NavLink>
        <div className={`flex flex-col items-center justify-center flex-1 text-xs font-medium gap-0.5 ${selectedMonth ? 'text-blue-600' : 'text-gray-500'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          <select
            value={selectedMonth}
            onChange={e => e.target.value && navigate(`/month/${e.target.value}`)}
            className="text-xs font-medium bg-transparent focus:outline-none w-full text-center cursor-pointer"
            style={{ color: 'inherit', appearance: 'none' }}
          >
            <option value="">Month</option>
            {MONTH_NAMES.map((name, i) => <option key={name} value={i + 1}>{name.slice(0, 3)}</option>)}
          </select>
        </div>
        <NavLink to="/settings" className={({ isActive }) =>
          `flex flex-col items-center justify-center flex-1 text-xs font-medium gap-0.5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          Settings
        </NavLink>
      </nav>
    </>
  );
}
