import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  en: {
    translation: {
      languageName: 'English',
      date: 'Date',
      customer: 'Customer',
      wholesale: 'Wholesale',
      retail: 'Retail',
      item: 'Item',
      qty: 'Qty',
      rate: 'Rate',
      amount: 'Amount',
      grandTotal: 'Grand Total',
      phone: 'Ph',
      thankYou: 'Thank you, visit again!',
      print: 'Print',
    },
  },
  ml: {
    translation: {
      languageName: 'മലയാളം',
      date: 'തീയതി',
      customer: 'ഉപഭോക്താവ്',
      wholesale: 'മൊത്തവില',
      retail: 'ചില്ലറ വില',
      item: 'ഇനം',
      qty: 'അളവ്',
      rate: 'നിരക്ക്',
      amount: 'തുക',
      grandTotal: 'ആകെ തുക',
      phone: 'ഫോണ്‍',
      thankYou: 'നന്ദി, വീണ്ടും വരിക!',
      print: 'പ്രിന്റ്',
    },
  },
  hi: {
    translation: {
      languageName: 'हिन्दी',
      date: 'दिनांक',
      customer: 'ग्राहक',
      wholesale: 'थोक',
      retail: 'खुदरा',
      item: 'वस्तु',
      qty: 'मात्रा',
      rate: 'दर',
      amount: 'राशि',
      grandTotal: 'कुल योग',
      phone: 'फ़ोन',
      thankYou: 'धन्यवाद, फिर पधारें!',
      print: 'प्रिंट',
    },
  },
}

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n
