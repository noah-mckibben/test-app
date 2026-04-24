import { useState, useEffect, useRef } from 'react'
import { RefreshCw, Trash2, AlertTriangle, AlertCircle, Info, CheckCircle, Activity } from 'lucide-react'
import { apiJson, api } from '../../lib/api'

const SEV_STYLES = {
  ERROR: { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    badge: 'bg-red-100 text-red-700',    icon: AlertCircle  },
  WARN:  { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle },
  INFO:  { bg: 'bg-white',     border: 'border-gray-100',   text: 'text-gray-700',   badge: 'bg-gray-100 text-gray-600',   icon: Info          },
}

const TYPE_COLORS = {
  CAMPAIGN_DIAL:   'bg-blue-100 text-blue-700',
  CALL_CONNECTED:  'bg-green-100 text-green-700',
  CALL_COMPLETED:  'bg-green-100 text-green-700',
  CALL_FAILED:     'bg-red-100 text-red-700',
  SYSTEM_ERROR:    'bg-red-100 text-red-700',
  INTEGRATION_CALL:'bg-purple-100 text-purple-700',
  AGENT_STATUS:    'bg-gray-100 text-gray-600',
  CAMPAIGN_STATUS: 'bg-indigo-100 text-indigo-700',
}

function fmtTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export default function AdminDiagnosticsPage() {
  const [health, setHealth]     = useState(null)
  const [events, setEvents]     = useState([])
  const [page, setPage]         = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading]   = useState(false)
  const [filter, setFilter]     = useState('ALL')   // ALL | ERROR | WARN | INFO
  const [expanded, setExpanded] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => { loadAll() }, [page])

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => { if (page === 0) loadAll() }, 5000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [autoRefresh, page])

  async function loadAll() {
    setLoading(true)
    try {
      const [h, e] = await Promise.all([
        apiJson('/api/admin/diagnostics/health'),
        apiJson(`/api/admin/diagnostics/events?page=${page}&size=50`),
      ])
      setHealth(h)
      setEvents(e.content || [])
      setTotalPages(e.totalPages || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = filter === 'ALL' ? events : events.filter(e => e.severity === filter)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-sm font-bold text-gray-800">Diagnostics & Event Log</h2>
          <p className="text-xs text-gray-400 mt-0.5">Real-time platform events, call attempts, and errors</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(v => !v)}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl border transition-colors ${
              autoRefresh ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
            }`}>
            <Activity size={13} /> {autoRefresh ? 'Live' : 'Live Off'}
          </button>
          <button onClick={() => { setPage(0); loadAll() }}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl border bg-white border-gray-200 text-gray-600 hover:border-gray-300 transition-colors ${loading ? 'opacity-50' : ''}`}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Health cards */}
      {health && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Status',           val: health.status,           color: health.status === 'HEALTHY' ? 'text-green-600' : 'text-red-600' },
            { label: 'Errors',           val: health.errors,           color: health.errors > 0 ? 'text-red-600' : 'text-gray-700' },
            { label: 'Warnings',         val: health.warnings,         color: health.warnings > 0 ? 'text-yellow-600' : 'text-gray-700' },
            { label: 'Active Campaigns', val: health.activeCampaigns,  color: 'text-blue-600' },
            { label: 'Online Agents',    val: health.onlineAgents,     color: 'text-green-600' },
            { label: 'Pending Contacts', val: health.pendingContacts,  color: 'text-indigo-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm px-3 py-3 text-center">
              <p className={`text-xl font-bold ${s.color}`}>{s.val}</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter + event list */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Filter bar */}
        <div className="flex items-center gap-1 px-4 py-3 border-b border-gray-100 bg-gray-50 flex-wrap">
          {['ALL','INFO','WARN','ERROR'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                filter === f ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'
              }`}>{f}</button>
          ))}
          <span className="ml-auto text-xs text-gray-400">{filtered.length} events shown</span>
        </div>

        {/* Events */}
        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <CheckCircle size={32} className="text-green-400 mx-auto mb-3" />
            <p className="text-sm text-gray-500 font-medium">No events yet</p>
            <p className="text-xs text-gray-400 mt-1">Events appear here as the system processes calls and campaigns</p>
          </div>
        )}

        <div className="divide-y divide-gray-50 max-h-[60vh] overflow-y-auto">
          {filtered.map(ev => {
            const s   = SEV_STYLES[ev.severity] || SEV_STYLES.INFO
            const Icon = s.icon
            const isExp = expanded === ev.id

            return (
              <div key={ev.id}
                className={`px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 ${isExp ? s.bg : ''}`}
                onClick={() => setExpanded(isExp ? null : ev.id)}>
                <div className="flex items-start gap-3">
                  <Icon size={15} className={`${s.text} mt-0.5 flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[ev.type] || 'bg-gray-100 text-gray-600'}`}>
                        {ev.type}
                      </span>
                      {ev.source && <span className="text-xs text-gray-400">{ev.source}</span>}
                      <span className="text-xs text-gray-400 ml-auto">{fmtTime(ev.timestamp)}</span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{ev.message}</p>

                    {isExp && ev.details && (
                      <pre className="mt-2 text-xs bg-gray-900 text-green-400 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap font-mono">
                        {(() => { try { return JSON.stringify(JSON.parse(ev.details), null, 2) } catch { return ev.details } })()}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
              className="text-xs text-blue-600 hover:underline disabled:opacity-40 disabled:no-underline">← Previous</button>
            <span className="text-xs text-gray-500">Page {page + 1} of {totalPages}</span>
            <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
              className="text-xs text-blue-600 hover:underline disabled:opacity-40 disabled:no-underline">Next →</button>
          </div>
        )}
      </div>

      {/* Dialing notes */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-4 space-y-1.5">
        <p className="text-xs font-bold text-blue-800">Campaign Dialing Notes</p>
        <p className="text-xs text-blue-700">• <b>PREVIEW</b> mode: agents dial manually — no auto-dial occurs.</p>
        <p className="text-xs text-blue-700">• <b>POWER / PREDICTIVE / BLASTER</b>: the dialer runs every 30 seconds. Calls appear in this log as <code className="bg-blue-100 px-1 rounded">CAMPAIGN_DIAL</code> events.</p>
        <p className="text-xs text-blue-700">• Phone numbers must be in E.164 format: <code className="bg-blue-100 px-1 rounded">+17654257718</code></p>
        <p className="text-xs text-blue-700">• Twilio must be able to reach <code className="bg-blue-100 px-1 rounded">APP_BASE_URL/api/twilio/campaign/&#123;id&#125;/voice</code> — use ngrok or a public URL in dev.</p>
        <p className="text-xs text-blue-700">• Set <code className="bg-blue-100 px-1 rounded">APP_BASE_URL</code> env var to your public server URL (e.g. <code className="bg-blue-100 px-1 rounded">https://yourapp.com</code>).</p>
      </div>
    </div>
  )
}
