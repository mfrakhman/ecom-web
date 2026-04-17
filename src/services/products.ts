const BASE = (import.meta.env.VITE_API_URL as string) || '/api'

export type Category = 'BAGS' | 'SHOES' | 'CLOTHES' | 'PANTS'

export interface Product {
  id: string
  name: string
  description: string | null
  category: Category
  createdAt: string
  updatedAt: string
}

export interface SkuInfo {
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
  skus: SkuInfo[]
}

export async function getProductDetail(id: string): Promise<ProductDetail> {
  const res = await fetch(`${BASE}/products/${id}`)
  if (!res.ok) throw new Error('Failed to fetch product')
  const json = await res.json()
  return json.data ?? json
}

export async function getProductSkus(productId: string): Promise<SkuInfo[]> {
  const res = await fetch(`${BASE}/products/${productId}/skus`)
  if (!res.ok) throw new Error('Failed to fetch SKUs')
  const json = await res.json()
  return Array.isArray(json) ? json : (json.data ?? [])
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

  const res = await fetch(`${BASE}/products?${q}`)
  if (!res.ok) throw new Error('Failed to fetch products')
  const json = await res.json()
  // handle both {data: [...]} and [...] shapes
  return Array.isArray(json) ? json : (json.data ?? [])
}
