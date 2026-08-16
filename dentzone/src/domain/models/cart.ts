import type { Product } from './product'

export interface CartLine {
  product: Product
  quantity: number
}

export interface CartSummary {
  lines: CartLine[]
  itemCount: number
  subtotal: number
  discount: number
  shipping: number
  tax: number
  total: number
}