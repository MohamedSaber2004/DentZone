import { HttpClient } from '../infrastructure/http/http-client'
import { TokenStore } from '../infrastructure/http/token-store'
import { AuthBridge } from '../infrastructure/http/auth-bridge'
import { ModalService } from '../infrastructure/feedback/modal.service'
import { ApiCatalogRepository } from '../data/repositories/api-catalog.repository'
import { ApiAuthRepository } from '../data/repositories/api-auth.repository'
import { ApiOrderRepository } from '../data/repositories/api-order.repository'
import { ApiWishlistRepository } from '../data/repositories/api-wishlist.repository'
import { AuthService } from '../application/auth.service'
import { CatalogService } from '../application/catalog.service'
import { CartService } from '../application/cart.service'
import { OrderService } from '../application/order.service'
import { WishlistService } from '../application/wishlist.service'
import { AdvertisementService } from '../application/advertisement.service'
import { ChatService } from '../application/chat.service'

type AnyConstructor = new (...args: never[]) => unknown

class ServiceContainer {
  private readonly factories = new Map<AnyConstructor, () => unknown>()
  private readonly instances = new Map<AnyConstructor, unknown>()

  register<T>(key: AnyConstructor, factory: () => T): void {
    this.factories.set(key, factory)
  }

  resolve<T>(key: AnyConstructor): T {
    let instance = this.instances.get(key) as T | undefined
    if (instance === undefined) {
      const factory = this.factories.get(key)
      if (!factory) throw new Error(`No factory registered for ${key.name}`)
      instance = factory() as T
      this.instances.set(key, instance)
    }
    return instance
  }
}

export const container = new ServiceContainer()

// --- infrastructure ---
container.register(TokenStore, () => new TokenStore())
container.register(AuthBridge, () => new AuthBridge())
container.register(ModalService, () => new ModalService())
container.register(HttpClient, () =>
  new HttpClient({
    tokenStore: container.resolve<TokenStore>(TokenStore),
    authBridge: container.resolve<AuthBridge>(AuthBridge),
    feedback: container.resolve<ModalService>(ModalService),
  }),
)

// --- data repositories ---
container.register(ApiCatalogRepository, () => new ApiCatalogRepository(container.resolve<HttpClient>(HttpClient)))
container.register(ApiAuthRepository, () => new ApiAuthRepository(container.resolve<HttpClient>(HttpClient)))
container.register(ApiOrderRepository, () => new ApiOrderRepository(container.resolve<HttpClient>(HttpClient)))
container.register(ApiWishlistRepository, () => new ApiWishlistRepository(container.resolve<HttpClient>(HttpClient)))

// --- application services ---
container.register(CatalogService, () => new CatalogService(container.resolve<ApiCatalogRepository>(ApiCatalogRepository)))
container.register(CartService, () => new CartService(container.resolve<CatalogService>(CatalogService)))
container.register(AuthService, () =>
  new AuthService(
    container.resolve<ApiAuthRepository>(ApiAuthRepository),
    container.resolve<TokenStore>(TokenStore),
    container.resolve<AuthBridge>(AuthBridge),
  ),
)
container.register(OrderService, () =>
  new OrderService(
    container.resolve<ApiOrderRepository>(ApiOrderRepository),
    container.resolve<CartService>(CartService),
  ),
)
container.register(WishlistService, () =>
  new WishlistService(
    container.resolve<ApiWishlistRepository>(ApiWishlistRepository),
    container.resolve<AuthService>(AuthService),
    container.resolve<CatalogService>(CatalogService),
  ),
)
container.register(AdvertisementService, () =>
  new AdvertisementService(container.resolve<CatalogService>(CatalogService)),
)

export const services = {
  tokenStore: container.resolve<TokenStore>(TokenStore),
  authBridge: container.resolve<AuthBridge>(AuthBridge),
  modalService: container.resolve<ModalService>(ModalService),
  authService: container.resolve<AuthService>(AuthService),
  catalogService: container.resolve<CatalogService>(CatalogService),
  cartService: container.resolve<CartService>(CartService),
  orderService: container.resolve<OrderService>(OrderService),
  wishlistService: container.resolve<WishlistService>(WishlistService),
  advertisementService: container.resolve<AdvertisementService>(AdvertisementService),
  chatService: new ChatService(),
}

export const modalService = services.modalService
export const authService = services.authService
export const catalogService = services.catalogService
export const cartService = services.cartService
export const orderService = services.orderService
export const wishlistService = services.wishlistService
export const advertisementService = services.advertisementService
export const chatService = services.chatService