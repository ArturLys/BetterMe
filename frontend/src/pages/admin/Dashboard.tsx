import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useI18n } from '../../context/I18nContext'
import { useTheme } from '../../context/ThemeContext'
import { useToast } from '../../context/ToastContext'
import { api, type Order } from '../../services/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

const STATUS_COLORS: Record<string, string> = {
  ORDERED: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  ON_THE_WAY: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  RETURNING: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  DELIVERED: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  RECEIVED: 'bg-green-500/10 text-green-500 border-green-500/20',
  WAITING_FOR_PAYMENT: 'bg-red-500/10 text-red-500 border-red-500/20',
}

const PAYMENT_COLORS: Record<string, string> = {
  PAID: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  NOT_PAID: 'bg-red-500/10 text-red-500 border-red-500/20',
}

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const { t, lang, setLang } = useI18n()
  const { theme, toggleTheme } = useTheme()
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadOrders = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.orders.list()
      setOrders(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  const handleDelete = async (id: string) => {
    if (!confirm(t('dash.orders.delete.confirm'))) return
    try {
      await api.orders.delete(id)
      setOrders((prev) => prev.filter((o) => o.id !== id))
      toast(t('dash.orders.deleted'), 'success')
    } catch (err: any) {
      toast(err.message, 'error')
    }
  }

  const handleSetPaid = async (id: string) => {
    try {
      await api.orders.setPaid(id)
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, paymentStatus: 'PAID' as const } : o)))
      toast(t('dash.orders.paid'), 'success')
    } catch (err: any) {
      toast(err.message, 'error')
    }
  }

  return (
    <div className='min-h-screen bg-background'>
      {/* Top nav */}
      <header className='sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg'>
        <div className='max-w-7xl mx-auto flex items-center justify-between h-16 px-6'>
          <div className='flex items-center gap-3'>
            <div className='w-8 h-8 rounded-lg bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center'>
              <span className='text-sm font-bold text-white'>B</span>
            </div>
            <span className='font-semibold text-lg'>BetterMe</span>
            <Badge variant='secondary' className='text-xs'>
              {t('dash.admin')}
            </Badge>
          </div>

          <div className='flex items-center gap-3'>
            <button
              onClick={toggleTheme}
              className='p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-sm'
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button
              onClick={() => setLang(lang === 'uk' ? 'en' : 'uk')}
              className='text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded border border-border/50'
            >
              {lang === 'uk' ? '🇬🇧' : '🇺🇦'}
            </button>
            <span className='text-sm text-muted-foreground hidden sm:inline'>{user?.email}</span>
            <Button variant='ghost' size='sm' onClick={signOut}>
              {t('dash.signout')}
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className='max-w-7xl mx-auto p-6'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold tracking-tight'>{t('dash.title')}</h1>
          <p className='text-muted-foreground mt-1'>{t('dash.subtitle')}</p>
        </div>

        {/* Stats */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-8'>
          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-medium text-muted-foreground'>{t('dash.stats.orders')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-3xl font-bold'>{orders.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-medium text-muted-foreground'>{t('dash.stats.tax')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-3xl font-bold'>—</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-medium text-muted-foreground'>{t('dash.stats.pending')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-3xl font-bold'>{orders.filter((o) => o.paymentStatus === 'NOT_PAID').length}</p>
            </CardContent>
          </Card>
        </div>

        <Separator className='mb-8' />

        {/* Orders table */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between'>
            <CardTitle>{t('dash.orders.title')}</CardTitle>
            <Button variant='outline' size='sm' onClick={loadOrders} disabled={loading}>
              ↻
            </Button>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className='flex items-center justify-center h-32'>
                <div className='h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent' />
              </div>
            )}

            {error && (
              <div className='rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive'>
                {t('dash.orders.error')}: {error}
              </div>
            )}

            {!loading && !error && orders.length === 0 && <p className='text-center text-muted-foreground py-8'>{t('dash.orders.empty')}</p>}

            {!loading && !error && orders.length > 0 && (
              <div className='overflow-x-auto'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='border-b'>
                      <th className='text-left px-3 py-3 font-medium text-muted-foreground'>{t('dash.orders.id')}</th>
                      <th className='text-left px-3 py-3 font-medium text-muted-foreground'>{t('dash.orders.email')}</th>
                      <th className='text-left px-3 py-3 font-medium text-muted-foreground'>{t('dash.orders.kit')}</th>
                      <th className='text-left px-3 py-3 font-medium text-muted-foreground'>{t('dash.orders.status')}</th>
                      <th className='text-left px-3 py-3 font-medium text-muted-foreground'>{t('dash.orders.payment')}</th>
                      <th className='text-left px-3 py-3 font-medium text-muted-foreground'>{t('dash.orders.progress')}</th>
                      <th className='text-left px-3 py-3 font-medium text-muted-foreground'>{t('dash.orders.coords')}</th>
                      <th className='text-left px-3 py-3 font-medium text-muted-foreground'>{t('dash.orders.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className='border-b last:border-0 hover:bg-muted/50 transition-colors'>
                        <td className='px-3 py-3 font-mono text-xs'>{order.id.slice(0, 8)}...</td>
                        <td className='px-3 py-3 text-xs'>{order.receiverEmail}</td>
                        <td className='px-3 py-3'>
                          <span className='text-xs'>{order.kitType.replace(/_/g, ' ')}</span>
                        </td>
                        <td className='px-3 py-3'>
                          <Badge variant='outline' className={`text-xs ${STATUS_COLORS[order.orderStatus] || ''}`}>
                            {order.orderStatus.replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td className='px-3 py-3'>
                          <Badge variant='outline' className={`text-xs ${PAYMENT_COLORS[order.paymentStatus] || ''}`}>
                            {order.paymentStatus.replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td className='px-3 py-3'>
                          <div className='flex items-center gap-2'>
                            <div className='w-16 h-1.5 rounded-full bg-muted overflow-hidden'>
                              <div className='h-full rounded-full bg-emerald-500 transition-all' style={{ width: `${order.deliveryProgress}%` }} />
                            </div>
                            <span className='text-xs text-muted-foreground'>{order.deliveryProgress}%</span>
                          </div>
                        </td>
                        <td className='px-3 py-3 font-mono text-xs'>
                          {order.latitude?.toFixed(4)}, {order.longitude?.toFixed(4)}
                        </td>
                        <td className='px-3 py-3'>
                          <div className='flex items-center gap-1'>
                            {order.paymentStatus === 'NOT_PAID' && (
                              <Button
                                variant='ghost'
                                size='sm'
                                className='text-xs h-7 px-2 text-emerald-500 hover:text-emerald-400'
                                onClick={() => handleSetPaid(order.id)}
                              >
                                💰
                              </Button>
                            )}
                            <Button
                              variant='ghost'
                              size='sm'
                              className='text-xs h-7 px-2 text-destructive hover:text-destructive'
                              onClick={() => handleDelete(order.id)}
                            >
                              🗑
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
