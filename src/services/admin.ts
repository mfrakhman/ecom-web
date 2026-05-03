import { safeFetch } from './http'
import type { ColorRef, SizeRef, CategoryRef, GenderRef, CategoryGroupRef, ProductColorImage, SkuInfo, ProductDetail } from './products'

export type { ColorRef, SizeRef, CategoryRef, GenderRef, CategoryGroupRef, ProductColorImage, SkuInfo, ProductDetail }

const BASE = (import.meta.env.VITE_API_URL as string) || '/api'

export interface CreateSkuPayload {
  skuCode: string
  colorId: string
  sizeId?: string
  price: number
  compareAt?: number
  isActive: boolean
  product_id: string
  quantity: number
}

export interface CreateSkuInProductPayload {
  skuCode: string
  colorId: string
  sizeId?: string
  price: number
  compareAt?: number
  isActive: boolean
  quantity: number
}

export interface CreateProductPayload {
  name: string
  slug: string
  description?: string
  categoryId: string
  sizeGroup?: string
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

// Products
export function getProduct(id: string) {
  return req<{ message: string; data: ProductDetail }>('GET', `/products/${id}`)
}

export function createProduct(data: CreateProductPayload) {
  return req<{ message: string; data: ProductDetail }>('POST', '/products', data)
}

export function updateProduct(id: string, data: { name?: string; description?: string; slug?: string; categoryId?: string; sizeGroup?: string }) {
  return req<{ message: string }>('PATCH', `/products/${id}`, data)
}

export function deleteProduct(id: string) {
  return req<{ message: string }>('DELETE', `/products/${id}`)
}

export interface UpdateSkuPayload {
  skuCode?: string
  colorId?: string
  sizeId?: string | null
  price?: number
  compareAt?: number | null
  isActive?: boolean
}

// SKUs
export function createSku(data: CreateSkuPayload) {
  return req<{ message: string; data: SkuInfo }>('POST', '/products/skus', data)
}

export function updateSku(id: string, data: UpdateSkuPayload) {
  return req<{ message: string; data: SkuInfo }>('PATCH', `/products/skus/${id}`, data)
}

export function restockSku(id: string, quantity: number) {
  return req<{ message: string }>('POST', `/products/skus/${id}/restock`, { quantity })
}

// Color images
export function getColorImages(productId: string, colorId: string) {
  return req<{ message: string; data: ProductColorImage[] }>('GET', `/products/${productId}/colors/${colorId}/images`)
}

export function uploadColorImage(productId: string, colorId: string, file: File) {
  return upload<{ message: string; data: ProductColorImage }>(`/products/${productId}/colors/${colorId}/images`, file)
}

export function deleteColorImage(productId: string, colorId: string, imageId: string) {
  return req<{ message: string }>('DELETE', `/products/${productId}/colors/${colorId}/images/${imageId}`)
}

// Reference data
export type CategoryNode = CategoryRef

export function getCategories(): Promise<{ message: string; data: CategoryRef[] }> {
  return req('GET', '/categories')
}

export function getGenders(): Promise<{ message: string; data: GenderRef[] }> {
  return req('GET', '/genders')
}

export function getCategoryGroups(): Promise<{ message: string; data: CategoryGroupRef[] }> {
  return req('GET', '/category-groups')
}

export function getColors(): Promise<{ message: string; data: ColorRef[] }> {
  return req('GET', '/colors')
}

export function getSizes(sizeGroup?: string): Promise<{ message: string; data: SizeRef[] }> {
  const q = sizeGroup ? `?sizeGroup=${sizeGroup}` : ''
  return req('GET', `/sizes${q}`)
}

// Categories CRUD
export function createCategory(data: { name: string; slug: string; genderId: string; groupId: string; displayOrder?: number }) {
  return req<{ message: string; data: CategoryRef }>('POST', '/categories', data)
}
export function updateCategory(id: string, data: { name?: string; slug?: string; genderId?: string; groupId?: string; displayOrder?: number }) {
  return req<{ message: string }>('PATCH', `/categories/${id}`, data)
}
export function deleteCategory(id: string) {
  return req<{ message: string }>('DELETE', `/categories/${id}`)
}

// Colors CRUD
export function createColor(data: { name: string; slug: string; hex: string; displayOrder?: number }) {
  return req<{ message: string; data: ColorRef }>('POST', '/colors', data)
}
export function updateColor(id: string, data: { name?: string; slug?: string; hex?: string; displayOrder?: number }) {
  return req<{ message: string }>('PATCH', `/colors/${id}`, data)
}
export function deleteColor(id: string) {
  return req<{ message: string }>('DELETE', `/colors/${id}`)
}

// Sizes CRUD
export function createSize(data: { sizeGroup: string; name: string; slug: string; sortOrder: number }) {
  return req<{ message: string; data: SizeRef }>('POST', '/sizes', data)
}
export function updateSize(id: string, data: { sizeGroup?: string; name?: string; slug?: string; sortOrder?: number }) {
  return req<{ message: string }>('PATCH', `/sizes/${id}`, data)
}
export function deleteSize(id: string) {
  return req<{ message: string }>('DELETE', `/sizes/${id}`)
}
