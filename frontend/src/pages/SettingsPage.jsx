import { useState } from 'react'
import { Save, User, Shield, CheckCircle2 } from 'lucide-react'

export default function SettingsPage() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [displayName, setDisplayName] = useState(user.displayName || '')
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    // Placeholder: a dedicated PATCH /api/users/me endpoint would go here
    await new Promise(r => setTimeout(r, 600))
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const inp = 'w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition bg-white'
  const lbl = 'block text-sm font-medium text-gray-700 mb-1.5'

  return (
    <div className="max-w-2xl space-y-5">

      {/* Profile card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
            <User size={16} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Profile</h2>
            <p className="text-xs text-gray-400">Update your personal information</p>
          </div>
        </div>
        <form onSubmit={save} className="p-6 space-y-5">
          {/* Avatar row */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold text-2xl shadow-md shadow-blue-200 flex-shrink-0">
              {user.displayName?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <p className="font-semibold text-gray-800">{user.displayName}</p>
              <p className="text-sm text-gray-400">@{user.username}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Display Name</label>
              <input value={displayName} onChange={e => setDisplayName(e.target.value)} type="text" className={inp} />
            </div>
            <div>
              <label className={lbl}>Username</label>
              <input value={user.username} disabled type="text"
                className={inp + ' bg-gray-50 text-gray-400 cursor-not-allowed'} />
            </div>
            <div className="sm:col-span-2">
              <label className={lbl}>Phone Number</label>
              <input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)}
                type="tel" placeholder="+15551234567" className={inp} />
            </div>
          </div>

          <div className="flex items-center gap-4 pt-1">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium text-sm px-5 py-2.5 rounded-xl transition-colors">
              <Save size={15} /> {saving ? 'Saving…' : 'Save Changes'}
            </button>
            {saved && (
              <span className="flex items-center gap-1.5 text-sm font-medium text-green-600">
                <CheckCircle2 size={16} /> Saved!
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Account info */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
            <Shield size={16} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Account Details</h2>
            <p className="text-xs text-gray-400">Read-only account information</p>
          </div>
        </div>
        <div className="divide-y divide-gray-50">
          {[
            { label: 'Username', desc: 'Used for login and in-app calling', value: `@${user.username}` },
            { label: 'Member since', desc: 'Account creation date',
              value: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A' },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="text-sm font-medium text-gray-700">{row.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{row.desc}</p>
              </div>
              <span className="text-sm font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded-full">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
