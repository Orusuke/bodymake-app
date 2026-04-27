import React from 'react'

const NAV = [
  { id: 'dashboard', label: 'ホーム', icon: '🏠' },
  { id: 'body', label: '体組成', icon: '⚖️' },
  { id: 'meals', label: '食事', icon: '🍱' },
  { id: 'exercise', label: '運動', icon: '🏃' },
  { id: 'charts', label: 'グラフ', icon: '📊' },
  { id: 'settings', label: '設定', icon: '⚙️' },
]

export default function NavBar({ page, onNav }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around z-50 pb-safe">
      {NAV.map((n) => (
        <button
          key={n.id}
          onClick={() => onNav(n.id)}
          className={`nav-item flex-1 px-1 ${page === n.id ? 'active' : ''}`}
        >
          <span className="text-xl">{n.icon}</span>
          <span className="text-[9px] font-medium whitespace-nowrap">{n.label}</span>
        </button>
      ))}
    </nav>
  )
}
