import type { AddressDto, AreaDto, CreateAddressDto, UpdateAddressDto } from '../models/auth'

export interface AddressRepository {
  getUserAddresses(): Promise<AddressDto[]>
  getAllAreas(): Promise<AreaDto[]>
  insertAddress(dto: CreateAddressDto): Promise<unknown>
  updateAddress(id: string, dto: UpdateAddressDto): Promise<unknown>
  deleteAddress(id: string): Promise<unknown>
}