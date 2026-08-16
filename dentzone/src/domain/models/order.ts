import type { CartLine } from './cart'

export type OrderStatus = 'confirmed' | 'processing' | 'shipped' | 'delivered'

export interface CustomerInfo {
  name: string
  email: string
  phone: string
  address: string
  city: string
  notes?: string
}

export interface OrderLine {
  productId: string
  name: string
  image: string
  price: number
  quantity: number
}

export interface OrderTotals {
  subtotal: number
  discount: number
  shipping: number
  tax: number
  total: number
}

export interface Order {
  id: string
  lines: OrderLine[]
  totals: OrderTotals
  customer: CustomerInfo
  status: OrderStatus
  createdAt: string
}

export const createOrder = (id: string, lines: CartLine[], totals: OrderTotals, customer: CustomerInfo): Order => ({
  id,
  lines: lines.map((line) => ({
    productId: line.product.id,
    name: line.product.name,
    image: line.product.image,
    price: line.product.price,
    quantity: line.quantity,
  })),
  totals,
  customer,
  status: 'confirmed',
  createdAt: new Date().toISOString(),
})