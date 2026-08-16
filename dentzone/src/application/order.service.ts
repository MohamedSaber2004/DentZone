import { ref } from 'vue'
import type { CustomerInfo, Order } from '../domain/models/order'
import { createOrder } from '../domain/models/order'
import { cartService } from './cart.service'

const STORAGE_KEY = 'dentzone.orders.v1'

const loadPersistedOrders = (): Order[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Order[]) : []
  } catch {
    return []
  }
}

const generateOrderId = (): string => {
  const serial = Math.floor(100000 + Math.random() * 900000)
  return `DZ-${serial}`
}

export class OrderService {
  readonly orders = ref<Order[]>(loadPersistedOrders())

  placeOrder(customer: CustomerInfo): Order {
    const summary = cartService.summary.value
    const order = createOrder(generateOrderId(), summary.lines, {
      subtotal: summary.subtotal,
      discount: summary.discount,
      shipping: summary.shipping,
      tax: summary.tax,
      total: summary.total,
    }, customer)

    this.orders.value = [order, ...this.orders.value]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.orders.value))
    cartService.clear()
    return order
  }

  getOrderById(id: string): Order | undefined {
    return this.orders.value.find((order) => order.id === id)
  }
}

export const orderService = new OrderService()