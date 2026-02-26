import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useI18n } from '../context/I18nContext'
import { useToast } from '../context/ToastContext'
import { api, type Order, KIT_INFO, type KitType } from '../services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const STATUS_COLORS: Record<string, string> = {
  ORDERED: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  ON_THE_WAY: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  RETURNING: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  DELIVERED: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  RECEIVED: 'bg-green-500/10 text-green-500 border-green-500/20',
  WAITING_FOR_PAYMENT: 'bg-red-500/10 text-red-500 border-red-500/20',
}

export default function TrackPage() {
  const { t } = useI18n()
  const { toast } = useToast()
  const [orderId, setOrderId] = useState('')
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [searchParams] = useSearchParams()

  const fetchOrder = async (idToFetch: string) => {
    setLoading(true)
    setSearched(true)
    try {
      const id = parseInt(idToFetch.trim(), 10)
      if (isNaN(id)) throw new Error('Invalid ID')
      const data = await api.orders.getById(id)
      setOrder(data)
    } catch {
      setOrder(null)
      toast(t('track.notfound'), 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const id = searchParams.get('id')
    if (id) {
      setOrderId(id)
      fetchOrder(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetchOrder(orderId)
  }

  const progress = order?.deliveryProgress ?? 0
  const payment = order?.paymentStatus ?? '—'
  const kitLabel = order ? (KIT_INFO[order.kitType as KitType]?.label ?? order.kitType) : ''

  return (
    <main className='max-w-lg mx-auto p-4 sm:p-6 mt-8'>
      <Card className='backdrop-blur-sm bg-card/80 mb-6'>
        <CardHeader>
          <CardTitle className='text-2xl'>{t('track.title')}</CardTitle>
          <CardDescription>{t('track.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='flex gap-2'>
            <div className='flex-1 space-y-2'>
              <Label htmlFor='orderId' className='sr-only'>
                {t('track.id')}
              </Label>
              <Input
                id='orderId'
                placeholder={t('track.id')}
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                required
                className='font-mono text-sm'
              />
            </div>
            <Button
              type='submit'
              disabled={loading}
              className='bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white'
            >
              {loading ? t('track.submit.loading') : t('track.submit')}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Result */}
      {order && (
        <Card className='overflow-hidden animate-[fadeIn_0.3s_ease-out]'>
          <CardHeader className='pb-3'>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-lg font-mono'>#{order.id}</CardTitle>
              <Badge className={`${STATUS_COLORS[order.orderStatus] || ''} border`}>
                {t(`dash.status.${order.orderStatus.toLowerCase()}` as any) || order.orderStatus.replace(/_/g, ' ')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className='space-y-4'>
            {/* Progress bar */}
            <div>
              <div className='flex justify-between text-xs text-muted-foreground mb-1'>
                <span>{t('track.progress')}</span>
                <span>{progress}%</span>
              </div>
              <div className='h-2 rounded-full bg-muted overflow-hidden'>
                <div
                  className='h-full rounded-full bg-linear-to-r from-emerald-500 to-teal-500 transition-all duration-500'
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Details */}
            <div className='grid grid-cols-2 gap-3 text-sm'>
              <div>
                <span className='text-muted-foreground'>{t('track.kit')}</span>
                <p className='font-medium'>{kitLabel}</p>
              </div>
              <div>
                <span className='text-muted-foreground'>{t('track.payment')}</span>
                <p className='font-medium'>{payment.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <span className='text-muted-foreground'>{t('track.placed')}</span>
                <p className='font-medium'>{order.timestamp ? order.timestamp.slice(0, 10) : '—'}</p>
              </div>
              <div>
                <span className='text-muted-foreground'>{t('dash.orders.subtotal')}</span>
                <p className='font-medium'>${order.subtotal}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {searched && !loading && !order && <p className='text-center text-muted-foreground mt-8'>{t('track.notfound')}</p>}
    </main>
  )
}
