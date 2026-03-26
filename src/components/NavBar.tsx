import React from 'react'

export type NavItem = 'map' | 'route' | 'incidents' | 'layers' | 'daynight' | 'settings' | 'profile'

interface NavItemDef {
  id: NavItem
  label: string
  icon: React.ReactNode
}

interface Props {
  activeNav: NavItem
  onNavChange: (item: NavItem) => void
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const MapIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
    <line x1="8" y1="2" x2="8" y2="18"/>
    <line x1="16" y1="6" x2="16" y2="22"/>
  </svg>
)

const RouteIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="19" r="3"/>
    <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/>
    <circle cx="18" cy="5" r="3"/>
  </svg>
)

const ListIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/>
    <line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/>
    <line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
)

const LayersIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2"/>
    <polyline points="2 17 12 22 22 17"/>
    <polyline points="2 12 12 17 22 12"/>
  </svg>
)

const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
)

const BookmarkIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
  </svg>
)

const GearIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
)

const PersonIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)

// ─── Nav items ────────────────────────────────────────────────────────────────

const topItems: NavItemDef[] = [
  { id: 'map',       label: 'マップ概要',         icon: <MapIcon /> },
  { id: 'route',     label: 'ルート探索',          icon: <RouteIcon /> },
  { id: 'incidents', label: 'インシデント',         icon: <ListIcon /> },
]

const middleItems: NavItemDef[] = [
  { id: 'layers',   label: 'レイヤー & フィルター', icon: <LayersIcon /> },
  { id: 'daynight', label: '昼夜切り替え',           icon: <MoonIcon /> },
]

const bottomItems: NavItemDef[] = [
  { id: 'settings', label: '設定',         icon: <GearIcon /> },
  { id: 'profile',  label: 'プロフィール', icon: <PersonIcon /> },
]

// ─── NavButton ────────────────────────────────────────────────────────────────

function NavButton({
  item,
  active,
  onClick,
}: {
  item: NavItemDef
  active: boolean
  onClick: () => void
}) {
  return (
    <div className="relative group w-full">
      {/* Left-edge active indicator */}
      <div
        className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 rounded-r-full transition-all duration-200 ${
          active ? 'bg-green-500' : 'bg-transparent'
        }`}
      />
      <div className="flex justify-center py-0.5">
        <button
          onClick={onClick}
          className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-150 ${
            active
              ? 'text-green-600 bg-green-50'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
          }`}
        >
          {item.icon}
        </button>
      </div>
      {/* Tooltip */}
      <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <div className="relative bg-gray-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
          {item.label}
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function NavBar({ activeNav, onNavChange }: Props) {
  return (
    <nav className="flex flex-col w-16 bg-white border-r border-gray-200 flex-shrink-0 py-3 gap-0.5 z-20 overflow-visible">
      {/* Top group: map, route, incidents */}
      {topItems.map((item) => (
        <NavButton
          key={item.id}
          item={item}
          active={activeNav === item.id}
          onClick={() => onNavChange(item.id)}
        />
      ))}

      <div className="mx-3 my-2 h-px bg-gray-100" />

      {/* Middle group: layers, daynight */}
      {middleItems.map((item) => (
        <NavButton
          key={item.id}
          item={item}
          active={activeNav === item.id}
          onClick={() => onNavChange(item.id)}
        />
      ))}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom group: saved (decorative), settings, profile */}
      <div className="relative group w-full">
        <div className="flex justify-center py-0.5">
          <button
            disabled
            className="w-11 h-11 flex items-center justify-center rounded-xl text-gray-300 cursor-default"
          >
            <BookmarkIcon />
          </button>
        </div>
        <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <div className="relative bg-gray-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
            保存済み（準備中）
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
          </div>
        </div>
      </div>

      {bottomItems.map((item) => (
        <NavButton
          key={item.id}
          item={item}
          active={activeNav === item.id}
          onClick={() => onNavChange(item.id)}
        />
      ))}
    </nav>
  )
}
