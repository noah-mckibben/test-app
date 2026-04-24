import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Phone, Users, BookUser, Settings, LogOut, PhoneCall } from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/dialpad',   icon: Phone,           label: 'Dialpad'   },
  { to: '/contacts',  icon: BookUser,         label: 'Contacts'  },
  { to: '/agents',    icon: Users,            label: 'Agents'    },
  { to: '/settings',  icon: Settings,         label: 'Settings'  },
]

export default function Sidebar({ onLogout }) {
  return (
    <aside className="fixed top-0 left-0 h-screen w-60 bg-white border-r border-gray-200 flex flex-col z-30">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <PhoneCall size={18} className="text-white" />
        </div>
        <span className="text-base font-bold text-gray-800 tracking-tight">Phone App</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-3 mb-3">Main Menu</p>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ` +
              (isActive
                ? 'bg-blue-50 text-blue-700 font-semibold'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900')
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={17} className={isActive ? 'text-blue-600' : 'text-gray-400'} />
                {label}
                {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-gray-100">
        <button
          onClick={onLogout}
          className="nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={17} className="text-gray-400" />
          Log Out
        </button>
      </div>
    </aside>
  )
}
