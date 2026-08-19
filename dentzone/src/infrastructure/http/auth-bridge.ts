export interface AuthHandlers {
  refresh: () => Promise<boolean>
  onSessionExpired: () => void
}

export class AuthBridge implements AuthHandlers {
  refresh = async (): Promise<boolean> => false
  onSessionExpired = (): void => {}

  bind(handlers: AuthHandlers): void {
    this.refresh = handlers.refresh
    this.onSessionExpired = handlers.onSessionExpired
  }
}