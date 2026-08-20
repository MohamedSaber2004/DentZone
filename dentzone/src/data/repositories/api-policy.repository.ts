import type { PolicyRepository } from '../../domain/ports/policy-repository'
import { POLICY_ROUTES, REFUND_POLICY_ROUTES } from '../../config/api.config'
import type { HttpClient } from '../../infrastructure/http/http-client'

export class ApiPolicyRepository implements PolicyRepository {
  constructor(private readonly http: HttpClient) {}

  getPolicy(lang: number): Promise<string> {
    return this.http.getText<string>(POLICY_ROUTES.getPolicy(lang), { showFeedback: false })
  }

  getRefundPolicy(lang: number): Promise<string> {
    return this.http.getText<string>(REFUND_POLICY_ROUTES.getRefundPolicy(lang), { showFeedback: false })
  }
}