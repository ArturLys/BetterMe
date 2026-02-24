const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export interface Order {
  id: string
  receiverEmail: string
  latitude: number
  longitude: number
  distance: number
  subtotal: number
  timestamp: string
  deliveredAt: string | null
  kitType: 'DEFAULT' | 'KIT_SILVER' | 'KIT_GOLD' | 'KIT_PLATINUM'
  orderStatus: 'ORDERED' | 'ON_THE_WAY' | 'RETURNING' | 'DELIVERED' | 'RECEIVED' | 'WAITING_FOR_PAYMENT'
  paymentStatus: 'NOT_PAID' | 'PAID'
  deliveryProgress: number
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
      const params = new URLSearchParams(filters).toString()
      return request<Order[]>(`/orders${params ? `?${params}` : ''}`)
    },
    getById: (id: string) => request<Order>(`/orders/${id}`),
    create: (dto: OrderCreateDTO) => request<void>('/orders', { method: 'POST', body: JSON.stringify(dto) }),
    setPaid: (id: string) => request<void>(`/orders/${id}`, { method: 'PATCH' }),
    delete: (id: string) => request<void>(`/orders/${id}`, { method: 'DELETE' }),
  },
}
