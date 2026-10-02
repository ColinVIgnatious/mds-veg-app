import { useState } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { LogIn, Sprout } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/useAuth'

function LoginPage() {
  const { session, loading: sessionLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!sessionLoading && session) {
    const from = location.state?.from?.pathname || '/admin'
    return <Navigate to={from} replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    setSubmitting(false)
    if (error) {
      setError(error.message)
      return
    }
    navigate('/admin', { replace: true })
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <Sprout size={32} className="login-icon" />
        <h1>Manies Departmental Store</h1>
        <p className="login-subtitle">Sign in to manage products and bills</p>

        {error && <div className="admin-error">{error}</div>}

        <div className="admin-field">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div className="admin-field">
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button className="admin-btn" type="submit" disabled={submitting} style={{ width: '100%', justifyContent: 'center' }}>
          <LogIn size={16} />
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}

export default LoginPage
