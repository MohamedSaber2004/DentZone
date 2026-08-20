import type { SpecialOffersRepository } from '../../domain/ports/special-offers-repository'
import type { SpecialOfferDto } from '../../domain/models/special-offer'
import { SPECIAL_OFFERS_ROUTES } from '../../config/api.config'
import type { HttpClient } from '../../infrastructure/http/http-client'

export class ApiSpecialOffersRepository implements SpecialOffersRepository {
  constructor(private readonly http: HttpClient) {}

  getOffers(): Promise<SpecialOfferDto[]> {
    return this.http.get<SpecialOfferDto[]>(SPECIAL_OFFERS_ROUTES.offers, { showFeedback: false })
  }
}