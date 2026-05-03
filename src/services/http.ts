import { setServerDown } from '../composables/useServerError'

const BASE = (import.meta.env.VITE_API_URL as string) || '/api'

let isRefreshing = false
let refreshQueue: Array<(token: string | null) => void> = []

function enqueueRefresh(): Promise<string | null> {
  return new Promise((resolve) => { refreshQueue.push(resolve) })
}

function drainQueue(token: string | null) {
  refreshQueue.forEach((resolve) => resolve(token))
  refreshQueue = []
}

async function tryRefresh(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refresh_token')
  if (!refreshToken) return null
  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
    if (!res.ok) return null
    const { access_token } = await res.json()
    localStorage.setItem('access_token', access_token)
    return access_token
  } catch {
    return null
  }
}

function redirectToLogin() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  const redirect = encodeURIComponent(window.location.pathname + window.location.search)
  window.location.href = `/login?redirect=${redirect}`
}

export async function safeFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  try {
    const res = await fetch(input, init)

    if (res.status === 401) {
      if (isRefreshing) {
        const newToken = await enqueueRefresh()
        if (!newToken) { redirectToLogin(); return res }
        return fetch(input, {
          ...init,
          headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${newToken}` },
        })
      }

      isRefreshing = true
      const newToken = await tryRefresh()
      isRefreshing = false
      drainQueue(newToken)

      if (newToken) {
        return fetch(input, {
          ...init,
          headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${newToken}` },
        })
      }

      redirectToLogin()
      return res
    }

    return res
  } catch (e) {
    if (e instanceof TypeError) setServerDown()
    throw e
  }
}
