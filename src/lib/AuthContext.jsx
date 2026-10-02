import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { AuthContext } from './authContext'

async function resolveRole(session) {
  if (!session) return 'admin'
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', session.user.id)
    .maybeSingle()
  return !error && data?.role === 'staff' ? 'staff' : 'admin'
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [role, setRole] = useState('admin')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function applySession(newSession) {
      setSession(newSession)
      setRole(await resolveRole(newSession))
    }

    async function init() {
      const { data } = await supabase.auth.getSession()
      await applySession(data.session)
      setLoading(false)
    }
    init()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      applySession(newSession)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ session, loading, role }}>
      {children}
    </AuthContext.Provider>
  )
}
