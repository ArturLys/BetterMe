import { useAuth } from '../context/AuthContext'
import { useI18n } from '../context/I18nContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const { t, lang, setLang } = useI18n()

  return (
    <div className='min-h-screen bg-background'>
      {/* Top nav */}
      <header className='sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg'>
        <div className='max-w-7xl mx-auto flex items-center justify-between h-16 px-6'>
          <div className='flex items-center gap-3'>
            <div className='w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center'>
              <span className='text-sm font-bold text-white'>B</span>
            </div>
            <span className='font-semibold text-lg'>BetterMe</span>
            <Badge variant='secondary' className='text-xs'>
              {t('dash.admin')}
            </Badge>
          </div>

          <div className='flex items-center gap-4'>
            <button
              onClick={() => setLang(lang === 'uk' ? 'en' : 'uk')}
              className='text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded border border-border/50'
            >
              {lang === 'uk' ? '🇬🇧 EN' : '🇺🇦 UK'}
            </button>
            <span className='text-sm text-muted-foreground'>{user?.email}</span>
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
              <p className='text-3xl font-bold'>—</p>
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
              <p className='text-3xl font-bold'>—</p>
            </CardContent>
          </Card>
        </div>

        <Separator className='mb-8' />

        {/* Action cards */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-8'>
          <Card className='hover:border-emerald-500/30 transition-colors cursor-pointer'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>{t('dash.import.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-sm text-muted-foreground'>{t('dash.import.desc')}</p>
            </CardContent>
          </Card>

          <Card className='hover:border-emerald-500/30 transition-colors cursor-pointer'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>{t('dash.manual.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-sm text-muted-foreground'>{t('dash.manual.desc')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Orders table placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dash.orders.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center justify-center h-48 text-muted-foreground'>
              <p>{t('dash.orders.empty')}</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
