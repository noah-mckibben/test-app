import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { CallProvider } from './context/CallContext'
import Layout from './components/Layout'
import RequireRole from './components/RequireRole'
import AdminLayout from './components/admin/AdminLayout'
import LoginPage        from './pages/LoginPage'
import DashboardPage    from './pages/DashboardPage'
import DialpadPage      from './pages/DialpadPage'
import ContactsPage     from './pages/ContactsPage'
import AgentsPage       from './pages/AgentsPage'
import SettingsPage     from './pages/SettingsPage'
import AdminUsersPage       from './pages/admin/AdminUsersPage'
import AdminWorkTypesPage   from './pages/admin/AdminWorkTypesPage'
import AdminCampaignsPage   from './pages/admin/AdminCampaignsPage'
import AdminCallFlowsPage   from './pages/admin/AdminCallFlowsPage'
import AdminIntegrationsPage from './pages/admin/AdminIntegrationsPage'

function RequireAuth({ children }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" replace />
  return children
}

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: <RequireAuth><CallProvider><Layout /></CallProvider></RequireAuth>,
    children: [
      { index: true,          element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard',    element: <DashboardPage /> },
      { path: 'dialpad',      element: <DialpadPage /> },
      { path: 'contacts',     element: <ContactsPage /> },
      { path: 'agents',       element: <AgentsPage /> },
      { path: 'settings',     element: <SettingsPage /> },
      {
        path: 'admin',
        element: <RequireRole roles={['ADMIN','SUPERVISOR']}><AdminLayout /></RequireRole>,
        children: [
          { index: true,           element: <Navigate to="/admin/users" replace /> },
          { path: 'users',         element: <AdminUsersPage /> },
          { path: 'work-types',    element: <AdminWorkTypesPage /> },
          { path: 'campaigns',     element: <AdminCampaignsPage /> },
          { path: 'call-flows',    element: <RequireRole roles={['ADMIN']}><AdminCallFlowsPage /></RequireRole> },
          { path: 'integrations',  element: <RequireRole roles={['ADMIN']}><AdminIntegrationsPage /></RequireRole> },
        ],
      },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
