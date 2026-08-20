export interface PolicyRepository {
  getPolicy(lang: number): Promise<string>
  getRefundPolicy(lang: number): Promise<string>
}