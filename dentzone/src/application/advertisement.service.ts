import { ref } from 'vue'
import type { Advertisement } from '../domain/models/advertisement'
import type { CatalogService } from './catalog.service'
import { onLocaleChange } from '../i18n'

export class AdvertisementService {
  private readonly catalogService: CatalogService

  readonly hero = ref<Advertisement | undefined>(undefined)

  readonly secondary = ref<Advertisement[]>([])

  private loaded = false

  constructor(catalogService: CatalogService) {
    this.catalogService = catalogService
    onLocaleChange(() => {
      this.loaded = false
      void this.load(true)
    })
  }

  async load(force = false): Promise<void> {
    if (this.loaded && !force) return
    try {
      const advertisements = await this.catalogService.getAdvertisements()
      this.hero.value = advertisements.hero
      this.secondary.value = advertisements.secondary
      this.loaded = true
    } catch {
      this.hero.value = undefined
      this.secondary.value = []
    }
  }
}