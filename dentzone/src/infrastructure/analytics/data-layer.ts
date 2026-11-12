export const newEventId = (): string => `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`

export const pushDataLayer = (event: string, params: Record<string, unknown> = {}): void => {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ event, event_id: newEventId(), ...params })
}
