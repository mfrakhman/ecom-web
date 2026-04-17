const BASE = import.meta.env.VITE_API_URL as string

interface ApiError {
  message: string | string[]
  statusCode: number
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
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

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export function login(email: string, password: string) {
  return post<{ access_token: string }>('/auth/login', { email, password })
}

export function register(email: string, username: string, password: string) {
  return post<{ message: string }>('/auth/register', { email, username, password })
}
