// God component, more like cute component :3

import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { useI18n } from '../../context/I18nContext'
import { useTheme } from '../../context/ThemeContext'
import { useToast } from '../../context/ToastContext'
import { api, type Order, type KitType, KIT_INFO, ALL_KIT_TYPES } from '../../services/api'
import LocationPicker from '@/components/LocationPicker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationLink,
  PaginationEllipsis,
} from '@/components/ui/pagination'
import {
  Package,
  Award,
  Trophy,
  Crown,
  Plus,
  Pencil,
  Map,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Upload,
  PlusCircle,
  Sun,
  Moon,
  ChevronDown,
  X,
} from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

import silverImg from '@/assets/silver.jpg'
import goldImg from '@/assets/gold.jpg'
import platinumImg from '@/assets/platinum.jpg'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const TIER_IMAGES: Record<string, string | null> = {
  default: null,
  silver: silverImg,
  gold: goldImg,
  platinum: platinumImg,
}
const TIER_ICONS: Record<string, typeof Package> = { default: Package, silver: Award, gold: Trophy, platinum: Crown }

const STATUS_COLORS: Record<string, string> = {
  ORDERED: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  ON_THE_WAY: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  RETURNING: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  DELIVERED: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  RECEIVED: 'bg-green-500/10 text-green-500 border-green-500/20',
  WAITING_FOR_PAYMENT: 'bg-red-500/10 text-red-500 border-red-500/20',
}

type SortField =
  | 'id'
  | 'timestamp'
  | 'receiverEmail'
  | 'kitType'
  | 'orderStatus'
  | 'subtotal'
  | 'taxAmount'
  | 'totalAmount'
type SortDir = 'asc' | 'desc'

const PAGE_SIZES = [10, 20, 50, 100] as const

function KitIcon({ kit, size = 16 }: { kit: KitType; size?: number }) {
  const info = KIT_INFO[kit]
  if (!info) return <Package size={size} />
  const Icon = TIER_ICONS[info.tier] || Package
  return (
    <span className="relative inline-flex">
      <Icon size={size} />
      {info.plus && <Plus size={size * 0.5} className="absolute -top-1 -right-1.5 text-emerald-500" strokeWidth={3} />}
    </span>
  )
}

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const { t, lang, setLang } = useI18n()
  const { theme, toggleTheme } = useTheme()
  const { toast } = useToast()
  const qc = useQueryClient()

  const [langOpen, setLangOpen] = useState(false)
  const langRef = useRef<HTMLDivElement>(null)

  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState<number>(20)

  const [sortField, setSortField] = useState<SortField>('id')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const [filterStatus, setFilterStatus] = useState('')
  const [filterEmail, setFilterEmail] = useState('')
  const [filterKit, setFilterKit] = useState('')

  const [csvOpen, setCsvOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [mapOpen, setMapOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editOrder, setEditOrder] = useState<Order | null>(null)
  const [mapOrder, setMapOrder] = useState<Order | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null)

  const [createForm, setCreateForm] = useState({ email: '', latitude: '', longitude: '', kitType: 'SILVER' as KitType })
  const [createLoading, setCreateLoading] = useState(false)

  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvLoading, setCsvLoading] = useState(false)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ─── React Query ───
  // Backend returns 10 per page. We fetch multiple backend pages to fill user's pageSize.
  const BACKEND_PAGE_SIZE = 10
  const pagesNeeded = Math.ceil(pageSize / BACKEND_PAGE_SIZE)

  const queryKey = ['orders', page, pageSize, filterStatus, filterEmail, filterKit]

  const { data: statsData } = useQuery({
    queryKey: ['stats'],
    queryFn: api.orders.getStats,
  })

  // We explicitly keep totalOrders in local state as fallback for perfect math
  if (statsData?.totalOrders) localStorage.setItem('cachedTotalOrders', String(statsData.totalOrders))
  const cachedTotalOrders = parseInt(localStorage.getItem('cachedTotalOrders') || '0', 10)
  const exactTotalOrders = statsData?.totalOrders || cachedTotalOrders

  const {
    data: queryData,
    isFetching: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async (): Promise<{ items: Order[]; totalElements: number; totalPages: number }> => {
      const baseFilters: Record<string, string> = { sort: 'id,desc' }
      if (filterStatus) baseFilters.orderStatus = filterStatus
      if (filterEmail) baseFilters.email = filterEmail
      if (filterKit) baseFilters.kitType = filterKit

      let fetchedItems: Order[] = []
      let totalFetchedElements = -1
      let totalFetchedPages = -1

      const hasFilters = !!(filterStatus || filterEmail || filterKit)

      if (exactTotalOrders > 0 && !hasFilters) {
        // We want `pageSize` items ending at the very end of the database.
        const endIndex = exactTotalOrders - page * pageSize
        const startIndex = Math.max(0, endIndex - pageSize)

        if (startIndex < endIndex) {
          const startPage = Math.floor(startIndex / BACKEND_PAGE_SIZE)
          const endPage = Math.floor((endIndex - 1) / BACKEND_PAGE_SIZE)

          const fetches = []
          for (let p = startPage; p <= endPage; p++) {
            fetches.push(api.orders.list({ ...baseFilters, page: String(p), size: String(BACKEND_PAGE_SIZE) }))
          }
          const results = await Promise.all(fetches)
          const merged = results.flatMap((r) => r.items)

          // Slice the exact items we need (compensating for the fact that the first loaded page might contain items from before startIndex)
          const localStartIndex = startIndex - startPage * BACKEND_PAGE_SIZE
          const localEndIndex = endIndex - startPage * BACKEND_PAGE_SIZE
          fetchedItems = merged.slice(localStartIndex, localEndIndex)
        }
        totalFetchedElements = exactTotalOrders
        totalFetchedPages = Math.ceil(exactTotalOrders / BACKEND_PAGE_SIZE)
      } else {
        const backendStartPage = page * pagesNeeded
        const fetches = Array.from({ length: pagesNeeded }, (_, i) => {
          return api.orders.list({
            ...baseFilters,
            page: String(backendStartPage + i),
            size: String(BACKEND_PAGE_SIZE),
          })
        })
        const results = await Promise.all(fetches)
        fetchedItems = results.flatMap((r) => r.items)
        if (results[0]) {
          totalFetchedElements = results[0].totalElements ?? -1
          totalFetchedPages = results[0].totalPages ?? -1
        }
      }

      return {
        items: fetchedItems,
        totalElements: totalFetchedElements,
        totalPages: totalFetchedPages,
      }
    },
    placeholderData: (prev) => prev,
  })
  const orders = queryData?.items ?? []

  // Use exact math from totalOrders avoiding backend -1, but prioritize queryData if the backend gave it to us
  const totalElements =
    queryData?.totalElements && queryData.totalElements > 0
      ? queryData.totalElements
      : exactTotalOrders > 0
        ? exactTotalOrders
        : orders.length > pageSize
          ? orders.length
          : 0
  const totalPages = totalElements > 0 ? Math.ceil(totalElements / pageSize) : 1
  const lastPage = Math.max(0, totalPages - 1)

  const error = queryError ? (queryError as Error).message : null

  // ─── Client-side sort (within current page) ───
  const sortedOrders = [...orders].sort((a, b) => {
    if (sortField === 'id') {
      return sortDir === 'asc' ? a.id - b.id : b.id - a.id
    }
    const av = a[sortField] ?? ''
    const bv = b[sortField] ?? ''
    const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true })
    return sortDir === 'asc' ? cmp : -cmp
  })

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown size={12} className="inline ml-1 opacity-40" />
    return sortDir === 'asc' ? (
      <ArrowUp size={12} className="inline ml-1" />
    ) : (
      <ArrowDown size={12} className="inline ml-1" />
    )
  }

  // ─── Actions ───
  const confirmDelete = (order: Order) => {
    setDeleteTarget(order)
    setDeleteOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await api.orders.delete(deleteTarget.id)
      toast(t('dash.orders.deleted'), 'success')
      qc.invalidateQueries({ queryKey: ['orders'] })
    } catch (err: any) {
      toast(err.message, 'error')
    }
    setDeleteOpen(false)
    setDeleteTarget(null)
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
      setCreateForm({ email: '', latitude: '', longitude: '', kitType: 'SILVER' as KitType })
      qc.invalidateQueries({ queryKey: ['orders'] })
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
      toast(t('dash.csv.success'), 'success')
      setCsvOpen(false)
      setCsvFile(null)
      qc.invalidateQueries({ queryKey: ['orders'] })
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
      await api.orders.update(editOrder.id, {
        receiverEmail: editOrder.receiverEmail,
        kitType: editOrder.kitType,
        orderStatus: editOrder.orderStatus,
        latitude: editOrder.latitude,
        longitude: editOrder.longitude,
      })
      toast(t('dash.edit.saved'), 'success')
      setEditOpen(false)
      qc.invalidateQueries({ queryKey: ['orders'] })
    } catch (err: any) {
      toast(err.message, 'error')
    }
  }

  const kitLabel = (kit: string) => KIT_INFO[kit as KitType]?.label ?? kit

  const hasNextPage = lastPage >= 0 && page < lastPage
  const hasPrevPage = page > 0

  // ═══════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-14 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <span className="text-xs font-bold text-white">B</span>
            </div>
            <span className='font-semibold hidden min-[460px]:inline'>BetterMe</span>
            <Badge variant='secondary' className='text-xs'>
              {t('dash.admin')}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="relative w-12 h-6 rounded-full bg-muted border border-border transition-colors duration-300 hover:border-emerald-500/30"
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm ${theme === 'dark' ? 'left-6 bg-indigo-500 shadow-indigo-500/30' : 'left-0.5 bg-amber-400 shadow-amber-400/30'}`}
              >
                {theme === 'dark' ? (
                  <Moon size={12} className="text-white" />
                ) : (
                  <Sun size={12} className="text-white" />
                )}
              </div>
            </button>
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <span>{lang === 'uk' ? '🇺🇦' : '🇬🇧'}</span>
                <span className="text-xs font-medium">{lang.toUpperCase()}</span>
                <ChevronDown
                  size={12}
                  className={`transition-transform duration-200 ${langOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {langOpen && (
                <div className="absolute right-0 mt-1 w-36 rounded-lg border bg-popover shadow-lg py-1 animate-[fadeIn_0.15s_ease-out]">
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
            <div className="w-px h-5 bg-border" />
            <span className="text-sm text-muted-foreground hidden sm:inline">{user?.username}</span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              {t('dash.signout')}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t('dash.title')}</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">{t('dash.subtitle')}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setCsvOpen(true)}>
              <Upload size={14} className="mr-1" /> CSV
            </Button>
            <Button
              size="sm"
              onClick={() => setCreateOpen(true)}
              className="bg-linear-to-r from-emerald-600 to-teal-600 text-white"
            >
              <PlusCircle size={14} className="mr-1" /> {t('dash.create.btn')}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('dash.stats.orders')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{statsData ? statsData.totalOrders.toLocaleString() : '—'}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('dash.stats.tax')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {statsData
                  ? `$${statsData.totalTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : '—'}
              </p>
            </CardContent>
          </Card>
          {/* <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-medium text-muted-foreground'>{t('dash.stats.pending')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-3xl font-bold'>{statsData ? statsData.totalPending.toLocaleString() : '—'}</p>
            </CardContent>
          </Card> */}
        </div>

        <Separator className="mb-6" />

        {/* Filters + page size + refresh */}
        <div className="flex flex-wrap items-end gap-2 sm:gap-3 mb-4 overflow-x-auto pb-1">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{t('dash.orders.status')}</Label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value)
                setPage(0)
              }}
              className="h-9 px-3 rounded-md border bg-background text-sm"
            >
              <option value="">{t('dash.filter.all')}</option>
              <option value="ORDERED">{t('dash.status.ordered')}</option>
              <option value="ON_THE_WAY">{t('dash.status.on_the_way')}</option>
              <option value="DELIVERED">{t('dash.status.delivered')}</option>
              <option value="RECEIVED">{t('dash.status.received')}</option>
              <option value="WAITING_FOR_PAYMENT">{t('dash.status.waiting_for_payment')}</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{t('dash.orders.kit')}</Label>
            <select
              value={filterKit}
              onChange={(e) => {
                setFilterKit(e.target.value)
                setPage(0)
              }}
              className="h-9 px-3 rounded-md border bg-background text-sm"
            >
              <option value="">{t('dash.filter.all')}</option>
              {ALL_KIT_TYPES.map((k) => (
                <option key={k} value={k}>
                  {KIT_INFO[k].label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{t('dash.orders.email')}</Label>
            <Input
              placeholder={t('dash.filter.search')}
              value={filterEmail}
              onChange={(e) => setFilterEmail(e.target.value)}
              className="h-9 w-44"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setFilterStatus('')
              setFilterKit('')
              setFilterEmail('')
              setPage(0)
            }}
          >
            <X size={14} className="mr-1" /> {t('dash.filter.clear')}
          </Button>

          {/* Spacer to push page-size + refresh to the right */}
          <div className="flex-1" />

          {/* Page size selector */}
          <div className="flex items-center gap-1.5">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">{t('dash.page.size')}</Label>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setPage(0)
              }}
              className="h-9 px-2 rounded-md border bg-background text-sm w-16"
            >
              {PAGE_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh */}
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </Button>
        </div>

        {/* Table */}
        <Card className="overflow-hidden py-0 gap-0">
          <CardContent className="p-0">
            {loading && (
              <div className="flex items-center justify-center h-32">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            )}
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 m-4 text-sm text-destructive">
                {t('dash.orders.error')}: {error}
              </div>
            )}
            {!loading && !error && orders.length === 0 && (
              <p className="text-center text-muted-foreground py-12">{t('dash.orders.empty')}</p>
            )}

            {!loading && !error && sortedOrders.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th
                        className="text-left px-3 py-3 font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground"
                        onClick={() => toggleSort('id')}
                      >
                        {t('dash.orders.id')}
                        <SortIcon field="id" />
                      </th>
                      <th
                        className="text-left px-3 py-3 font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground"
                        onClick={() => toggleSort('receiverEmail')}
                      >
                        {t('dash.orders.email')}
                        <SortIcon field="receiverEmail" />
                      </th>
                      <th
                        className="text-left px-3 py-3 font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground"
                        onClick={() => toggleSort('kitType')}
                      >
                        {t('dash.orders.kit')}
                        <SortIcon field="kitType" />
                      </th>
                      <th
                        className="text-left px-3 py-3 font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground"
                        onClick={() => toggleSort('orderStatus')}
                      >
                        {t('dash.orders.status')}
                        <SortIcon field="orderStatus" />
                      </th>
                      <th
                        className="text-left px-3 py-3 font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground"
                        onClick={() => toggleSort('subtotal')}
                      >
                        {t('dash.orders.subtotal')}
                        <SortIcon field="subtotal" />
                      </th>
                      <th
                        className="text-left px-3 py-3 font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground"
                        onClick={() => toggleSort('taxAmount')}
                      >
                        {t('dash.orders.tax')}
                        <SortIcon field="taxAmount" />
                      </th>
                      <th
                        className="text-left px-3 py-3 font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground"
                        onClick={() => toggleSort('totalAmount')}
                      >
                        {t('dash.orders.total')}
                        <SortIcon field="totalAmount" />
                      </th>
                      <th
                        className="text-left px-3 py-3 font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground"
                        onClick={() => toggleSort('timestamp')}
                      >
                        {t('dash.orders.date')}
                        <SortIcon field="timestamp" />
                      </th>
                      {/* <th className='text-left px-3 py-3 font-medium text-muted-foreground'>{t('dash.orders.payment')}</th> */}
                      <th className="text-left px-3 py-3 font-medium text-muted-foreground">
                        {t('dash.orders.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedOrders.map((order) => (
                      <tr key={order.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-3 py-3 font-mono text-xs">{order.id}</td>
                        <td className="px-3 py-3 text-xs">{order.receiverEmail ?? '—'}</td>
                        <td className="px-3 py-3 text-xs">
                          <span className="inline-flex items-center gap-1.5">
                            <KitIcon kit={order.kitType} size={14} />
                            {kitLabel(order.kitType)}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <Badge variant="outline" className={`text-xs ${STATUS_COLORS[order.orderStatus] || ''}`}>
                            {t(`dash.status.${order.orderStatus.toLowerCase()}` as any) ||
                              order.orderStatus.replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 text-xs font-mono">${order.subtotal}</td>
                        <td className="px-3 py-3 text-xs font-mono text-muted-foreground">
                          {order.taxAmount !== undefined ? `$${order.taxAmount.toFixed(2)}` : '—'}
                          {order.compositeTax ? ` (${(order.compositeTax * 100).toFixed(1)}%)` : ''}
                        </td>
                        <td className="px-3 py-3 text-xs font-mono font-medium">
                          {order.totalAmount !== undefined ? `$${order.totalAmount.toFixed(2)}` : '—'}
                        </td>
                        <td className="px-3 py-3 text-xs text-muted-foreground">
                          {order.timestamp?.slice(0, 10) ?? '—'}
                        </td>
                        {/* <td className='px-3 py-3'>
                          <Badge
                            variant='outline'
                            className={`text-xs cursor-pointer transition-colors ${
                              (order.paymentStatus ?? 'NOT_PAID') === 'PAID'
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20'
                                : 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'
                            }`}
                            onClick={() => handleTogglePaid(order)}
                          >
                            {(order.paymentStatus ?? 'NOT_PAID') === 'PAID' ? t('dash.orders.paid') : t('dash.orders.not_paid')}
                          </Badge>
                        </td> */}
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-0.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              title={t('dash.edit.title')}
                              onClick={() => openEdit(order)}
                            >
                              <Pencil size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              title={t('dash.map.title')}
                              onClick={() => {
                                setMapOrder(order)
                                setMapOpen(true)
                              }}
                            >
                              <Map size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-destructive"
                              title={t('dash.delete.title')}
                              onClick={() => confirmDelete(order)}
                            >
                              <Trash2 size={14} />
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
        <div className="flex items-center justify-between gap-3 mt-4">
          {/* Info: showing X of Y */}
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {totalElements >= 0
              ? `${page * pageSize + 1}–${Math.min((page + 1) * pageSize, totalElements)} / ${totalElements.toLocaleString()}`
              : `${orders.length} ${t('dash.page.showing')}`}
          </span>

          <Pagination className="mx-0 w-auto">
            <PaginationContent>
              {/* Previous */}
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className={!hasPrevPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  label={t('dash.page.prev')}
                />
              </PaginationItem>

              {/* Page 1 */}
              {page > 1 && (
                <PaginationItem>
                  <PaginationLink className="cursor-pointer" onClick={() => setPage(0)}>
                    1
                  </PaginationLink>
                </PaginationItem>
              )}
              {page > 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

              {/* Previous page */}
              {page > 0 && (
                <PaginationItem>
                  <PaginationLink className="cursor-pointer" onClick={() => setPage(page - 1)}>
                    {page}
                  </PaginationLink>
                </PaginationItem>
              )}

              {/* Current page */}
              <PaginationItem>
                <PaginationLink isActive>{page + 1}</PaginationLink>
              </PaginationItem>

              {/* Next page */}
              {hasNextPage && (
                <PaginationItem>
                  <PaginationLink className="cursor-pointer" onClick={() => setPage(page + 1)}>
                    {page + 2}
                  </PaginationLink>
                </PaginationItem>
              )}

              {/* Ellipsis + last page */}
              {lastPage >= 0 && page < lastPage - 1 && (
                <>
                  {page < lastPage - 2 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  <PaginationItem>
                    <PaginationLink className="cursor-pointer" onClick={() => setPage(lastPage)}>
                      {lastPage + 1}
                    </PaginationLink>
                  </PaginationItem>
                </>
              )}

              {/* Next */}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                  className={!hasNextPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  label={t('dash.page.next')}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>

          {/* Page info */}
          <span className='text-xs text-muted-foreground whitespace-nowrap'>
            {/* {t('dash.page.label')} {page + 1}
            {totalPages > 0 ? ` / ${totalPages}` : ''} */}
          </span>
        </div>
      </main>

      {/* ═══ Delete Dialog ═══ */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 size={18} /> {t('dash.delete.title')}
            </DialogTitle>
            <DialogDescription>{t('dash.delete.desc')}</DialogDescription>
          </DialogHeader>
          {deleteTarget && (
            <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">ID</span>
                <span className="font-mono text-xs">{deleteTarget.id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('dash.orders.email')}</span>
                <span>{deleteTarget.receiverEmail ?? '—'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('dash.orders.kit')}</span>
                <span className="inline-flex items-center gap-1">
                  <KitIcon kit={deleteTarget.kitType} size={14} /> {kitLabel(deleteTarget.kitType)}
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              {t('dash.btn.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {t('dash.btn.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ CSV Import Dialog ═══ */}
      <Dialog open={csvOpen} onOpenChange={setCsvOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload size={18} /> {t('dash.csv.title')}
            </DialogTitle>
            <DialogDescription>{t('dash.csv.desc')}</DialogDescription>
          </DialogHeader>
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload" className="cursor-pointer">
              {csvFile ? (
                <div className="flex items-center justify-center gap-2 text-emerald-500">
                  <Upload size={20} /> <span className="font-medium">{csvFile.name}</span>
                  <span className="text-xs text-muted-foreground">({(csvFile.size / 1024).toFixed(1)} KB)</span>
                </div>
              ) : (
                <div className="text-muted-foreground">
                  <Upload size={32} className="mx-auto mb-2 opacity-50" />
                  <span className="text-sm">{t('dash.csv.choose')}</span>
                </div>
              )}
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCsvOpen(false)}>
              {t('dash.btn.cancel')}
            </Button>
            <Button
              onClick={handleCsvImport}
              disabled={!csvFile || csvLoading}
              className="bg-linear-to-r from-emerald-600 to-teal-600 text-white"
            >
              {csvLoading ? t('dash.csv.importing') : t('dash.csv.import')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Create Dialog ═══ */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlusCircle size={18} /> {t('dash.create.title')}
            </DialogTitle>
            <DialogDescription>{t('dash.create.desc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('dash.orders.email')}</Label>
              <Input
                placeholder="customer@email.com"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('dash.orders.kit')}</Label>
              <div className="grid grid-cols-4 gap-2">
                {ALL_KIT_TYPES.map((kit) => {
                  const info = KIT_INFO[kit]
                  const img = TIER_IMAGES[info.tier]
                  const selected = createForm.kitType === kit
                  return (
                    <button
                      key={kit}
                      type="button"
                      onClick={() => setCreateForm({ ...createForm, kitType: kit })}
                      className={`relative flex flex-col items-center gap-1 rounded-xl border-2 overflow-hidden transition-all duration-200 ${selected ? 'border-emerald-500 shadow-lg shadow-emerald-500/10 scale-[1.02]' : 'border-border opacity-70 hover:opacity-100'}`}
                    >
                      {img ? (
                        <img src={img} alt={info.label} className="w-full h-16 object-cover" />
                      ) : (
                        <div className="w-full h-16 bg-muted flex items-center justify-center">
                          <Package size={20} className="text-muted-foreground" />
                        </div>
                      )}
                      <div className="p-1.5 text-center w-full">
                        <span className={`text-xs font-semibold block ${selected ? 'text-emerald-500' : ''}`}>
                          {info.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground">${info.price}</span>
                      </div>
                      {info.plus && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                          <Plus size={10} className="text-white" strokeWidth={3} />
                        </div>
                      )}
                      {selected && (
                        <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                          <svg
                            className="w-2.5 h-2.5 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  )
                })}
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
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              {t('dash.btn.cancel')}
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createLoading || !createForm.email || !createForm.latitude}
              className="bg-linear-to-r from-emerald-600 to-teal-600 text-white"
            >
              {createLoading ? t('dash.create.loading') : t('dash.create.btn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Edit Dialog ═══ */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil size={18} /> {t('dash.edit.title')}
            </DialogTitle>
            <DialogDescription className="font-mono text-xs">ID: {editOrder?.id}</DialogDescription>
          </DialogHeader>
          {editOrder && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t('dash.orders.email')}</Label>
                <Input
                  value={editOrder.receiverEmail ?? ''}
                  onChange={(e) => setEditOrder({ ...editOrder, receiverEmail: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('dash.orders.kit')}</Label>
                  <select
                    value={editOrder.kitType}
                    onChange={(e) => setEditOrder({ ...editOrder, kitType: e.target.value as KitType })}
                    className="w-full h-9 px-3 rounded-md border bg-background text-sm"
                  >
                    {ALL_KIT_TYPES.map((k) => (
                      <option key={k} value={k}>
                        {KIT_INFO[k].label} (${KIT_INFO[k].price})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>{t('dash.orders.status')}</Label>
                  <select
                    value={editOrder.orderStatus}
                    onChange={(e) => setEditOrder({ ...editOrder, orderStatus: e.target.value })}
                    className="w-full h-9 px-3 rounded-md border bg-background text-sm"
                  >
                    <option value="ORDERED">{t('dash.status.ordered')}</option>
                    <option value="ON_THE_WAY">{t('dash.status.on_the_way')}</option>
                    <option value="RETURNING">{t('dash.status.returning')}</option>
                    <option value="DELIVERED">{t('dash.status.delivered')}</option>
                    <option value="RECEIVED">{t('dash.status.received')}</option>
                    <option value="WAITING_FOR_PAYMENT">{t('dash.status.waiting_for_payment')}</option>
                  </select>
                </div>
              </div>
              <LocationPicker
                compact
                latitude={String(editOrder.latitude)}
                longitude={String(editOrder.longitude)}
                onChange={(lat, lon) =>
                  setEditOrder({ ...editOrder, latitude: parseFloat(lat), longitude: parseFloat(lon) })
                }
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              {t('dash.btn.cancel')}
            </Button>
            <Button onClick={handleEditSave} className="bg-linear-to-r from-emerald-600 to-teal-600 text-white">
              {t('dash.btn.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Map Dialog ═══ */}
      <Dialog open={mapOpen} onOpenChange={setMapOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Map size={18} /> {t('dash.map.title')}
            </DialogTitle>
            <DialogDescription className="font-mono text-xs">
              {mapOrder?.latitude.toFixed(6)}, {mapOrder?.longitude.toFixed(6)}
            </DialogDescription>
          </DialogHeader>
          {mapOrder && (
            <div className="rounded-lg overflow-hidden border h-80">
              <MapContainer
                key={mapOrder.id}
                center={[mapOrder.latitude, mapOrder.longitude]}
                zoom={14}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution="&copy; OpenStreetMap"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[mapOrder.latitude, mapOrder.longitude]} />
              </MapContainer>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setMapOpen(false)}>
              {t('dash.btn.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
