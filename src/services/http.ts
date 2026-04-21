import { setServerDown } from '../composables/useServerError'

export async function safeFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init)
  } catch (e) {
    if (e instanceof TypeError) setServerDown()
    throw e
  }
}
