import { useState, useRef, useEffect, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import { useI18n } from '../context/I18nContext'
import { useToast } from '../context/ToastContext'
import { api } from '../services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

import silverImg from '@/assets/silver.jpg'
import goldImg from '@/assets/gold.jpg'
import platinumImg from '@/assets/platinum.jpg'

// Fix default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const KITS = [
  { id: 'KIT_SILVER', img: silverImg },
  { id: 'KIT_GOLD', img: goldImg },
  { id: 'KIT_PLATINUM', img: platinumImg },
] as const

const NYC_CENTER: [number, number] = [40.7128, -74.006]

// ── Nominatim helpers ──
async function reverseGeocode(lat: number, lon: number): Promise<string> {
  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`, {
    headers: { 'Accept-Language': 'en' },
  })
  const data = await res.json()
  if (!data.address) return `${lat.toFixed(4)}, ${lon.toFixed(4)}`
  const { road, house_number, city, town, village, state } = data.address
  const parts = [house_number, road, city || town || village, state].filter(Boolean)
  return parts.join(', ')
}

async function searchAddress(query: string): Promise<Array<{ display_name: string; lat: string; lon: string }>> {
  if (query.length < 3) return []
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5&viewbox=-80,45,-71,40&bounded=1`,
    { headers: { 'Accept-Language': 'en' } }
  )
  return res.json()
}

// ── Map sub-components ──
function MapClickHandler({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onSelect(e.latlng.lat, e.latlng.lng) })
  return null
}

function FlyTo({ position }: { position: [number, number] | null }) {
  const map = useMap()
  useEffect(() => {
    if (position) map.flyTo(position, 15, { duration: 1 })
  }, [position, map])
  return null
}

// ── Main ──
export default function OrderPage() {
  const { t } = useI18n()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [addressQuery, setAddressQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Array<{ display_name: string; lat: string; lon: string }>>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const [form, setForm] = useState({
    email: '',
    latitude: '',
    longitude: '',
    kitType: 'KIT_SILVER' as string,
  })
  const [locationDisplay, setLocationDisplay] = useState('')
  const [locationConfirmed, setLocationConfirmed] = useState(false)

  const markerPos: [number, number] | null = form.latitude && form.longitude ? [parseFloat(form.latitude), parseFloat(form.longitude)] : null

  // Close suggestions on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) setShowSuggestions(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Debounced address search
  const handleAddressInput = useCallback((value: string) => {
    setAddressQuery(value)
    setLocationConfirmed(false)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const results = await searchAddress(value)
      setSuggestions(results)
      setShowSuggestions(results.length > 0)
    }, 350)
  }, [])

  const handleSuggestionPick = (s: { display_name: string; lat: string; lon: string }) => {
    setForm({ ...form, latitude: s.lat, longitude: s.lon })
    setLocationDisplay(s.display_name)
    setAddressQuery(s.display_name)
    setShowSuggestions(false)
    setLocationConfirmed(false)
  }

  const handleMapClick = async (lat: number, lng: number) => {
    setForm({ ...form, latitude: lat.toFixed(6), longitude: lng.toFixed(6) })
    setLocationConfirmed(false)
    setLocationDisplay('...')
    const name = await reverseGeocode(lat, lng)
    setLocationDisplay(name)
    setAddressQuery(name)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!locationConfirmed) {
      toast('Please confirm your delivery location first', 'error')
      return
    }
    setLoading(true)
    try {
      await api.orders.create({
        email: form.email,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        kitType: form.kitType,
      })
      toast(t('order.success'), 'success')
      setForm({ email: '', latitude: '', longitude: '', kitType: 'KIT_SILVER' })
      setLocationDisplay('')
      setAddressQuery('')
      setLocationConfirmed(false)
    } catch (err: any) {
      toast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className='max-w-2xl mx-auto p-6 mt-8'>
      <Card className='backdrop-blur-sm bg-card/80'>
        <CardHeader>
          <CardTitle className='text-2xl'>{t('order.title')}</CardTitle>
          <CardDescription>{t('order.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-5'>
            <div className='space-y-2'>
              <Label htmlFor='email'>{t('order.email')}</Label>
              <Input
                id='email'
                type='email'
                placeholder='you@example.com'
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            {/* Kit selector */}
            <div className='space-y-2'>
              <Label>{t('order.kit')}</Label>
              <div className='grid grid-cols-3 gap-3'>
                {KITS.map(({ id, img }) => (
                  <button
                    key={id}
                    type='button'
                    onClick={() => setForm({ ...form, kitType: id })}
                    className={`relative rounded-xl overflow-hidden border-2 transition-all duration-200 group ${
                      form.kitType === id
                        ? 'border-emerald-500 shadow-lg shadow-emerald-500/20 scale-[1.02]'
                        : 'border-transparent hover:border-border opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={id} className='w-full h-28 object-cover' />
                    <div className='absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent' />
                    <span className='absolute bottom-2 left-0 right-0 text-center text-white text-sm font-semibold drop-shadow-lg'>
                      {t(`order.kit.${id}`)}
                    </span>
                    {form.kitType === id && (
                      <div className='absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow'>
                        <svg className='w-3 h-3 text-white' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={3}>
                          <path strokeLinecap='round' strokeLinejoin='round' d='M5 13l4 4L19 7' />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Address search */}
            <div className='space-y-2'>
              <Label>📍 Delivery location</Label>
              <div className='relative' ref={suggestionsRef}>
                <Input
                  placeholder='Search address or click on the map...'
                  value={addressQuery}
                  onChange={(e) => handleAddressInput(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                />
                {showSuggestions && (
                  <div className='absolute top-full left-0 right-0 mt-1 z-50 rounded-lg border bg-popover shadow-lg max-h-48 overflow-y-auto animate-[fadeIn_0.15s_ease-out]'>
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        type='button'
                        onClick={() => handleSuggestionPick(s)}
                        className='w-full text-left px-3 py-2.5 text-sm hover:bg-muted transition-colors border-b border-border/50 last:border-0'
                      >
                        <span className='text-muted-foreground mr-1.5'>📍</span>
                        {s.display_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Map */}
            <div className='rounded-lg overflow-hidden border h-64'>
              <MapContainer center={NYC_CENTER} zoom={11} style={{ height: '100%', width: '100%' }} className='z-0'>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                />
                <MapClickHandler onSelect={handleMapClick} />
                <FlyTo position={markerPos} />
                {markerPos && <Marker position={markerPos} />}
              </MapContainer>
            </div>

            {/* Confirm location */}
            {locationDisplay && (
              <div
                className={`rounded-lg border p-4 transition-all ${
                  locationConfirmed ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-border bg-muted/30'
                }`}
              >
                <div className='flex items-start justify-between gap-3'>
                  <div className='flex-1 min-w-0'>
                    <p className='text-xs text-muted-foreground mb-0.5'>Delivery to:</p>
                    <p className='text-sm font-medium truncate'>{locationDisplay}</p>
                  </div>
                  {!locationConfirmed ? (
                    <Button
                      type='button'
                      size='sm'
                      onClick={() => setLocationConfirmed(true)}
                      className='shrink-0 bg-linear-to-r from-emerald-600 to-teal-600 text-white text-xs'
                    >
                      ✓ Confirm
                    </Button>
                  ) : (
                    <div className='shrink-0 flex items-center gap-1.5 text-emerald-500 text-sm font-medium'>
                      <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2.5}>
                        <path strokeLinecap='round' strokeLinejoin='round' d='M5 13l4 4L19 7' />
                      </svg>
                      Confirmed
                    </div>
                  )}
                </div>
              </div>
            )}

            <Button
              type='submit'
              disabled={loading || !locationConfirmed}
              className='w-full bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20 disabled:opacity-50'
            >
              {loading ? t('order.submit.loading') : t('order.submit')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
