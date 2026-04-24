import { useState, useEffect } from 'react'
import { Plus, X, Save, ChevronDown, ChevronRight, Plug, Zap } from 'lucide-react'
import { apiJson, api } from '../../lib/api'

const AUTH_TYPES = ['NONE','API_KEY','BEARER','BASIC','OAUTH2']
const INT_TYPES  = ['REST_API','SALESFORCE','WEBHOOK']
const METHODS    = ['GET','POST','PUT','PATCH','DELETE']

const TYPE_ICON = {
  REST_API:   '🔌',
  SALESFORCE: '☁️',
  WEBHOOK:    '⚡',
}

export default function AdminIntegrationsPage() {
  const [integrations, setIntegrations] = useState([])
  const [expanded, setExpanded]         = useState(null)   // integration id with actions shown
  const [dataActions, setDataActions]   = useState({})     // id -> []
  const [showIntForm, setShowIntForm]   = useState(false)
  const [editInt, setEditInt]           = useState(null)
  const [intForm, setIntForm]           = useState({ name:'', type:'REST_API', baseUrl:'', authType:'NONE', authConfig:'{}', description:'' })
  const [showDAForm, setShowDAForm]     = useState(null)   // integration id
  const [editDA, setEditDA]             = useState(null)
  const [daForm, setDaForm]             = useState({ name:'', method:'GET', path:'', headersJson:'{}', bodyTemplate:'', responseMapping:'{}' })

  useEffect(() => { loadIntegrations() }, [])

  async function loadIntegrations() {
    setIntegrations(await apiJson('/api/admin/integrations'))
  }

  async function toggleExpand(id) {
    if (expanded === id) { setExpanded(null); return }
    setExpanded(id)
    if (!dataActions[id]) {
      const das = await apiJson(`/api/admin/integrations/${id}/data-actions`)
      setDataActions(d => ({ ...d, [id]: das }))
    }
  }

  async function saveIntegration() {
    const method = editInt ? 'PUT' : 'POST'
    const url    = editInt ? `/api/admin/integrations/${editInt.id}` : '/api/admin/integrations'
    await api(url, { method, body: JSON.stringify(intForm) })
    setShowIntForm(false); setEditInt(null)
    setIntForm({ name:'', type:'REST_API', baseUrl:'', authType:'NONE', authConfig:'{}', description:'' })
    loadIntegrations()
  }

  async function deleteIntegration(id) {
    if (!confirm('Delete integration and all its data actions?')) return
    await api(`/api/admin/integrations/${id}`, { method: 'DELETE' })
    loadIntegrations()
  }

  async function saveDataAction(integrationId) {
    const method = editDA ? 'PUT' : 'POST'
    const url    = editDA ? `/api/admin/integrations/data-actions/${editDA.id}` : `/api/admin/integrations/${integrationId}/data-actions`
    await api(url, { method, body: JSON.stringify(daForm) })
    setShowDAForm(null); setEditDA(null)
    setDaForm({ name:'', method:'GET', path:'', headersJson:'{}', bodyTemplate:'', responseMapping:'{}' })
    const das = await apiJson(`/api/admin/integrations/${integrationId}/data-actions`)
    setDataActions(d => ({ ...d, [integrationId]: das }))
  }

  async function deleteDA(integrationId, daId) {
    await api(`/api/admin/integrations/data-actions/${daId}`, { method: 'DELETE' })
    const das = await apiJson(`/api/admin/integrations/${integrationId}/data-actions`)
    setDataActions(d => ({ ...d, [integrationId]: das }))
  }

  function openEditInt(i) {
    setEditInt(i)
    setIntForm({ name: i.name, type: i.type, baseUrl: i.baseUrl||'', authType: i.authType, authConfig: i.authConfig||'{}', description: i.description||'' })
    setShowIntForm(true)
  }

  function openEditDA(integrationId, da) {
    setEditDA(da)
    setDaForm({ name: da.name, method: da.method, path: da.path, headersJson: da.headersJson||'{}', bodyTemplate: da.bodyTemplate||'', responseMapping: da.responseMapping||'{}' })
    setShowDAForm(integrationId)
  }

  const inp  = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 transition bg-white'
  const mono = inp + ' font-mono text-xs'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-gray-800">Integrations</h2>
          <p className="text-xs text-gray-400 mt-0.5">Third-party API connections and data actions</p>
        </div>
        <button onClick={() => { setEditInt(null); setShowIntForm(v => !v) }}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
          <Plus size={14} /> New Integration
        </button>
      </div>

      {showIntForm && (
        <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-5 space-y-3">
          <h3 className="text-sm font-semibold text-gray-800">{editInt ? 'Edit' : 'New'} Integration</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="text-xs font-medium text-gray-600 mb-1 block">Name</label>
              <input value={intForm.name} onChange={e => setIntForm(f=>({...f,name:e.target.value}))} className={inp} /></div>
            <div><label className="text-xs font-medium text-gray-600 mb-1 block">Type</label>
              <select value={intForm.type} onChange={e => setIntForm(f=>({...f,type:e.target.value}))} className={inp}>
                {INT_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
            <div className="sm:col-span-2"><label className="text-xs font-medium text-gray-600 mb-1 block">Base URL</label>
              <input value={intForm.baseUrl} onChange={e => setIntForm(f=>({...f,baseUrl:e.target.value}))} placeholder="https://api.example.com" className={inp} /></div>
            <div><label className="text-xs font-medium text-gray-600 mb-1 block">Auth Type</label>
              <select value={intForm.authType} onChange={e => setIntForm(f=>({...f,authType:e.target.value}))} className={inp}>
                {AUTH_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
            <div><label className="text-xs font-medium text-gray-600 mb-1 block">Auth Config (JSON)</label>
              <input value={intForm.authConfig} onChange={e => setIntForm(f=>({...f,authConfig:e.target.value}))} placeholder='{"apiKey":"..."}' className={mono} /></div>
            <div className="sm:col-span-2"><label className="text-xs font-medium text-gray-600 mb-1 block">Description</label>
              <input value={intForm.description} onChange={e => setIntForm(f=>({...f,description:e.target.value}))} className={inp} /></div>
          </div>
          <div className="flex gap-2">
            <button onClick={saveIntegration} className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg">
              <Save size={14} /> Save
            </button>
            <button onClick={() => { setShowIntForm(false); setEditInt(null) }} className="text-sm text-gray-500 px-4 py-2 rounded-lg hover:bg-gray-100">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {integrations.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
            <p className="text-3xl mb-3">🔌</p>
            <p className="text-gray-600 font-medium text-sm">No integrations yet</p>
            <p className="text-xs text-gray-400 mt-1">Add your first integration to enable data actions in call flows</p>
          </div>
        )}
        {integrations.map(i => (
          <div key={i.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4">
              <span className="text-xl">{TYPE_ICON[i.type] || '🔌'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">{i.name}</p>
                <p className="text-xs text-gray-400">{i.baseUrl || i.type} · Auth: {i.authType}</p>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${i.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {i.active ? 'Active' : 'Inactive'}
              </span>
              <button onClick={() => openEditInt(i)} className="text-xs text-blue-600 hover:underline px-2">Edit</button>
              <button onClick={() => deleteIntegration(i.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><X size={14} /></button>
              <button onClick={() => toggleExpand(i.id)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
                {expanded === i.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            </div>

            {/* Data Actions */}
            {expanded === i.id && (
              <div className="border-t border-gray-100">
                <div className="flex items-center justify-between px-5 py-3 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Data Actions</p>
                  <button onClick={() => { setEditDA(null); setDaForm({ name:'', method:'GET', path:'', headersJson:'{}', bodyTemplate:'', responseMapping:'{}' }); setShowDAForm(i.id) }}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium">
                    <Plus size={12} /> Add Action
                  </button>
                </div>

                {showDAForm === i.id && (
                  <div className="px-5 py-4 border-b border-gray-100 space-y-3 bg-blue-50/30">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div><label className="text-xs font-medium text-gray-600 mb-1 block">Name</label>
                        <input value={daForm.name} onChange={e => setDaForm(f=>({...f,name:e.target.value}))} className={inp} /></div>
                      <div><label className="text-xs font-medium text-gray-600 mb-1 block">Method</label>
                        <select value={daForm.method} onChange={e => setDaForm(f=>({...f,method:e.target.value}))} className={inp}>
                          {METHODS.map(m => <option key={m}>{m}</option>)}</select></div>
                      <div><label className="text-xs font-medium text-gray-600 mb-1 block">Path</label>
                        <input value={daForm.path} onChange={e => setDaForm(f=>({...f,path:e.target.value}))} placeholder="/endpoint/{id}" className={inp} /></div>
                      <div className="sm:col-span-3"><label className="text-xs font-medium text-gray-600 mb-1 block">Body Template (JSON)</label>
                        <textarea value={daForm.bodyTemplate} onChange={e => setDaForm(f=>({...f,bodyTemplate:e.target.value}))}
                          rows={2} placeholder='{"key":"{{variable}}"}' className={mono + ' resize-none'} /></div>
                      <div className="sm:col-span-3"><label className="text-xs font-medium text-gray-600 mb-1 block">Response Mapping (JSON)</label>
                        <textarea value={daForm.responseMapping} onChange={e => setDaForm(f=>({...f,responseMapping:e.target.value}))}
                          rows={2} placeholder='{"outputVar":"$.data.field"}' className={mono + ' resize-none'} /></div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => saveDataAction(i.id)} className="flex items-center gap-1.5 bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg">
                        <Save size={12} /> Save Action
                      </button>
                      <button onClick={() => { setShowDAForm(null); setEditDA(null) }} className="text-xs text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-100">Cancel</button>
                    </div>
                  </div>
                )}

                {(dataActions[i.id] || []).length === 0 && showDAForm !== i.id && (
                  <p className="text-xs text-gray-400 px-5 py-4">No data actions yet</p>
                )}
                {(dataActions[i.id] || []).map(da => (
                  <div key={da.id} className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 hover:bg-gray-50">
                    <span className={`text-xs font-mono font-bold w-14 text-center py-0.5 rounded ${
                      da.method === 'GET' ? 'bg-green-100 text-green-700' : da.method === 'POST' ? 'bg-blue-100 text-blue-700' :
                      da.method === 'DELETE' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>{da.method}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{da.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{i.baseUrl}{da.path}</p>
                    </div>
                    <button onClick={() => openEditDA(i.id, da)} className="text-xs text-blue-600 hover:underline">Edit</button>
                    <button onClick={() => deleteDA(i.id, da.id)} className="p-1 text-red-400 hover:bg-red-50 rounded"><X size={13} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
