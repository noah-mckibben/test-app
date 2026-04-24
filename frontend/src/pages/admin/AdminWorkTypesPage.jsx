import { useState, useEffect } from 'react'
import { Plus, X, Save, Users, Briefcase, Phone } from 'lucide-react'
import { apiJson, api } from '../../lib/api'

const MODES = ['PREVIEW','POWER','PREDICTIVE','BLASTER']

const EMPTY_FORM = {
  name: '', description: '', defaultDialingMode: 'PREVIEW',
  dnis: '', callFlowId: '',
}

export default function AdminWorkTypesPage() {
  const [workTypes, setWorkTypes]   = useState([])
  const [allUsers, setAllUsers]     = useState([])
  const [callFlows, setCallFlows]   = useState([])
  const [editing, setEditing]       = useState(null)
  const [showForm, setShowForm]     = useState(false)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [agentModal, setAgentModal] = useState(null)
  const [selectedAgents, setSelectedAgents] = useState([])

  useEffect(() => { load() }, [])

  async function load() {
    const [wts, users, cfs] = await Promise.all([
      apiJson('/api/admin/work-types'),
      apiJson('/api/admin/users'),
      apiJson('/api/admin/call-flows'),
    ])
    setWorkTypes(wts)
    setAllUsers(users)
    setCallFlows(cfs)
  }

  async function save() {
    const payload = {
      ...form,
      callFlow: form.callFlowId ? { id: parseInt(form.callFlowId) } : null,
    }
    const method = editing ? 'PUT' : 'POST'
    const url = editing ? `/api/admin/work-types/${editing.id}` : '/api/admin/work-types'
    await api(url, { method, body: JSON.stringify(payload) })
    setShowForm(false); setEditing(null); setForm(EMPTY_FORM)
    load()
  }

  async function remove(id) {
    if (!confirm('Delete work type?')) return
    await api(`/api/admin/work-types/${id}`, { method: 'DELETE' })
    load()
  }

  async function saveAgents() {
    await api(`/api/admin/work-types/${agentModal.id}/agents`, {
      method: 'PUT',
      body: JSON.stringify({ userIds: selectedAgents }),
    })
    setAgentModal(null); load()
  }

  function openEdit(wt) {
    setEditing(wt)
    setForm({
      name: wt.name,
      description: wt.description || '',
      defaultDialingMode: wt.defaultDialingMode,
      dnis: wt.dnis || '',
      callFlowId: wt.callFlow?.id?.toString() || '',
    })
    setShowForm(true)
  }

  function openAgents(wt) {
    setAgentModal(wt)
    setSelectedAgents((wt.agents || []).map(a => a.id))
  }

  const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 transition'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-gray-800">Work Types</h2>
          <p className="text-xs text-gray-400 mt-0.5">Queues and skill groups agents are staffed in</p>
        </div>
        <button onClick={() => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true) }}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
          <Plus size={14} /> New Work Type
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-5">
          <h3 className="text-sm font-semibold text-gray-800">{editing ? 'Edit' : 'New'} Work Type</h3>

          {/* Basic settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Name</label>
              <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className={inp} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Default Dialing Mode</label>
              <select value={form.defaultDialingMode} onChange={e => setForm(f => ({...f, defaultDialingMode: e.target.value}))} className={inp}>
                {MODES.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-gray-600 mb-1 block">Description</label>
              <input value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} className={inp} />
            </div>
          </div>

          {/* Numbering plan */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Phone size={14} className="text-green-500" />
              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Numbering Plan</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  DNIS / TFN
                  <span className="ml-1 text-gray-400 font-normal">(E.164, e.g. +18005551234)</span>
                </label>
                <input
                  value={form.dnis}
                  onChange={e => setForm(f => ({...f, dnis: e.target.value}))}
                  placeholder="+18005551234"
                  className={inp}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Used as caller ID for outbound campaigns and to route inbound calls to this queue.
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Call Flow</label>
                <select value={form.callFlowId} onChange={e => setForm(f => ({...f, callFlowId: e.target.value}))} className={inp}>
                  <option value="">— None —</option>
                  {callFlows.map(cf => <option key={cf.id} value={cf.id}>{cf.name}</option>)}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  The IVR / call flow to execute when an inbound call arrives on this number.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={save} className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg">
              <Save size={14} /> Save
            </button>
            <button onClick={() => setShowForm(false)} className="text-sm text-gray-500 px-4 py-2 rounded-lg hover:bg-gray-100">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {workTypes.length === 0 && !showForm && (
          <div className="sm:col-span-2 xl:col-span-3 bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
            <p className="text-3xl mb-3">🗂️</p>
            <p className="text-gray-600 font-medium text-sm">No work types yet</p>
          </div>
        )}
        {workTypes.map(wt => (
          <div key={wt.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Briefcase size={16} className="text-blue-600" />
              </div>
              <span className="text-xs bg-gray-100 text-gray-600 font-medium px-2 py-0.5 rounded-full">{wt.defaultDialingMode}</span>
            </div>
            <p className="font-semibold text-gray-800 text-sm">{wt.name}</p>
            {wt.description && <p className="text-xs text-gray-400 mt-0.5">{wt.description}</p>}

            {/* Numbering plan badges */}
            <div className="mt-2 space-y-1">
              {wt.dnis ? (
                <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                  <Phone size={10} /> {wt.dnis}
                </p>
              ) : (
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <Phone size={10} /> No number assigned
                </p>
              )}
              {wt.callFlow && (
                <p className="text-xs text-purple-600 flex items-center gap-1">
                  ↪ {wt.callFlow.name}
                </p>
              )}
            </div>

            <p className="text-xs text-gray-500 mt-2">{(wt.agents || []).length} agent{(wt.agents || []).length !== 1 ? 's' : ''} staffed</p>

            <div className="flex gap-2 mt-4">
              <button onClick={() => openAgents(wt)}
                className="flex-1 flex items-center justify-center gap-1 text-xs bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium py-2 rounded-lg transition-colors">
                <Users size={12} /> Staffing
              </button>
              <button onClick={() => openEdit(wt)}
                className="flex-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-2 rounded-lg transition-colors">
                Edit
              </button>
              <button onClick={() => remove(wt.id)}
                className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                <X size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Agent assignment modal */}
      {agentModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800 text-sm">Staff Agents — {agentModal.name}</h3>
              <button onClick={() => setAgentModal(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="p-4 max-h-72 overflow-y-auto divide-y divide-gray-50">
              {allUsers.map(u => (
                <label key={u.id} className="flex items-center gap-3 py-2.5 cursor-pointer">
                  <input type="checkbox" checked={selectedAgents.includes(u.id)}
                    onChange={e => setSelectedAgents(s => e.target.checked ? [...s, u.id] : s.filter(id => id !== u.id))}
                    className="rounded" />
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">
                    {u.displayName?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{u.displayName}</p>
                    <p className="text-xs text-gray-400">@{u.username} · {u.role}</p>
                  </div>
                </label>
              ))}
            </div>
            <div className="px-5 py-4 border-t border-gray-100 flex gap-2">
              <button onClick={saveAgents}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 rounded-xl transition-colors">
                Save Staffing
              </button>
              <button onClick={() => setAgentModal(null)}
                className="px-5 text-sm text-gray-500 hover:bg-gray-100 rounded-xl">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
