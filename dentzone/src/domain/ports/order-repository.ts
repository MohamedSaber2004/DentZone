import type { ApplyCouponDto, CreateOrderParams, DeliveryTimeSlotDto, GroupedOrderDto, OrderLimitDto } from '../models/order'

export interface OrderRepository {
  getOrderLimits(): Promise<OrderLimitDto[]>
  getDeliveryTimeSlots(day: number): Promise<DeliveryTimeSlotDto[]>
  applyCoupon(dto: ApplyCouponDto): Promise<unknown>
  getShippingFees(addressId: string): Promise<number>
  createOrder(params: CreateOrderParams): Promise<unknown>
  getMyOrders(status?: number): Promise<GroupedOrderDto[]>
}