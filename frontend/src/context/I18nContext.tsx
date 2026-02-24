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
    'dash.orders.title': 'Замовлення',
    'dash.orders.empty': 'Замовлень не знайдено',
    'dash.orders.loading': 'Завантажуємо замовлення...',
    'dash.orders.error': 'Помилка завантаження',
    'dash.orders.id': 'ID',
    'dash.orders.email': 'Email',
    'dash.orders.kit': 'Набір',
    'dash.orders.status': 'Статус',
    'dash.orders.payment': 'Оплата',
    'dash.orders.coords': 'Координати',
    'dash.orders.date': 'Дата',
    'dash.orders.progress': 'Прогрес',
    'dash.orders.actions': 'Дії',
    'dash.orders.delete.confirm': 'Ви впевнені що хочете видалити це замовлення?',
    'dash.orders.deleted': 'Замовлення видалено',
    'dash.orders.paid': 'Позначено як оплачено',

    // Public
    'pub.hero.title': 'Wellness доставка дроном',
    'pub.hero.subtitle': 'Миттєві набори для відновлення у будь-яку точку штату Нью-Йорк за 20-30 хвилин',
    'pub.nav.order': 'Замовити',
    'pub.nav.track': 'Відстежити',
    'pub.nav.admin': 'Адмін',

    // Order page
    'order.title': 'Замовити набір',
    'order.subtitle': 'Оберіть набір та вкажіть координати доставки',
    'order.email': 'Ваш email',
    'order.kit': 'Тип набору',
    'order.lat': 'Широта',
    'order.lon': 'Довгота',
    'order.submit': 'Замовити',
    'order.submit.loading': 'Оформлюємо...',
    'order.success': 'Замовлення створено!',

    'order.kit.KIT_SILVER': 'Silver',
    'order.kit.KIT_GOLD': 'Gold',
    'order.kit.KIT_PLATINUM': 'Platinum',

    // Track page
    'track.title': 'Відстежити замовлення',
    'track.subtitle': 'Введіть ID замовлення щоб побачити статус',
    'track.id': 'ID замовлення',
    'track.submit': 'Знайти',
    'track.submit.loading': 'Шукаємо...',
    'track.notfound': 'Замовлення не знайдено',
    'track.status': 'Статус',
    'track.progress': 'Прогрес доставки',
    'track.kit': 'Набір',
    'track.payment': 'Оплата',
    'track.placed': 'Дата замовлення',
    'track.delivered': 'Дата доставки',

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
    'dash.orders.title': 'Orders',
    'dash.orders.empty': 'No orders found',
    'dash.orders.loading': 'Loading orders...',
    'dash.orders.error': 'Failed to load orders',
    'dash.orders.id': 'ID',
    'dash.orders.email': 'Email',
    'dash.orders.kit': 'Kit',
    'dash.orders.status': 'Status',
    'dash.orders.payment': 'Payment',
    'dash.orders.coords': 'Coordinates',
    'dash.orders.date': 'Date',
    'dash.orders.progress': 'Progress',
    'dash.orders.actions': 'Actions',
    'dash.orders.delete.confirm': 'Are you sure you want to delete this order?',
    'dash.orders.deleted': 'Order deleted',
    'dash.orders.paid': 'Marked as paid',

    'pub.hero.title': 'Drone Wellness Delivery',
    'pub.hero.subtitle': 'Instant wellness kits delivered anywhere in New York State in 20-30 minutes',
    'pub.nav.order': 'Order',
    'pub.nav.track': 'Track',
    'pub.nav.admin': 'Admin',

    'order.title': 'Order a Kit',
    'order.subtitle': 'Choose your kit and provide delivery coordinates',
    'order.email': 'Your email',
    'order.kit': 'Kit type',
    'order.lat': 'Latitude',
    'order.lon': 'Longitude',
    'order.submit': 'Place Order',
    'order.submit.loading': 'Placing order...',
    'order.success': 'Order placed successfully!',

    'order.kit.KIT_SILVER': 'Silver',
    'order.kit.KIT_GOLD': 'Gold',
    'order.kit.KIT_PLATINUM': 'Platinum',

    'track.title': 'Track Your Order',
    'track.subtitle': 'Enter your order ID to see the status',
    'track.id': 'Order ID',
    'track.submit': 'Find',
    'track.submit.loading': 'Searching...',
    'track.notfound': 'Order not found',
    'track.status': 'Status',
    'track.progress': 'Delivery progress',
    'track.kit': 'Kit',
    'track.payment': 'Payment',
    'track.placed': 'Placed on',
    'track.delivered': 'Delivered on',

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
