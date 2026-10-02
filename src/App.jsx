import { Routes, Route, Navigate, Link } from 'react-router-dom'
import { Sprout, LogIn } from 'lucide-react'
import AdminLayout from './admin/AdminLayout.jsx'
import LoginPage from './admin/LoginPage.jsx'
import RequireAuth from './admin/RequireAuth.jsx'
import RequireAdmin from './admin/RequireAdmin.jsx'
import ProductsTab from './admin/ProductsTab.jsx'
import StockTab from './admin/StockTab.jsx'
import BillingTab from './admin/BillingTab.jsx'
import BillsTab from './admin/BillsTab.jsx'
import ReceiptView from './admin/ReceiptView.jsx'
import { useAuth } from './lib/useAuth.js'
import './App.css'

function AdminIndex() {
  const { role } = useAuth()
  return <Navigate to={role === 'admin' ? 'products' : 'billing'} replace />
}

function Home() {
  return (
    <div className="landing">
      <div className="landing-card">
        <Sprout size={40} className="landing-icon" />
        <h1>Manies Departmental Store</h1>
        <p className="landing-tagline">Fresh Vegetables · Wholesale &amp; Retail Billing</p>
        <Link to="/login" className="landing-cta">
          <LogIn size={16} />
          Admin Login
        </Link>
      </div>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/admin/receipt/:billId"
        element={
          <RequireAuth>
            <ReceiptView />
          </RequireAuth>
        }
      />
      <Route
        path="/admin"
        element={
          <RequireAuth>
            <AdminLayout />
          </RequireAuth>
        }
      >
        <Route index element={<AdminIndex />} />
        <Route
          path="products"
          element={
            <RequireAdmin>
              <ProductsTab />
            </RequireAdmin>
          }
        />
        <Route
          path="stock"
          element={
            <RequireAdmin>
              <StockTab />
            </RequireAdmin>
          }
        />
        <Route path="billing" element={<BillingTab />} />
        <Route
          path="bills"
          element={
            <RequireAdmin>
              <BillsTab />
            </RequireAdmin>
          }
        />
      </Route>
    </Routes>
  )
}

export default App
