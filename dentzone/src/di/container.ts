import { HttpClient } from '../infrastructure/http/http-client'
import { TokenStore } from '../infrastructure/http/token-store'
import { AuthBridge } from '../infrastructure/http/auth-bridge'
import { ModalService } from '../infrastructure/feedback/modal.service'
import { ApiAuthRepository } from '../data/repositories/api-auth.repository'
import { ApiCategoryRepository } from '../data/repositories/api-category.repository'
import { ApiProductRepository } from '../data/repositories/api-product.repository'
import { ApiPolicyRepository } from '../data/repositories/api-policy.repository'
import { ApiAddressRepository } from '../data/repositories/api-address.repository'
import { ApiSpecialOffersRepository } from '../data/repositories/api-special-offers.repository'
import { ApiHomeRepository } from '../data/repositories/api-home.repository'
import { ApiCartRepository } from '../data/repositories/api-cart.repository'
import { ApiOrderRepository } from '../data/repositories/api-order.repository'
import { ApiNotificationRepository } from '../data/repositories/api-notification.repository'
import { FirebaseMessagingService } from '../infrastructure/firebase/firebase-messaging.service'
import { AuthService } from '../application/auth.service'
import { CartService } from '../application/cart.service'

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
container.register(FirebaseMessagingService, () => new FirebaseMessagingService())
container.register(HttpClient, () =>
  new HttpClient({
    tokenStore: container.resolve<TokenStore>(TokenStore),
    authBridge: container.resolve<AuthBridge>(AuthBridge),
    feedback: container.resolve<ModalService>(ModalService),
  }),
)

// --- data repositories ---
container.register(ApiAuthRepository, () => new ApiAuthRepository(container.resolve<HttpClient>(HttpClient)))
container.register(ApiCategoryRepository, () => new ApiCategoryRepository(container.resolve<HttpClient>(HttpClient)))
container.register(ApiProductRepository, () => new ApiProductRepository(container.resolve<HttpClient>(HttpClient)))
container.register(ApiPolicyRepository, () => new ApiPolicyRepository(container.resolve<HttpClient>(HttpClient)))
container.register(ApiAddressRepository, () => new ApiAddressRepository(container.resolve<HttpClient>(HttpClient)))
container.register(
  ApiSpecialOffersRepository,
  () => new ApiSpecialOffersRepository(container.resolve<HttpClient>(HttpClient)),
)
container.register(ApiHomeRepository, () => new ApiHomeRepository(container.resolve<HttpClient>(HttpClient)))
container.register(ApiCartRepository, () => new ApiCartRepository(container.resolve<HttpClient>(HttpClient)))
container.register(ApiOrderRepository, () => new ApiOrderRepository(container.resolve<HttpClient>(HttpClient)))
container.register(
  ApiNotificationRepository,
  () => new ApiNotificationRepository(container.resolve<HttpClient>(HttpClient)),
)

// --- application services ---
container.register(AuthService, () =>
  new AuthService(
    container.resolve<ApiAuthRepository>(ApiAuthRepository),
    container.resolve<TokenStore>(TokenStore),
    container.resolve<AuthBridge>(AuthBridge),
    container.resolve<FirebaseMessagingService>(FirebaseMessagingService),
  ),
)

container.register(CartService, () =>
  new CartService(
    container.resolve<ApiCartRepository>(ApiCartRepository),
    container.resolve<AuthService>(AuthService),
  ),
)

export const services = {
  tokenStore: container.resolve<TokenStore>(TokenStore),
  authBridge: container.resolve<AuthBridge>(AuthBridge),
  modalService: container.resolve<ModalService>(ModalService),
  authService: container.resolve<AuthService>(AuthService),
  cartService: container.resolve<CartService>(CartService),
  categoryRepository: container.resolve<ApiCategoryRepository>(ApiCategoryRepository),
  productRepository: container.resolve<ApiProductRepository>(ApiProductRepository),
  policyRepository: container.resolve<ApiPolicyRepository>(ApiPolicyRepository),
  addressRepository: container.resolve<ApiAddressRepository>(ApiAddressRepository),
  specialOffersRepository: container.resolve<ApiSpecialOffersRepository>(ApiSpecialOffersRepository),
  homeRepository: container.resolve<ApiHomeRepository>(ApiHomeRepository),
  orderRepository: container.resolve<ApiOrderRepository>(ApiOrderRepository),
  notificationRepository: container.resolve<ApiNotificationRepository>(ApiNotificationRepository),
  firebaseMessagingService: container.resolve<FirebaseMessagingService>(FirebaseMessagingService),
}

export const modalService = services.modalService
export const authService = services.authService
export const cartService = services.cartService
export const addressRepository = services.addressRepository
export const orderRepository = services.orderRepository
export const notificationRepository = services.notificationRepository
export const firebaseMessagingService = services.firebaseMessagingService

