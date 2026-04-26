import { setServerDown } from '../composables/useServerError'

const BASE = (import.meta.env.VITE_API_URL as string) || '/api'

let isRefreshing = false

async function tryRefresh(): Promise<boolean> {
  const refreshToken = localStorage.getItem('refresh_token')
  if (!refreshToken) return false

  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
    if (!res.ok) return false
    const { access_token } = await res.json()
    localStorage.setItem('access_token', access_token)
    return true
  } catch {
    return false
  }
}

export async function safeFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  try {
    const res = await fetch(input, init)

    if (res.status === 401 && !isRefreshing) {
      isRefreshing = true
      const refreshed = await tryRefresh()
      isRefreshing = false

      if (refreshed) {
        // rebuild headers with new token and retry
        const newToken = localStorage.getItem('access_token')
        const newInit: RequestInit = {
          ...init,
          headers: {
            ...(init?.headers ?? {}),
            Authorization: `Bearer ${newToken}`,
          },
        }
        return await fetch(input, newInit)
      } else {
        // refresh failed — clear session and redirect to login
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
      }
    }

    return res
  } catch (e) {
    if (e instanceof TypeError) setServerDown()
    throw e
  }
}
