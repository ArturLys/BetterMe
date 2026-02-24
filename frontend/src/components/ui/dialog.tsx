import * as React from 'react'
import { cn } from '@/lib/utils'

// Simple Dialog built on native <dialog> — no extra deps needed
interface DialogContextValue {
  open: boolean
  setOpen: (o: boolean) => void
}
const DialogContext = React.createContext<DialogContextValue>({ open: false, setOpen: () => {} })

export function Dialog({ open, onOpenChange, children }: { open?: boolean; onOpenChange?: (o: boolean) => void; children: React.ReactNode }) {
  const [internal, setInternal] = React.useState(false)
  const isOpen = open ?? internal
  const setOpen = onOpenChange ?? setInternal
  return <DialogContext.Provider value={{ open: isOpen, setOpen }}>{children}</DialogContext.Provider>
}

export function DialogTrigger({ children, asChild, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) {
  const { setOpen } = React.useContext(DialogContext)
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: (e: React.MouseEvent) => {
        ;(children as any).props?.onClick?.(e)
        setOpen(true)
      },
    })
  }
  return (
    <button type='button' onClick={() => setOpen(true)} {...props}>
      {children}
    </button>
  )
}

export function DialogContent({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { open, setOpen } = React.useContext(DialogContext)
  if (!open) return null
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center'>
      <div className='fixed inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.15s]' onClick={() => setOpen(false)} />
      <div
        className={cn(
          'relative z-50 w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-xl border bg-card p-6 shadow-2xl animate-[fadeIn_0.2s_ease-out]',
          className
        )}
        {...props}
      >
        <button
          onClick={() => setOpen(false)}
          className='absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors'
        >
          <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round'>
            <path d='M18 6L6 18M6 6l12 12' />
          </svg>
        </button>
        {children}
      </div>
    </div>
  )
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-4', className)} {...props} />
}

export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('text-lg font-semibold', className)} {...props} />
}

export function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-muted-foreground mt-1', className)} {...props} />
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mt-6 flex justify-end gap-2', className)} {...props} />
}
