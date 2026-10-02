import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

const emptyForm = {
  name: '',
  name_ml: '',
  name_hi: '',
  category: 'vegetable',
  unit: 'kg',
  wholesale_price: '',
  retail_price: '',
  stock: '',
}

const categoryLabels = {
  vegetable: 'Vegetable',
  fruit: 'Fruit',
  other: 'Other',
}

function ProductsTab() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(emptyForm)

  async function loadProducts() {
    setLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true })

    if (error) setError(error.message)
    else setProducts(data)
    setLoading(false)
  }

  useEffect(() => {
    async function init() {
      await loadProducts()
    }
    init()
  }, [])

  async function handleAdd(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.wholesale_price || !form.retail_price) return

    setSaving(true)
    setError('')
    const { error } = await supabase.from('products').insert({
      name: form.name.trim(),
      name_ml: form.name_ml.trim() || null,
      name_hi: form.name_hi.trim() || null,
      category: form.category,
      unit: form.unit.trim() || 'kg',
      wholesale_price: Number(form.wholesale_price),
      retail_price: Number(form.retail_price),
      stock: Number(form.stock) || 0,
    })
    setSaving(false)

    if (error) {
      setError(error.message)
      return
    }
    setForm(emptyForm)
    loadProducts()
  }

  function startEdit(product) {
    setEditingId(product.id)
    setEditForm({
      name: product.name,
      name_ml: product.name_ml || '',
      name_hi: product.name_hi || '',
      category: product.category || 'vegetable',
      unit: product.unit,
      wholesale_price: product.wholesale_price,
      retail_price: product.retail_price,
      stock: product.stock,
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setEditForm(emptyForm)
  }

  async function saveEdit(id) {
    if (!editForm.name.trim() || !editForm.wholesale_price || !editForm.retail_price) return

    setError('')
    const { error } = await supabase
      .from('products')
      .update({
        name: editForm.name.trim(),
        name_ml: editForm.name_ml.trim() || null,
        name_hi: editForm.name_hi.trim() || null,
        category: editForm.category,
        unit: editForm.unit.trim() || 'kg',
        wholesale_price: Number(editForm.wholesale_price),
        retail_price: Number(editForm.retail_price),
        stock: Number(editForm.stock) || 0,
      })
      .eq('id', id)

    if (error) {
      setError(error.message)
      return
    }
    cancelEdit()
    loadProducts()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this product?')) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) {
      setError(error.message)
      return
    }
    loadProducts()
  }

  return (
    <div>
      <div className="admin-panel-header">
        <h2>Products</h2>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <form className="admin-form" onSubmit={handleAdd}>
        <div className="admin-field">
          <label htmlFor="p-name">Name</label>
          <input
            id="p-name"
            placeholder="e.g. Tomato"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div className="admin-field">
          <label htmlFor="p-name-ml">Name (Malayalam)</label>
          <input
            id="p-name-ml"
            placeholder="തക്കാളി"
            value={form.name_ml}
            onChange={(e) => setForm({ ...form, name_ml: e.target.value })}
          />
        </div>
        <div className="admin-field">
          <label htmlFor="p-name-hi">Name (Hindi)</label>
          <input
            id="p-name-hi"
            placeholder="टमाटर"
            value={form.name_hi}
            onChange={(e) => setForm({ ...form, name_hi: e.target.value })}
          />
        </div>
        <div className="admin-field">
          <label htmlFor="p-category">Category</label>
          <select
            id="p-category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            <option value="vegetable">Vegetable</option>
            <option value="fruit">Fruit</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="admin-field">
          <label htmlFor="p-unit">Unit</label>
          <input
            id="p-unit"
            placeholder="kg / piece"
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
          />
        </div>
        <div className="admin-field">
          <label htmlFor="p-wholesale">Wholesale rate</label>
          <input
            id="p-wholesale"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={form.wholesale_price}
            onChange={(e) => setForm({ ...form, wholesale_price: e.target.value })}
            required
          />
        </div>
        <div className="admin-field">
          <label htmlFor="p-retail">Retail rate</label>
          <input
            id="p-retail"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={form.retail_price}
            onChange={(e) => setForm({ ...form, retail_price: e.target.value })}
            required
          />
        </div>
        <div className="admin-field">
          <label htmlFor="p-stock">Opening stock</label>
          <input
            id="p-stock"
            type="number"
            min="0"
            step="0.01"
            placeholder="0"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
          />
        </div>
        <button className="admin-btn" type="submit" disabled={saving}>
          <Plus size={16} />
          Add product
        </button>
      </form>

      {loading ? (
        <p>Loading products…</p>
      ) : products.length === 0 ? (
        <div className="admin-empty">No products yet. Add one above.</div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Unit</th>
              <th>Wholesale</th>
              <th>Retail</th>
              <th>Stock</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const isEditing = editingId === product.id
              return (
                <tr key={product.id}>
                  <td>
                    {isEditing ? (
                      <div className="admin-name-edit">
                        <input
                          placeholder="Name"
                          value={editForm.name}
                          onChange={(e) =>
                            setEditForm({ ...editForm, name: e.target.value })
                          }
                        />
                        <input
                          placeholder="Malayalam name"
                          value={editForm.name_ml}
                          onChange={(e) =>
                            setEditForm({ ...editForm, name_ml: e.target.value })
                          }
                        />
                        <input
                          placeholder="Hindi name"
                          value={editForm.name_hi}
                          onChange={(e) =>
                            setEditForm({ ...editForm, name_hi: e.target.value })
                          }
                        />
                      </div>
                    ) : (
                      <>
                        {product.name}
                        {(product.name_ml || product.name_hi) && (
                          <div className="admin-name-sub">
                            {[product.name_ml, product.name_hi].filter(Boolean).join(' / ')}
                          </div>
                        )}
                      </>
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <select
                        value={editForm.category}
                        onChange={(e) =>
                          setEditForm({ ...editForm, category: e.target.value })
                        }
                      >
                        <option value="vegetable">Vegetable</option>
                        <option value="fruit">Fruit</option>
                        <option value="other">Other</option>
                      </select>
                    ) : (
                      categoryLabels[product.category] || 'Vegetable'
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        value={editForm.unit}
                        onChange={(e) =>
                          setEditForm({ ...editForm, unit: e.target.value })
                        }
                      />
                    ) : (
                      product.unit
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editForm.wholesale_price}
                        onChange={(e) =>
                          setEditForm({ ...editForm, wholesale_price: e.target.value })
                        }
                      />
                    ) : (
                      `₹${Number(product.wholesale_price).toFixed(2)}`
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editForm.retail_price}
                        onChange={(e) =>
                          setEditForm({ ...editForm, retail_price: e.target.value })
                        }
                      />
                    ) : (
                      `₹${Number(product.retail_price).toFixed(2)}`
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editForm.stock}
                        onChange={(e) =>
                          setEditForm({ ...editForm, stock: e.target.value })
                        }
                      />
                    ) : (
                      `${Number(product.stock)} ${product.unit}`
                    )}
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      {isEditing ? (
                        <>
                          <button
                            className="admin-btn admin-btn-icon"
                            onClick={() => saveEdit(product.id)}
                            title="Save"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            className="admin-btn admin-btn-ghost admin-btn-icon"
                            onClick={cancelEdit}
                            title="Cancel"
                          >
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="admin-btn admin-btn-ghost admin-btn-icon"
                            onClick={() => startEdit(product)}
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            className="admin-btn admin-btn-danger admin-btn-icon"
                            onClick={() => handleDelete(product.id)}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default ProductsTab
