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

export interface UserInfo {
  sub: string
  email: string
  username?: string
  name?: string
  role: string
  iat?: number
  exp?: number
}

export function getUser(): UserInfo | null {
  const token = getToken()
  if (!token) return null
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch {
    return null
  }
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

export function sendVerificationOtp(email: string) {
  return post<{ message: string }>('/auth/verify-email/send', { email })
}

export function verifyEmail(email: string, code: string) {
  return post<{ message: string; access_token: string; refresh_token: string }>('/auth/verify-email', { email, code })
}

export function sendLoginOtp(email: string) {
  return post<{ message: string }>('/auth/login/otp/send', { email })
}

export function verifyLoginOtp(email: string, code: string) {
  return post<{ access_token: string; refresh_token: string }>('/auth/login/otp', { email, code })
}

export function sendForgotPasswordOtp(email: string) {
  return post<{ message: string }>('/auth/forgot-password', { email })
}

export function verifyForgotPasswordOtp(email: string, code: string) {
  return post<{ reset_token: string }>('/auth/forgot-password/verify', { email, code })
}

export function resetPassword(token: string, password: string) {
  return post<{ message: string }>('/auth/reset-password', { token, password })
}

export interface Profile {
  id: string
  email: string
  username?: string
  role: string
  firstName: string | null
  lastName: string | null
  dob: string | null
  gender: 'MALE' | 'FEMALE' | null
  phone: string | null
  profilePhotoUrl: string | null
  createdAt: string
  updatedAt: string
}

function authHeaders(): Record<string, string> {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function getMe(): Promise<Profile> {
  const res = await safeFetch(`${BASE}/auth/me`, { headers: authHeaders() })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Failed to load profile')
  return data
}

export async function updateMe(payload: Partial<Omit<Profile, 'id' | 'email' | 'role' | 'createdAt' | 'updatedAt'>>): Promise<Profile> {
  const res = await safeFetch(`${BASE}/auth/me`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Failed to update profile')
  return data
}

export async function uploadPhoto(file: File): Promise<Profile> {
  const form = new FormData()
  form.append('file', file)
  const res = await safeFetch(`${BASE}/auth/me/photo`, {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Upload failed')
  return data
}

export async function deletePhoto(): Promise<Profile> {
  const res = await safeFetch(`${BASE}/auth/me/photo`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Delete failed')
  return data
}

export async function getUsers(): Promise<Profile[]> {
  const res = await safeFetch(`${BASE}/users`, { headers: authHeaders() })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Failed to load users')
  return data
}

export async function deleteUser(id: string): Promise<void> {
  const res = await safeFetch(`${BASE}/users/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.message || 'Failed to delete user')
  }
}
