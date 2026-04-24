import { useState, useEffect } from 'react'
import { Plus, X, Save, Play, Pause, Upload, ChevronRight, Users, RefreshCw, Settings } from 'lucide-react'
import { apiJson, api } from '../../lib/api'

const MODES   = ['PREVIEW','POWER','PREDICTIVE','BLASTER']
const STATUSES = ['DRAFT','ACTIVE','PAUSED','COMPLETED','ARCHIVED']
const STATUS_COLORS = {
  DRAFT:     'bg-gray-100 text-gray-600',
  ACTIVE:    'bg-green-100 text-green-700',
  PAUSED:    'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
  ARCHIVED:  'bg-gray-100 text-gray-400',
}
const CONTACT_STATUS_COLORS = {
  PENDING:     'bg-gray-100 text-gray-600',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED:   'bg-green-100 text-green-700',
  FAILED:      'bg-red-100 text-red-700',
  DNC:         'bg-orange-100 text-orange-700',
}

const EMPTY_FORM = {
  name: '', description: '', dialingMode: 'PREVIEW',
  maxAttempts: 3, retryDelayMinutes: 60,
  workTypeId: '', callFlowId: '',
  // recycling
  maxRecycles: 0, recycleIntervalMinutes: 60,
  recycleOnNoAnswer: true, recycleOnBusy: true,
  recycleOnFailed: false, recycleOnVoicemail: false,
  resetAttemptsOnRecycle: true,
}

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns]           = useState([])
  const [workTypes, setWorkTypes]           = useState([])
  const [callFlows, setCallFlows]           = useState([])
  const [selected, setSelected]             = useState(null)
  const [contacts, setContacts]             = useState([])
  const [stats, setStats]                   = useState(null)
  const [showForm, setShowForm]             = useState(false)
  const [form, setForm]                     = useState(EMPTY_FORM)
  const [csvText, setCsvText]               = useState('')
  const [showUpload, setShowUpload]         = useState(false)
  const [showRecyclePanel, setShowRecyclePanel] = useState(false)
  const [recycleForm, setRecycleForm]       = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    const [c, wt, cf] = await Promise.all([
      apiJson('/api/admin/campaigns'),
      apiJson('/api/admin/work-types'),
      apiJson('/api/admin/call-flows'),
    ])
    setCampaigns(c); setWorkTypes(wt); setCallFlows(cf)
  }

  async function selectCampaign(c) {
    setSelected(c)
    setShowRecyclePanel(false)
    const [con, st] = await Promise.all([
      apiJson(`/api/admin/campaigns/${c.id}/contacts`),
      apiJson(`/api/admin/campaigns/${c.id}/stats`),
    ])
    setContacts(con); setStats(st)
  }

  async function saveCampaign() {
    const payload = {
      ...form,
      workType: form.workTypeId ? { id: parseInt(form.workTypeId) } : null,
      callFlow:  form.callFlowId  ? { id: parseInt(form.callFlowId)  } : null,
    }
    await api('/api/admin/campaigns', { method: 'POST', body: JSON.stringify(payload) })
    setShowForm(false)
    setForm(EMPTY_FORM)
    load()
  }

  async function setStatus(id, status) {
    await api(`/api/admin/campaigns/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) })
    load(); if (selected?.id === id) setSelected(s => ({...s, status}))
  }

  async function setDialingMode(mode) {
    const updated = { ...selected, dialingMode: mode }
    await api(`/api/admin/campaigns/${selected.id}`, { method: 'PUT', body: JSON.stringify(updated) })
    setSelected(updated)
    load()
  }

  async function saveRecycleSettings() {
    const updated = { ...selected, ...recycleForm }
    await api(`/api/admin/campaigns/${selected.id}`, { method: 'PUT', body: JSON.stringify(updated) })
    setSelected(updated)
    setShowRecyclePanel(false)
    load()
  }

  function openRecyclePanel() {
    setRecycleForm({
      maxRecycles:            selected.maxRecycles            ?? 0,
      recycleIntervalMinutes: selected.recycleIntervalMinutes ?? 60,
      recycleOnNoAnswer:      selected.recycleOnNoAnswer      ?? true,
      recycleOnBusy:          selected.recycleOnBusy          ?? true,
      recycleOnFailed:        selected.recycleOnFailed        ?? false,
      recycleOnVoicemail:     selected.recycleOnVoicemail     ?? false,
      resetAttemptsOnRecycle: selected.resetAttemptsOnRecycle ?? true,
    })
    setShowRecyclePanel(true)
  }

  async function uploadCsv() {
    const lines = csvText.trim().split('\n').map(l => l.trim()).filter(Boolean)
    for (const line of lines) {
      const [name, phoneNumber] = line.split(',')
      if (name && phoneNumber) {
        await api(`/api/admin/campaigns/${selected.id}/contacts`, {
          method: 'POST',
          body: JSON.stringify({ name: name.trim(), phoneNumber: phoneNumber.trim() }),
        })
      }
    }
    setCsvText(''); setShowUpload(false)
    const [con, st] = await Promise.all([
      apiJson(`/api/admin/campaigns/${selected.id}/contacts`),
      apiJson(`/api/admin/campaigns/${selected.id}/stats`),
    ])
    setContacts(con); setStats(st)
  }

  async function removeContact(contactId) {
    await api(`/api/admin/campaigns/contacts/${contactId}`, { method: 'DELETE' })
    setContacts(c => c.filter(x => x.id !== contactId))
  }

  const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 transition bg-white'
  const chk = (val, setter, label) => (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <input type="checkbox" checked={val} onChange={e => setter(e.target.checked)}
        className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer" />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  )

  /* ── Detail view ──────────────────────────────────────────────────────── */
  if (selected) {
    const hasRecycles   = (selected.maxRecycles ?? 0) > 0
    const currentPass   = (selected.currentRecycle ?? 0) + 1
    const totalPasses   = (selected.maxRecycles ?? 0) + 1

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setSelected(null)} className="text-sm text-blue-600 hover:underline">← Campaigns</button>
          <ChevronRight size={14} className="text-gray-400" />
          <span className="text-sm font-semibold text-gray-800">{selected.name}</span>
          <span className={`ml-1 text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[selected.status]}`}>{selected.status}</span>
          {hasRecycles && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 flex items-center gap-1">
              <RefreshCw size={10} /> Pass {currentPass} of {totalPasses}
            </span>
          )}
          <div className="ml-auto flex items-center gap-2">
            <label className="text-xs text-gray-400 font-medium">Mode:</label>
            <select value={selected.dialingMode} onChange={e => setDialingMode(e.target.value)}
              className="text-xs font-semibold border border-gray-200 rounded-lg px-2 py-1.5 bg-white outline-none focus:border-blue-400 cursor-pointer">
              {MODES.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
        </div>

        {/* Stats bar */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'Total',     val: stats.total,     color: 'text-gray-700' },
              { label: 'Pending',   val: stats.pending,   color: 'text-gray-600' },
              { label: 'Completed', val: stats.completed, color: 'text-green-600' },
              { label: 'Failed',    val: stats.failed,    color: 'text-red-600' },
              { label: 'DNC',       val: stats.dnc,       color: 'text-orange-600' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {selected.status !== 'ACTIVE' && (
            <button onClick={() => setStatus(selected.id, 'ACTIVE')}
              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
              <Play size={14} /> Activate
            </button>
          )}
          {selected.status === 'ACTIVE' && (
            <button onClick={() => setStatus(selected.id, 'PAUSED')}
              className="flex items-center gap-1.5 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
              <Pause size={14} /> Pause
            </button>
          )}
          <button onClick={() => setShowUpload(v => !v)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
            <Upload size={14} /> Upload Contacts
          </button>
          <button onClick={showRecyclePanel ? () => setShowRecyclePanel(false) : openRecyclePanel}
            className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
            <RefreshCw size={14} /> Recycle Settings
          </button>
        </div>

        {/* Recycle settings panel */}
        {showRecyclePanel && recycleForm && (
          <div className="bg-white rounded-xl border border-purple-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2">
              <RefreshCw size={15} className="text-purple-600" />
              <h3 className="text-sm font-semibold text-gray-800">Recycle Settings</h3>
              {hasRecycles && (
                <span className="ml-2 text-xs text-purple-600 font-medium">
                  Currently on pass {currentPass} of {totalPasses}
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  Max Recycle Passes <span className="text-gray-400 font-normal">(0 = disabled)</span>
                </label>
                <input type="number" min={0} max={20}
                  value={recycleForm.maxRecycles}
                  onChange={e => setRecycleForm(f => ({...f, maxRecycles: parseInt(e.target.value) || 0}))}
                  className={inp} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Wait Between Passes (minutes)</label>
                <input type="number" min={1}
                  value={recycleForm.recycleIntervalMinutes}
                  onChange={e => setRecycleForm(f => ({...f, recycleIntervalMinutes: parseInt(e.target.value) || 60}))}
                  className={inp} />
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Recycle contacts whose last call was:</p>
              <div className="flex flex-wrap gap-4">
                {chk(recycleForm.recycleOnNoAnswer, v => setRecycleForm(f => ({...f, recycleOnNoAnswer: v})), 'No Answer')}
                {chk(recycleForm.recycleOnBusy,     v => setRecycleForm(f => ({...f, recycleOnBusy: v})),     'Busy')}
                {chk(recycleForm.recycleOnVoicemail,v => setRecycleForm(f => ({...f, recycleOnVoicemail: v})),'Voicemail')}
                {chk(recycleForm.recycleOnFailed,   v => setRecycleForm(f => ({...f, recycleOnFailed: v})),   'Failed (hard)')}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Attempt counter on recycle:</p>
              {chk(recycleForm.resetAttemptsOnRecycle,
                v => setRecycleForm(f => ({...f, resetAttemptsOnRecycle: v})),
                'Reset each contact\'s attempt count at the start of each pass')}
            </div>

            <div className="flex gap-2">
              <button onClick={saveRecycleSettings}
                className="flex items-center gap-1.5 bg-purple-600 text-white text-sm font-medium px-4 py-2 rounded-lg">
                <Save size={14} /> Save Recycle Settings
              </button>
              <button onClick={() => setShowRecyclePanel(false)}
                className="text-sm text-gray-500 px-4 py-2 rounded-lg hover:bg-gray-100">Cancel</button>
            </div>
          </div>
        )}

        {/* CSV upload */}
        {showUpload && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
            <p className="text-xs text-gray-500">Paste CSV rows: <code className="bg-gray-100 px-1 rounded">Name, Phone Number</code> — one per line</p>
            <textarea value={csvText} onChange={e => setCsvText(e.target.value)}
              rows={6} placeholder={"John Smith, +15551234567\nJane Doe, +15559876543"}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:border-blue-400 resize-none" />
            <div className="flex gap-2">
              <button onClick={uploadCsv} className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg">
                <Upload size={14} /> Import
              </button>
              <button onClick={() => setShowUpload(false)} className="text-sm text-gray-500 px-4 py-2 rounded-lg hover:bg-gray-100">Cancel</button>
            </div>
          </div>
        )}

        {/* Contact list */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-gray-50 px-5 py-3 border-b border-gray-100 grid grid-cols-[1fr_1fr_auto_auto_auto] gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-24 text-center">Status</span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-20 text-center">Last Call</span>
            <span className="w-8" />
          </div>
          {contacts.length === 0 && <p className="text-sm text-gray-400 text-center py-10">No contacts yet — upload a CSV to get started</p>}
          {contacts.map(c => (
            <div key={c.id} className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-2 items-center px-5 py-3 border-b border-gray-50 hover:bg-gray-50">
              <p className="text-sm font-medium text-gray-800 truncate">{c.name}</p>
              <p className="text-sm text-gray-500">{c.phoneNumber}</p>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full w-24 text-center ${CONTACT_STATUS_COLORS[c.status] || 'bg-gray-100 text-gray-600'}`}>
                {c.status}
              </span>
              <span className="text-xs text-gray-400 w-20 text-center">{c.lastCallStatus || '—'}</span>
              <button onClick={() => removeContact(c.id)} className="p-1 text-red-400 hover:bg-red-50 rounded w-8 flex justify-center">
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>
    )
  }

  /* ── Campaign list + create form ──────────────────────────────────────── */
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-gray-800">Campaigns</h2>
          <p className="text-xs text-gray-400 mt-0.5">Outbound contact lists and dialing strategies</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
          <Plus size={14} /> New Campaign
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-5">
          <h3 className="text-sm font-semibold text-gray-800">New Campaign</h3>

          {/* Basic settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-gray-600 mb-1 block">Campaign Name</label>
              <input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} className={inp} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Dialing Mode</label>
              <select value={form.dialingMode} onChange={e => setForm(f=>({...f,dialingMode:e.target.value}))} className={inp}>
                {MODES.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Work Type (Queue)</label>
              <select value={form.workTypeId} onChange={e => setForm(f=>({...f,workTypeId:e.target.value}))} className={inp}>
                <option value="">— None —</option>
                {workTypes.map(wt => <option key={wt.id} value={wt.id}>{wt.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Max Attempts per Contact</label>
              <input type="number" min={1} max={10} value={form.maxAttempts}
                onChange={e => setForm(f=>({...f,maxAttempts:parseInt(e.target.value)}))} className={inp} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Retry Delay (mins)</label>
              <input type="number" min={5} value={form.retryDelayMinutes}
                onChange={e => setForm(f=>({...f,retryDelayMinutes:parseInt(e.target.value)}))} className={inp} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-gray-600 mb-1 block">Call Flow (optional)</label>
              <select value={form.callFlowId} onChange={e => setForm(f=>({...f,callFlowId:e.target.value}))} className={inp}>
                <option value="">— None —</option>
                {callFlows.map(cf => <option key={cf.id} value={cf.id}>{cf.name}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-gray-600 mb-1 block">Description</label>
              <input value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} className={inp} />
            </div>
          </div>

          {/* Recycling settings */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <RefreshCw size={14} className="text-purple-500" />
              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Recycling</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  Max Recycle Passes <span className="text-gray-400 font-normal">(0 = disabled)</span>
                </label>
                <input type="number" min={0} max={20} value={form.maxRecycles}
                  onChange={e => setForm(f=>({...f,maxRecycles:parseInt(e.target.value)||0}))} className={inp} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Wait Between Passes (minutes)</label>
                <input type="number" min={1} value={form.recycleIntervalMinutes}
                  onChange={e => setForm(f=>({...f,recycleIntervalMinutes:parseInt(e.target.value)||60}))} className={inp} />
              </div>
            </div>
            {form.maxRecycles > 0 && (
              <div className="mt-3 space-y-3">
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-2">Recycle contacts whose last call was:</p>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                      <input type="checkbox" checked={form.recycleOnNoAnswer}
                        onChange={e => setForm(f=>({...f,recycleOnNoAnswer:e.target.checked}))}
                        className="w-4 h-4 rounded border-gray-300" /> No Answer
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                      <input type="checkbox" checked={form.recycleOnBusy}
                        onChange={e => setForm(f=>({...f,recycleOnBusy:e.target.checked}))}
                        className="w-4 h-4 rounded border-gray-300" /> Busy
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                      <input type="checkbox" checked={form.recycleOnVoicemail}
                        onChange={e => setForm(f=>({...f,recycleOnVoicemail:e.target.checked}))}
                        className="w-4 h-4 rounded border-gray-300" /> Voicemail
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                      <input type="checkbox" checked={form.recycleOnFailed}
                        onChange={e => setForm(f=>({...f,recycleOnFailed:e.target.checked}))}
                        className="w-4 h-4 rounded border-gray-300" /> Failed (hard)
                    </label>
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                  <input type="checkbox" checked={form.resetAttemptsOnRecycle}
                    onChange={e => setForm(f=>({...f,resetAttemptsOnRecycle:e.target.checked}))}
                    className="w-4 h-4 rounded border-gray-300" />
                  Reset attempt count at the start of each pass
                </label>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button onClick={saveCampaign}
              className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg">
              <Save size={14} /> Create Campaign
            </button>
            <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}
              className="text-sm text-gray-500 px-4 py-2 rounded-lg hover:bg-gray-100">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {campaigns.length === 0 && !showForm && (
          <div className="sm:col-span-2 xl:col-span-3 bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
            <p className="text-3xl mb-3">📣</p>
            <p className="text-gray-600 font-medium text-sm">No campaigns yet</p>
          </div>
        )}
        {campaigns.map(c => (
          <div key={c.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 cursor-pointer hover:shadow-md transition-shadow" onClick={() => selectCampaign(c)}>
            <div className="flex items-start justify-between mb-3">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[c.status]}`}>{c.status}</span>
              <div className="flex items-center gap-1.5">
                {(c.maxRecycles ?? 0) > 0 && (
                  <span className="text-xs bg-purple-100 text-purple-700 font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                    <RefreshCw size={9} /> {(c.currentRecycle ?? 0) + 1}/{(c.maxRecycles ?? 0) + 1}
                  </span>
                )}
                <span className="text-xs bg-gray-100 text-gray-600 font-medium px-2 py-0.5 rounded-full">{c.dialingMode}</span>
              </div>
            </div>
            <p className="font-semibold text-gray-800 text-sm">{c.name}</p>
            {c.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{c.description}</p>}
            {c.workType && <p className="text-xs text-blue-600 mt-2">Queue: {c.workType.name}</p>}
            <div className="flex gap-2 mt-4" onClick={e => e.stopPropagation()}>
              {c.status !== 'ACTIVE' && (
                <button onClick={() => setStatus(c.id, 'ACTIVE')}
                  className="flex items-center gap-1 text-xs bg-green-50 hover:bg-green-100 text-green-700 font-medium px-3 py-1.5 rounded-lg">
                  <Play size={11} /> Activate
                </button>
              )}
              {c.status === 'ACTIVE' && (
                <button onClick={() => setStatus(c.id, 'PAUSED')}
                  className="flex items-center gap-1 text-xs bg-yellow-50 hover:bg-yellow-100 text-yellow-700 font-medium px-3 py-1.5 rounded-lg">
                  <Pause size={11} /> Pause
                </button>
              )}
              <button onClick={() => selectCampaign(c)}
                className="flex items-center gap-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium px-3 py-1.5 rounded-lg ml-auto">
                <Users size={11} /> Contacts
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
