import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PhoneCall } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('login')
  const [form, setForm] = useState({ username: '', password: '', displayName: '', phoneNumber: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { if (localStorage.getItem('token')) navigate('/dashboard') }, [])

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function submit() {
    setLoading(true); setError('')
    try {
      const path = tab === 'login' ? '/api/auth/login' : '/api/auth/register'
      const body = tab === 'login'
        ? { username: form.username, password: form.password }
        : form
      const res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || (tab === 'login' ? 'Invalid username or password' : 'Registration failed'))
      }
      const data = await res.json()
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      navigate('/dashboard')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const inp = 'w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition'

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          {/* Logo */}
          <div className="text-center mb-7">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md shadow-blue-200">
              <PhoneCall size={28} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-800">Phone App</h1>
            <p className="text-sm text-gray-400 mt-1">Contact Center Platform</p>
          </div>

          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            {['login', 'register'].map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError('') }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === t ? 'bg-white shadow text-blue-700' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          {/* Inputs */}
          <div className="space-y-3">
            <input value={form.username} onChange={set('username')} onKeyUp={e => e.key === 'Enter' && submit()}
              type="text" placeholder="Username" className={inp} autoComplete="username" />
            {tab === 'register' && (
              <>
                <input value={form.displayName} onChange={set('displayName')}
                  type="text" placeholder="Display Name" className={inp} />
                <input value={form.phoneNumber} onChange={set('phoneNumber')}
                  type="tel" placeholder="Phone number (e.g. 5551234567)" className={inp} />
              </>
            )}
            <input value={form.password} onChange={set('password')} onKeyUp={e => e.key === 'Enter' && submit()}
              type="password" placeholder="Password" className={inp}
              autoComplete={tab === 'login' ? 'current-password' : 'new-password'} />

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-lg">
                {error}
              </div>
            )}

            <button
              onClick={submit}
              disabled={loading || !form.username || !form.password}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors mt-1"
            >
              {loading ? 'Please wait…' : (tab === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">Phone App © {new Date().getFullYear()}</p>
      </div>
    </div>
  )
}
