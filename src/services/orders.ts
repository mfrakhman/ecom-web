const BASE = (import.meta.env.VITE_API_URL as string) || '/api'

export interface OrderItem {
  id: string
  skuId: string
  quantity: number
  price: number
}

export interface Order {
  id: string
  userId?: string
  status: 'PENDING' | 'COMPLETED' | 'FAILED'
  items: OrderItem[]
  createdAt: string
}

function authHeaders() {
  const token = localStorage.getItem('access_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function getMyOrders(): Promise<Order[]> {
  const res = await fetch(`${BASE}/order/user/me`, { headers: authHeaders() })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Failed to fetch orders')
  return json.data ?? json
}

export async function getAllOrders(): Promise<Order[]> {
  const res = await fetch(`${BASE}/order`, { headers: authHeaders() })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Failed to fetch orders')
  return json.data ?? json
}

export async function createOrder(items: { skuId: string; quantity: number }[]): Promise<Order> {
  const token = localStorage.getItem('access_token')
  const res = await fetch(`${BASE}/order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ items }),
  })
  const json = await res.json()
  if (!res.ok) {
    const msg = Array.isArray(json.message) ? json.message[0] : json.message
    throw new Error(msg || 'Failed to place order')
  }
  return json.data ?? json
}
