import { NavLink } from 'react-router-dom';

const ITEMS = [
  {
    to: '/',
    end: true,
    label: 'Transactions',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2
             M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2
             M9 12h6M9 16h4" />
      </svg>
    ),
  },
  {
    to: '/recurring',
    end: false,
    label: 'Recurring',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9
             m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  },
  {
    to: '/settings',
    end: false,
    label: 'Settings',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066
             c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572
             c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573
             c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065
             c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066
             c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572
             c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573
             c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export default function FloatingNav() {
  return (
    <div className="fixed bottom-8 right-4 z-50 flex flex-col gap-3">
      {ITEMS.map(item => (
        <NavLink key={item.to} to={item.to} end={item.end} title={item.label}>
          {({ isActive }) => (
            <div className={`
              w-11 h-11 rounded-2xl flex items-center justify-center
              shadow-lg transition-all duration-150
              ${isActive
                ? 'bg-blue-600 text-white shadow-blue-300'
                : 'bg-white text-gray-500 hover:text-blue-600 hover:shadow-xl'
              }
            `}>
              {item.icon}
            </div>
          )}
        </NavLink>
      ))}
    </div>
  );
}
