import { useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useBudget } from '../store/BudgetContext';
import { MONTH_NAMES } from '../types';

const CURRENT_MONTH = new Date().getMonth() + 1;

export default function TopBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, selectedYear, setSelectedYear } = useBudget();

  const monthScrollRef = useRef<HTMLDivElement>(null);
  const monthTabRefs = useRef<(HTMLButtonElement | null)[]>(Array(12).fill(null));

  const monthMatch = location.pathname.match(/^\/month\/(\d+)/);
  const activeMonth = monthMatch ? parseInt(monthMatch[1], 10) : null;

  useEffect(() => {
    const targetIdx = (activeMonth ?? CURRENT_MONTH) - 1;
    const tab = monthTabRefs.current[targetIdx];
    const container = monthScrollRef.current;
    if (!tab || !container) return;
    const targetLeft = tab.offsetLeft - container.offsetWidth / 2 + tab.offsetWidth / 2;
    container.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' });
  }, [activeMonth]);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-stretch">
        {/* Month slider with gradient fades */}
        <div className="relative flex-1 overflow-hidden">
          <div className="absolute left-0 inset-y-0 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none z-10" />
          <div ref={monthScrollRef} className="overflow-x-auto no-scrollbar flex h-full">
            {MONTH_NAMES.map((name, i) => {
              const m = i + 1;
              const active = activeMonth === m;
              const isCurrent = m === CURRENT_MONTH;
              return (
                <button
                  key={name}
                  ref={el => { monthTabRefs.current[i] = el; }}
                  onClick={() => navigate(`/month/${m}`)}
                  className={`relative shrink-0 px-3 py-3 text-sm whitespace-nowrap border-b-2 transition-colors ${
                    active
                      ? 'border-blue-600 text-blue-600 font-semibold'
                      : 'border-transparent text-gray-500 hover:text-gray-800 font-medium'
                  }`}
                >
                  {name}
                  {/* Dot marks the current calendar month */}
                  {isCurrent && !active && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-500" />
                  )}
                </button>
              );
            })}
          </div>
          <div className="absolute right-0 inset-y-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />
        </div>

        {/* Year — solid dropdown, always visible */}
        <div className="shrink-0 flex items-center px-3 border-l border-gray-100">
          <select
            value={selectedYear}
            onChange={e => {
              setSelectedYear(parseInt(e.target.value));
              navigate('/year');
            }}
            className="text-sm font-bold text-gray-800 bg-white border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            {state.years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>
    </header>
  );
}
