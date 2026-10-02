import { useEffect, useState } from 'react'
import { PackagePlus } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function StockTab() {
  const [products, setProducts] = useState([])
  const [selectedProductId, setSelectedProductId] = useState('')
  const [entryDate, setEntryDate] = useState(todayStr())
  const [quantity, setQuantity] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  const [reportDate, setReportDate] = useState(todayStr())
  const [report, setReport] = useState([])
  const [reportLoading, setReportLoading] = useState(true)

  async function loadProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true })
    if (error) setError(error.message)
    else {
      setProducts(data)
      if (data.length > 0 && !selectedProductId) setSelectedProductId(data[0].id)
    }
  }

  async function loadReport(date) {
    setReportLoading(true)

    const { data: productRows, error: productsError } = await supabase
      .from('products')
      .select('id, name, unit, stock')
      .order('name', { ascending: true })

    const { data: entryRows, error: entriesError } = await supabase
      .from('stock_entries')
      .select('product_id, quantity')
      .eq('entry_date', date)

    const dayStart = `${date}T00:00:00`
    const dayEnd = `${date}T23:59:59.999`
    const { data: billRows, error: billsError } = await supabase
      .from('bills')
      .select('id')
      .gte('created_at', dayStart)
      .lte('created_at', dayEnd)

    let itemRows = []
    if (billRows && billRows.length > 0) {
      const { data, error: itemsError } = await supabase
        .from('bill_items')
        .select('product_id, quantity')
        .in('bill_id', billRows.map((b) => b.id))
      if (itemsError) setError(itemsError.message)
      else itemRows = data
    }

    if (productsError || entriesError || billsError) {
      setError((productsError || entriesError || billsError).message)
      setReportLoading(false)
      return
    }

    const addedByProduct = {}
    for (const row of entryRows || []) {
      addedByProduct[row.product_id] = (addedByProduct[row.product_id] || 0) + Number(row.quantity)
    }

    const soldByProduct = {}
    for (const row of itemRows) {
      soldByProduct[row.product_id] = (soldByProduct[row.product_id] || 0) + Number(row.quantity)
    }

    setReport(
      (productRows || []).map((product) => ({
        ...product,
        added: addedByProduct[product.id] || 0,
        sold: soldByProduct[product.id] || 0,
      })),
    )
    setReportLoading(false)
  }

  useEffect(() => {
    async function init() {
      await loadProducts()
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    loadReport(reportDate)
  }, [reportDate])

  async function handleAddStock(e) {
    e.preventDefault()
    const qty = Number(quantity)
    if (!selectedProductId || !qty || qty <= 0) return

    setSaving(true)
    setError('')
    setSuccess('')

    const { error } = await supabase.rpc('add_stock', {
      p_product_id: selectedProductId,
      p_entry_date: entryDate,
      p_quantity: qty,
    })

    setSaving(false)

    if (error) {
      setError(error.message)
      return
    }

    const product = products.find((p) => p.id === selectedProductId)
    setSuccess(`Added ${qty} ${product?.unit || ''} to ${product?.name || 'product'}.`)
    setQuantity('')
    loadProducts()
    if (entryDate === reportDate) loadReport(reportDate)
  }

  return (
    <div>
      <div className="admin-panel-header">
        <h2>Stock</h2>
      </div>

      {error && <div className="admin-error">{error}</div>}
      {success && <div className="admin-success">{success}</div>}

      {products.length === 0 ? (
        <div className="admin-empty">
          Add products first in the Products tab before logging stock.
        </div>
      ) : (
        <form className="admin-form" onSubmit={handleAddStock}>
          <div className="admin-field">
            <label htmlFor="s-product">Product</label>
            <select
              id="s-product"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
            >
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} (current: {product.stock} {product.unit})
                </option>
              ))}
            </select>
          </div>
          <div className="admin-field">
            <label htmlFor="s-date">Date</label>
            <input
              id="s-date"
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
            />
          </div>
          <div className="admin-field">
            <label htmlFor="s-qty">Quantity received</label>
            <input
              id="s-qty"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>
          <button className="admin-btn" type="submit" disabled={saving}>
            <PackagePlus size={16} />
            Add stock
          </button>
        </form>
      )}

      <div className="admin-panel-header">
        <h2>Daily Stock Report</h2>
        <div className="admin-field">
          <input
            type="date"
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
          />
        </div>
      </div>

      {reportLoading ? (
        <p>Loading report…</p>
      ) : report.length === 0 ? (
        <div className="admin-empty">No products to report on.</div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Added</th>
              <th>Sold</th>
              <th>Current stock</th>
            </tr>
          </thead>
          <tbody>
            {report.map((row) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td>{row.added ? `+${row.added} ${row.unit}` : '—'}</td>
                <td>{row.sold ? `-${row.sold} ${row.unit}` : '—'}</td>
                <td>{row.stock} {row.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="stock-note">
        "Current stock" reflects the live total, not a historical balance for
        past dates. "Added" and "Sold" are exact for the selected date.
      </p>
    </div>
  )
}

export default StockTab
