import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { CallProvider } from './context/CallContext'
import Layout from './components/Layout'
import LoginPage    from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import DialpadPage  from './pages/DialpadPage'
import ContactsPage from './pages/ContactsPage'
import AgentsPage   from './pages/AgentsPage'
import SettingsPage from './pages/SettingsPage'

function RequireAuth({ children }) {
  return localStorage.getItem('token') ? children : <Navigate to="/login" replace />
}

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: (
      <RequireAuth>
        <CallProvider>
          <Layout />
        </CallProvider>
      </RequireAuth>
    ),
    children: [
      { index: true,         element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard',   element: <DashboardPage /> },
      { path: 'dialpad',     element: <DialpadPage />   },
      { path: 'contacts',    element: <ContactsPage />  },
      { path: 'agents',      element: <AgentsPage />    },
      { path: 'settings',    element: <SettingsPage />  },
    ],
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
])

export default function App() {
  return <RouterProvider router={router} />
}
