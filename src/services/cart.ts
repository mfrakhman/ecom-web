const BASE = (import.meta.env.VITE_API_URL as string) || '/api'

export interface CartItem {
  id: string
  skuId: string
  quantity: number
  price: number | null
}

export interface Cart {
  id: string
  status: 'CART'
  items: CartItem[]
  createdAt: string
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('access_token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: authHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const json = await res.json()
  if (!res.ok) {
    const msg = Array.isArray(json.message) ? json.message[0] : json.message
    throw new Error(msg || 'Request failed')
  }
  return json
}

export function getCart(): Promise<Cart> {
  return req<Cart>('GET', '/order/cart')
}

export function addToCart(skuId: string, quantity = 1): Promise<Cart> {
  return req<Cart>('POST', '/order/cart/items', { skuId, quantity })
}

export function updateCartItem(skuId: string, quantity: number): Promise<Cart> {
  return req<Cart>('PATCH', `/order/cart/items/${skuId}`, { quantity })
}

export function removeFromCart(skuId: string): Promise<Cart> {
  return req<Cart>('DELETE', `/order/cart/items/${skuId}`)
}

export async function clearCart(): Promise<void> {
  await req('DELETE', '/order/cart')
}

export function checkout(): Promise<{ id: string; status: string }> {
  return req('POST', '/order/cart/checkout')
}
