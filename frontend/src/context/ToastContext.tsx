import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

interface ToastState {
  toast: (message: string, type?: Toast['type']) => void
}

const ToastContext = createContext<ToastState | undefined>(undefined)

let toastId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = ++toastId
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container */}
      <div className='fixed bottom-6 right-6 z-100 flex flex-col gap-2 max-w-sm'>
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-[slideUp_0.3s_ease-out] backdrop-blur-lg border ${
              t.type === 'success'
                ? 'bg-emerald-500/90 text-white border-emerald-400/50'
                : t.type === 'error'
                  ? 'bg-red-500/90 text-white border-red-400/50'
                  : 'bg-card/90 text-foreground border-border/50'
            }`}
          >
            {t.type === 'success' && '✅ '}
            {t.type === 'error' && '❌ '}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
