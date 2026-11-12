import { computed, ref, watch } from 'vue'
import type { HomeRepository } from '../domain/ports/home-repository'
import type { HomeDto, HomeProviderDto, HomeSectionDto } from '../domain/models/home'
import type { ProviderProductDto } from '../domain/models/product'
import { API_LANG } from '../config/api.config'
import { locale, onLocaleChange, type Locale } from '../i18n'
import type { AuthService } from './auth.service'
import type { WishlistService } from './wishlist.service'

const emptyHome = (): HomeDto => ({
  banners: [],
  promoBanners: [],
  categories: [],
  products: [],
  providers: [],
  brands: [],
  specialOffersone: [],
  specialOfferstwo: [],
  flashSales: [],
  sections: [],
  offers: [],
  fullName: null,
})

/**
 * Single owner of the /api/Home/GetHomeProduct payload so the header,
 * the home page and the offers page share one request instead of three.
 */
export class HomeService {
  readonly home = ref<HomeDto>(emptyHome())
  readonly loading = ref(false)

  private loadedLocale: Locale | null = null
  private inflight: Promise<void> | null = null

  constructor(
    private readonly homeRepository: HomeRepository,
    private readonly authService: AuthService,
    private readonly wishlistService: WishlistService,
  ) {
    onLocaleChange(() => {
      if (this.loadedLocale) void this.load()
    })
    watch(
      () => this.authService.user.value,
      (user, previous) => {
        // Favorite flags are user-bound, so re-pull whatever locale is loaded.
        if (this.loadedLocale && Boolean(user) !== Boolean(previous)) void this.load()
      },
    )
  }

  readonly sections = computed<HomeSectionDto[]>(() => this.home.value.sections)
  readonly offerSections = computed<HomeSectionDto[]>(() => this.home.value.offers)
  readonly providers = computed<HomeProviderDto[]>(() => this.home.value.providers)

  readonly offerProducts = computed<ProviderProductDto[]>(() => {
    const seen = new Set<string>()
    const list: ProviderProductDto[] = []
    for (const section of this.offerSections.value) {
      for (const product of section.products) {
        const key = product.productPriceId || product.productId
        if (!seen.has(key)) {
          seen.add(key)
          list.push(product)
        }
      }
    }
    return list
  })

  readonly offerSupplierIds = computed<string[]>(() => {
    const ids = new Set<string>()
    for (const product of this.offerProducts.value) {
      if (product.inventoryUserId) ids.add(product.inventoryUserId)
    }
    return Array.from(ids)
  })

  readonly hasOffers = computed(() => this.offerProducts.value.length > 0)

  /** Campaign name comes from the backend section title, not from a hardcoded label. */
  readonly headline = computed(() => this.offerSections.value[0]?.title?.trim() ?? '')

  ensureLoaded(): Promise<void> {
    if (this.loadedLocale === locale.value) return this.inflight ?? Promise.resolve()
    return this.load()
  }

  refresh(): Promise<void> {
    return this.load()
  }

  private load(): Promise<void> {
    if (this.inflight) return this.inflight
    this.loading.value = true
    this.inflight = (async () => {
      try {
        const lang = locale.value === 'ar' ? API_LANG.ARABIC : API_LANG.ENGLISH
        const payload = await this.homeRepository.getHome(lang)
        this.home.value = payload
        this.loadedLocale = locale.value
        if (this.authService.isAuthenticated) {
          this.wishlistService.mergeFavorites(
            [
              ...payload.products.filter((p) => p.isFavorite).map((p) => p.productPriceId),
              ...payload.sections.flatMap((s) => s.products).filter((p) => p.isFavorite).map((p) => p.productPriceId),
            ],
          )
        }
      } finally {
        this.loading.value = false
        this.inflight = null
      }
    })()
    return this.inflight
  }
}
