const API_URL = import.meta.env.VITE_API_URL || '/api'

export type KitType =
  | 'DEFAULT'
  | 'DEFAULT_PLUS'
  | 'SILVER'
  | 'SILVER_PLUS'
  | 'GOLD'
  | 'GOLD_PLUS'
  | 'PLATINUM'
  | 'PLATINUM_PLUS'

export const KIT_INFO: Record<
  KitType,
  { label: string; price: number; tier: 'default' | 'silver' | 'gold' | 'platinum'; plus: boolean }
> = {
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
  taxAmount?: number
  compositeTax?: number
  totalAmount?: number
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

export interface PagedOrders {
  items: Order[]
  totalElements: number
  totalPages: number
}

export interface OrderStats {
  totalOrders: number
  totalTax: number
  totalPending: number
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
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
    /** Fetches a page of orders. Handles both plain array and Spring Page responses. */
    list: async (filters?: Record<string, string>): Promise<PagedOrders> => {
      const params = new URLSearchParams(filters ?? {}).toString()
      const raw: any = await request<unknown>(`/orders${params ? `?${params}` : ''}`)

      // Spring Page object: { content: [...], totalElements, totalPages, ... }
      if (raw && !Array.isArray(raw) && Array.isArray(raw.content)) {
        return {
          items: raw.content as Order[],
          totalElements: raw.totalElements ?? -1,
          totalPages: raw.totalPages ?? -1,
        }
      }
      // Plain array fallback (old backend)
      if (Array.isArray(raw)) {
        return { items: raw, totalElements: -1, totalPages: -1 }
      }
      return { items: [], totalElements: 0, totalPages: 0 }
    },

    getStats: () => request<OrderStats>('/orders/stats'),
    getById: (id: number) => request<Order>(`/orders/${id}`),
    create: (dto: OrderCreateDTO) => request<number>('/orders', { method: 'POST', body: JSON.stringify(dto) }),
    update: (id: number, order: Partial<Order>) =>
      request<Order>(`/orders/${id}`, { method: 'PUT', body: JSON.stringify(order) }),
    delete: (id: number) => request<void>(`/orders/${id}`, { method: 'DELETE' }),
    pay: (id: number) => request<void>(`/orders/pay/${id}`, { method: 'POST' }),
  },
}
