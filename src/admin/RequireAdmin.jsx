import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'

function RequireAdmin({ children }) {
  const { role } = useAuth()

  if (role !== 'admin') return <Navigate to="/admin/billing" replace />

  return children
}

export default RequireAdmin
