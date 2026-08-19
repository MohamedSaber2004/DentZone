import type { OrderRepository, PlaceOrderInput } from '../../domain/ports/order-repository'
import type { Order, OrderStatus } from '../../domain/models/order'
import { ORDER_ROUTES } from '../../config/api.config'
import type { HttpClient } from '../../infrastructure/http/http-client'
import { ApiError } from '../../infrastructure/http/api-error'

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

export class ApiOrderRepository implements OrderRepository {
  constructor(private readonly http: HttpClient) {}

  async create(input: PlaceOrderInput): Promise<Order> {
    const dto = await this.http.post<OrderDto>(ORDER_ROUTES.base, {
      customerName: input.customer.name,
      customerEmail: input.customer.email,
      customerPhone: input.customer.phone || null,
      shippingAddress: input.customer.address,
      shippingCity: input.customer.city,
      notes: input.customer.notes ?? null,
      lines: input.lines.map((line) => ({
        productId: line.productId,
        quantity: line.quantity,
      })),
    })
    return mapOrderDto(dto)
  }

  async getById(id: string): Promise<Order | undefined> {
    try {
      return mapOrderDto(await this.http.get<OrderDto>(ORDER_ROUTES.byId(id)))
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return undefined
      throw err
    }
  }

  async getMine(): Promise<Order[]> {
    const dto = await this.http.get<OrderDto[]>(ORDER_ROUTES.base)
    return (dto ?? []).map(mapOrderDto)
  }
}