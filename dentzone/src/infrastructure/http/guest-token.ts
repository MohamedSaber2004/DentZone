import { API_BASE_URL, AUTH_ROUTES } from '../../config/api.config'

let cachedGuestToken: string | null = null
let guestTokenPromise: Promise<string | null> | null = null

/**
 * Retrieves a guest session token from the backend.
 * Caches the token in memory to avoid repeated login requests.
 */
export const getGuestToken = async (): Promise<string | null> => {
  if (cachedGuestToken) return cachedGuestToken
  if (guestTokenPromise) return guestTokenPromise

  guestTokenPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}${AUTH_ROUTES.loginGuest}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usernameOrEmail: 'guest@guest.com',
          password: '123123',
        }),
      })

      if (!response.ok) return null
      const data = (await response.json().catch(() => null)) as { token?: string } | null
      if (data?.token) {
        cachedGuestToken = data.token
        return cachedGuestToken
      }
      return null
    } catch {
      return null
    } finally {
      guestTokenPromise = null
    }
  })()

  return guestTokenPromise
}
