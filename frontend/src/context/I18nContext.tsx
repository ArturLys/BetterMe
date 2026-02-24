import { createContext, useContext, useState, type ReactNode } from 'react'

const translations = {
  uk: {
    // Login
    'login.title': 'З поверненням',
    'login.subtitle': 'Увійдіть до панелі адміністратора',
    'login.signup.title': 'Створити акаунт',
    'login.signup.subtitle': 'Зареєструйтесь для керування доставками',
    'login.email': 'Електронна пошта',
    'login.password': 'Пароль',
    'login.submit': 'Увійти',
    'login.submit.loading': 'Входимо...',
    'login.signup.submit': 'Створити акаунт',
    'login.signup.submit.loading': 'Створюємо...',
    'login.toggle.signup': 'Немає акаунта?',
    'login.toggle.signin': 'Вже є акаунт?',
    'login.toggle.signup.link': 'Зареєструватися',
    'login.toggle.signin.link': 'Увійти',
    'login.brand': 'BetterMe',
    'login.brand.subtitle': 'Адмін-панель доставки',
    'login.footer': 'Адмін-панель • BetterMe © 2026',

    // Dashboard
    'dash.title': 'Панель керування',
    'dash.subtitle': 'Керування замовленнями та розрахунок податків',
    'dash.signout': 'Вийти',
    'dash.admin': 'Адмін',
    'dash.stats.orders': 'Всього замовлень',
    'dash.stats.tax': 'Зібрано податків',
    'dash.stats.pending': 'На перевірці',
    'dash.import.title': '📄 Імпорт CSV',
    'dash.import.desc': 'Завантажте CSV файл із замовленнями для масового розрахунку податків',
    'dash.manual.title': '➕ Нове замовлення',
    'dash.manual.desc': 'Створіть замовлення вручну з координатами та сумою',
    'dash.orders.title': 'Останні замовлення',
    'dash.orders.empty': 'Таблиця замовлень — скоро буде',

    // Common
    loading: 'Завантаження...',
  },
  en: {
    'login.title': 'Welcome Back',
    'login.subtitle': 'Sign in to your admin dashboard',
    'login.signup.title': 'Create Account',
    'login.signup.subtitle': 'Sign up to manage wellness deliveries',
    'login.email': 'Email',
    'login.password': 'Password',
    'login.submit': 'Sign In',
    'login.submit.loading': 'Signing in...',
    'login.signup.submit': 'Create Account',
    'login.signup.submit.loading': 'Creating account...',
    'login.toggle.signup': "Don't have an account?",
    'login.toggle.signin': 'Already have an account?',
    'login.toggle.signup.link': 'Sign up',
    'login.toggle.signin.link': 'Sign in',
    'login.brand': 'BetterMe',
    'login.brand.subtitle': 'Instant Wellness Delivery Admin',
    'login.footer': 'Admin Panel • BetterMe © 2026',

    'dash.title': 'Dashboard',
    'dash.subtitle': 'Manage orders and tax calculations',
    'dash.signout': 'Sign Out',
    'dash.admin': 'Admin',
    'dash.stats.orders': 'Total Orders',
    'dash.stats.tax': 'Tax Collected',
    'dash.stats.pending': 'Pending Review',
    'dash.import.title': '📄 Import CSV',
    'dash.import.desc': 'Upload a CSV file with orders to calculate taxes in bulk',
    'dash.manual.title': '➕ Manual Order',
    'dash.manual.desc': 'Create an order manually with coordinates and subtotal',
    'dash.orders.title': 'Recent Orders',
    'dash.orders.empty': 'Orders table coming soon',

    loading: 'Loading...',
  },
} as const

type Lang = keyof typeof translations
type Key = keyof typeof translations.uk

interface I18nState {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: Key) => string
}

const I18nContext = createContext<I18nState | undefined>(undefined)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('uk')

  const t = (key: Key) => translations[lang][key] ?? key

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
