import { ref } from 'vue'
import type { CustomerInfo, Order } from '../domain/models/order'
import type { OrderRepository } from '../domain/ports/order-repository'
import type { CartService } from './cart.service'

export class OrderService {
  private readonly orderRepository: OrderRepository
  private readonly cartService: CartService

  readonly orders = ref<Order[]>([])

  readonly loading = ref(false)

  constructor(orderRepository: OrderRepository, cartService: CartService) {
    this.orderRepository = orderRepository
    this.cartService = cartService
  }

  async placeOrder(customer: CustomerInfo): Promise<Order> {
    const summary = this.cartService.summary.value
    const order = await this.orderRepository.create({
      customer,
      lines: summary.lines.map((line) => ({
        productId: line.product.id,
        quantity: line.quantity,
      })),
    })
    this.cartService.clear()
    return order
  }

  async getOrderById(id: string): Promise<Order | undefined> {
    return this.orderRepository.getById(id)
  }

  async fetchOrders(): Promise<Order[]> {
    this.loading.value = true
    try {
      this.orders.value = await this.orderRepository.getMine()
      return this.orders.value
    } finally {
      this.loading.value = false
    }
  }
}