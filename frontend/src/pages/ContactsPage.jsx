import { useState } from 'react'
import { Plus, Search, Phone, PhoneCall, Trash2, X } from 'lucide-react'
import { useCall } from '../context/CallContext'
import { api } from '../lib/api'
import { useNavigate } from 'react-router-dom'

const STATUS_DOT = { ONLINE: 'bg-green-500', BUSY: 'bg-yellow-400', OFFLINE: 'bg-gray-300' }

export default function ContactsPage() {
  const { contacts, loadContacts, dial } = useCall()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [addErr, setAddErr] = useState('')

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.phoneNumber.includes(search)
  )

  async function addContact() {
    setAddErr('')
    try {
      const res = await api('/api/contacts', {
        method: 'POST',
        body: JSON.stringify({ name, phoneNumber: phone }),
      })
      if (!res.ok) throw new Error('Failed to save contact')
      setName(''); setPhone(''); setShowAdd(false)
      loadContacts()
    } catch (e) { setAddErr(e.message) }
  }

  async function remove(id) {
    await api(`/api/contacts/${id}`, { method: 'DELETE' })
    loadContacts()
  }

  const inp = 'w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition'

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search contacts by name or number…"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white transition" />
        </div>
        <button onClick={() => setShowAdd(v => !v)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-5 py-2.5 rounded-xl transition-colors flex-shrink-0">
          {showAdd ? <X size={15} /> : <Plus size={15} />}
          {showAdd ? 'Cancel' : 'Add Contact'}
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">New Contact</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <input value={name} onChange={e => setName(e.target.value)}
              type="text" placeholder="Full name" className={inp} />
            <input value={phone} onChange={e => setPhone(e.target.value)}
              type="tel" placeholder="Phone number" className={inp} />
          </div>
          {addErr && <p className="text-red-500 text-sm mb-3">{addErr}</p>}
          <button onClick={addContact} disabled={!name || !phone}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium text-sm px-5 py-2 rounded-lg transition-colors">
            Save Contact
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-gray-600 font-medium">{search ? 'No contacts match your search' : 'No contacts yet'}</p>
            {!search && <p className="text-sm text-gray-400 mt-1">Click "Add Contact" to get started</p>}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[1fr_1fr_auto_auto] sm:grid-cols-[1fr_1fr_1fr_auto] gap-0 border-b border-gray-100 bg-gray-50 px-5 py-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</span>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:block">Phone</span>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:block">Status</span>
              <span />
            </div>
            <div className="divide-y divide-gray-50">
              {filtered.map(c => (
                <div key={c.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm flex-shrink-0">
                      {c.name[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{c.name}</p>
                      <p className="text-xs text-gray-400 sm:hidden">{c.phoneNumber}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 flex-1 hidden sm:block">{c.phoneNumber}</p>
                  <div className="flex-1 hidden sm:flex items-center gap-2">
                    {c.appUsername ? (
                      <>
                        <span className={`w-2 h-2 rounded-full ${STATUS_DOT[c.appStatus] || 'bg-gray-300'}`} />
                        <span className="text-xs text-gray-500">{c.appStatus || 'OFFLINE'}</span>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">External</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {c.appUsername && (
                      <button
                        onClick={() => { dial(c.phoneNumber, c.name, c.appUsername, c.appUserId); navigate('/dialpad') }}
                        title="In-app call" className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                        <PhoneCall size={15} />
                      </button>
                    )}
                    <button
                      onClick={() => { dial(c.phoneNumber, c.name); navigate('/dialpad') }}
                      title="Call" className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                      <Phone size={15} />
                    </button>
                    <button onClick={() => remove(c.id)} title="Remove"
                      className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
