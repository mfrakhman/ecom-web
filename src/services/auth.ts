import { safeFetch } from './http'

const BASE = (import.meta.env.VITE_API_URL as string) || '/api'

interface ApiError {
  message: string | string[]
  statusCode: number
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await safeFetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data: T | ApiError = await res.json()
  if (!res.ok) {
    const err = data as ApiError
    const msg = Array.isArray(err.message) ? err.message[0] : err.message
    throw new Error(msg || 'Request failed')
  }
  return data as T
}

export const TOKEN_KEY = 'access_token'
export const REFRESH_KEY = 'refresh_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY)
}

export function saveRefreshToken(token: string): void {
  localStorage.setItem(REFRESH_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

export function getRole(): string | null {
  const token = getToken()
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.role ?? null
  } catch {
    return null
  }
}

export function login(email: string, password: string) {
  return post<{ access_token: string; refresh_token: string }>('/auth/login', { email, password })
}

export function register(email: string, username: string, password: string) {
  return post<{ message: string }>('/auth/register', { email, username, password })
}
