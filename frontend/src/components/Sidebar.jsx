import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, Settings, PhoneCall, X, ShieldCheck } from 'lucide-react'

const mainItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/agents',    icon: Users,           label: 'Agents'    },
]

export default function Sidebar({ isOpen, onClose }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const isPrivileged = user.role === 'ADMIN' || user.role === 'SUPERVISOR'

  function NavItem({ to, icon: Icon, label }) {
    return (
      <NavLink to={to} onClick={onClose}
        className={({ isActive }) =>
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ' +
          (isActive ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900')
        }>
        {({ isActive }) => (
          <>
            <Icon size={17} className={isActive ? 'text-blue-600' : 'text-gray-400'} />
            {label}
            {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />}
          </>
        )}
      </NavLink>
    )
  }

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onClose} />}
      <aside className={[
        'fixed top-0 left-0 h-screen w-64 bg-white border-r border-gray-200',
        'flex flex-col z-50 transition-transform duration-300 ease-in-out',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        'lg:translate-x-0 lg:w-60 lg:z-30',
      ].join(' ')}>

        <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <PhoneCall size={18} className="text-white" />
            </div>
            <span className="text-base font-bold text-gray-800 tracking-tight">Phone App</span>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-3 mb-2">Main Menu</p>
          {mainItems.map(item => <NavItem key={item.to} {...item} />)}

          {isPrivileged && (
            <>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-3 mt-5 mb-2">Administration</p>
              <NavItem to="/admin" icon={ShieldCheck} label="Admin Panel" />
            </>
          )}
        </nav>
      </aside>
    </>
  )
}
