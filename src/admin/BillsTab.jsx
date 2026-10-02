import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

function formatDate(iso) {
  return new Date(iso).toLocaleString()
}

function BillsTab() {
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [itemsByBill, setItemsByBill] = useState({})

  useEffect(() => {
    async function loadBills() {
      setLoading(true)
      const { data, error } = await supabase
        .from('bills')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) setError(error.message)
      else setBills(data)
      setLoading(false)
    }
    loadBills()
  }, [])

  async function toggleExpand(billId) {
    if (expandedId === billId) {
      setExpandedId(null)
      return
    }
    setExpandedId(billId)

    if (!itemsByBill[billId]) {
      const { data, error } = await supabase
        .from('bill_items')
        .select('*')
        .eq('bill_id', billId)
      if (error) {
        setError(error.message)
        return
      }
      setItemsByBill((prev) => ({ ...prev, [billId]: data }))
    }
  }

  return (
    <div>
      <div className="admin-panel-header">
        <h2>Saved Bills</h2>
      </div>

      {error && <div className="admin-error">{error}</div>}

      {loading ? (
        <p>Loading bills…</p>
      ) : bills.length === 0 ? (
        <div className="admin-empty">No bills saved yet.</div>
      ) : (
        bills.map((bill) => {
          const isOpen = expandedId === bill.id
          const items = itemsByBill[bill.id]
          return (
            <div className="bill-card" key={bill.id}>
              <div
                className="bill-card-summary"
                onClick={() => toggleExpand(bill.id)}
              >
                <div className="bill-card-meta">
                  <span className="bill-number">
                    {bill.customer_name || 'Walk-in customer'}{' '}
                    <span className={`rate-badge rate-badge-${bill.rate_type}`}>
                      {bill.rate_type}
                    </span>
                  </span>
                  <span className="bill-date">{formatDate(bill.created_at)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span className="bill-card-total">
                    ₹{Number(bill.total).toFixed(2)}
                  </span>
                  {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </div>

              {isOpen && (
                <div className="bill-card-details">
                  {!items ? (
                    <p>Loading items…</p>
                  ) : (
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Qty</th>
                          <th>Unit price</th>
                          <th>Line total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => (
                          <tr key={item.id}>
                            <td>{item.product_name}</td>
                            <td>{item.quantity}</td>
                            <td>₹{Number(item.unit_price).toFixed(2)}</td>
                            <td>₹{Number(item.line_total).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}

export default BillsTab
