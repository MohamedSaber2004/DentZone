import type {
  AddToCartRequestDto,
  CartDto,
  RemoveFromCartRequestDto,
  UpdateCartQuantityRequestDto,
} from '../models/cart'

export interface CartRepository {
  getCart(userId: string): Promise<CartDto>
  addToCart(request: AddToCartRequestDto): Promise<unknown>
  updateQuantity(request: UpdateCartQuantityRequestDto): Promise<unknown>
  removeFromCart(request: RemoveFromCartRequestDto): Promise<unknown>
}