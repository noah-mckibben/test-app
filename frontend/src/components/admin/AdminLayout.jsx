import { NavLink, Outlet } from 'react-router-dom'
import { Users, Puzzle, GitBranch, Briefcase, Megaphone, ChevronRight, Activity } from 'lucide-react'

const links = [
  { to: '/admin/users',        icon: Users,      label: 'Users & Roles',  roles: ['ADMIN','SUPERVISOR'] },
  { to: '/admin/work-types',   icon: Briefcase,  label: 'Work Types',     roles: ['ADMIN','SUPERVISOR'] },
  { to: '/admin/campaigns',    icon: Megaphone,  label: 'Campaigns',      roles: ['ADMIN','SUPERVISOR'] },
  { to: '/admin/diagnostics',  icon: Activity,   label: 'Diagnostics',    roles: ['ADMIN','SUPERVISOR'] },
  { to: '/admin/call-flows',   icon: GitBranch,  label: 'Call Flows',     roles: ['ADMIN'] },
  { to: '/admin/integrations', icon: Puzzle,     label: 'Integrations',   roles: ['ADMIN'] },
]

export default function AdminLayout() {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
  const visibleLinks = links.filter(l => l.roles.includes(currentUser.role))

  return (
    <div className="flex gap-5 min-h-full">
      <aside className="w-52 flex-shrink-0">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Admin Panel</p>
          </div>
          <nav className="p-2 space-y-0.5">
            {visibleLinks.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to}
                className={({ isActive }) =>
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ' +
                  (isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50')
                }>
                {({ isActive }) => (
                  <>
                    <Icon size={15} className={isActive ? 'text-blue-600' : 'text-gray-400'} />
                    <span className="flex-1">{label}</span>
                    {isActive && <ChevronRight size={13} className="text-blue-400" />}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>
      <div className="flex-1 min-w-0"><Outlet /></div>
    </div>
  )
}
