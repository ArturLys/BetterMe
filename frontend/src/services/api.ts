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
  drone?: Partial<DroneDetails> | null
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

export interface Drone {
  id: number
  status: string
  progress?: number
}

export interface DroneLog {
  droneId: number
  order: Order
  startedAt: string
  finishedAt: string
  status: string
}

export interface DroneDetails {
  status: string
  progress: number
  currentOrder: Order | null
  currentLatitude: number
  currentLongitude: number
  logs: DroneLog[]
}

export interface DroneHome {
  latitude: number
  longitude: number
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
  drones: {
    list: async () => {
      try {
        return await request<Drone[]>('/drones')
      } catch {
        return [
          { id: 1, status: 'FREE' },
          { id: 2, status: 'FREE' },
          { id: 3, status: 'OCCUPIED' },
          { id: 4, status: 'OCCUPIED' },
          { id: 5, status: 'FREE' },
          { id: 6, status: 'FREE' },
          { id: 7, status: 'OCCUPIED' },
          { id: 8, status: 'FREE' },
        ]
      }
    },
    getById: async (id: number) => {
      try {
        return await request<DroneDetails>(`/drones/${id}`)
      } catch {
        const isOccupied = id === 3 || id === 4 || id === 7
        return {
          status: isOccupied ? 'OCCUPIED' : 'FREE',
          progress: isOccupied ? 50 : 0,
          currentOrder: isOccupied
            ? ({
                id: 200 + id,
                receiverEmail: 'mock@example.com',
                latitude: 40.722,
                longitude: -73.767,
                orderStatus: 'ORDERED',
                kitType: 'DEFAULT',
              } as Order)
            : null,
          currentLatitude: 40.7128,
          currentLongitude: -74.006,
          logs: isOccupied
            ? [
                {
                  droneId: id,
                  order: {
                    id: 200 + id,
                    receiverEmail: 'mock@example.com',
                    latitude: 40.722,
                    longitude: -73.767,
                    orderStatus: 'ORDERED',
                    kitType: 'DEFAULT',
                  } as Order,
                  startedAt: new Date(Date.now() - 3600000).toISOString(),
                  finishedAt: new Date(Date.now() - 1800000).toISOString(),
                  status: 'COMPLETED',
                },
                {
                  droneId: id,
                  order: {
                    id: 300 + id,
                    receiverEmail: 'mock2@example.com',
                    latitude: 40.75,
                    longitude: -73.98,
                    orderStatus: 'ON_THE_WAY',
                    kitType: 'GOLD',
                  } as Order,
                  startedAt: new Date(Date.now() - 600000).toISOString(),
                  finishedAt: new Date(Date.now() + 600000).toISOString(),
                  status: 'IN_PROGRESS',
                },
              ]
            : [],
        }
      }
    },
    home: async () => {
      try {
        return await request<DroneHome>('/drones/home')
      } catch {
        return { latitude: 40.7128, longitude: -74.006 }
      }
    },
    facilitate: () => request<void>('/drones/facilitate', { method: 'POST' }),
  },
}
