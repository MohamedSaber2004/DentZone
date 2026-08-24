import type { HomeDto, HomeProviderDto } from '../models/home'

export interface HomeRepository {
  getHome(lang: number): Promise<HomeDto>
  getTopProviders(lang?: number): Promise<HomeProviderDto[]>
  getAllProviders(lang?: number): Promise<HomeProviderDto[]>
}