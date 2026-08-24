import type { AddressRepository } from '../../domain/ports/address-repository'
import type { AddressDto, AreaDto, CreateAddressDto, UpdateAddressDto } from '../../domain/models/auth'
import { ADDRESS_ROUTES, AREA_ROUTES } from '../../config/api.config'
import type { HttpClient } from '../../infrastructure/http/http-client'

export class ApiAddressRepository implements AddressRepository {
  constructor(private readonly http: HttpClient) {}

  async getUserAddresses(): Promise<AddressDto[]> {
    try {
      const raw = await this.http.get<unknown>(ADDRESS_ROUTES.userAddresses, { showFeedback: false })
      if (Array.isArray(raw)) return raw as AddressDto[]
      if (raw && typeof raw === 'object') {
        const obj = raw as Record<string, unknown>
        if (Array.isArray(obj.data)) return obj.data as AddressDto[]
        if (Array.isArray(obj.result)) return obj.result as AddressDto[]
        if (Array.isArray(obj.items)) return obj.items as AddressDto[]
        if (Array.isArray(obj.$values)) return obj.$values as AddressDto[]
      }
      return []
    } catch {
      return []
    }
  }

  async getAllAreas(): Promise<AreaDto[]> {
    try {
      const raw = await this.http.get<unknown>(AREA_ROUTES.allAreas, { showFeedback: false })
      if (Array.isArray(raw)) return raw as AreaDto[]
      if (raw && typeof raw === 'object') {
        const obj = raw as Record<string, unknown>
        if (Array.isArray(obj.data)) return obj.data as AreaDto[]
        if (Array.isArray(obj.result)) return obj.result as AreaDto[]
        if (Array.isArray(obj.items)) return obj.items as AreaDto[]
        if (Array.isArray(obj.$values)) return obj.$values as AreaDto[]
      }
      return []
    } catch {
      return []
    }
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