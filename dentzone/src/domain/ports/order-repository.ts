import type { ApplyCouponDto, CreateOrderParams, DeliveryTimeSlotDto, GroupedOrderDto } from '../models/order'

export interface OrderRepository {
  getDeliveryTimeSlots(day: number): Promise<DeliveryTimeSlotDto[]>
  applyCoupon(dto: ApplyCouponDto): Promise<unknown>
  getShippingFees(addressId: string): Promise<number>
  createOrder(params: CreateOrderParams): Promise<unknown>
  getMyOrders(status?: number): Promise<GroupedOrderDto[]>
}