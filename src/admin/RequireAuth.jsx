import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'

function RequireAuth({ children }) {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) return <p style={{ padding: 24 }}>Loading…</p>
  if (!session) return <Navigate to="/login" replace state={{ from: location }} />

  return children
}

export default RequireAuth
