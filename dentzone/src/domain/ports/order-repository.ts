import type { CustomerInfo, Order } from '../models/order'

export interface PlaceOrderInput {
  customer: CustomerInfo
  lines: { productId: string; quantity: number }[]
}

export interface OrderRepository {
  create(input: PlaceOrderInput): Promise<Order>
  getById(id: string): Promise<Order | undefined>
  getMine(): Promise<Order[]>
}