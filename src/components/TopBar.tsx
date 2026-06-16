import { useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useBudget } from '../store/BudgetContext';
import { MONTH_NAMES } from '../types';

const CURRENT_MONTH = new Date().getMonth() + 1;
const CURRENT_YEAR = new Date().getFullYear();
const TAB_W = 48; // fixed px width per month tab

export default function TopBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, selectedYear, setSelectedYear } = useBudget();

  const monthScrollRef = useRef<HTMLDivElement>(null);

  const monthMatch = location.pathname.match(/^\/month\/(\d+)/);
  const activeMonth = monthMatch ? parseInt(monthMatch[1], 10) : null;

  useEffect(() => {
    const container = monthScrollRef.current;
    if (!container) return;
    const targetIdx = (activeMonth ?? CURRENT_MONTH) - 1;
    const scrollTo = targetIdx * TAB_W - container.offsetWidth / 2 + TAB_W / 2;
    container.scrollTo({ left: Math.max(0, scrollTo), behavior: 'smooth' });
  }, [activeMonth]);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
      <div className="flex items-center gap-2 px-3 py-2">

        {/* Month pill tray */}
        <div className="relative flex-1 overflow-hidden">
          <div ref={monthScrollRef} className="overflow-x-auto no-scrollbar">
            <div className="relative flex" style={{ width: `${12 * TAB_W}px` }}>

              {/* Tray background */}
              <div className="absolute inset-0 bg-gray-100 rounded-xl pointer-events-none" />

              {/* Sliding pill */}
              {activeMonth && (
                <div
                  className="absolute inset-y-1 pointer-events-none"
                  style={{
                    width: TAB_W,
                    transform: `translateX(${(activeMonth - 1) * TAB_W}px)`,
                    transition: 'transform 300ms ease-out',
                  }}
                >
                  <div className="mx-1 h-full bg-white rounded-lg shadow-sm" />
                </div>
              )}

              {MONTH_NAMES.map((name, i) => {
                const m = i + 1;
                const active = activeMonth === m;
                const isCurrent = m === CURRENT_MONTH && selectedYear === CURRENT_YEAR;
                return (
                  <button
                    key={name}
                    onClick={() => navigate(`/month/${m}`)}
                    className="relative z-10 shrink-0 py-2.5 transition-colors duration-200 text-center"
                    style={{ width: TAB_W }}
                  >
                    <span className={`text-xs font-semibold ${active ? 'text-blue-600' : 'text-gray-400'}`}>
                      {name.slice(0, 3)}
                    </span>
                    {isCurrent && !active && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Gradient fades */}
          <div className="absolute left-0 inset-y-0 w-5 bg-gradient-to-r from-white to-transparent pointer-events-none z-20" />
          <div className="absolute right-0 inset-y-0 w-5 bg-gradient-to-l from-white to-transparent pointer-events-none z-20" />
        </div>

        {/* Year select — matches tray style */}
        <div className="shrink-0">
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(parseInt(e.target.value))}
            className="text-sm font-bold text-gray-700 bg-gray-100 rounded-xl px-3 py-2 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            {state.years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

      </div>
    </header>
  );
}
