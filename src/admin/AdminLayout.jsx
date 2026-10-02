import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Carrot, Receipt, FileText, Boxes, LogOut, Sprout } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/useAuth'
import './admin.css'

const allTabs = [
  { to: '/admin/products', label: 'Products', icon: Carrot },
  { to: '/admin/stock', label: 'Stock', icon: Boxes },
  { to: '/admin/billing', label: 'Billing', icon: Receipt },
  { to: '/admin/bills', label: 'Saved Bills', icon: FileText },
]

function AdminLayout() {
  const navigate = useNavigate()
  const { session, role } = useAuth()
  const tabs = role === 'admin' ? allTabs : allTabs.filter((tab) => tab.to === '/admin/billing')

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="admin">
      <header className="admin-header">
        <div className="admin-brand">
          <Sprout size={26} className="admin-brand-icon" />
          <div>
            <h1>Manies Departmental Store</h1>
            <p className="admin-brand-subtitle">{role === 'admin' ? 'Admin Dashboard' : 'Staff Billing'}</p>
          </div>
        </div>
        <div className="admin-header-actions">
          {session?.user?.email && (
            <span className="admin-user-email">{session.user.email}</span>
          )}
          <button className="admin-btn admin-btn-ghost" onClick={handleLogout}>
            <LogOut size={16} />
            Log out
          </button>
        </div>
      </header>

      {tabs.length > 1 && (
        <nav className="admin-tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                className={({ isActive }) =>
                  isActive ? 'admin-tab admin-tab-active' : 'admin-tab'
                }
              >
                <Icon size={18} />
                {tab.label}
              </NavLink>
            )
          })}
        </nav>
      )}

      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  )
}

export default AdminLayout
