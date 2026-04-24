import { useLocation } from 'react-router-dom'
import { Wifi, WifiOff } from 'lucide-react'
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

export default function Navbar({ user, status, onStatusChange }) {
  const location = useLocation()
  const { twilioReady } = useCall()
  const title = pageTitles[location.pathname] || 'Phone App'
  const crumb = location.pathname.replace('/', '')

  return (
    <header className="bg-white border-b border-gray-200 px-6 h-16 flex items-center justify-between flex-shrink-0">
      <div>
        <p className="text-xs text-gray-400 leading-none mb-1 capitalize">Pages / {crumb || 'home'}</p>
        <h1 className="text-base font-bold text-gray-800 leading-none">{title}</h1>
      </div>

      <div className="flex items-center gap-5">
        {/* Phone status */}
        <div className={`hidden sm:flex items-center gap-1.5 text-xs font-medium ${twilioReady ? 'text-green-600' : 'text-gray-400'}`}>
          {twilioReady
            ? <><Wifi size={13} /> Phone Ready</>
            : <><WifiOff size={13} /> Connecting</>}
        </div>

        {/* Status selector */}
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusColors[status] || 'bg-gray-400'}`} />
          <select
            value={status}
            onChange={e => onStatusChange(e.target.value)}
            className="text-sm text-gray-700 bg-transparent border-none outline-none cursor-pointer font-medium"
          >
            <option value="ONLINE">Online</option>
            <option value="BUSY">Busy</option>
            <option value="OFFLINE">Offline</option>
          </select>
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {user?.displayName?.[0]?.toUpperCase() || 'U'}
          </div>
          <span className="text-sm font-medium text-gray-700 hidden md:block">{user?.displayName}</span>
        </div>
      </div>
    </header>
  )
}
