import { useEffect, useMemo, useState } from 'react'
import { Trash2, Receipt, Minus, Plus } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

const categorySections = [
  { key: 'vegetable', label: 'Vegetables' },
  { key: 'fruit', label: 'Fruits' },
  { key: 'other', label: 'Other' },
]

function BillingTab() {
  const [products, setProducts] = useState([])
  const [rateType, setRateType] = useState('retail')
  const [tapQuantity, setTapQuantity] = useState(1)
  const [customerName, setCustomerName] = useState('')
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadProducts() {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true })
      if (error) setError(error.message)
      else setProducts(data)
    }
    loadProducts()
  }, [])

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.line_total, 0),
    [items],
  )

  const productsByCategory = useMemo(() => {
    const groups = { vegetable: [], fruit: [], other: [] }
    for (const product of products) {
      const category = groups[product.category] ? product.category : 'vegetable'
      groups[category].push(product)
    }
    return groups
  }, [products])

  function remainingStock(product) {
    const alreadyAdded = items
      .filter((item) => item.product_id === product.id)
      .reduce((sum, item) => sum + item.quantity, 0)
    return product.stock - alreadyAdded
  }

  function addProduct(product) {
    const qty = tapQuantity
    if (!qty || qty <= 0) return

    if (qty > remainingStock(product)) {
      setError(`Only ${remainingStock(product)} ${product.unit} of ${product.name} left in stock.`)
      return
    }

    const unitPrice = rateType === 'wholesale' ? product.wholesale_price : product.retail_price

    setItems((prev) => {
      const existing = prev.find(
        (item) => item.product_id === product.id && item.unit_price === unitPrice,
      )
      if (existing) {
        return prev.map((item) =>
          item.key === existing.key
            ? {
                ...item,
                quantity: Number((item.quantity + qty).toFixed(2)),
                line_total: Number(((item.quantity + qty) * unitPrice).toFixed(2)),
              }
            : item,
        )
      }
      return [
        ...prev,
        {
          key: `${product.id}-${Date.now()}`,
          product_id: product.id,
          product_name: product.name,
          product_name_ml: product.name_ml || null,
          product_name_hi: product.name_hi || null,
          unit: product.unit,
          unit_price: unitPrice,
          quantity: qty,
          line_total: Number((unitPrice * qty).toFixed(2)),
        },
      ]
    })
    setError('')
    setSuccess('')
  }

  function updateQuantity(key, quantity) {
    setItems((prev) =>
      prev.map((item) =>
        item.key === key
          ? { ...item, quantity, line_total: Number((item.unit_price * quantity).toFixed(2)) }
          : item,
      ),
    )
  }

  function removeItem(key) {
    setItems((prev) => prev.filter((item) => item.key !== key))
  }

  async function saveBill() {
    if (items.length === 0) return
    setSaving(true)
    setError('')
    setSuccess('')

    const { data: bill, error: rpcError } = await supabase.rpc('create_bill', {
      p_customer_name: customerName.trim() || null,
      p_rate_type: rateType,
      p_items: items.map((item) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        product_name_ml: item.product_name_ml,
        product_name_hi: item.product_name_hi,
        unit_price: item.unit_price,
        quantity: item.quantity,
        line_total: item.line_total,
      })),
    })

    setSaving(false)

    if (rpcError) {
      setError(rpcError.message)
      return
    }

    window.open(`/admin/receipt/${bill.id}`, '_blank')

    setSuccess(`Bill saved (₹${total.toFixed(2)}).`)
    setItems([])
    setCustomerName('')

    const { data } = await supabase.from('products').select('*').order('name', { ascending: true })
    if (data) setProducts(data)
  }

  return (
    <div>
      <div className="admin-panel-header">
        <h2>New Bill</h2>
        <div className="rate-toggle">
          <button
            type="button"
            className={rateType === 'retail' ? 'rate-toggle-btn rate-toggle-active' : 'rate-toggle-btn'}
            onClick={() => setRateType('retail')}
          >
            Retail
          </button>
          <button
            type="button"
            className={rateType === 'wholesale' ? 'rate-toggle-btn rate-toggle-active' : 'rate-toggle-btn'}
            onClick={() => setRateType('wholesale')}
          >
            Wholesale
          </button>
        </div>
      </div>

      {error && <div className="admin-error">{error}</div>}
      {success && <div className="admin-success">{success}</div>}

      {products.length === 0 ? (
        <div className="admin-empty">
          Add products first in the Products tab before creating a bill.
        </div>
      ) : (
        <div className="billing-layout">
          <div>
            <div className="qty-stepper">
              <span className="qty-stepper-label">Qty per tap</span>
              <button
                type="button"
                className="qty-stepper-btn"
                onClick={() => setTapQuantity((q) => Math.max(0.5, Number((q - 0.5).toFixed(2))))}
              >
                <Minus size={16} />
              </button>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={tapQuantity}
                onChange={(e) => setTapQuantity(Number(e.target.value) || 1)}
              />
              <button
                type="button"
                className="qty-stepper-btn"
                onClick={() => setTapQuantity((q) => Number((q + 0.5).toFixed(2)))}
              >
                <Plus size={16} />
              </button>
            </div>

            {categorySections.map(({ key, label }) => {
              const sectionProducts = productsByCategory[key]
              if (sectionProducts.length === 0) return null
              return (
                <div key={key} className="product-section">
                  <h3 className="product-section-title">{label}</h3>
                  <div className="product-grid">
                    {sectionProducts.map((product) => {
                      const price =
                        rateType === 'wholesale' ? product.wholesale_price : product.retail_price
                      const outOfStock = remainingStock(product) <= 0
                      return (
                        <button
                          key={product.id}
                          type="button"
                          className="product-tile"
                          disabled={outOfStock}
                          onClick={() => addProduct(product)}
                        >
                          <span className="product-tile-name">{product.name}</span>
                          <span className="product-tile-price">
                            ₹{Number(price).toFixed(2)}/{product.unit}
                          </span>
                          <span className="product-tile-stock">
                            {outOfStock ? 'Out of stock' : `${remainingStock(product)} ${product.unit} left`}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {items.length === 0 ? (
              <div className="admin-empty">Tap a product above to add it to the bill.</div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Unit price</th>
                    <th>Line total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.key}>
                      <td>{item.product_name}</td>
                      <td>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.key, Number(e.target.value) || 0)}
                          className="qty-cell-input"
                        />{' '}
                        {item.unit}
                      </td>
                      <td>₹{Number(item.unit_price).toFixed(2)}</td>
                      <td>₹{item.line_total.toFixed(2)}</td>
                      <td>
                        <button
                          className="admin-btn admin-btn-danger admin-btn-icon"
                          onClick={() => removeItem(item.key)}
                          title="Remove"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="billing-summary">
            <div className="admin-field" style={{ marginBottom: 16 }}>
              <label htmlFor="b-customer">Customer name (optional)</label>
              <input
                id="b-customer"
                placeholder="Walk-in customer"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>

            <div className="admin-field" style={{ marginBottom: 16 }}>
              <label>Rate type</label>
              <span style={{ textTransform: 'capitalize' }}>{rateType}</span>
            </div>

            <div className="billing-total-row">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>

            <button
              className="admin-btn"
              style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}
              onClick={saveBill}
              disabled={items.length === 0 || saving}
            >
              <Receipt size={16} />
              {saving ? 'Saving…' : 'Save bill'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default BillingTab
