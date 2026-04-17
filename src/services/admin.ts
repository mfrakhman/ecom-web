const BASE = (import.meta.env.VITE_API_URL as string) || '/api'

export type Category = 'BAGS' | 'SHOES' | 'CLOTHES' | 'PANTS'
export const CATEGORIES: Category[] = ['BAGS', 'SHOES', 'CLOTHES', 'PANTS']

export interface Sku {
  id: string
  skuCode: string
  name: string
  description: string | null
  size: string | null
  color: string | null
  price: number
  isActive: boolean
  stock: { id: string; amount: number } | null
}

export interface ProductDetail {
  id: string
  name: string
  description: string | null
  category: Category
  skus: Sku[]
  createdAt: string
  updatedAt: string
}

export interface CreateSkuPayload {
  name: string
  description: string
  skuCode: string
  size: string
  color: string
  price: number
  isActive: boolean
  product_id: string
  quantity: number
}

function headers() {
  const token = localStorage.getItem('access_token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: headers(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const json = await res.json()
  if (!res.ok) {
    const msg = Array.isArray(json.message) ? json.message[0] : json.message
    throw new Error(msg || 'Request failed')
  }
  return json
}

export function getProduct(id: string) {
  return req<{ message: string; data: ProductDetail }>('GET', `/products/${id}`)
}

export function createProduct(data: { name: string; description: string; category: Category }) {
  return req<{ message: string; data: ProductDetail }>('POST', '/products', data)
}

export function updateProduct(id: string, data: { name: string; description: string }) {
  return req<{ message: string }>('PATCH', `/products/${id}`, data)
}

export function deleteProduct(id: string) {
  return req<{ message: string }>('DELETE', `/products/${id}`)
}

export function createSku(data: CreateSkuPayload) {
  return req<{ message: string; data: Sku }>('POST', '/products/skus', data)
}

export function restockSku(id: string, quantity: number) {
  return req<{ message: string }>('POST', `/products/skus/${id}/restock`, { quantity })
}
