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
  const yearScrollRef = useRef<HTMLDivElement>(null);
  const yearTabRefs = useRef<Map<number, HTMLButtonElement | null>>(new Map());

  const monthMatch = location.pathname.match(/^\/month\/(\d+)/);
  const activeMonth = monthMatch ? parseInt(monthMatch[1], 10) : null;
  const onYear = location.pathname === '/year';
  const multipleYears = state.years.length > 1;

  function scrollToTab(
    ref: React.RefObject<HTMLDivElement | null>,
    tab: HTMLButtonElement | null
  ) {
    const container = ref.current;
    if (!tab || !container) return;
    const targetLeft = tab.offsetLeft - container.offsetWidth / 2 + tab.offsetWidth / 2;
    container.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' });
  }

  // Scroll months: on first load → current month; on navigation → active month
  useEffect(() => {
    const targetIdx = (activeMonth ?? CURRENT_MONTH) - 1;
    scrollToTab(monthScrollRef, monthTabRefs.current[targetIdx] ?? null);
  }, [activeMonth]);

  // Scroll years when selectedYear changes
  useEffect(() => {
    if (multipleYears) {
      scrollToTab(yearScrollRef, yearTabRefs.current.get(selectedYear) ?? null);
    }
  }, [selectedYear, multipleYears]);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      {/* Year strip — only when 2+ years */}
      {multipleYears && (
        <div className="relative flex border-b border-gray-100">
          <div className="absolute left-0 inset-y-0 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none z-10" />
          <div ref={yearScrollRef} className="overflow-x-auto no-scrollbar flex flex-1">
            {state.years.map(y => (
              <button
                key={y}
                ref={el => { yearTabRefs.current.set(y, el); }}
                onClick={() => { setSelectedYear(y); navigate('/year'); }}
                className={`shrink-0 px-5 py-2 text-sm font-bold border-b-2 transition-colors ${
                  y === selectedYear
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-400 hover:text-gray-700'
                }`}
              >
                {y}
              </button>
            ))}
          </div>
          <div className="absolute right-0 inset-y-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />
        </div>
      )}

      {/* Month strip */}
      <div className="flex items-stretch">
        <div className="relative flex-1 overflow-hidden">
          <div className="absolute left-0 inset-y-0 w-10 bg-gradient-to-r from-white to-transparent pointer-events-none z-10" />
          <div ref={monthScrollRef} className="overflow-x-auto no-scrollbar flex">
            {MONTH_NAMES.map((name, i) => {
              const m = i + 1;
              const active = activeMonth === m;
              const isCurrent = m === CURRENT_MONTH && !activeMonth;
              return (
                <button
                  key={name}
                  ref={el => { monthTabRefs.current[i] = el; }}
                  onClick={() => navigate(`/month/${m}`)}
                  className={`shrink-0 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    active
                      ? 'border-blue-600 text-blue-600'
                      : isCurrent
                      ? 'border-blue-200 text-blue-400 hover:text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>
          <div className="absolute right-0 inset-y-0 w-10 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />
        </div>

        {/* Year — shown at far right when single year */}
        {!multipleYears && (
          <button
            onClick={() => navigate('/year')}
            className={`shrink-0 pl-2 pr-4 py-3 text-base font-bold border-b-2 transition-colors ${
              onYear
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-900 hover:text-blue-600'
            }`}
          >
            {selectedYear}
          </button>
        )}
      </div>
    </header>
  );
}
