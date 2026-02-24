import { Link } from 'react-router-dom'
import { useI18n } from '../context/I18nContext'
import { Button } from '@/components/ui/button'

import silverImg from '@/assets/silver.jpg'
import goldImg from '@/assets/gold.jpg'
import platinumImg from '@/assets/platinum.jpg'

const KITS = [
  { id: 'KIT_SILVER', img: silverImg },
  { id: 'KIT_GOLD', img: goldImg },
  { id: 'KIT_PLATINUM', img: platinumImg },
] as const

export default function Home() {
  const { t } = useI18n()

  return (
    <main className='flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] px-4 sm:px-6'>
      {/* Hero */}
      <div className='relative text-center max-w-2xl'>
        {/* Glow */}
        <div className='absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl -z-10' />

        <div className='inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-500 text-sm font-medium mb-6'>
          <span className='relative flex h-2 w-2'>
            <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75' />
            <span className='relative inline-flex rounded-full h-2 w-2 bg-emerald-500' />
          </span>
          New York State
        </div>

        <h1 className='text-5xl md:text-6xl font-bold tracking-tight leading-tight mb-4'>{t('pub.hero.title')}</h1>
        <p className='text-lg text-muted-foreground mb-8 max-w-lg mx-auto'>{t('pub.hero.subtitle')}</p>

        <div className='flex items-center justify-center gap-3'>
          <Button
            asChild
            size='lg'
            className='bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20'
          >
            <Link to='/order'>{t('pub.nav.order')}</Link>
          </Button>
          <Button asChild variant='outline' size='lg'>
            <Link to='/track'>{t('pub.nav.track')}</Link>
          </Button>
        </div>
      </div>

      {/* Kit cards with real images */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-5 mt-20 max-w-3xl w-full'>
        {KITS.map(({ id, img }) => (
          <Link
            key={id}
            to='/order'
            className='group relative rounded-2xl overflow-hidden border bg-card hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 hover:-translate-y-2'
          >
            <div className='overflow-hidden'>
              <img src={img} alt={id} className='w-full h-44 object-cover transition-transform duration-500 group-hover:scale-110' />
            </div>
            <div className='absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent' />
            <div className='absolute bottom-0 left-0 right-0 p-4'>
              <h3 className='font-semibold text-white text-lg drop-shadow-lg'>{t(`order.kit.${id}` as any)}</h3>
              <p className='text-white/70 text-sm'>Wellness Kit</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}
