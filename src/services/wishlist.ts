import { safeFetch } from './http'

const BASE = (import.meta.env.VITE_API_URL as string) || '/api'

export interface WishlistItem {
  id: string
  userId: string
  skuId: string
  convertedAt: string | null
  convertedOrderId: string | null
  createdAt: string
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('access_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function getWishlist(): Promise<WishlistItem[]> {
  const res = await safeFetch(`${BASE}/wishlist`, { headers: authHeaders() })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Failed to fetch wishlist')
  return json
}

export async function addToWishlist(skuId: string): Promise<WishlistItem> {
  const res = await safeFetch(`${BASE}/wishlist/${skuId}`, {
    method: 'POST',
    headers: authHeaders(),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Failed to add to wishlist')
  return json
}

export async function removeFromWishlist(skuId: string): Promise<void> {
  await safeFetch(`${BASE}/wishlist/${skuId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
}
