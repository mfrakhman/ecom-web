import { safeFetch } from './http'

const BASE = (import.meta.env.VITE_API_URL as string) || '/api'

export interface Address {
  id: string
  userId: string
  label: string | null
  street: string
  district: string | null
  subdistrict: string | null
  city: string
  province: string
  postalCode: string | null
  country: string
  isDefault: boolean
  createdAt: string
}

export interface AddressForm {
  label?: string
  street: string
  district?: string
  subdistrict?: string
  city: string
  province: string
  postalCode?: string
  country?: string
  isDefault?: boolean
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('access_token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await safeFetch(`${BASE}${path}`, {
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

export function getAddresses(): Promise<Address[]> {
  return req<Address[]>('GET', '/addresses')
}

export function createAddress(data: AddressForm): Promise<Address> {
  return req<Address>('POST', '/addresses', data)
}

export function updateAddress(id: string, data: Partial<AddressForm>): Promise<Address> {
  return req<Address>('PUT', `/addresses/${id}`, data)
}

export function setDefaultAddress(id: string): Promise<Address> {
  return req<Address>('PATCH', `/addresses/${id}/default`)
}

export function deleteAddress(id: string): Promise<void> {
  return req<void>('DELETE', `/addresses/${id}`)
}
