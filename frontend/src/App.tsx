import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './context/AuthContext'
import { I18nProvider } from './context/I18nContext'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'
import { ProtectedRoute } from './components/ProtectedRoute'

// Layouts
import PublicLayout from './components/PublicLayout'

// Public pages
import Home from './pages/Home'
import OrderPage from './pages/OrderPage'
import TrackPage from './pages/TrackPage'

// Admin pages
import AdminLogin from './pages/admin/Login'
import Dashboard from './pages/admin/Dashboard'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <I18nProvider>
            <ToastProvider>
              <AuthProvider>
                <Routes>
                  {/* Public routes with shared header */}
                  <Route element={<PublicLayout />}>
                    <Route path='/' element={<Home />} />
                    <Route path='/order' element={<OrderPage />} />
                    <Route path='/track' element={<TrackPage />} />
                  </Route>

                  {/* Admin routes */}
                  <Route path='/admin/login' element={<AdminLogin />} />
                  <Route
                    path='/admin'
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />

                  <Route path='*' element={<Navigate to='/' replace />} />
                </Routes>
              </AuthProvider>
            </ToastProvider>
          </I18nProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
