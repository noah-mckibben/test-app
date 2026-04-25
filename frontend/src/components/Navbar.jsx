import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Wifi, WifiOff, Menu, ChevronDown,
  Phone, User, Shield, LogOut, Camera,
  Search, Plus, X, Trash2, Mic, MicOff,
  PhoneOff, Delete, Settings, BookUser,
  Clock, Check, ChevronLeft
} from 'lucide-react'
import { useCall } from '../context/CallContext'
import { api, apiJson } from '../lib/api'

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

const KEYS = ['1','2','3','4','5','6','7','8','9','*','0','#']

const DTMF_FREQS = {
  '1': [697, 1209], '2': [697, 1336], '3': [697, 1477],
  '4': [770, 1209], '5': [770, 1336], '6': [770, 1477],
  '7': [852, 1209], '8': [852, 1336], '9': [852, 1477],
  '*': [941, 1209], '0': [941, 1336], '#': [941, 1477],
}

function playDtmf(key) {
  const freqs = DTMF_FREQS[key]
  if (!freqs) return
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.12, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
    gain.connect(ctx.destination)
    freqs.forEach(freq => {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = freq
      osc.connect(gain)
      osc.start()
      osc.stop(ctx.currentTime + 0.15)
    })
    setTimeout(() => ctx.close(), 300)
  } catch (_) {}
}

function normalizePhone(raw) {
  const s = raw.trim()
  // Already E.164
  if (/^\+\d{7,15}$/.test(s)) return s
  // Strip everything except digits
  const digits = s.replace(/\D/g, '')
  if (!digits) return s
  // 10-digit North American → +1XXXXXXXXXX
  if (digits.length === 10) return '+1' + digits
  // 11-digit starting with 1 → +XXXXXXXXXXX
  if (digits.length === 11 && digits.startsWith('1')) return '+' + digits
  // Anything else: prepend + and hope for the best
  return '+' + digits
}

function fmt(s) {
  if (!s) return ''
  const m = Math.floor(s / 60)
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`
}
function fmtTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function Navbar({ user, status, onStatusChange, onMenuClick, onLogout, onUserUpdate }) {
  const { twilioReady, callHistory, dial, hangUp, toggleMute, activeCall, callSeconds, muted, callError, setCallError, contacts, loadContacts } = useCall()

  const [open, setOpen]         = useState(false)
  const [tab, setTab]           = useState('dialpad')   // 'dialpad' | 'contacts' | 'settings'
  const dropRef                 = useRef(null)
  const fileRef                 = useRef(null)
  const avatarPreview           = useRef(user?.avatarData || null)

  // Dialpad state
  const [dialInput, setDialInput] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [historyTab, setHistoryTab] = useState('history') // 'history' | 'contacts'
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')

  // Contacts state
  const [contactSearch, setContactSearch] = useState('')
  const [showAddContact, setShowAddContact] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')

  // Settings state
  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '')
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [avatarSrc, setAvatarSrc] = useState(user?.avatarData || null)

  const currentStatus = STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0]
  const roleStyle     = ROLE_STYLES[user?.role] || ROLE_STYLES.AGENT
  const today         = new Date().toDateString()
  const callsToday    = (callHistory || []).filter(c => new Date(c.startTime).toDateString() === today).length

  // Sync settings fields when user prop changes
  useEffect(() => {
    setDisplayName(user?.displayName || '')
    setPhoneNumber(user?.phoneNumber || '')
    setAvatarSrc(user?.avatarData || null)
  }, [user])

  // Close on outside click
  useEffect(() => {
    function handle(e) { if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  // Dialpad: name lookup
  async function onDialInput(val) {
    setDialInput(val)
    if (!val || /^[\d\s+\-()*#]+$/.test(val)) { setSuggestions([]); return }
    try {
      const res = await api(`/api/contacts/search?name=${encodeURIComponent(val)}`)
      setSuggestions(await res.json())
    } catch (_) {}
  }

  function handleDial() {
    if (!dialInput.trim()) return
    const normalized = normalizePhone(dialInput)
    setDialInput('')
    setSuggestions([])
    dial(normalized, normalized)
  }

  // Contacts
  const filteredContacts = (contacts || []).filter(c =>
    c.name.toLowerCase().includes(contactSearch.toLowerCase()) || c.phoneNumber.includes(contactSearch)
  )

  async function addContact() {
    if (!newName || !newPhone) return
    await api('/api/contacts', { method: 'POST', body: JSON.stringify({ name: newName, phoneNumber: newPhone }) })
    setNewName(''); setNewPhone(''); setShowAddContact(false)
    loadContacts()
  }

  async function removeContact(id) {
    await api(`/api/contacts/${id}`, { method: 'DELETE' })
    loadContacts()
  }

  // Settings
  async function saveProfile() {
    const res = await apiJson('/api/users/me/profile', {
      method: 'PUT',
      body: JSON.stringify({ displayName, phoneNumber }),
    })
    const updated = { ...currentUser, ...res }
    localStorage.setItem('user', JSON.stringify(updated))
    onUserUpdate?.(updated)
    setSettingsSaved(true)
    setTimeout(() => setSettingsSaved(false), 2000)
  }

  // Avatar upload
  function handleAvatarFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (evt) => {
      const dataUrl = evt.target.result
      setAvatarSrc(dataUrl)
      try {
        const res = await apiJson('/api/users/me/avatar', {
          method: 'PUT',
          body: JSON.stringify({ avatarData: dataUrl }),
        })
        const updated = { ...currentUser, ...res }
        localStorage.setItem('user', JSON.stringify(updated))
        onUserUpdate?.(updated)
      } catch (_) {}
    }
    reader.readAsDataURL(file)
  }

  const mm = String(Math.floor(callSeconds / 60)).padStart(2, '0')
  const ss = String(callSeconds % 60).padStart(2, '0')
  const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 transition bg-white'

  // ── Avatar component ──────────────────────────────────────────────────────
  function Avatar({ size = 'sm' }) {
    const s = size === 'lg' ? 'w-14 h-14 text-2xl rounded-2xl' : 'w-8 h-8 text-sm rounded-full'
    return (
      <div className={`${s} bg-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden`}>
        {avatarSrc
          ? <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" />
          : (user?.displayName?.[0]?.toUpperCase() || 'U')}
      </div>
    )
  }

  // ── Dialpad panel ─────────────────────────────────────────────────────────
  const DialpadPanel = (
    <div className="flex flex-col h-full">
      {activeCall ? (
        <div className="flex flex-col items-center gap-4 py-6 px-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-3xl">📞</div>
          <div className="text-center">
            <p className="text-base font-bold text-gray-800">{activeCall.remoteName}</p>
            {activeCall.isAppCall && <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">In-App</span>}
          </div>
          <p className="text-2xl font-mono font-semibold text-gray-400 tabular-nums">{mm}:{ss}</p>
          <div className="flex gap-4">
            <button onClick={toggleMute} className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${muted ? 'bg-yellow-400 border-yellow-400 text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {muted ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
            <button onClick={hangUp} className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-200">
              <PhoneOff size={18} />
            </button>
          </div>
          <audio id="remoteAudio" autoPlay />
        </div>
      ) : (
        <div className="px-3 pt-3 pb-2">
          {/* Number input */}
          <div className="relative mb-2">
            <div className="flex items-center border-2 border-gray-200 focus-within:border-blue-500 rounded-xl px-3 py-2 transition-colors">
              <input value={dialInput} onChange={e => onDialInput(e.target.value)}
                onKeyUp={e => e.key === 'Enter' && handleDial()}
                placeholder="Name or number…"
                className="flex-1 text-base font-light text-gray-800 outline-none bg-transparent min-w-0"
                autoComplete="off" />
              {dialInput && (
                <button onClick={() => { setDialInput(''); setSuggestions([]) }} className="text-gray-400 hover:text-gray-600 ml-1 flex-shrink-0">
                  <Delete size={16} />
                </button>
              )}
            </div>
            {suggestions.length > 0 && (
              <ul className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                {suggestions.map(c => (
                  <li key={c.id} onClick={() => { setDialInput(c.phoneNumber); setSuggestions([]) }}
                    className="flex justify-between items-center px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm">
                    <span className="font-medium text-gray-800">{c.name}</span>
                    <span className="text-gray-400">{c.phoneNumber}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* Keys */}
          <div className="grid grid-cols-3 gap-1.5 mb-2">
            {KEYS.map(k => (
              <button key={k} onClick={() => { playDtmf(k); setDialInput(d => d + k) }}
                className="h-11 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 border border-gray-200 rounded-lg text-base font-medium text-gray-700 transition-colors select-none">
                {k}
              </button>
            ))}
          </div>
          {/* Dial button */}
          <button onClick={handleDial} disabled={!dialInput}
            className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-colors">
            📞 Call
          </button>
          {callError && (
            <div className="mt-2 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg">
              <span className="flex-1">{callError}</span>
              <button onClick={() => setCallError('')} className="font-bold">×</button>
            </div>
          )}
        </div>
      )}

      {/* History / contacts mini tabs */}
      <div className="flex border-t border-b border-gray-100 flex-shrink-0 mt-1">
        {[['history', Clock, 'Recent'], ['contacts', BookUser, 'Contacts']].map(([id, Icon, label]) => (
          <button key={id} onClick={() => setHistoryTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${historyTab === id ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
            <Icon size={12} /> {label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">
        {historyTab === 'history' ? (
          callHistory.length === 0
            ? <p className="p-4 text-center text-xs text-gray-400">No recent calls</p>
            : callHistory.slice(0, 20).map(call => {
                const isCaller = call.caller?.id === currentUser.id
                const other = isCaller ? (call.callee?.displayName || call.calleeNumber || 'External') : call.caller?.displayName
                const isMissed = call.status === 'MISSED' || call.status === 'REJECTED'
                const num = isCaller ? (call.calleeNumber || call.callee?.phoneNumber || '') : (call.caller?.phoneNumber || '')
                return (
                  <button key={call.id} onClick={() => setDialInput(num)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 border-b border-gray-50 hover:bg-gray-50 text-left">
                    <span className={`text-xs font-bold w-3 flex-shrink-0 ${isCaller ? 'text-blue-500' : isMissed ? 'text-red-500' : 'text-green-500'}`}>
                      {isCaller ? '↗' : isMissed ? '↙' : '↘'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{other}</p>
                      <p className="text-xs text-gray-400">{fmtTime(call.startTime)}</p>
                    </div>
                    {call.durationSeconds && <span className="text-xs text-gray-400 flex-shrink-0">{fmt(call.durationSeconds)}</span>}
                  </button>
                )
              })
        ) : (
          (contacts || []).length === 0
            ? <p className="p-4 text-center text-xs text-gray-400">No contacts</p>
            : (contacts || []).map(c => (
                <button key={c.id} onClick={() => setDialInput(c.phoneNumber)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 border-b border-gray-50 hover:bg-gray-50 text-left">
                  <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold text-xs flex-shrink-0">
                    {c.name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.phoneNumber}</p>
                  </div>
                </button>
              ))
        )}
      </div>
    </div>
  )

  // ── Contacts panel ────────────────────────────────────────────────────────
  const ContactsPanel = (
    <div className="flex flex-col h-full">
      <div className="px-3 pt-3 pb-2 space-y-2">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={contactSearch} onChange={e => setContactSearch(e.target.value)}
            placeholder="Search contacts…"
            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-blue-400 transition bg-white" />
        </div>
        <button onClick={() => setShowAddContact(v => !v)}
          className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-2 rounded-lg transition-colors">
          {showAddContact ? <X size={12} /> : <Plus size={12} />}
          {showAddContact ? 'Cancel' : 'Add Contact'}
        </button>
        {showAddContact && (
          <div className="space-y-1.5 bg-gray-50 rounded-lg p-2">
            <input value={newName} onChange={e => setNewName(e.target.value)}
              placeholder="Full name" className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-blue-400 bg-white" />
            <input value={newPhone} onChange={e => setNewPhone(e.target.value)}
              placeholder="Phone number" type="tel"
              className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-blue-400 bg-white" />
            <button onClick={addContact} disabled={!newName || !newPhone}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-medium py-1.5 rounded-lg transition-colors">
              Save Contact
            </button>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto border-t border-gray-100">
        {filteredContacts.length === 0 && <p className="p-4 text-center text-xs text-gray-400">No contacts found</p>}
        {filteredContacts.map(c => (
          <div key={c.id} className="flex items-center gap-2.5 px-3 py-2.5 border-b border-gray-50 hover:bg-gray-50">
            <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold text-xs flex-shrink-0">
              {c.name[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-800 truncate">{c.name}</p>
              <p className="text-xs text-gray-400">{c.phoneNumber}</p>
            </div>
            <div className="flex items-center gap-1">
              {c.appStatus === 'ONLINE' && <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />}
              <button onClick={() => { setDialInput(c.phoneNumber); setTab('dialpad') }}
                className="p-1 bg-green-50 hover:bg-green-100 text-green-700 rounded-md transition-colors">
                <Phone size={11} />
              </button>
              <button onClick={() => removeContact(c.id)}
                className="p-1 bg-red-50 hover:bg-red-100 text-red-500 rounded-md transition-colors">
                <Trash2 size={11} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  // ── Settings panel ────────────────────────────────────────────────────────
  const SettingsPanel = (
    <div className="flex flex-col gap-4 px-4 py-4">
      {/* Avatar upload */}
      <div className="flex flex-col items-center gap-2">
        <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
          <div className="w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold text-2xl overflow-hidden">
            {avatarSrc
              ? <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" />
              : (user?.displayName?.[0]?.toUpperCase() || 'U')}
          </div>
          <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera size={20} className="text-white" />
          </div>
        </div>
        <p className="text-xs text-gray-400">Click to change photo</p>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />
      </div>

      {/* Profile fields */}
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Display Name</label>
          <input value={displayName} onChange={e => setDisplayName(e.target.value)}
            className={inp} placeholder="Your full name" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Phone Number</label>
          <input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)}
            type="tel" className={inp} placeholder="+15551234567" />
        </div>
        <button onClick={saveProfile}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors ${settingsSaved ? 'bg-green-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
          {settingsSaved ? <><Check size={14} /> Saved!</> : 'Save Changes'}
        </button>
      </div>

      {/* Status section */}
      <div className="border-t border-gray-100 pt-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Agent Status</p>
        <div className="space-y-1">
          {STATUS_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => onStatusChange(opt.value)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                status === opt.value ? `${opt.bg} ${opt.text} ring-1 ${opt.ring}` : 'hover:bg-gray-50 text-gray-700'
              }`}>
              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${opt.dot}`} />
              {opt.label}
              {status === opt.value && <Check size={12} className="ml-auto" />}
            </button>
          ))}
        </div>
      </div>

      {/* Sign out */}
      <div className="border-t border-gray-100 pt-2">
        <button onClick={() => { setOpen(false); onLogout() }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 text-red-600 transition-colors text-left group">
          <div className="w-7 h-7 bg-red-50 group-hover:bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <LogOut size={13} className="text-red-500" />
          </div>
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  )

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 h-16 flex items-center justify-between flex-shrink-0 gap-3 z-20 relative">

      {/* Left */}
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={onMenuClick}
          className="lg:hidden p-2 -ml-1 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
          <Menu size={20} />
        </button>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-auto">
        {/* Headset indicator */}
        <div className={`hidden sm:flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
          twilioReady ? 'text-green-700 bg-green-50 border-green-200' : 'text-gray-400 bg-gray-50 border-gray-200'
        }`}>
          {twilioReady ? <Wifi size={12} /> : <WifiOff size={12} />}
          <span className="hidden md:inline">{twilioReady ? 'Headset Ready' : 'Connecting…'}</span>
        </div>

        {/* Profile button */}
        <div className="relative" ref={dropRef}>
          <button onClick={() => setOpen(v => !v)}
            className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-xl hover:bg-gray-100 transition-colors">
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                {avatarSrc
                  ? <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" />
                  : (user?.displayName?.[0]?.toUpperCase() || 'U')}
              </div>
              <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${currentStatus.dot}`} />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold text-gray-800 leading-none">{user?.displayName}</p>
              <p className="text-xs text-gray-400 leading-none mt-0.5">{currentStatus.label}</p>
            </div>
            <ChevronDown size={14} className={`text-gray-400 transition-transform hidden md:block ${open ? 'rotate-180' : ''}`} />
          </button>

          {/* ── Dropdown ── */}
          {open && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden flex flex-col"
              style={{ maxHeight: 'calc(100vh - 80px)' }}>

              {/* Profile header */}
              <div className="px-4 py-3 bg-gradient-to-br from-blue-600 to-blue-700 flex-shrink-0">
                <div className="flex items-center gap-3">
                  {/* Avatar with camera on hover */}
                  <div className="relative group cursor-pointer flex-shrink-0" onClick={() => fileRef.current?.click()}>
                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white font-bold text-xl overflow-hidden">
                      {avatarSrc
                        ? <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" />
                        : (user?.displayName?.[0]?.toUpperCase() || 'U')}
                    </div>
                    <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera size={14} className="text-white" />
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />
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
                {/* Quick stats */}
                <div className="mt-2.5 flex items-center gap-2">
                  <div className="bg-white/10 rounded-lg px-3 py-1.5 text-center flex-1">
                    <p className="text-white font-bold text-sm">{callsToday}</p>
                    <p className="text-blue-200 text-xs">Calls Today</p>
                  </div>
                  <div className={`rounded-lg px-3 py-1.5 text-center flex-1 ${twilioReady ? 'bg-green-500/30' : 'bg-white/10'}`}>
                    <p className="text-white font-bold text-xs">{twilioReady ? '🟢 Ready' : '🔴 Offline'}</p>
                    <p className="text-blue-200 text-xs">Headset</p>
                  </div>
                  {/* Status pill */}
                  <div className="flex-1">
                    <select value={status} onChange={e => onStatusChange(e.target.value)}
                      className="w-full bg-white/20 text-white text-xs font-medium rounded-lg px-2 py-2 outline-none cursor-pointer appearance-none text-center">
                      {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value} className="text-gray-800">{o.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Tab bar */}
              <div className="flex border-b border-gray-100 flex-shrink-0 bg-gray-50">
                {[
                  ['dialpad',  Phone,    'Dialpad'],
                  ['contacts', BookUser, 'Contacts'],
                  ['settings', Settings, 'Settings'],
                ].map(([id, Icon, label]) => (
                  <button key={id} onClick={() => setTab(id)}
                    className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-xs font-medium transition-colors ${
                      tab === id ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-gray-500 hover:text-gray-700'
                    }`}>
                    <Icon size={13} /> {label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-hidden flex flex-col" style={{ minHeight: 0 }}>
                {tab === 'dialpad'  && DialpadPanel}
                {tab === 'contacts' && ContactsPanel}
                {tab === 'settings' && SettingsPanel}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
