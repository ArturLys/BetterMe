const API_URL = import.meta.env.VITE_API_URL || '/api'

export type KitType = 'DEFAULT' | 'DEFAULT_PLUS' | 'SILVER' | 'SILVER_PLUS' | 'GOLD' | 'GOLD_PLUS' | 'PLATINUM' | 'PLATINUM_PLUS'

export const KIT_INFO: Record<KitType, { label: string; price: number; tier: 'default' | 'silver' | 'gold' | 'platinum'; plus: boolean }> = {
  DEFAULT: { label: 'Default', price: 22, tier: 'default', plus: false },
  DEFAULT_PLUS: { label: 'Default+', price: 25, tier: 'default', plus: true },
  SILVER: { label: 'Silver', price: 45, tier: 'silver', plus: false },
  SILVER_PLUS: { label: 'Silver+', price: 50, tier: 'silver', plus: true },
  GOLD: { label: 'Gold', price: 108, tier: 'gold', plus: false },
  GOLD_PLUS: { label: 'Gold+', price: 120, tier: 'gold', plus: true },
  PLATINUM: { label: 'Platinum', price: 180, tier: 'platinum', plus: false },
  PLATINUM_PLUS: { label: 'Platinum+', price: 200, tier: 'platinum', plus: true },
}

export const ALL_KIT_TYPES = Object.keys(KIT_INFO) as KitType[]

export interface Order {
  id: number
  receiverEmail: string | null
  latitude: number
  longitude: number
  distance?: number
  subtotal: number
  timestamp: string
  deliveredAt?: string | null
  kitType: KitType
  orderStatus: string
  paymentStatus?: string
  deliveryProgress?: number
}

export interface OrderCreateDTO {
  email: string
  longitude: number
  latitude: number
  kitType: string
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(text || `HTTP ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  orders: {
    list: (filters?: Record<string, string>) => {
      const p = { size: '20', ...filters }
      const params = new URLSearchParams(p).toString()
      return request<Order[]>(`/orders?${params}`)
    },
    getById: (id: number) => request<Order>(`/orders/${id}`),
    create: (dto: OrderCreateDTO) => request<void>('/orders', { method: 'POST', body: JSON.stringify(dto) }),
    setPaid: (id: number) => request<void>(`/orders/${id}`, { method: 'PATCH' }),
    delete: (id: number) => request<void>(`/orders/${id}`, { method: 'DELETE' }),
  },
}
