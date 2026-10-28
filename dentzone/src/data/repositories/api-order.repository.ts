import type { OrderRepository } from '../../domain/ports/order-repository'
import type { ApplyCouponDto, CreateOrderParams, DeliveryTimeSlotDto, GroupedOrderDto, OrderLimitDto } from '../../domain/models/order'
import { ORDER_ROUTES } from '../../config/api.config'
import type { HttpClient } from '../../infrastructure/http/http-client'

interface DeliveryTimeSlotsResult {
  value?: DeliveryTimeSlotDto[] | null
  Count?: number
}

export class ApiOrderRepository implements OrderRepository {
  private cachedLimits: OrderLimitDto[] | null = null

  constructor(private readonly http: HttpClient) {}

  async getOrderLimits(): Promise<OrderLimitDto[]> {
    if (this.cachedLimits && this.cachedLimits.length > 0) {
      return this.cachedLimits
    }
    try {
      const result = await this.http.get<OrderLimitDto[] | { value?: OrderLimitDto[] } | null>(
        ORDER_ROUTES.getLimitsOrder,
        { showFeedback: false },
      )
      const list = Array.isArray(result) ? result : result?.value ?? []
      if (list.length > 0) {
        this.cachedLimits = list
      }
      return list
    } catch {
      return this.cachedLimits ?? []
    }
  }

  async getDeliveryTimeSlots(day: number): Promise<DeliveryTimeSlotDto[]> {
    const result = await this.http.get<DeliveryTimeSlotDto[] | DeliveryTimeSlotsResult>(
      ORDER_ROUTES.deliveryTimeSlots(day),
      { showFeedback: false },
    )
    if (Array.isArray(result)) return result
    return result?.value ?? []
  }

  applyCoupon(dto: ApplyCouponDto): Promise<unknown> {
    return this.http.post<unknown>(ORDER_ROUTES.applyCoupon, dto, { showFeedback: false })
  }

  getShippingFees(addressId: string): Promise<number> {
    return this.http.get<number>(ORDER_ROUTES.shippingFees(addressId), { showFeedback: false })
  }

  createOrder(params: CreateOrderParams): Promise<unknown> {
    const query = new URLSearchParams()
    query.set('addresssId', params.addresssId)
    query.set('addressId', params.addresssId)
    query.set('deliveryDate', String(params.deliveryDate))
    query.set('deliveryTimeSlotId', params.deliveryTimeSlotId)
    if (params.orderNote) query.set('orderNote', params.orderNote)
    if (params.couponCode) query.set('couponCode', params.couponCode)
    return this.http.post<unknown>(`${ORDER_ROUTES.create}?${query.toString()}`)
  }

  async getMyOrders(status?: number): Promise<GroupedOrderDto[]> {
    const result = await this.http.get<GroupedOrderDto[]>(ORDER_ROUTES.myOrders(status), {
      showFeedback: false,
    })
    return result ?? []
  }
}