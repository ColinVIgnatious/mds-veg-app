import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Languages, Printer } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import '../lib/i18n'
import './receipt.css'

const STORE_NAME = 'Manies Departmental Store'
const STORE_PHONES = ['9447224166', '9809411750']
const LANGUAGES = ['en', 'ml', 'hi']

function itemName(item, lang) {
  if (lang === 'ml' && item.product_name_ml) return item.product_name_ml
  if (lang === 'hi' && item.product_name_hi) return item.product_name_hi
  return item.product_name
}

function ReceiptView() {
  const { billId } = useParams()
  const { t, i18n } = useTranslation()
  const [bill, setBill] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const hasPrinted = useRef(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data: billRow, error: billError } = await supabase
        .from('bills')
        .select('*')
        .eq('id', billId)
        .single()

      if (billError) {
        setError(billError.message)
        setLoading(false)
        return
      }

      const { data: itemRows, error: itemsError } = await supabase
        .from('bill_items')
        .select('*')
        .eq('bill_id', billId)

      if (itemsError) {
        setError(itemsError.message)
        setLoading(false)
        return
      }

      setBill(billRow)
      setItems(itemRows)
      setLoading(false)
    }
    load()
  }, [billId])

  useEffect(() => {
    if (!loading && bill && !hasPrinted.current) {
      hasPrinted.current = true
      setTimeout(() => window.print(), 300)
    }
  }, [loading, bill])

  function cycleLanguage() {
    const next = LANGUAGES[(LANGUAGES.indexOf(i18n.language) + 1) % LANGUAGES.length]
    i18n.changeLanguage(next)
  }

  if (loading) return <p style={{ padding: 24 }}>Loading receipt…</p>
  if (error) return <div className="admin-error" style={{ margin: 24 }}>{error}</div>
  if (!bill) return null

  return (
    <div className="receipt-page">
      <div className="receipt-toolbar no-print">
        <button className="admin-btn admin-btn-ghost" onClick={cycleLanguage}>
          <Languages size={16} />
          {t('languageName')}
        </button>
        <button className="admin-btn" onClick={() => window.print()}>
          <Printer size={16} />
          {t('print')}
        </button>
      </div>

      <div className="receipt">
        <div className="receipt-header">
          <div className="receipt-store-name">{STORE_NAME}</div>
          <div className="receipt-store-phone">
            {t('phone')}: {STORE_PHONES.join(', ')}
          </div>
        </div>

        <div className="receipt-divider" />

        <div className="receipt-meta">
          <div>
            <span>{t('date')}</span>
            <span>{new Date(bill.created_at).toLocaleString()}</span>
          </div>
          {bill.customer_name && (
            <div>
              <span>{t('customer')}</span>
              <span>{bill.customer_name}</span>
            </div>
          )}
          <div>
            <span></span>
            <span className="receipt-rate-type">
              {bill.rate_type === 'wholesale' ? t('wholesale') : t('retail')}
            </span>
          </div>
        </div>

        <div className="receipt-divider" />

        <table className="receipt-table">
          <thead>
            <tr>
              <th className="col-item">{t('item')}</th>
              <th className="col-qty">{t('qty')}</th>
              <th className="col-rate">{t('rate')}</th>
              <th className="col-amount">{t('amount')}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td className="col-item">{itemName(item, i18n.language)}</td>
                <td className="col-qty">{item.quantity}</td>
                <td className="col-rate">{Number(item.unit_price).toFixed(2)}</td>
                <td className="col-amount">{Number(item.line_total).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="receipt-divider" />

        <div className="receipt-grand-total">
          <span>{t('grandTotal')}</span>
          <span>₹{Number(bill.total).toFixed(2)}</span>
        </div>

        <div className="receipt-divider" />

        <div className="receipt-footer">{t('thankYou')}</div>
      </div>
    </div>
  )
}

export default ReceiptView
