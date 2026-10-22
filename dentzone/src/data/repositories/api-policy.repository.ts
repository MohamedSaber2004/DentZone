import type { PolicyRepository } from '../../domain/ports/policy-repository'
import { POLICY_ROUTES, REFUND_POLICY_ROUTES, TERMS_ROUTES } from '../../config/api.config'
import type { HttpClient } from '../../infrastructure/http/http-client'
import { getGuestToken } from '../../infrastructure/http/guest-token'

export class ApiPolicyRepository implements PolicyRepository {
  constructor(private readonly http: HttpClient) {}

  private async getAuthHeaders(): Promise<Record<string, string>> {
    if (!this.http.hasToken) {
      const guestToken = await getGuestToken()
      if (guestToken) {
        return { Authorization: `Bearer ${guestToken}` }
      }
    }
    return {}
  }

  async getPolicy(lang: number): Promise<string> {
    const headers = await this.getAuthHeaders()
    return this.http.getText<string>(POLICY_ROUTES.getPolicy(lang), { headers, showFeedback: false })
  }

  async getRefundPolicy(lang: number): Promise<string> {
    const headers = await this.getAuthHeaders()
    return this.http.getText<string>(REFUND_POLICY_ROUTES.getRefundPolicy(lang), { headers, showFeedback: false })
  }

  async getTerms(lang: number): Promise<string> {
    const headers = await this.getAuthHeaders()
    return this.http.getText<string>(TERMS_ROUTES.getTerms(lang), { headers, showFeedback: false })
  }
}