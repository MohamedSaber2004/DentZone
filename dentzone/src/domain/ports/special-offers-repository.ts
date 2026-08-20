import type { SpecialOfferDto } from '../models/special-offer'

export interface SpecialOffersRepository {
  getOffers(): Promise<SpecialOfferDto[]>
}