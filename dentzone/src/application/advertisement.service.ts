import { ref } from 'vue'
import type { Advertisement } from '../domain/models/advertisement'
import { catalogService } from './catalog.service'
import { onLocaleChange } from '../i18n'

export class AdvertisementService {
  readonly hero = ref<Advertisement | undefined>(undefined)

  readonly secondary = ref<Advertisement[]>([])

  private loaded = false

  constructor() {
    onLocaleChange(() => {
      this.loaded = false
      void this.load(true)
    })
  }

  async load(force = false): Promise<void> {
    if (this.loaded && !force) return
    try {
      const advertisements = await catalogService.getAdvertisements()
      this.hero.value = advertisements.hero
      this.secondary.value = advertisements.secondary
      this.loaded = true
    } catch {
      this.hero.value = undefined
      this.secondary.value = []
    }
  }
}

export const advertisementService = new AdvertisementService()
