import { safeFetch } from './http'

const BASE = (import.meta.env.VITE_API_URL as string) || '/api'

export interface ColorRef { id: string; name: string; slug: string; hex: string }
export interface SizeRef  { id: string; name: string; slug: string; sizeGroup: string }
export interface CategoryRef { id: string; name: string; slug: string; parentId: string | null }
export interface ProductColorImage { id: string; colorId: string; imageUrl: string }

export interface SkuInfo {
  id: string
  skuCode: string
  colorId: string
  color: ColorRef
  sizeId: string | null
  size: SizeRef | null
  price: number
  compareAt: number | null
  isActive: boolean
  stock: { id: string; amount: number; reserved?: number } | null
  product?: { id: string; name: string; images?: ProductColorImage[] }
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  categoryId: string
  category?: CategoryRef
  sizeGroup: string | null
  images?: ProductColorImage[]
  createdAt: string
  updatedAt: string
}

export interface ProductDetail extends Product {
  images: ProductColorImage[]
  skus: SkuInfo[]
}

export async function getProductDetail(id: string): Promise<ProductDetail> {
  const res = await safeFetch(`${BASE}/products/${id}`)
  if (!res.ok) throw new Error('Failed to fetch product')
  const json = await res.json()
  return json.data ?? json
}

export async function getProductSkus(productId: string): Promise<SkuInfo[]> {
  const detail = await getProductDetail(productId)
  return detail.skus ?? []
}

export async function getSkuById(skuId: string): Promise<SkuInfo> {
  const res = await safeFetch(`${BASE}/products/skus/${skuId}`)
  if (!res.ok) throw new Error('Failed to fetch SKU')
  const json = await res.json()
  return json.data ?? json
}

export async function getProducts(params: {
  page?: number
  limit?: number
  query?: string
} = {}): Promise<Product[]> {
  const q = new URLSearchParams()
  if (params.page) q.set('page', String(params.page))
  if (params.limit) q.set('limit', String(params.limit))
  if (params.query) q.set('query', params.query)

  const res = await safeFetch(`${BASE}/products?${q}`)
  if (!res.ok) throw new Error('Failed to fetch products')
  const json = await res.json()
  return Array.isArray(json) ? json : (json.data ?? [])
}
