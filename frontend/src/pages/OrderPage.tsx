import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../context/I18nContext'
import { useToast } from '../context/ToastContext'
import { api, ALL_KIT_TYPES, KIT_INFO, type KitType } from '../services/api'
import LocationPicker from '@/components/LocationPicker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, Award, Trophy, Crown, Plus, Check } from 'lucide-react'

import silverImg from '@/assets/silver.jpg'
import goldImg from '@/assets/gold.jpg'
import platinumImg from '@/assets/platinum.jpg'

const TIER_IMAGES: Record<string, string | null> = { default: null, silver: silverImg, gold: goldImg, platinum: platinumImg }
const TIER_ICONS: Record<string, typeof Package> = { default: Package, silver: Award, gold: Trophy, platinum: Crown }

export default function OrderPage() {
  const { t } = useI18n()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    email: '',
    latitude: '',
    longitude: '',
    kitType: 'SILVER' as KitType,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.latitude || !form.longitude) {
      toast(t('order.location.required' as any), 'error')
      return
    }
    setLoading(true)
    try {
      const orderId = await api.orders.create({
        email: form.email,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        kitType: form.kitType,
      })
      toast(t('order.success'), 'success')
      setForm({ email: '', latitude: '', longitude: '', kitType: 'SILVER' as KitType })
      navigate(`/track?id=${orderId}`)
    } catch (err: any) {
      toast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className='max-w-2xl mx-auto p-4 sm:p-6 mt-8'>
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

            {/* Kit selector — image cards with plus badge */}
            <div className='space-y-2'>
              <Label>{t('order.kit')}</Label>
              <div className='grid grid-cols-2 sm:grid-cols-4 gap-2'>
                {ALL_KIT_TYPES.map((kit) => {
                  const info = KIT_INFO[kit]
                  const img = TIER_IMAGES[info.tier]
                  const Icon = TIER_ICONS[info.tier] || Package
                  const selected = form.kitType === kit
                  return (
                    <button
                      key={kit}
                      type='button'
                      onClick={() => setForm({ ...form, kitType: kit })}
                      className={`relative flex flex-col rounded-xl overflow-hidden border-2 transition-all duration-200 group ${
                        selected
                          ? 'border-emerald-500 shadow-lg shadow-emerald-500/10 scale-[1.02]'
                          : 'border-border hover:border-emerald-500/30 opacity-70 hover:opacity-100'
                      }`}
                    >
                      {img ? (
                        <img
                          src={img}
                          alt={info.label}
                          className='w-full h-20 object-cover transition-transform duration-500 group-hover:scale-110'
                        />
                      ) : (
                        <div className='w-full h-20 bg-muted flex items-center justify-center'>
                          <Icon size={28} className='text-muted-foreground' />
                        </div>
                      )}
                      <div className='absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent' />
                      <div className='absolute bottom-0 left-0 right-0 p-2 text-center'>
                        <span className='text-white text-xs font-semibold drop-shadow-lg block'>{t(`order.kit.${kit}` as any)}</span>
                        <span className='text-white/70 text-[10px]'>${info.price}</span>
                      </div>
                      {info.plus && (
                        <div className='absolute top-1 right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow'>
                          <Plus size={12} className='text-white' strokeWidth={3} />
                        </div>
                      )}
                      {selected && (
                        <div className='absolute top-1 left-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow'>
                          <Check size={12} className='text-white' strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            <LocationPicker
              latitude={form.latitude}
              longitude={form.longitude}
              onChange={(lat, lon) => setForm({ ...form, latitude: lat, longitude: lon })}
            />

            <Button
              type='submit'
              disabled={loading || !form.latitude}
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
