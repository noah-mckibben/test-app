import { useState, useEffect, useRef, useCallback } from 'react'
import { Plus, X, Save, Play, Square, GitBranch, Trash2 } from 'lucide-react'
import { apiJson, api } from '../../lib/api'

// ── Node types ────────────────────────────────────────────────────────────
const NODE_TYPES = {
  start:      { label: 'Start',          color: 'bg-green-500',  text: 'text-white', desc: 'Entry point' },
  greeting:   { label: 'Play Greeting',  color: 'bg-blue-500',   text: 'text-white', desc: 'Play a TTS or recorded message' },
  menu:       { label: 'IVR Menu',       color: 'bg-indigo-500', text: 'text-white', desc: 'Collect a digit and branch' },
  route_queue:{ label: 'Route to Queue', color: 'bg-teal-500',   text: 'text-white', desc: 'Send caller to a work-type queue' },
  route_agent:{ label: 'Route to Agent', color: 'bg-cyan-500',   text: 'text-white', desc: 'Direct to a specific agent' },
  data_action:{ label: 'Data Action',    color: 'bg-orange-500', text: 'text-white', desc: 'Call a third-party API' },
  voicemail:  { label: 'Voicemail',      color: 'bg-purple-500', text: 'text-white', desc: 'Record a voicemail' },
  end:        { label: 'End',            color: 'bg-red-500',    text: 'text-white', desc: 'Hang up' },
}

const DEFAULT_FLOW = { nodes: [], edges: [] }

let nodeIdCounter = 1
function newNodeId() { return `node_${nodeIdCounter++}` }

// ── Canvas / node-graph editor ────────────────────────────────────────────
function FlowCanvas({ flow, onChange, dataActions, workTypes = [], agents = [] }) {
  const [nodes, setNodes]         = useState(flow?.nodes || [])
  const [edges, setEdges]         = useState(flow?.edges || [])
  const [selected, setSelected]   = useState(null)   // selected node id
  const [dragging, setDragging]   = useState(null)   // { id, ox, oy }
  const [connecting, setConnecting] = useState(null) // source node id
  const canvasRef = useRef(null)

  // Sync to parent (one-way: local → parent only)
  useEffect(() => { onChange({ nodes, edges }) }, [nodes, edges])

  function addNode(type) {
    const id = newNodeId()
    const n = { id, type, x: 80 + Math.random()*300, y: 80 + Math.random()*200, data: {} }
    setNodes(ns => [...ns, n])
    setSelected(id)
  }

  function updateNodeData(id, data) {
    setNodes(ns => ns.map(n => n.id === id ? { ...n, data: { ...n.data, ...data } } : n))
  }

  function deleteNode(id) {
    setNodes(ns => ns.filter(n => n.id !== id))
    setEdges(es => es.filter(e => e.source !== id && e.target !== id))
    if (selected === id) setSelected(null)
  }

  function onMouseDown(e, id) {
    e.stopPropagation()
    if (connecting) {
      if (connecting !== id) {
        setEdges(es => [...es, { id: `e_${connecting}_${id}`, source: connecting, target: id }])
      }
      setConnecting(null)
      return
    }
    const rect = canvasRef.current.getBoundingClientRect()
    const node = nodes.find(n => n.id === id)
    setDragging({ id, ox: e.clientX - rect.left - node.x, oy: e.clientY - rect.top - node.y })
    setSelected(id)
  }

  function onMouseMove(e) {
    if (!dragging) return
    const rect = canvasRef.current.getBoundingClientRect()
    setNodes(ns => ns.map(n => n.id === dragging.id
      ? { ...n, x: e.clientX - rect.left - dragging.ox, y: e.clientY - rect.top - dragging.oy }
      : n))
  }

  function onMouseUp() { setDragging(null) }

  const selectedNode = nodes.find(n => n.id === selected)
  const cfg = selectedNode ? NODE_TYPES[selectedNode.type] : null

  return (
    <div className="flex gap-4 h-full">
      {/* Palette */}
      <div className="w-44 flex-shrink-0 space-y-1.5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Add Node</p>
        {Object.entries(NODE_TYPES).map(([type, cfg]) => (
          <button key={type} onClick={() => addNode(type)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-white transition-opacity hover:opacity-90 ${cfg.color}`}>
            <span className="truncate">{cfg.label}</span>
          </button>
        ))}
        {connecting && (
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700">
            Click target node to connect, or click canvas to cancel
          </div>
        )}
      </div>

      {/* Canvas */}
      <div className="flex-1 relative bg-gray-50 rounded-xl border border-gray-200 overflow-hidden"
        style={{ minHeight: 480 }}
        ref={canvasRef}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onClick={() => { setConnecting(null); setSelected(null) }}>

        {/* Grid dots */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
          <defs>
            <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="#d1d5db" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          {/* Edges */}
          {edges.map(edge => {
            const src = nodes.find(n => n.id === edge.source)
            const tgt = nodes.find(n => n.id === edge.target)
            if (!src || !tgt) return null
            const x1 = src.x + 80, y1 = src.y + 18
            const x2 = tgt.x + 80, y2 = tgt.y + 18
            const mx = (x1 + x2) / 2
            return (
              <g key={edge.id} className="pointer-events-auto" onClick={e => { e.stopPropagation(); setEdges(es => es.filter(e2 => e2.id !== edge.id)) }}>
                <path d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`}
                  stroke="#6b7280" strokeWidth="2" fill="none" markerEnd="url(#arrow)" className="cursor-pointer hover:stroke-red-400" />
                <defs>
                  <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L8,3 z" fill="#6b7280" />
                  </marker>
                </defs>
              </g>
            )
          })}
        </svg>

        {/* Nodes */}
        {nodes.map(node => {
          const c = NODE_TYPES[node.type] || NODE_TYPES.end
          const isSelected = selected === node.id
          return (
            <div key={node.id}
              style={{ position: 'absolute', left: node.x, top: node.y, zIndex: isSelected ? 10 : 5, cursor: dragging?.id === node.id ? 'grabbing' : 'grab', userSelect: 'none' }}
              className={`w-40 rounded-xl shadow-md border-2 ${isSelected ? 'border-blue-400' : 'border-transparent'} overflow-hidden`}
              onMouseDown={e => onMouseDown(e, node.id)}
              onClick={e => { e.stopPropagation(); setSelected(node.id) }}>
              <div className={`${c.color} px-3 py-1.5 flex items-center justify-between`}>
                <span className={`text-xs font-semibold ${c.text} truncate`}>{c.label}</span>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={e => { e.stopPropagation(); setConnecting(node.id) }}
                    title="Connect to another node"
                    className="text-white/80 hover:text-white text-xs leading-none">→</button>
                  <button onClick={e => { e.stopPropagation(); deleteNode(node.id) }}
                    className="text-white/80 hover:text-white text-xs leading-none"><X size={11} /></button>
                </div>
              </div>
              <div className="bg-white px-3 py-1.5">
                <p className="text-xs text-gray-500 truncate">{node.data?.label || c.desc}</p>
              </div>
            </div>
          )
        })}

        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-sm text-gray-400">Add nodes from the palette on the left, then drag to position and click → to connect them</p>
          </div>
        )}
      </div>

      {/* Properties panel */}
      {selectedNode && cfg && (
        <div className="w-56 flex-shrink-0 bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3 overflow-y-auto" style={{ maxHeight: 480 }}>
          <div className={`${cfg.color} rounded-lg px-3 py-1.5`}>
            <p className={`text-xs font-bold ${cfg.text}`}>{cfg.label}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Display Label</label>
            <input value={selectedNode.data?.label || ''} onChange={e => updateNodeData(selectedNode.id, { label: e.target.value })}
              placeholder={cfg.label}
              className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-blue-400" />
          </div>
          {selectedNode.type === 'greeting' && (
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Message Text (TTS)</label>
              <textarea value={selectedNode.data?.message || ''} onChange={e => updateNodeData(selectedNode.id, { message: e.target.value })}
                rows={3} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-blue-400 resize-none" />
            </div>
          )}
          {selectedNode.type === 'menu' && (
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Prompt Text</label>
              <textarea value={selectedNode.data?.prompt || ''} onChange={e => updateNodeData(selectedNode.id, { prompt: e.target.value })}
                rows={2} placeholder="Press 1 for sales, 2 for support…"
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-blue-400 resize-none" />
              <label className="text-xs font-medium text-gray-600 block mb-1 mt-2">Options (digit=label, one per line)</label>
              <textarea value={selectedNode.data?.options || ''} onChange={e => updateNodeData(selectedNode.id, { options: e.target.value })}
                rows={3} placeholder={"1=Sales\n2=Support\n0=Operator"}
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-mono outline-none focus:border-blue-400 resize-none" />
            </div>
          )}
          {selectedNode.type === 'route_queue' && (
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Route to Queue</label>
              {workTypes.length > 0 ? (
                <select value={selectedNode.data?.queue || ''} onChange={e => updateNodeData(selectedNode.id, { queue: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-blue-400 bg-white">
                  <option value="">— Select Queue —</option>
                  {workTypes.map(wt => (
                    <option key={wt.id} value={wt.name}>{wt.name}</option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-gray-400 italic">No work types found. Create one in Work Types first.</p>
              )}
              {selectedNode.data?.queue && (
                <p className="text-xs text-gray-400 mt-1">→ {selectedNode.data.queue}</p>
              )}
            </div>
          )}
          {selectedNode.type === 'route_agent' && (
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Route to Agent</label>
              {agents.length > 0 ? (
                <select value={selectedNode.data?.agentUsername || ''} onChange={e => updateNodeData(selectedNode.id, { agentUsername: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-blue-400 bg-white">
                  <option value="">— Select Agent —</option>
                  {agents.map(a => (
                    <option key={a.id} value={a.username}>{a.displayName || a.username}</option>
                  ))}
                </select>
              ) : (
                <input value={selectedNode.data?.agentUsername || ''} onChange={e => updateNodeData(selectedNode.id, { agentUsername: e.target.value })}
                  placeholder="username"
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-blue-400" />
              )}
            </div>
          )}
          {selectedNode.type === 'data_action' && (
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Data Action</label>
              <select value={selectedNode.data?.dataActionId || ''} onChange={e => updateNodeData(selectedNode.id, { dataActionId: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-blue-400 bg-white">
                <option value="">— Select —</option>
                {dataActions.map(da => <option key={da.id} value={da.id}>{da.name}</option>)}
              </select>
            </div>
          )}
          {selectedNode.type === 'voicemail' && (
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Voicemail Prompt</label>
              <textarea value={selectedNode.data?.prompt || ''} onChange={e => updateNodeData(selectedNode.id, { prompt: e.target.value })}
                rows={2} placeholder="Please leave a message after the tone…"
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-blue-400 resize-none" />
            </div>
          )}
          <button onClick={() => deleteNode(selectedNode.id)}
            className="w-full flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium py-2 rounded-lg transition-colors">
            <Trash2 size={12} /> Delete Node
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function AdminCallFlowsPage() {
  const [flows, setFlows]           = useState([])
  const [dataActions, setDataActions] = useState([])
  const [workTypes, setWorkTypes]   = useState([])
  const [agents, setAgents]         = useState([])
  const [editing, setEditing]       = useState(null)
  const [editName, setEditName]     = useState('')
  const [editDesc, setEditDesc]     = useState('')
  const [editNumber, setEditNumber] = useState('')
  const [currentFlow, setCurrentFlow] = useState(DEFAULT_FLOW)
  const [showList, setShowList]     = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    const [f, da, wt, ag] = await Promise.all([
      apiJson('/api/admin/call-flows'),
      apiJson('/api/admin/integrations/data-actions').catch(() => []),
      apiJson('/api/admin/work-types').catch(() => []),
      apiJson('/api/admin/users').catch(() => []),
    ])
    setFlows(f); setDataActions(da); setWorkTypes(wt); setAgents(ag)
  }

  async function openNew() {
    setEditing(null); setEditName(''); setEditDesc(''); setEditNumber('')
    setCurrentFlow(DEFAULT_FLOW); setShowList(false)
  }

  async function openEdit(cf) {
    setEditing(cf); setEditName(cf.name); setEditDesc(cf.description||''); setEditNumber(cf.triggerNumber||'')
    setCurrentFlow(cf.flowJson ? JSON.parse(cf.flowJson) : DEFAULT_FLOW)
    setShowList(false)
  }

  async function save() {
    const payload = { name: editName, description: editDesc, triggerNumber: editNumber, flowJson: JSON.stringify(currentFlow) }
    const method  = editing ? 'PUT' : 'POST'
    const url     = editing ? `/api/admin/call-flows/${editing.id}` : '/api/admin/call-flows'
    await api(url, { method, body: JSON.stringify(payload) })
    setShowList(true); load()
  }

  async function toggleActive(cf) {
    const url = `/api/admin/call-flows/${cf.id}/${cf.active ? 'deactivate' : 'activate'}`
    await api(url, { method: 'POST' })
    load()
  }

  async function remove(id) {
    if (!confirm('Delete this call flow?')) return
    await api(`/api/admin/call-flows/${id}`, { method: 'DELETE' })
    load()
  }

  if (!showList) return (
    <div className="flex flex-col gap-4" style={{ height: 'calc(100vh - 200px)' }}>
      <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
        <button onClick={() => setShowList(true)} className="text-sm text-blue-600 hover:underline">← Call Flows</button>
        <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Flow name…"
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-400 w-48" />
        <input value={editNumber} onChange={e => setEditNumber(e.target.value)} placeholder="+15551234567"
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-400 w-40" />
        <button onClick={save}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors ml-auto">
          <Save size={14} /> Save Flow
        </button>
      </div>
      <div className="flex-1 min-h-0">
        <FlowCanvas key={editing?.id ?? 'new'} flow={currentFlow} onChange={setCurrentFlow} dataActions={dataActions} workTypes={workTypes} agents={agents} />
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-gray-800">Call Flows</h2>
          <p className="text-xs text-gray-400 mt-0.5">Visual inbound call routing configuration</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
          <Plus size={14} /> New Flow
        </button>
      </div>

      {flows.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <p className="text-3xl mb-3">🔀</p>
          <p className="text-gray-600 font-medium text-sm">No call flows yet</p>
          <p className="text-xs text-gray-400 mt-1">Create a flow to control how inbound calls are routed</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {flows.map(cf => (
          <div key={cf.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <GitBranch size={16} className="text-indigo-600" />
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cf.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {cf.active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="font-semibold text-gray-800 text-sm">{cf.name}</p>
            {cf.triggerNumber && <p className="text-xs text-gray-400 mt-0.5 font-mono">{cf.triggerNumber}</p>}
            {cf.description && <p className="text-xs text-gray-400 mt-0.5">{cf.description}</p>}
            <div className="flex gap-2 mt-4">
              <button onClick={() => openEdit(cf)}
                className="flex-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-2 rounded-lg transition-colors">
                Edit Flow
              </button>
              <button onClick={() => toggleActive(cf)}
                className={`flex items-center gap-1 text-xs font-medium px-3 py-2 rounded-lg transition-colors ${
                  cf.active ? 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700' : 'bg-green-50 hover:bg-green-100 text-green-700'
                }`}>
                {cf.active ? <><Square size={11}/> Deactivate</> : <><Play size={11}/> Activate</>}
              </button>
              <button onClick={() => remove(cf.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
