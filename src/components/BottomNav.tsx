import { NavLink } from 'react-router-dom';

const ITEMS = [
  { to: '/', label: 'Transactions', end: true },
  { to: '/recurring', label: 'Recurring', end: false },
  { to: '/settings', label: 'Settings', end: false },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 flex h-14">
      {ITEMS.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `flex-1 flex items-center justify-center text-sm font-medium transition-colors ${
              isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
