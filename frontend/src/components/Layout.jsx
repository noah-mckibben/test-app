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
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content — offset by sidebar width on desktop only */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden lg:ml-60">
        <Navbar
          user={user}
          status={status}
          onStatusChange={handleStatusChange}
          onMenuClick={() => setSidebarOpen(true)}
          onLogout={handleLogout}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
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
