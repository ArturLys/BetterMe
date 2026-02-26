import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useI18n } from '../../context/I18nContext'
import { useTheme } from '../../context/ThemeContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminLogin() {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const isSignUp = false
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { signIn, signUp } = useAuth()
  const { t, lang, setLang } = useI18n()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = isSignUp ? await signUp(login, password) : await signIn(login, password)

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      navigate('/admin')
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center relative overflow-hidden bg-background'>
      {/* Top controls */}
      <div className='absolute top-4 right-4 flex items-center gap-2'>
        <button
          onClick={toggleTheme}
          className='text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-md border border-border/50 bg-card/50 backdrop-blur-sm'
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <button
          onClick={() => setLang(lang === 'uk' ? 'en' : 'uk')}
          className='text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md border border-border/50 bg-card/50 backdrop-blur-sm'
        >
          {lang === 'uk' ? '🇬🇧 EN' : '🇺🇦 UK'}
        </button>
      </div>

      {/* Animated background */}
      <div className='absolute inset-0 -z-10'>
        <div className='absolute top-[-50%] left-[-50%] w-[200%] h-[200%] animate-[spin_60s_linear_infinite]'>
          <div className='absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl' />
          <div className='absolute top-3/4 left-1/2 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl' />
          <div className='absolute top-1/2 left-3/4 w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl' />
        </div>
      </div>

      <div className='w-full max-w-md px-4'>
        <div className='text-center mb-8'>
          <h1 className='text-3xl font-bold tracking-tight'>{t('login.brand')}</h1>
          <p className='text-muted-foreground mt-1'>{t('login.brand.subtitle')}</p>
        </div>

        <Card className='backdrop-blur-xl bg-card/80 border-border/50 shadow-2xl'>
          <CardHeader className='text-center pb-2'>
            <CardTitle className='text-xl'>{isSignUp ? t('login.signup.title') : t('login.title')}</CardTitle>
            <CardDescription>{isSignUp ? t('login.signup.subtitle') : t('login.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='login'>Login</Label>
                <Input
                  id='login'
                  type='text'
                  placeholder='admin'
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  required
                  className='h-11'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='password'>{t('login.password')}</Label>
                <Input
                  id='password'
                  type='password'
                  placeholder='••••••••'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className='h-11'
                />
              </div>

              {error && <div className='rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive'>{error}</div>}

              <Button
                type='submit'
                className='w-full h-11 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20 transition-all duration-300'
                disabled={loading}
              >
                {loading ? (
                  <span className='flex items-center gap-2'>
                    <span className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
                    {isSignUp ? t('login.signup.submit.loading') : t('login.submit.loading')}
                  </span>
                ) : isSignUp ? (
                  t('login.signup.submit')
                ) : (
                  t('login.submit')
                )}
              </Button>
            </form>

            {/* Registration is hidden for now
            <Separator className='my-6' />

            <p className='text-center text-sm text-muted-foreground'>
              {isSignUp ? t('login.toggle.signin') : t('login.toggle.signup')}{' '}
              <button
                type='button'
                onClick={() => {
                  setIsSignUp(!isSignUp)
                  setError(null)
                }}
                className='text-emerald-500 hover:text-emerald-400 font-medium transition-colors'
              >
                {isSignUp ? t('login.toggle.signin.link') : t('login.toggle.signup.link')}
              </button>
            </p>
            */}
          </CardContent>
        </Card>

        <p className='text-center text-xs text-muted-foreground mt-6'>{t('login.footer')}</p>
      </div>
    </div>
  )
}
