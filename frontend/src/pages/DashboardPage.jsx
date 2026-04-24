import { useMemo } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { useCall } from '../context/CallContext'
import StatCard from '../components/StatCard'
import Card from '../components/Card'

const STATUS_BADGE = {
  ANSWERED: 'bg-green-100 text-green-700',
  ENDED:    'bg-gray-100 text-gray-600',
  MISSED:   'bg-red-100 text-red-700',
  REJECTED: 'bg-yellow-100 text-yellow-700',
  INITIATED:'bg-blue-100 text-blue-700',
  RINGING:  'bg-purple-100 text-purple-700',
}
const PIE_COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#6b7280']

function formatDuration(s) {
  if (!s) return '0s'
  const m = Math.floor(s / 60)
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`
}
function formatTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const TOOLTIP_STYLE = {
  borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', fontSize: 12,
}

export default function DashboardPage() {
  const { callHistory, onlineUsers } = useCall()
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')

  const stats = useMemo(() => {
    const midnight = new Date(); midnight.setHours(0, 0, 0, 0)
    const todaysCalls = callHistory.filter(c => new Date(c.startTime) >= midnight)
    const durations = callHistory.filter(c => c.durationSeconds).map(c => c.durationSeconds)
    const avgDur = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0
    const activeCalls = callHistory.filter(c => c.status === 'ANSWERED').length
    return { todaysCalls: todaysCalls.length, activeCalls, onlineAgents: onlineUsers.length, avgDur }
  }, [callHistory, onlineUsers])

  // Hourly call volume (last 12 h)
  const hourlyData = useMemo(() => {
    const now = new Date()
    const buckets = Array.from({ length: 12 }, (_, i) => {
      const h = new Date(now - (11 - i) * 3_600_000)
      return { label: h.getHours() + ':00', count: 0 }
    })
    const cutoff = new Date(now - 12 * 3_600_000)
    callHistory.filter(c => new Date(c.startTime) >= cutoff).forEach(c => {
      const label = new Date(c.startTime).getHours() + ':00'
      const b = buckets.find(x => x.label === label)
      if (b) b.count++
    })
    return buckets
  }, [callHistory])

  // Status pie
  const pieData = useMemo(() => {
    const counts = {}
    callHistory.forEach(c => { counts[c.status] = (counts[c.status] || 0) + 1 })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [callHistory])

  // Daily bar (last 7 d)
  const dailyData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i)); d.setHours(0, 0, 0, 0)
      return { day: d.toLocaleDateString([], { weekday: 'short' }), count: 0, _ts: d.getTime() }
    })
    callHistory.forEach(c => {
      const d = new Date(c.startTime); d.setHours(0, 0, 0, 0)
      const b = days.find(x => x._ts === d.getTime())
      if (b) b.count++
    })
    return days
  }, [callHistory])

  const recent = callHistory.slice(0, 8)

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Active Calls"   value={stats.activeCalls}          subtitle="Currently in progress" icon="📞" color="blue"   />
        <StatCard title="Online Agents"  value={stats.onlineAgents}         subtitle="Ready to take calls"   icon="👥" color="green"  />
        <StatCard title="Calls Today"    value={stats.todaysCalls}          subtitle="Since midnight"         icon="📊" color="orange" />
        <StatCard title="Avg Duration"   value={formatDuration(stats.avgDur)} subtitle="All-time average"    icon="⏱" color="purple" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card title="Call Volume" subtitle="Last 12 hours" className="xl:col-span-2">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={hourlyData} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3, fill: '#3b82f6' }} name="Calls" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Call Outcomes" subtitle="Status breakdown">
          {pieData.length === 0
            ? <div className="h-[220px] flex items-center justify-center text-sm text-gray-400">No data yet</div>
            : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="45%" innerRadius={48} outerRadius={76} paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            )
          }
        </Card>
      </div>

      {/* Bar + Recent calls */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card title="Weekly Volume" subtitle="Calls per day, last 7 days">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dailyData} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Calls" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Recent Calls" subtitle="Latest activity" className="xl:col-span-2"
          footer={`${callHistory.length} total call records`}>
          {recent.length === 0
            ? <p className="text-sm text-gray-400 text-center py-8">No call history yet</p>
            : (
              <div className="divide-y divide-gray-50 -mx-5 -mt-5">
                {recent.map(call => {
                  const isCaller = call.caller.id === currentUser.id
                  const other = isCaller
                    ? (call.callee?.displayName || call.calleeNumber || 'External')
                    : call.caller.displayName
                  const arrow = isCaller ? '↗' : (call.status === 'MISSED' ? '↙' : '↘')
                  const arrowColor = isCaller ? 'text-blue-500' : (call.status === 'MISSED' ? 'text-red-500' : 'text-green-500')
                  const badge = STATUS_BADGE[call.status] || 'bg-gray-100 text-gray-600'
                  return (
                    <div key={call.id} className="flex items-center justify-between px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className={`w-7 text-center text-sm font-bold ${arrowColor}`}>{arrow}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{other}</p>
                          <p className="text-xs text-gray-400">{formatTime(call.startTime)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-right">
                        {call.durationSeconds && (
                          <span className="text-xs text-gray-400 hidden sm:block">{formatDuration(call.durationSeconds)}</span>
                        )}
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge}`}>{call.status}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          }
        </Card>
      </div>
    </div>
  )
}
