export interface DeliveryTimeSlotDto {
  id: string
  name: string
  from: string
  to: string
  isNow: boolean
}

export interface ApplyCouponDto {
  code: string
  amount: number
}

export interface CreateOrderParams {
  addresssId: string
  deliveryDate: number
  orderNote?: string
  deliveryTimeSlotId: string
  couponCode?: string
}

export enum OrderStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
  Prepared = 3,
  Shipped = 4,
  Delivered = 5,
  Completed = 6,
  ReAssignTo = 7,
  Refund = 8,
  Cancel = 9,
}

export interface OrderItemDto {
  id?: string
  productId: string
  productName: string
  inventoryName: string
  productPriceId: string
  quantity: number
  unitPrice: number
  inventoryUserId?: string
}

export interface OrderDto {
  id: string
  userId: string
  inventoryUserId?: string
  inventoryName?: string
  couponId?: string
  couponCode?: string
  doctorName?: string
  couponPrecentage?: number
  descountAmount?: number
  descountType: string
  address: string
  orderDate: string
  status: OrderStatus
  totalAmount: number
  deliveryUserId?: string
  deliveryName?: string
  orderNote?: string
  deliveryOptionName?: string
  latlong?: string
  orderNumber?: string
  deliveryTimeName?: string
  items: OrderItemDto[]
}

export interface GroupedOrderDto {
  orderNumber: string
  doctorName: string
  phoneNumber: string
  orders: OrderDto[]
  status: OrderStatus
  totalAmountOrder: number
  totalAmountOrderAfter: number
  coupon: number
  shippingFees: number
}
