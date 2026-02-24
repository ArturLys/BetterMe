import { useEffect, useState, useCallback, useRef } from 'react'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import { useAuth } from '../../context/AuthContext'
import { useI18n } from '../../context/I18nContext'
import { useTheme } from '../../context/ThemeContext'
import { useToast } from '../../context/ToastContext'
import { api, type Order } from '../../services/api'
import LocationPicker from '@/components/LocationPicker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const STATUS_COLORS: Record<string, string> = {
  ORDERED: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  ON_THE_WAY: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  RETURNING: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  DELIVERED: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  RECEIVED: 'bg-green-500/10 text-green-500 border-green-500/20',
  WAITING_FOR_PAYMENT: 'bg-red-500/10 text-red-500 border-red-500/20',
}
const PAYMENT_COLORS: Record<string, string> = {
  PAID: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  NOT_PAID: 'bg-red-500/10 text-red-500 border-red-500/20',
}

type SortField = 'timestamp' | 'receiverEmail' | 'kitType' | 'orderStatus' | 'paymentStatus' | 'deliveryProgress'
type SortDir = 'asc' | 'desc'

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const { t, lang, setLang } = useI18n()
  const { theme, toggleTheme } = useTheme()
  const { toast } = useToast()

  const [langOpen, setLangOpen] = useState(false)
  const langRef = useRef<HTMLDivElement>(null)

  // Orders
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)

  // Sorting
  const [sortField, setSortField] = useState<SortField>('timestamp')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  // Filters
  const [filterStatus, setFilterStatus] = useState('')
  const [filterEmail, setFilterEmail] = useState('')
  const [filterKit, setFilterKit] = useState('')

  // Dialogs
  const [csvOpen, setCsvOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [mapOpen, setMapOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editOrder, setEditOrder] = useState<Order | null>(null)
  const [mapOrder, setMapOrder] = useState<Order | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null)

  // Create form
  const [createForm, setCreateForm] = useState({ email: '', latitude: '', longitude: '', kitType: 'KIT_SILVER' })
  const [createLoading, setCreateLoading] = useState(false)

  // CSV
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvLoading, setCsvLoading] = useState(false)

  // Close lang dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Load orders
  const loadOrders = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const filters: Record<string, string> = { page: String(page) }
      if (filterStatus) filters.orderStatus = filterStatus
      if (filterEmail) filters.email = filterEmail
      if (filterKit) filters.kitType = filterKit
      const data = await api.orders.list(filters)
      setOrders(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [page, filterStatus, filterEmail, filterKit])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  // Sort
  const sortedOrders = [...orders].sort((a, b) => {
    const av = a[sortField] ?? ''
    const bv = b[sortField] ?? ''
    const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true })
    return sortDir === 'asc' ? cmp : -cmp
  })

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => (
    <span className='inline-block ml-1 text-xs opacity-50'>{sortField === field ? (sortDir === 'asc' ? '↑' : '↓') : '⇅'}</span>
  )

  // Actions
  const confirmDelete = (order: Order) => {
    setDeleteTarget(order)
    setDeleteOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await api.orders.delete(deleteTarget.id)
      setOrders((prev) => prev.filter((o) => o.id !== deleteTarget.id))
      toast(t('dash.orders.deleted'), 'success')
    } catch (err: any) {
      toast(err.message, 'error')
    }
    setDeleteOpen(false)
    setDeleteTarget(null)
  }

  const handleTogglePaid = async (order: Order) => {
    try {
      if (order.paymentStatus === 'NOT_PAID') {
        await api.orders.setPaid(order.id)
        setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, paymentStatus: 'PAID' as const } : o)))
        toast(t('dash.orders.paid'), 'success')
      } else {
        // Backend doesn't support "unpay" — we just update locally for now
        setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, paymentStatus: 'NOT_PAID' as const } : o)))
        toast('Marked as unpaid (local)', 'info')
      }
    } catch (err: any) {
      toast(err.message, 'error')
    }
  }

  const handleCreate = async () => {
    setCreateLoading(true)
    try {
      await api.orders.create({
        email: createForm.email,
        latitude: parseFloat(createForm.latitude),
        longitude: parseFloat(createForm.longitude),
        kitType: createForm.kitType,
      })
      toast(t('order.success'), 'success')
      setCreateOpen(false)
      setCreateForm({ email: '', latitude: '', longitude: '', kitType: 'KIT_SILVER' })
      loadOrders()
    } catch (err: any) {
      toast(err.message, 'error')
    } finally {
      setCreateLoading(false)
    }
  }

  const handleCsvImport = async () => {
    if (!csvFile) return
    setCsvLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', csvFile)
      const API_URL = import.meta.env.VITE_API_URL || '/api'
      const res = await fetch(`${API_URL}/orders/import`, { method: 'POST', body: formData })
      if (!res.ok) throw new Error(await res.text())
      toast('CSV imported!', 'success')
      setCsvOpen(false)
      setCsvFile(null)
      loadOrders()
    } catch (err: any) {
      toast(err.message, 'error')
    } finally {
      setCsvLoading(false)
    }
  }

  const openEdit = (order: Order) => {
    setEditOrder({ ...order })
    setEditOpen(true)
  }

  const handleEditSave = async () => {
    if (!editOrder) return
    try {
      if (editOrder.paymentStatus === 'PAID') {
        await api.orders.setPaid(editOrder.id)
      }
      setOrders((prev) => prev.map((o) => (o.id === editOrder.id ? editOrder : o)))
      toast('Saved', 'success')
      setEditOpen(false)
    } catch (err: any) {
      toast(err.message, 'error')
    }
  }

  return (
    <div className='min-h-screen bg-background'>
      {/* Header */}
      <header className='sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg'>
        <div className='max-w-7xl mx-auto flex items-center justify-between h-14 px-4 sm:px-6'>
          <div className='flex items-center gap-3'>
            <div className='w-7 h-7 rounded-lg bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center'>
              <span className='text-xs font-bold text-white'>B</span>
            </div>
            <span className='font-semibold hidden min-[400px]:inline'>BetterMe</span>
            <Badge variant='secondary' className='text-xs'>
              {t('dash.admin')}
            </Badge>
          </div>
          <div className='flex items-center gap-2'>
            {/* Theme toggle — pill style */}
            <button
              onClick={toggleTheme}
              className='relative w-12 h-6 rounded-full bg-muted border border-border transition-colors duration-300 hover:border-emerald-500/30'
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs transition-all duration-300 shadow-sm ${
                  theme === 'dark' ? 'left-6 bg-indigo-500 shadow-indigo-500/30' : 'left-0.5 bg-amber-400 shadow-amber-400/30'
                }`}
              >
                {theme === 'dark' ? '🌙' : '☀️'}
              </div>
            </button>

            {/* Language dropdown */}
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

            <div className='w-px h-5 bg-border' />
            <span className='text-sm text-muted-foreground hidden sm:inline'>{user?.email}</span>
            <Button variant='ghost' size='sm' onClick={signOut}>
              {t('dash.signout')}
            </Button>
          </div>
        </div>
      </header>

      <main className='max-w-7xl mx-auto p-4 sm:p-6'>
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8'>
          <div>
            <h1 className='text-2xl sm:text-3xl font-bold tracking-tight'>{t('dash.title')}</h1>
            <p className='text-muted-foreground mt-1 text-sm sm:text-base'>{t('dash.subtitle')}</p>
          </div>
          <div className='flex gap-2'>
            <Button variant='outline' size='sm' onClick={() => setCsvOpen(true)}>
              📄 CSV
            </Button>
            <Button size='sm' onClick={() => setCreateOpen(true)} className='bg-linear-to-r from-emerald-600 to-teal-600 text-white'>
              ➕ Order
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-8'>
          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-medium text-muted-foreground'>{t('dash.stats.orders')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-3xl font-bold'>{orders.length}</p>
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
              <p className='text-3xl font-bold'>{orders.filter((o) => o.paymentStatus === 'NOT_PAID').length}</p>
            </CardContent>
          </Card>
        </div>

        <Separator className='mb-6' />

        {/* Filters */}
        <div className='flex flex-wrap items-end gap-2 sm:gap-3 mb-4 overflow-x-auto pb-1'>
          <div className='space-y-1'>
            <Label className='text-xs text-muted-foreground'>Status</Label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value)
                setPage(0)
              }}
              className='h-9 px-3 rounded-md border bg-background text-sm'
            >
              <option value=''>All</option>
              <option value='ORDERED'>Ordered</option>
              <option value='ON_THE_WAY'>On the way</option>
              <option value='DELIVERED'>Delivered</option>
              <option value='RECEIVED'>Received</option>
              <option value='WAITING_FOR_PAYMENT'>Waiting payment</option>
            </select>
          </div>
          <div className='space-y-1'>
            <Label className='text-xs text-muted-foreground'>Kit</Label>
            <select
              value={filterKit}
              onChange={(e) => {
                setFilterKit(e.target.value)
                setPage(0)
              }}
              className='h-9 px-3 rounded-md border bg-background text-sm'
            >
              <option value=''>All</option>
              <option value='KIT_SILVER'>Silver</option>
              <option value='KIT_GOLD'>Gold</option>
              <option value='KIT_PLATINUM'>Platinum</option>
            </select>
          </div>
          <div className='space-y-1'>
            <Label className='text-xs text-muted-foreground'>Email</Label>
            <Input placeholder='filter...' value={filterEmail} onChange={(e) => setFilterEmail(e.target.value)} className='h-9 w-44' />
          </div>
          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              setFilterStatus('')
              setFilterKit('')
              setFilterEmail('')
              setPage(0)
            }}
          >
            Clear
          </Button>
          <div className='ml-auto'>
            <Button variant='outline' size='sm' onClick={loadOrders} disabled={loading}>
              ↻
            </Button>
          </div>
        </div>

        {/* Table */}
        <Card className='overflow-hidden py-0 gap-0'>
          <CardContent className='p-0'>
            {loading && (
              <div className='flex items-center justify-center h-32'>
                <div className='h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent' />
              </div>
            )}
            {error && (
              <div className='rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 m-4 text-sm text-destructive'>
                {t('dash.orders.error')}: {error}
              </div>
            )}
            {!loading && !error && orders.length === 0 && <p className='text-center text-muted-foreground py-12'>{t('dash.orders.empty')}</p>}

            {!loading && !error && sortedOrders.length > 0 && (
              <div className='overflow-x-auto'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='border-b bg-muted/30'>
                      <th className='text-left px-3 py-3 font-medium text-muted-foreground'>ID</th>
                      <th
                        className='text-left px-3 py-3 font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground'
                        onClick={() => toggleSort('receiverEmail')}
                      >
                        Email
                        <SortIcon field='receiverEmail' />
                      </th>
                      <th
                        className='text-left px-3 py-3 font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground'
                        onClick={() => toggleSort('kitType')}
                      >
                        Kit
                        <SortIcon field='kitType' />
                      </th>
                      <th
                        className='text-left px-3 py-3 font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground'
                        onClick={() => toggleSort('orderStatus')}
                      >
                        Status
                        <SortIcon field='orderStatus' />
                      </th>
                      <th
                        className='text-left px-3 py-3 font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground'
                        onClick={() => toggleSort('paymentStatus')}
                      >
                        Payment
                        <SortIcon field='paymentStatus' />
                      </th>
                      <th
                        className='text-left px-3 py-3 font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground'
                        onClick={() => toggleSort('deliveryProgress')}
                      >
                        Progress
                        <SortIcon field='deliveryProgress' />
                      </th>
                      <th
                        className='text-left px-3 py-3 font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground'
                        onClick={() => toggleSort('timestamp')}
                      >
                        Date
                        <SortIcon field='timestamp' />
                      </th>
                      <th className='text-left px-3 py-3 font-medium text-muted-foreground'>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedOrders.map((order) => (
                      <tr key={order.id} className='border-b last:border-0 hover:bg-muted/30 transition-colors'>
                        <td className='px-3 py-3 font-mono text-xs'>{order.id.slice(0, 8)}…</td>
                        <td className='px-3 py-3 text-xs'>{order.receiverEmail}</td>
                        <td className='px-3 py-3 text-xs'>{order.kitType.replace(/_/g, ' ')}</td>
                        <td className='px-3 py-3'>
                          <Badge variant='outline' className={`text-xs ${STATUS_COLORS[order.orderStatus] || ''}`}>
                            {order.orderStatus.replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td className='px-3 py-3'>
                          <button onClick={() => handleTogglePaid(order)} title='Click to toggle'>
                            <Badge
                              variant='outline'
                              className={`text-xs cursor-pointer hover:opacity-80 ${PAYMENT_COLORS[order.paymentStatus] || ''}`}
                            >
                              {order.paymentStatus.replace(/_/g, ' ')}
                            </Badge>
                          </button>
                        </td>
                        <td className='px-3 py-3'>
                          <div className='flex items-center gap-2'>
                            <div className='w-16 h-1.5 rounded-full bg-muted overflow-hidden'>
                              <div className='h-full rounded-full bg-emerald-500' style={{ width: `${order.deliveryProgress}%` }} />
                            </div>
                            <span className='text-xs text-muted-foreground'>{order.deliveryProgress}%</span>
                          </div>
                        </td>
                        <td className='px-3 py-3 text-xs text-muted-foreground'>{order.timestamp}</td>
                        <td className='px-3 py-3'>
                          <div className='flex items-center gap-0.5'>
                            <Button variant='ghost' size='sm' className='h-7 w-7 p-0' title='Edit' onClick={() => openEdit(order)}>
                              ✏️
                            </Button>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='h-7 w-7 p-0'
                              title='Map'
                              onClick={() => {
                                setMapOrder(order)
                                setMapOpen(true)
                              }}
                            >
                              🗺️
                            </Button>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='h-7 w-7 p-0 text-destructive'
                              title='Delete'
                              onClick={() => confirmDelete(order)}
                            >
                              🗑
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        <div className='flex items-center justify-center gap-2 mt-4'>
          <Button variant='outline' size='sm' disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            ← Prev
          </Button>
          <span className='text-sm text-muted-foreground px-3'>Page {page + 1}</span>
          <Button variant='outline' size='sm' disabled={orders.length < 10} onClick={() => setPage((p) => p + 1)}>
            Next →
          </Button>
        </div>
      </main>

      {/* ═══════ Delete Confirmation Dialog ═══════ */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className='max-w-sm'>
          <DialogHeader>
            <DialogTitle className='text-destructive'>🗑 Delete Order</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          {deleteTarget && (
            <div className='rounded-lg border bg-muted/30 p-4 space-y-2'>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>ID</span>
                <span className='font-mono text-xs'>{deleteTarget.id.slice(0, 16)}…</span>
              </div>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Email</span>
                <span>{deleteTarget.receiverEmail}</span>
              </div>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Kit</span>
                <span>{deleteTarget.kitType.replace(/_/g, ' ')}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant='destructive' onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════ CSV Import Dialog ═══════ */}
      <Dialog open={csvOpen} onOpenChange={setCsvOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>📄 Import CSV</DialogTitle>
            <DialogDescription>Upload CSV (latitude, longitude, subtotal, timestamp)</DialogDescription>
          </DialogHeader>
          <div className='border-2 border-dashed rounded-lg p-8 text-center'>
            <input type='file' accept='.csv' onChange={(e) => setCsvFile(e.target.files?.[0] || null)} className='hidden' id='csv-upload' />
            <label htmlFor='csv-upload' className='cursor-pointer'>
              {csvFile ? (
                <div className='flex items-center justify-center gap-2 text-emerald-500'>
                  <span className='text-2xl'>📎</span>
                  <span className='font-medium'>{csvFile.name}</span>
                  <span className='text-xs text-muted-foreground'>({(csvFile.size / 1024).toFixed(1)} KB)</span>
                </div>
              ) : (
                <div className='text-muted-foreground'>
                  <span className='text-3xl block mb-2'>📁</span>
                  <span className='text-sm'>Click to choose a CSV file</span>
                </div>
              )}
            </label>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setCsvOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCsvImport} disabled={!csvFile || csvLoading} className='bg-linear-to-r from-emerald-600 to-teal-600 text-white'>
              {csvLoading ? 'Importing...' : 'Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════ Manual Create Dialog ═══════ */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>➕ Create Order</DialogTitle>
            <DialogDescription>Add a new order with address picker</DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label>Email</Label>
                <Input
                  placeholder='customer@email.com'
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                />
              </div>
              <div className='space-y-2'>
                <Label>Kit Type</Label>
                <div className='flex gap-1.5'>
                  {(['KIT_SILVER', 'KIT_GOLD', 'KIT_PLATINUM'] as const).map((kit) => (
                    <button
                      key={kit}
                      type='button'
                      onClick={() => setCreateForm({ ...createForm, kitType: kit })}
                      className={`flex-1 p-2 rounded-lg border text-xs font-medium transition-all ${createForm.kitType === kit ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500' : 'border-border text-muted-foreground'}`}
                    >
                      {kit === 'KIT_SILVER' ? '🥈' : kit === 'KIT_GOLD' ? '🥇' : '💎'} {kit.replace('KIT_', '')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <LocationPicker
              compact
              latitude={createForm.latitude}
              longitude={createForm.longitude}
              onChange={(lat, lon) => setCreateForm({ ...createForm, latitude: lat, longitude: lon })}
            />
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createLoading || !createForm.email || !createForm.latitude}
              className='bg-linear-to-r from-emerald-600 to-teal-600 text-white'
            >
              {createLoading ? 'Creating...' : 'Create Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════ Edit Dialog ═══════ */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>✏️ Edit Order</DialogTitle>
            <DialogDescription className='font-mono text-xs'>{editOrder?.id}</DialogDescription>
          </DialogHeader>
          {editOrder && (
            <div className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label>Email</Label>
                  <Input value={editOrder.receiverEmail} onChange={(e) => setEditOrder({ ...editOrder, receiverEmail: e.target.value })} />
                </div>
                <div className='space-y-2'>
                  <Label>Kit Type</Label>
                  <select
                    value={editOrder.kitType}
                    onChange={(e) => setEditOrder({ ...editOrder, kitType: e.target.value as any })}
                    className='w-full h-9 px-3 rounded-md border bg-background text-sm'
                  >
                    <option value='KIT_SILVER'>🥈 Silver</option>
                    <option value='KIT_GOLD'>🥇 Gold</option>
                    <option value='KIT_PLATINUM'>💎 Platinum</option>
                  </select>
                </div>
              </div>
              <div className='grid grid-cols-3 gap-3'>
                <div className='space-y-2'>
                  <Label>Order Status</Label>
                  <select
                    value={editOrder.orderStatus}
                    onChange={(e) => setEditOrder({ ...editOrder, orderStatus: e.target.value as any })}
                    className='w-full h-9 px-3 rounded-md border bg-background text-sm'
                  >
                    <option value='ORDERED'>Ordered</option>
                    <option value='ON_THE_WAY'>On the way</option>
                    <option value='RETURNING'>Returning</option>
                    <option value='DELIVERED'>Delivered</option>
                    <option value='RECEIVED'>Received</option>
                    <option value='WAITING_FOR_PAYMENT'>Waiting payment</option>
                  </select>
                </div>
                <div className='space-y-2'>
                  <Label>Payment</Label>
                  <select
                    value={editOrder.paymentStatus}
                    onChange={(e) => setEditOrder({ ...editOrder, paymentStatus: e.target.value as any })}
                    className='w-full h-9 px-3 rounded-md border bg-background text-sm'
                  >
                    <option value='NOT_PAID'>Not Paid</option>
                    <option value='PAID'>Paid</option>
                  </select>
                </div>
                <div className='space-y-2'>
                  <Label>Subtotal</Label>
                  <Input
                    type='number'
                    value={editOrder.subtotal}
                    onChange={(e) => setEditOrder({ ...editOrder, subtotal: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className='space-y-2'>
                <Label>Delivery Progress: {editOrder.deliveryProgress}%</Label>
                <input
                  type='range'
                  min='0'
                  max='100'
                  value={editOrder.deliveryProgress}
                  onChange={(e) => setEditOrder({ ...editOrder, deliveryProgress: parseInt(e.target.value) })}
                  className='w-full accent-emerald-500'
                />
              </div>
              <LocationPicker
                compact
                latitude={String(editOrder.latitude)}
                longitude={String(editOrder.longitude)}
                onChange={(lat, lon) => setEditOrder({ ...editOrder, latitude: parseFloat(lat), longitude: parseFloat(lon) })}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant='outline' onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSave} className='bg-linear-to-r from-emerald-600 to-teal-600 text-white'>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════ Map Dialog ═══════ */}
      <Dialog open={mapOpen} onOpenChange={setMapOpen}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>🗺️ Order Location</DialogTitle>
            <DialogDescription className='font-mono text-xs'>
              {mapOrder?.latitude.toFixed(6)}, {mapOrder?.longitude.toFixed(6)}
            </DialogDescription>
          </DialogHeader>
          {mapOrder && (
            <div className='rounded-lg overflow-hidden border h-80'>
              <MapContainer key={mapOrder.id} center={[mapOrder.latitude, mapOrder.longitude]} zoom={14} style={{ height: '100%', width: '100%' }}>
                <TileLayer attribution='&copy; OpenStreetMap' url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />
                <Marker position={[mapOrder.latitude, mapOrder.longitude]} />
              </MapContainer>
            </div>
          )}
          <DialogFooter>
            <Button variant='outline' onClick={() => setMapOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
