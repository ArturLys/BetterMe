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
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const droneSVG = `
<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 21V11"/>
  <path d="M22 11c0 2.2-2 4-5 4-2.8 0-5-1.8-5-4s2.2-4 5-4 5 1.8 5 4z"/>
  <path d="M12 11c0 2.2-2 4-5 4-2.8 0-5-1.8-5-4s2.2-4 5-4 5 1.8 5 4z"/>
  <path d="M17 7 7 15"/>
  <path d="M7 7l10 8"/>
</svg>
`

const droneIcon = new L.Icon({
  iconUrl: `data:image/svg+xml;base64,${btoa(droneSVG)}`,
  iconSize: [48, 48],
  iconAnchor: [24, 24],
  popupAnchor: [0, -24],
})

const STATUS_COLORS: Record<string, string> = {
  ORDERED: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  ON_THE_WAY: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  RETURNING: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  DELIVERED: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  RECEIVED: 'bg-green-500/10 text-green-500 border-green-500/20',
  WAITING_FOR_PAYMENT: 'bg-red-500/10 text-red-500 border-red-500/20',
}

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3
  const x1 = (lat1 * Math.PI) / 180
  const x2 = (lat2 * Math.PI) / 180
  const dx = ((lat2 - lat1) * Math.PI) / 180
  const dy = ((lon2 - lon1) * Math.PI) / 180

  const a = Math.sin(dx / 2) * Math.sin(dx / 2) + Math.cos(x1) * Math.cos(x2) * Math.sin(dy / 2) * Math.sin(dy / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export default function TrackPage() {
  const { t } = useI18n()
  const { toast } = useToast()
  const [orderId, setOrderId] = useState('')
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)
  const [paying, setPaying] = useState(false)
  const [searched, setSearched] = useState(false)
  const [searchParams] = useSearchParams()
  const [droneHome, setDroneHome] = useState<{ latitude: number; longitude: number } | null>(null)

  useEffect(() => {
    api.drones
      .home()
      .then(setDroneHome)
      .catch(() => {})
  }, [])

  const fetchOrder = async (idToFetch: string, silent = false) => {
    if (!silent) {
      setLoading(true)
      setSearched(true)
    }
    try {
      const id = parseInt(idToFetch.trim(), 10)
      if (isNaN(id)) throw new Error('Invalid ID')
      const data = await api.orders.getById(id)
      if (!data || !data.id) throw new Error('Order missing')
      setOrder(data)
    } catch {
      setOrder(null)
      if (!silent) toast(t('track.notfound'), 'error')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const handlePay = async () => {
    if (!order) return
    setPaying(true)
    try {
      await api.orders.pay(order.id)
      toast(t('track.paySuccess') || 'Payment successful!', 'success')
      await fetchOrder(String(order.id))
    } catch {
      toast(t('track.payError') || 'Payment failed. Please try again.', 'error')
    } finally {
      setPaying(false)
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

  useEffect(() => {
    if (!orderId || !order) return
    const interval = setInterval(() => {
      fetchOrder(orderId, true)
    }, 30000)
    return () => clearInterval(interval)
  }, [orderId, order])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetchOrder(orderId)
  }

  const progressVal = order?.drone?.progress ?? order?.distance ?? 0
  let progress = progressVal
  if (
    order?.orderStatus === 'ON_THE_WAY' &&
    order.drone?.currentLatitude &&
    order.drone?.currentLongitude &&
    droneHome
  ) {
    const totalDist = getDistance(droneHome.latitude, droneHome.longitude, order.latitude, order.longitude)
    const currentDist = getDistance(
      droneHome.latitude,
      droneHome.longitude,
      order.drone.currentLatitude,
      order.drone.currentLongitude
    )
    progress = totalDist > 0 ? Math.min(100, Math.max(0, Math.round((currentDist / totalDist) * 100))) : 0
  } else if (
    order?.orderStatus === 'RETURNING' &&
    order.drone?.currentLatitude &&
    order.drone?.currentLongitude &&
    droneHome
  ) {
    const totalDist = getDistance(order.latitude, order.longitude, droneHome.latitude, droneHome.longitude)
    const currentDist = getDistance(
      order.latitude,
      order.longitude,
      order.drone.currentLatitude,
      order.drone.currentLongitude
    )
    progress = totalDist > 0 ? Math.min(100, Math.max(0, Math.round((currentDist / totalDist) * 100))) : 0
  } else if (order?.orderStatus === 'DELIVERED' || order?.orderStatus === 'RECEIVED') {
    progress = 100
  } else {
    progress = progressVal
  }

  const payment = order?.paymentStatus ?? '—'
  const kitLabel = order?.kitType ? (KIT_INFO[order.kitType as KitType]?.label ?? order.kitType) : 'Unknown'
  const needsPayment = order?.orderStatus === 'WAITING_FOR_PAYMENT'

  let effDroneLat = order?.drone?.currentLatitude
  let effDroneLng = order?.drone?.currentLongitude

  if (!effDroneLat && !effDroneLng && droneHome && order?.latitude && order?.longitude) {
    if (order.orderStatus === 'ON_THE_WAY') {
      effDroneLat = droneHome.latitude + (order.latitude - droneHome.latitude) * (progress / 100)
      effDroneLng = droneHome.longitude + (order.longitude - droneHome.longitude) * (progress / 100)
    } else if (order.orderStatus === 'RETURNING') {
      effDroneLat = order.latitude + (droneHome.latitude - order.latitude) * (progress / 100)
      effDroneLng = order.longitude + (droneHome.longitude - order.longitude) * (progress / 100)
    } else if (order.orderStatus === 'DELIVERED' || order.orderStatus === 'RECEIVED') {
      effDroneLat = order.latitude
      effDroneLng = order.longitude
    } else {
      effDroneLat = droneHome.latitude
      effDroneLng = droneHome.longitude
    }
  }

  return (
    <main className="max-w-lg mx-auto p-4 sm:p-6 mt-8">
      <Card className="backdrop-blur-sm bg-card/80 mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">{t('track.title')}</CardTitle>
          <CardDescription>{t('track.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="flex-1 space-y-2">
              <Label htmlFor="orderId" className="sr-only">
                {t('track.id')}
              </Label>
              <Input
                id="orderId"
                placeholder={t('track.id')}
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                required
                className="font-mono text-sm"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white"
            >
              {loading ? t('track.submit.loading') : t('track.submit')}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Result */}
      {order && (
        <Card className="overflow-hidden animate-[fadeIn_0.3s_ease-out]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-mono">#{order.id}</CardTitle>
              <Badge className={`${order.orderStatus ? STATUS_COLORS[order.orderStatus] : ''} border`}>
                {order.orderStatus
                  ? t(`dash.status.${order.orderStatus.toLowerCase()}` as any) || order.orderStatus.replace(/_/g, ' ')
                  : 'Unknown'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>{t('track.progress')}</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-linear-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">{t('track.kit')}</span>
                <p className="font-medium">{kitLabel}</p>
              </div>
              <div>
                <span className="text-muted-foreground">{t('track.payment')}</span>
                <p className="font-medium">{payment.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <span className="text-muted-foreground">{t('track.placed')}</span>
                <p className="font-medium">
                  {order.timestamp ? String(order.timestamp).slice(0, 16).replace('T', ' ') : '—'}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">{t('dash.orders.subtotal')}</span>
                <p className="font-medium">${order.subtotal ?? 0}</p>
              </div>
            </div>

            {/* Map */}
            {order.latitude && order.longitude && (
              <div className="rounded-lg overflow-hidden border h-64 mt-4 relative z-0">
                <MapContainer
                  center={[order.latitude, order.longitude]}
                  zoom={12}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution="&copy; OpenStreetMap"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[order.latitude, order.longitude]} />
                  {order.orderStatus !== 'DELIVERED' &&
                    order.orderStatus !== 'RECEIVED' &&
                    effDroneLat &&
                    effDroneLng && <Marker position={[effDroneLat, effDroneLng]} icon={droneIcon} />}
                </MapContainer>
              </div>
            )}

            {/* Pay Order Button */}
            {needsPayment && (
              <div className="pt-2">
                <Button
                  id="pay-order-btn"
                  onClick={handlePay}
                  disabled={paying}
                  className="w-full relative overflow-hidden bg-linear-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold py-5 text-base shadow-lg shadow-violet-500/25 transition-all duration-300 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98]"
                >
                  {paying ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      {t('track.paying') || 'Processing…'}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                        <path
                          fillRule="evenodd"
                          d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {t('track.pay') || 'Pay Order'}
                    </span>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {searched && !loading && !order && (
        <p className="text-center text-muted-foreground mt-8">{t('track.notfound')}</p>
      )}
    </main>
  )
}
