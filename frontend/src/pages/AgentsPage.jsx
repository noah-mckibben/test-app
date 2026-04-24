import { RefreshCw } from 'lucide-react'
import { useCall } from '../context/CallContext'
import { useNavigate } from 'react-router-dom'

const STATUS = {
  ONLINE:  { label: 'Online',  dot: 'bg-green-500',  badge: 'bg-green-100 text-green-700'  },
  BUSY:    { label: 'Busy',    dot: 'bg-yellow-400', badge: 'bg-yellow-100 text-yellow-700' },
  OFFLINE: { label: 'Offline', dot: 'bg-gray-400',   badge: 'bg-gray-100 text-gray-500'    },
}

export default function AgentsPage() {
  const { onlineUsers, loadOnlineUsers, dial } = useCall()
  const navigate = useNavigate()
  const me = JSON.parse(localStorage.getItem('user') || '{}')
  const agents = onlineUsers.filter(u => u.id !== me.id)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-700">Live Agent Status</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {agents.length} agent{agents.length !== 1 ? 's' : ''} currently online
          </p>
        </div>
        <button onClick={loadOnlineUsers}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors font-medium">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {agents.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-16 text-center">
          <p className="text-5xl mb-4">👥</p>
          <p className="text-gray-600 font-medium">No agents online</p>
          <p className="text-sm text-gray-400 mt-1">Agents appear here when they log in and set their status to Online</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {agents.map(agent => {
            const cfg = STATUS[agent.status] || STATUS.OFFLINE
            return (
              <div key={agent.id} className="card-hover bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-700 font-bold text-lg">
                    {agent.displayName?.[0]?.toUpperCase() || 'A'}
                  </div>
                  <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                  </span>
                </div>
                <p className="font-semibold text-gray-800 truncate">{agent.displayName}</p>
                <p className="text-sm text-gray-400 mt-0.5 truncate">@{agent.username}</p>
                {agent.phoneNumber && (
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{agent.phoneNumber}</p>
                )}
                <button
                  onClick={() => { dial(agent.phoneNumber || '', agent.displayName, agent.username, agent.id); navigate('/dialpad') }}
                  className="mt-4 w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium text-sm py-2.5 rounded-xl transition-colors">
                  📞 Call Agent
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
