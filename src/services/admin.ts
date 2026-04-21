import { safeFetch } from './http'

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
  imageUrl: string | null
  stock: { id: string; amount: number } | null
}

export interface ProductDetail {
  id: string
  name: string
  description: string | null
  category: Category
  imageUrl: string | null
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

export interface CreateSkuInProductPayload {
  skuCode: string
  name: string
  description: string
  size: string
  color: string
  price: number
  isActive: boolean
  quantity: number
}

export interface CreateProductPayload {
  name: string
  description: string
  category: Category
  skus: [CreateSkuInProductPayload, ...CreateSkuInProductPayload[]]
}

function headers() {
  const token = localStorage.getItem('access_token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await safeFetch(`${BASE}${path}`, {
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

export function createProduct(data: CreateProductPayload) {
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

async function upload<T>(path: string, file: File): Promise<T> {
  const token = localStorage.getItem('access_token')
  const form = new FormData()
  form.append('file', file)
  const res = await safeFetch(`${BASE}${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  })
  const json = await res.json()
  if (!res.ok) {
    const msg = Array.isArray(json.message) ? json.message[0] : json.message
    throw new Error(msg || 'Upload failed')
  }
  return json
}

export function uploadProductImage(id: string, file: File) {
  return upload<{ imageUrl: string }>(`/products/${id}/image`, file)
}

export function deleteProductImage(id: string) {
  return req<{ message: string }>('DELETE', `/products/${id}/image`)
}

export function uploadSkuImage(id: string, file: File) {
  return upload<{ imageUrl: string }>(`/products/skus/${id}/image`, file)
}

export function deleteSkuImage(id: string) {
  return req<{ message: string }>('DELETE', `/products/skus/${id}/image`)
}
