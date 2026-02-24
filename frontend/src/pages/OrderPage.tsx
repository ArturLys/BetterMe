import { useState } from 'react'
import { useI18n } from '../context/I18nContext'
import { useToast } from '../context/ToastContext'
import { api } from '../services/api'
import LocationPicker from '@/components/LocationPicker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import silverImg from '@/assets/silver.jpg'
import goldImg from '@/assets/gold.jpg'
import platinumImg from '@/assets/platinum.jpg'

const KITS = [
  { id: 'KIT_SILVER', img: silverImg },
  { id: 'KIT_GOLD', img: goldImg },
  { id: 'KIT_PLATINUM', img: platinumImg },
] as const

export default function OrderPage() {
  const { t } = useI18n()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    email: '',
    latitude: '',
    longitude: '',
    kitType: 'KIT_SILVER' as string,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.latitude || !form.longitude) {
      toast('Please pick a delivery location', 'error')
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

            {/* Location picker (reusable) */}
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
