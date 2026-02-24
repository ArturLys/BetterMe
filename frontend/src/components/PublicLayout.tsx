import { useState, useRef, useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useI18n } from '../context/I18nContext'
import { useTheme } from '../context/ThemeContext'

export default function PublicLayout() {
  const { t, lang, setLang } = useI18n()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const [langOpen, setLangOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const langRef = useRef<HTMLDivElement>(null)

  const isActive = (path: string) => location.pathname === path

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close mobile menu on nav
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  return (
    <div className='min-h-screen bg-background text-foreground'>
      <header className='sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg'>
        <div className='max-w-5xl mx-auto flex items-center justify-between h-14 px-4 sm:px-6'>
          <Link to='/' className='flex items-center gap-2 group'>
            <div className='w-7 h-7 rounded-lg bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center transition-transform group-hover:scale-110'>
              <span className='text-xs font-bold text-white'>B</span>
            </div>
            <span className='font-semibold hidden min-[400px]:inline'>BetterMe</span>
          </Link>

          {/* Desktop nav */}
          <nav className='hidden sm:flex items-center gap-1'>
            <Link
              to='/order'
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${isActive('/order') ? 'bg-emerald-500/10 text-emerald-500' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
            >
              {t('pub.nav.order')}
            </Link>
            <Link
              to='/track'
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${isActive('/track') ? 'bg-emerald-500/10 text-emerald-500' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
            >
              {t('pub.nav.track')}
            </Link>
            <div className='w-px h-5 bg-border mx-2' />
            <button
              onClick={toggleTheme}
              className='relative w-12 h-6 rounded-full bg-muted border border-border transition-colors duration-300 hover:border-emerald-500/30'
              aria-label='Toggle theme'
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs transition-all duration-300 shadow-sm ${theme === 'dark' ? 'left-6 bg-indigo-500 shadow-indigo-500/30' : 'left-0.5 bg-amber-400 shadow-amber-400/30'}`}
              >
                {theme === 'dark' ? '🌙' : '☀️'}
              </div>
            </button>
            <div className='relative' ref={langRef}>
              <button
                onClick={() => setLangOpen(!langOpen)}
                className='flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors'
              >
                <span>{lang === 'uk' ? '🇺🇦' : '🇬🇧'}</span>
                <span className='text-xs font-medium'>{lang.toUpperCase()}</span>
                <svg
                  className={`w-3 h-3 transition-transform duration-200 ${langOpen ? 'rotate-180' : ''}`}
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                  strokeWidth={2}
                >
                  <path strokeLinecap='round' strokeLinejoin='round' d='M19 9l-7 7-7-7' />
                </svg>
              </button>
              {langOpen && (
                <div className='absolute right-0 mt-1 w-36 rounded-lg border bg-popover shadow-lg py-1 animate-[fadeIn_0.15s_ease-out]'>
                  <button
                    onClick={() => {
                      setLang('uk')
                      setLangOpen(false)
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${lang === 'uk' ? 'text-emerald-500 bg-emerald-500/5' : 'text-popover-foreground hover:bg-muted'}`}
                  >
                    🇺🇦 Українська
                  </button>
                  <button
                    onClick={() => {
                      setLang('en')
                      setLangOpen(false)
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${lang === 'en' ? 'text-emerald-500 bg-emerald-500/5' : 'text-popover-foreground hover:bg-muted'}`}
                  >
                    🇬🇧 English
                  </button>
                </div>
              )}
            </div>
            <Link
              to='/admin'
              className='ml-1 px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors'
            >
              {t('pub.nav.admin')}
            </Link>
          </nav>

          {/* Mobile hamburger */}
          <button className='sm:hidden p-2 text-muted-foreground hover:text-foreground' onClick={() => setMenuOpen(!menuOpen)}>
            <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
              {menuOpen ? (
                <path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' />
              ) : (
                <path strokeLinecap='round' strokeLinejoin='round' d='M4 6h16M4 12h16M4 18h16' />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className='sm:hidden border-t bg-background px-4 py-3 space-y-2 animate-[fadeIn_0.15s_ease-out]'>
            <Link
              to='/order'
              className={`block px-3 py-2 rounded-md text-sm font-medium ${isActive('/order') ? 'bg-emerald-500/10 text-emerald-500' : 'text-muted-foreground'}`}
            >
              {t('pub.nav.order')}
            </Link>
            <Link
              to='/track'
              className={`block px-3 py-2 rounded-md text-sm font-medium ${isActive('/track') ? 'bg-emerald-500/10 text-emerald-500' : 'text-muted-foreground'}`}
            >
              {t('pub.nav.track')}
            </Link>
            <Link to='/admin' className='block px-3 py-2 rounded-md text-sm font-medium text-muted-foreground'>
              {t('pub.nav.admin')}
            </Link>
            <div className='flex items-center gap-3 px-3 pt-2 border-t border-border/50'>
              <button onClick={toggleTheme} className='relative w-12 h-6 rounded-full bg-muted border border-border'>
                <div
                  className={`absolute top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs transition-all duration-300 ${theme === 'dark' ? 'left-6 bg-indigo-500' : 'left-0.5 bg-amber-400'}`}
                >
                  {theme === 'dark' ? '🌙' : '☀️'}
                </div>
              </button>
              <button onClick={() => setLang(lang === 'uk' ? 'en' : 'uk')} className='text-sm text-muted-foreground'>
                {lang === 'uk' ? '🇺🇦 UA' : '🇬🇧 EN'}
              </button>
            </div>
          </div>
        )}
      </header>

      <Outlet />
    </div>
  )
}
