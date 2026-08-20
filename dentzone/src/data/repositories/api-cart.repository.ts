import type { CartRepository } from '../../domain/ports/cart-repository'
import type {
  AddToCartRequestDto,
  CartDto,
  RemoveFromCartRequestDto,
  UpdateCartQuantityRequestDto,
} from '../../domain/models/cart'
import { CART_ROUTES } from '../../config/api.config'
import type { HttpClient } from '../../infrastructure/http/http-client'

export class ApiCartRepository implements CartRepository {
  constructor(private readonly http: HttpClient) {}

  getCart(userId: string): Promise<CartDto> {
    return this.http.get<CartDto>(CART_ROUTES.getCart(userId), { showFeedback: false })
  }

  addToCart(request: AddToCartRequestDto): Promise<unknown> {
    return this.http.post<unknown>(CART_ROUTES.addToCart, request, { showFeedback: false })
  }

  updateQuantity(request: UpdateCartQuantityRequestDto): Promise<unknown> {
    return this.http.put<unknown>(CART_ROUTES.updateQuantity, request, { showFeedback: false })
  }

  removeFromCart(request: RemoveFromCartRequestDto): Promise<unknown> {
    return this.http.post<unknown>(CART_ROUTES.removeFromCart, request, { showFeedback: false })
  }
}