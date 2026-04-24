import { useLocation, useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import {
  Wifi, WifiOff, Menu, ChevronDown,
  Circle, Settings, BookUser, LogOut,
  Phone, User, Shield
} from 'lucide-react'
import { useCall } from '../context/CallContext'
import { api } from '../lib/api'

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/dialpad':   'Dialpad',
  '/contacts':  'Contacts',
  '/agents':    'Agents',
  '/settings':  'Settings',
}

const STATUS_OPTIONS = [
  { value: 'ONLINE',  label: 'Online',  dot: 'bg-green-500',  ring: 'ring-green-200',  text: 'text-green-700',  bg: 'bg-green-50  hover:bg-green-100' },
  { value: 'BUSY',    label: 'Busy',    dot: 'bg-yellow-400', ring: 'ring-yellow-200', text: 'text-yellow-700', bg: 'bg-yellow-50 hover:bg-yellow-100' },
  { value: 'OFFLINE', label: 'Offline', dot: 'bg-gray-400',   ring: 'ring-gray-200',   text: 'text-gray-600',   bg: 'bg-gray-50   hover:bg-gray-100' },
]

const ROLE_STYLES = {
  ADMIN:      { bg: 'bg-purple-100', text: 'text-purple-700', icon: Shield },
  SUPERVISOR: { bg: 'bg-blue-100',   text: 'text-blue-700',   icon: Shield },
  AGENT:      { bg: 'bg-gray-100',   text: 'text-gray-600',   icon: User   },
}

export default function Navbar({ user, status, onStatusChange, onMenuClick, onLogout }) {
  const location    = useLocation()
  const navigate    = useNavigate()
  const { twilioReady, callHistory } = useCall()
  const [open, setOpen] = useState(false)
  const dropRef     = useRef(null)

  const title = pageTitles[location.pathname] || 'Phone App'
  const crumb = location.pathname.slice(1).split('/').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' / ') || 'Home'

  const currentStatus = STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0]
  const roleStyle     = ROLE_STYLES[user?.role] || ROLE_STYLES.AGENT
  const RoleIcon      = roleStyle.icon

  // Calls today stat
  const today = new Date().toDateString()
  const callsToday = (callHistory || []).filter(c => new Date(c.startTime).toDateString() === today).length

  // Close on outside click
  useEffect(() => {
    function handle(e) { if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  function handleStatusChange(val) {
    onStatusChange(val)
    // keep dropdown open so user sees the change
  }

  function navigate_and_close(path) {
    setOpen(false)
    navigate(path)
  }

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 h-16 flex items-center justify-between flex-shrink-0 gap-3 z-20 relative">

      {/* Left — breadcrumb + title */}
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={onMenuClick}
          className="lg:hidden p-2 -ml-1 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          aria-label="Open menu">
          <Menu size={20} />
        </button>
        <div className="min-w-0">
          <p className="text-xs text-gray-400 leading-none mb-0.5 hidden sm:block">{crumb}</p>
          <h1 className="text-base font-bold text-gray-800 leading-none truncate">{title}</h1>
        </div>
      </div>

      {/* Right — phone indicator + profile button */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">

        {/* Twilio / headset indicator */}
        <div className={`hidden sm:flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
          twilioReady
            ? 'text-green-700 bg-green-50 border-green-200'
            : 'text-gray-400 bg-gray-50 border-gray-200'
        }`}>
          {twilioReady ? <Wifi size={12} /> : <WifiOff size={12} />}
          <span className="hidden md:inline">{twilioReady ? 'Headset Ready' : 'Connecting…'}</span>
        </div>

        {/* Profile button */}
        <div className="relative" ref={dropRef}>
          <button
            onClick={() => setOpen(v => !v)}
            className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-xl hover:bg-gray-100 transition-colors group"
          >
            {/* Avatar with status ring */}
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                {user?.displayName?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${currentStatus.dot}`} />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold text-gray-800 leading-none">{user?.displayName}</p>
              <p className="text-xs text-gray-400 leading-none mt-0.5">{currentStatus.label}</p>
            </div>
            <ChevronDown size={14} className={`text-gray-400 transition-transform hidden md:block ${open ? 'rotate-180' : ''}`} />
          </button>

          {/* ── Dropdown panel ── */}
          {open && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">

              {/* Profile header */}
              <div className="px-4 py-4 bg-gradient-to-br from-blue-600 to-blue-700">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                    {user?.displayName?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-bold text-sm truncate">{user?.displayName}</p>
                    <p className="text-blue-200 text-xs truncate">@{user?.username}</p>
                    {user?.phoneNumber && (
                      <p className="text-blue-200 text-xs mt-0.5 flex items-center gap-1">
                        <Phone size={10} /> {user.phoneNumber}
                      </p>
                    )}
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${roleStyle.bg} ${roleStyle.text}`}>
                    {user?.role || 'AGENT'}
                  </span>
                </div>

                {/* Quick stat */}
                <div className="mt-3 flex items-center gap-4">
                  <div className="bg-white/10 rounded-lg px-3 py-1.5 text-center flex-1">
                    <p className="text-white font-bold text-base">{callsToday}</p>
                    <p className="text-blue-200 text-xs">Calls Today</p>
                  </div>
                  <div className={`rounded-lg px-3 py-1.5 text-center flex-1 ${twilioReady ? 'bg-green-500/30' : 'bg-white/10'}`}>
                    <p className="text-white font-bold text-xs">{twilioReady ? '🟢 Ready' : '🔴 Offline'}</p>
                    <p className="text-blue-200 text-xs">Headset</p>
                  </div>
                </div>
              </div>

              {/* Status selector */}
              <div className="px-3 py-3 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 mb-2">Agent Status</p>
                <div className="space-y-1">
                  {STATUS_OPTIONS.map(opt => (
                    <button key={opt.value}
                      onClick={() => handleStatusChange(opt.value)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                        status === opt.value
                          ? `${opt.bg} ${opt.text} ring-1 ${opt.ring}`
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}>
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${opt.dot}`} />
                      {opt.label}
                      {status === opt.value && <span className="ml-auto text-xs">✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick links */}
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 mb-1.5">Quick Access</p>
                {[
                  { icon: User,     label: 'My Profile',  sub: 'Account & preferences', path: '/settings'  },
                  { icon: BookUser, label: 'Contacts',    sub: 'Your contact list',      path: '/contacts'  },
                  { icon: Phone,    label: 'Dialpad',     sub: 'Make or receive calls',  path: '/dialpad'   },
                ].map(({ icon: Icon, label, sub, path }) => (
                  <button key={path}
                    onClick={() => navigate_and_close(path)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon size={15} className="text-gray-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800">{label}</p>
                      <p className="text-xs text-gray-400">{sub}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Logout */}
              <div className="px-3 py-2">
                <button onClick={() => { setOpen(false); onLogout() }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 text-red-600 transition-colors text-left group">
                  <div className="w-8 h-8 bg-red-50 group-hover:bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors">
                    <LogOut size={15} className="text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Sign Out</p>
                    <p className="text-xs text-red-400">End your session</p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
