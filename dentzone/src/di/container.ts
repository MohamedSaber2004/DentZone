import { HttpClient } from '../infrastructure/http/http-client'
import { TokenStore } from '../infrastructure/http/token-store'
import { AuthBridge } from '../infrastructure/http/auth-bridge'
import { ModalService } from '../infrastructure/feedback/modal.service'
import { ApiAuthRepository } from '../data/repositories/api-auth.repository'
import { ApiCategoryRepository } from '../data/repositories/api-category.repository'
import { ApiProductRepository } from '../data/repositories/api-product.repository'
import { AuthService } from '../application/auth.service'

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
container.register(ApiAuthRepository, () => new ApiAuthRepository(container.resolve<HttpClient>(HttpClient)))
container.register(ApiCategoryRepository, () => new ApiCategoryRepository(container.resolve<HttpClient>(HttpClient)))
container.register(ApiProductRepository, () => new ApiProductRepository(container.resolve<HttpClient>(HttpClient)))

// --- application services ---
container.register(AuthService, () =>
  new AuthService(
    container.resolve<ApiAuthRepository>(ApiAuthRepository),
    container.resolve<TokenStore>(TokenStore),
    container.resolve<AuthBridge>(AuthBridge),
  ),
)

export const services = {
  tokenStore: container.resolve<TokenStore>(TokenStore),
  authBridge: container.resolve<AuthBridge>(AuthBridge),
  modalService: container.resolve<ModalService>(ModalService),
  authService: container.resolve<AuthService>(AuthService),
  categoryRepository: container.resolve<ApiCategoryRepository>(ApiCategoryRepository),
  productRepository: container.resolve<ApiProductRepository>(ApiProductRepository),
}

export const modalService = services.modalService
export const authService = services.authService