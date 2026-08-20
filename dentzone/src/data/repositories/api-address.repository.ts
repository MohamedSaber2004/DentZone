import type { AddressRepository } from '../../domain/ports/address-repository'
import type { AddressDto, AreaDto, CreateAddressDto, UpdateAddressDto } from '../../domain/models/auth'
import { ADDRESS_ROUTES, AREA_ROUTES } from '../../config/api.config'
import type { HttpClient } from '../../infrastructure/http/http-client'

export class ApiAddressRepository implements AddressRepository {
  constructor(private readonly http: HttpClient) {}

  getUserAddresses(): Promise<AddressDto[]> {
    return this.http.get<AddressDto[]>(ADDRESS_ROUTES.userAddresses, { showFeedback: false })
  }

  getAllAreas(): Promise<AreaDto[]> {
    return this.http.get<AreaDto[]>(AREA_ROUTES.allAreas, { showFeedback: false })
  }

  insertAddress(dto: CreateAddressDto): Promise<unknown> {
    return this.http.post(ADDRESS_ROUTES.insert, dto)
  }

  updateAddress(id: string, dto: UpdateAddressDto): Promise<unknown> {
    return this.http.put(ADDRESS_ROUTES.update(id), dto)
  }

  deleteAddress(id: string): Promise<unknown> {
    return this.http.del(ADDRESS_ROUTES.delete(id))
  }
}