import { Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import IncomingCallModal from './IncomingCallModal'
import { useCall } from '../context/CallContext'
import { api } from '../lib/api'

export default function Layout() {
  const navigate = useNavigate()
  const { incomingCall, acceptCall, rejectCall } = useCall()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [status, setStatus] = useState(user.status || 'ONLINE')

  async function handleStatusChange(s) {
    setStatus(s)
    await api(`/api/users/status?status=${s}`, { method: 'PUT' })
  }

  function handleLogout() {
    api('/api/users/status?status=OFFLINE', { method: 'PUT' }).finally(() => {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      navigate('/login')
    })
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar onLogout={handleLogout} />

      <div className="flex-1 flex flex-col ml-60 min-w-0 overflow-hidden">
        <Navbar user={user} status={status} onStatusChange={handleStatusChange} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>

      {incomingCall && (
        <IncomingCallModal
          incomingCall={incomingCall}
          onAccept={acceptCall}
          onReject={rejectCall}
        />
      )}
    </div>
  )
}
