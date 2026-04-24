import { useLocation } from 'react-router-dom'
import { Wifi, WifiOff, Menu } from 'lucide-react'
import { useCall } from '../context/CallContext'

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/dialpad':   'Dialpad',
  '/contacts':  'Contacts',
  '/agents':    'Agents',
  '/settings':  'Settings',
}

const statusColors = {
  ONLINE:  'bg-green-500',
  BUSY:    'bg-yellow-400',
  OFFLINE: 'bg-gray-400',
}

export default function Navbar({ user, status, onStatusChange, onMenuClick }) {
  const location = useLocation()
  const { twilioReady } = useCall()
  const title = pageTitles[location.pathname] || 'Phone App'
  const crumb = location.pathname.replace('/', '')

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 h-16 flex items-center justify-between flex-shrink-0 gap-3">
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-1 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <div className="min-w-0">
          <p className="text-xs text-gray-400 leading-none mb-1 capitalize hidden sm:block">
            Pages / {crumb || 'home'}
          </p>
          <h1 className="text-base font-bold text-gray-800 leading-none truncate">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-5 flex-shrink-0">
        {/* Phone status — hidden on small screens */}
        <div className={`hidden md:flex items-center gap-1.5 text-xs font-medium ${twilioReady ? 'text-green-600' : 'text-gray-400'}`}>
          {twilioReady
            ? <><Wifi size={13} /> Phone Ready</>
            : <><WifiOff size={13} /> Connecting</>}
        </div>

        {/* Status selector */}
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusColors[status] || 'bg-gray-400'}`} />
          <select
            value={status}
            onChange={e => onStatusChange(e.target.value)}
            className="text-sm text-gray-700 bg-transparent border-none outline-none cursor-pointer font-medium max-w-[80px] sm:max-w-none"
          >
            <option value="ONLINE">Online</option>
            <option value="BUSY">Busy</option>
            <option value="OFFLINE">Offline</option>
          </select>
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {user?.displayName?.[0]?.toUpperCase() || 'U'}
          </div>
          <span className="text-sm font-medium text-gray-700 hidden lg:block">{user?.displayName}</span>
        </div>
      </div>
    </header>
  )
}
