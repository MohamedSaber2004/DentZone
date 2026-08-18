import { ref } from 'vue'
import type { CustomerInfo, Order, OrderStatus } from '../domain/models/order'
import { cartService } from './cart.service'
import { ApiError, http } from './http.client'

interface OrderLineDto {
  productId: string
  name: string
  image: string
  price: number
  quantity: number
}

interface CustomerInfoDto {
  name: string
  email: string
  phone: string | null
  address: string
  city: string
  notes: string | null
}

interface OrderDto {
  id: string
  orderNumber: string
  status: string
  createdAt: string
  customer: CustomerInfoDto
  lines: OrderLineDto[]
  subtotal: number
  discount: number
  shipping: number
  tax: number
  total: number
}

const mapOrderDto = (dto: OrderDto): Order => ({
  id: dto.id,
  orderNumber: dto.orderNumber,
  status: (dto.status || 'confirmed') as OrderStatus,
  createdAt: dto.createdAt,
  customer: {
    name: dto.customer?.name ?? '',
    email: dto.customer?.email ?? '',
    phone: dto.customer?.phone ?? '',
    address: dto.customer?.address ?? '',
    city: dto.customer?.city ?? '',
    notes: dto.customer?.notes ?? undefined,
  },
  lines: (dto.lines ?? []).map((line) => ({
    productId: line.productId,
    name: line.name,
    image: line.image,
    price: line.price,
    quantity: line.quantity,
  })),
  totals: {
    subtotal: dto.subtotal ?? 0,
    discount: dto.discount ?? 0,
    shipping: dto.shipping ?? 0,
    tax: dto.tax ?? 0,
    total: dto.total ?? 0,
  },
})

export class OrderService {
  readonly orders = ref<Order[]>([])

  readonly loading = ref(false)

  async placeOrder(customer: CustomerInfo): Promise<Order> {
    const summary = cartService.summary.value
    const dto = await http.post<OrderDto>('/api/v1/orders', {
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone || null,
      shippingAddress: customer.address,
      shippingCity: customer.city,
      notes: customer.notes ?? null,
      lines: summary.lines.map((line) => ({
        productId: line.product.id,
        quantity: line.quantity,
      })),
    })
    const order = mapOrderDto(dto)
    cartService.clear()
    return order
  }

  async getOrderById(id: string): Promise<Order | undefined> {
    try {
      return mapOrderDto(await http.get<OrderDto>(`/api/v1/orders/${encodeURIComponent(id)}`))
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return undefined
      throw err
    }
  }

  async fetchOrders(): Promise<Order[]> {
    this.loading.value = true
    try {
      this.orders.value = (await http.get<OrderDto[]>('/api/v1/orders')).map(mapOrderDto)
      return this.orders.value
    } finally {
      this.loading.value = false
    }
  }
}

export const orderService = new OrderService()
