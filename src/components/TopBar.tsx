import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useBudget } from '../store/BudgetContext';
import { MONTH_NAMES } from '../types';

export default function TopBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, selectedYear, setSelectedYear } = useBudget();

  const [yearOpen, setYearOpen] = useState(false);
  const yearRef = useRef<HTMLDivElement>(null);

  const monthMatch = location.pathname.match(/^\/month\/(\d+)/);
  const activeMonth = monthMatch ? parseInt(monthMatch[1], 10) : null;
  const onYear = location.pathname === '/year';

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (yearRef.current && !yearRef.current.contains(e.target as Node)) setYearOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  function handleYearClick() {
    if (onYear) {
      setYearOpen(o => !o);
    } else {
      setYearOpen(false);
      navigate('/year');
    }
  }

  function pickYear(y: number) {
    setSelectedYear(y);
    setYearOpen(false);
    navigate('/year');
  }

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="flex items-stretch overflow-x-auto no-scrollbar">
        {MONTH_NAMES.map((name, i) => {
          const m = i + 1;
          const active = activeMonth === m;
          return (
            <button
              key={name}
              onClick={() => navigate(`/month/${m}`)}
              className={`shrink-0 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                active
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {name}
            </button>
          );
        })}

        {/* Year tab — conspicuous, second click opens dropdown */}
        <div ref={yearRef} className="relative shrink-0 ml-auto">
          <button
            onClick={handleYearClick}
            className={`px-5 py-3 text-base font-bold whitespace-nowrap border-b-2 transition-colors flex items-center gap-1 ${
              onYear
                ? 'border-blue-600 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-900 hover:bg-gray-50'
            }`}
          >
            {selectedYear}
            <span className={`text-xs transition-transform duration-200 ${yearOpen ? 'rotate-180' : ''}`}>▾</span>
          </button>

          {yearOpen && (
            <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden origin-top-right animate-[dropdown_150ms_ease-out] z-50">
              {state.years.map(y => (
                <button
                  key={y}
                  onClick={() => pickYear(y)}
                  className={`block w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${
                    y === selectedYear ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
