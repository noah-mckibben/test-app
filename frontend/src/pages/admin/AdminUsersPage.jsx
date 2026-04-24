import { useState, useEffect } from 'react'
import { Shield, Trash2, ChevronDown } from 'lucide-react'
import { apiJson, api } from '../../lib/api'

const ROLES = ['AGENT','SUPERVISOR','ADMIN']
const ROLE_COLORS = {
  ADMIN:      'bg-purple-100 text-purple-700',
  SUPERVISOR: 'bg-blue-100 text-blue-700',
  AGENT:      'bg-gray-100 text-gray-600',
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const me = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => { load() }, [])

  async function load() {
    const data = await apiJson('/api/admin/users')
    setUsers(data)
  }

  async function changeRole(id, role) {
    await api('/api/admin/users/' + id + '/role', {
      method: 'PUT',
      body: JSON.stringify({ role }),
    })
    load()
  }

  async function remove(id) {
    if (!confirm('Delete this user?')) return
    await api('/api/admin/users/' + id, { method: 'DELETE' })
    load()
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-bold text-gray-800">Users & Roles</h2>
        <p className="text-xs text-gray-400 mt-0.5">{users.length} total users</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-0 bg-gray-50 px-5 py-3 border-b border-gray-100">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">User</span>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-28 text-center">Status</span>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-36 text-center">Role</span>
          <span className="w-10" />
        </div>
        {users.map(u => (
          <div key={u.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-0 items-center px-5 py-3.5 border-b border-gray-50 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {u.displayName?.[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{u.displayName}</p>
                <p className="text-xs text-gray-400">@{u.username}</p>
              </div>
            </div>
            <div className="w-28 flex justify-center">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.status === 'ONLINE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {u.status}
              </span>
            </div>
            <div className="w-36 flex justify-center">
              {u.id === me.id ? (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ROLE_COLORS[u.role] || 'bg-gray-100 text-gray-600'}`}>
                  {u.role}
                </span>
              ) : (
                <select
                  value={u.role}
                  onChange={e => changeRole(u.id, e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-700 outline-none focus:border-blue-400 cursor-pointer"
                >
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              )}
            </div>
            <div className="w-10 flex justify-end">
              {u.id !== me.id && (
                <button onClick={() => remove(u.id)}
                  className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
