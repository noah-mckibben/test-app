import { useState } from 'react'
import { Mic, MicOff, PhoneOff, Clock, Users, Delete, Phone } from 'lucide-react'
import { useCall } from '../context/CallContext'
import { api } from '../lib/api'

const KEYS = ['1','2','3','4','5','6','7','8','9','*','0','#']

function fmt(s) {
  if (!s) return ''
  const m = Math.floor(s / 60)
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`
}
function fmtTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ── sub-panels ──────────────────────────────────────────────────────────────

function HistoryPanel({ callHistory, currentUser, onSelect }) {
  if (callHistory.length === 0)
    return <p className="p-6 text-center text-sm text-gray-400">No recent calls</p>
  return callHistory.slice(0, 30).map(call => {
    const isCaller = call.caller.id === currentUser.id
    const other = isCaller ? (call.callee?.displayName || call.calleeNumber || 'External') : call.caller.displayName
    const isMissed = call.status === 'MISSED' || call.status === 'REJECTED'
    const num = isCaller ? (call.calleeNumber || call.callee?.phoneNumber || '') : (call.caller.phoneNumber || '')
    return (
      <button key={call.id} onClick={() => onSelect(num)}
        className="w-full flex items-center gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors text-left">
        <span className={`text-xs font-bold w-4 flex-shrink-0 ${isCaller ? 'text-blue-500' : isMissed ? 'text-red-500' : 'text-green-500'}`}>
          {isCaller ? '↗' : isMissed ? '↙' : '↘'}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{other}</p>
          <p className="text-xs text-gray-400">{fmtTime(call.startTime)}</p>
        </div>
        {call.durationSeconds && <span className="text-xs text-gray-400 flex-shrink-0">{fmt(call.durationSeconds)}</span>}
      </button>
    )
  })
}

function ContactsPanel({ contacts, onSelect }) {
  if (contacts.length === 0)
    return <p className="p-6 text-center text-sm text-gray-400">No contacts</p>
  return contacts.map(c => (
    <button key={c.id} onClick={() => onSelect(c.phoneNumber)}
      className="w-full flex items-center gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors text-left">
      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold text-xs flex-shrink-0">
        {c.name[0]?.toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{c.name}</p>
        <p className="text-xs text-gray-400">{c.phoneNumber}</p>
      </div>
      {c.appStatus === 'ONLINE' && <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />}
    </button>
  ))
}

function AgentsPanel({ users, onDial }) {
  if (users.length === 0)
    return <p className="p-6 text-center text-sm text-gray-400">No agents currently online</p>
  return users.map(u => (
    <div key={u.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50">
      <div className="relative flex-shrink-0">
        <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold text-sm">
          {u.displayName?.[0]?.toUpperCase()}
        </div>
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{u.displayName}</p>
        <p className="text-xs text-gray-400">@{u.username}</p>
      </div>
      <button onClick={() => onDial(u)}
        className="p-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors flex-shrink-0 text-sm font-medium">
        Call
      </button>
    </div>
  ))
}

// ── main component ───────────────────────────────────────────────────────────

export default function DialpadPage() {
  const {
    dial, hangUp, toggleMute,
    activeCall, callSeconds, muted, callError, setCallError,
    callHistory, onlineUsers, contacts,
  } = useCall()
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [sideTab, setSideTab] = useState('history')
  // Mobile tab: 'pad' | 'history' | 'agents'
  const [mobileTab, setMobileTab] = useState('pad')
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')

  async function onInput(val) {
    setInput(val)
    if (!val || /^[\d\s+\-()*#]+$/.test(val)) { setSuggestions([]); return }
    try {
      const res = await api(`/api/contacts/search?name=${encodeURIComponent(val)}`)
      setSuggestions(await res.json())
    } catch (_) {}
  }

  function handleDial() {
    if (!input.trim()) return
    const v = input.trim(); setInput(''); setSuggestions([])
    dial(v, v)
  }

  function selectNumber(num) {
    if (!num) return
    setInput(num); setSuggestions([])
    setMobileTab('pad')
  }

  const mm = String(Math.floor(callSeconds / 60)).padStart(2, '0')
  const ss = String(callSeconds % 60).padStart(2, '0')
  const otherUsers = onlineUsers.filter(u => u.id !== currentUser.id)

  // ── shared dialpad / active-call view ────────────────────────────────────
  const DialpadCenter = (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center p-5 sm:p-6 h-full">
      {activeCall ? (
        <div className="flex flex-col items-center gap-5 w-full">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-3xl sm:text-4xl">📞</span>
          </div>
          <div className="text-center">
            <p className="text-xl sm:text-2xl font-bold text-gray-800">{activeCall.remoteName}</p>
            {activeCall.isAppCall && (
              <span className="inline-block text-xs bg-blue-100 text-blue-700 font-semibold px-2.5 py-0.5 rounded-full mt-1">
                In-App Call
              </span>
            )}
          </div>
          <p className="text-3xl font-mono font-semibold text-gray-400 tabular-nums">{mm}:{ss}</p>
          <div className="flex gap-5">
            <button onClick={toggleMute}
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center border-2 transition-all ${
                muted ? 'bg-yellow-400 border-yellow-400 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}>
              {muted ? <MicOff size={22} /> : <Mic size={22} />}
            </button>
            <button onClick={hangUp}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors shadow-lg shadow-red-200">
              <PhoneOff size={22} />
            </button>
          </div>
          <audio id="remoteAudio" autoPlay />
        </div>
      ) : (
        <>
          {/* Number input */}
          <div className="relative w-full max-w-xs mb-4">
            <div className="flex items-center border-2 border-gray-200 focus-within:border-blue-500 rounded-2xl px-4 py-3 transition-colors">
              <input
                value={input}
                onChange={e => onInput(e.target.value)}
                onKeyUp={e => e.key === 'Enter' && handleDial()}
                placeholder="Enter name or number…"
                className="flex-1 text-lg sm:text-xl font-light text-gray-800 outline-none bg-transparent tracking-wide min-w-0"
                autoComplete="off"
              />
              {input && (
                <button onClick={() => { setInput(''); setSuggestions([]) }}
                  className="text-gray-400 hover:text-gray-600 ml-2 transition-colors flex-shrink-0">
                  <Delete size={18} />
                </button>
              )}
            </div>
            {suggestions.length > 0 && (
              <ul className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                {suggestions.map(c => (
                  <li key={c.id} onClick={() => { setInput(c.phoneNumber); setSuggestions([]) }}
                    className="flex justify-between items-center px-4 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0">
                    <span className="text-sm font-medium text-gray-800">{c.name}</span>
                    <span className="text-sm text-gray-400">{c.phoneNumber}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Key grid */}
          <div className="grid grid-cols-3 gap-2 sm:gap-2.5 w-full max-w-xs mb-4">
            {KEYS.map(k => (
              <button key={k}
                onClick={() => { setInput(d => d + k); setSuggestions([]) }}
                className="h-12 sm:h-14 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 border border-gray-200 rounded-xl text-lg sm:text-xl font-medium text-gray-700 transition-colors select-none">
                {k}
              </button>
            ))}
          </div>

          <button onClick={handleDial} disabled={!input}
            className="w-full max-w-xs flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3.5 sm:py-4 rounded-2xl text-base transition-colors shadow-md shadow-green-200">
            📞 Call
          </button>

          {callError && (
            <div className="mt-3 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-xl w-full max-w-xs">
              <span className="flex-1">{callError}</span>
              <button onClick={() => setCallError('')} className="text-red-400 hover:text-red-600 font-bold text-base">×</button>
            </div>
          )}
        </>
      )}
    </div>
  )

  // ── MOBILE layout ─────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Desktop: 3-column grid ── */}
      <div className="hidden lg:grid lg:grid-cols-3 gap-4" style={{ height: 'calc(100vh - 148px)' }}>
        {/* LEFT */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
          <div className="flex border-b border-gray-100 flex-shrink-0">
            {[['history', Clock, 'Recent'], ['contacts', Users, 'Contacts']].map(([id, Icon, label]) => (
              <button key={id} onClick={() => setSideTab(id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors ${
                  sideTab === id ? 'text-blue-600 border-b-2 border-blue-600 -mb-px' : 'text-gray-500 hover:text-gray-700'
                }`}>
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto">
            {sideTab === 'history'
              ? <HistoryPanel callHistory={callHistory} currentUser={currentUser} onSelect={selectNumber} />
              : <ContactsPanel contacts={contacts} onSelect={selectNumber} />}
          </div>
        </div>

        {/* CENTER */}
        {DialpadCenter}

        {/* RIGHT */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
          <div className="px-4 py-3.5 border-b border-gray-100 flex-shrink-0">
            <h3 className="text-sm font-semibold text-gray-800">Online Now</h3>
            <p className="text-xs text-gray-400 mt-0.5">{otherUsers.length} agent{otherUsers.length !== 1 ? 's' : ''} available</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            <AgentsPanel users={otherUsers} onDial={u => dial(u.phoneNumber || '', u.displayName, u.username, u.id)} />
          </div>
        </div>
      </div>

      {/* ── Mobile: tab switcher ── */}
      <div className="flex flex-col lg:hidden" style={{ height: 'calc(100vh - 136px)' }}>
        {/* Tab bar */}
        <div className="flex bg-white border border-gray-100 rounded-xl shadow-sm mb-3 flex-shrink-0 overflow-hidden">
          {[
            ['pad',     Phone,  'Dialpad'],
            ['history', Clock,  'Recent'],
            ['agents',  Users,  'Agents'],
          ].map(([id, Icon, label]) => (
            <button key={id} onClick={() => setMobileTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors ${
                mobileTab === id
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-hidden">
          {mobileTab === 'pad' && DialpadCenter}

          {mobileTab === 'history' && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm h-full flex flex-col overflow-hidden">
              <div className="flex border-b border-gray-100 flex-shrink-0">
                {[['history', Clock, 'Recent'], ['contacts', Users, 'Contacts']].map(([id, Icon, label]) => (
                  <button key={id} onClick={() => setSideTab(id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors ${
                      sideTab === id ? 'text-blue-600 border-b-2 border-blue-600 -mb-px' : 'text-gray-500 hover:text-gray-700'
                    }`}>
                    <Icon size={14} /> {label}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto">
                {sideTab === 'history'
                  ? <HistoryPanel callHistory={callHistory} currentUser={currentUser} onSelect={selectNumber} />
                  : <ContactsPanel contacts={contacts} onSelect={selectNumber} />}
              </div>
            </div>
          )}

          {mobileTab === 'agents' && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm h-full flex flex-col overflow-hidden">
              <div className="px-4 py-3.5 border-b border-gray-100 flex-shrink-0">
                <h3 className="text-sm font-semibold text-gray-800">Online Now</h3>
                <p className="text-xs text-gray-400 mt-0.5">{otherUsers.length} agent{otherUsers.length !== 1 ? 's' : ''} available</p>
              </div>
              <div className="flex-1 overflow-y-auto">
                <AgentsPanel users={otherUsers} onDial={u => dial(u.phoneNumber || '', u.displayName, u.username, u.id)} />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
