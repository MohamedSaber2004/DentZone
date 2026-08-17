import { computed } from 'vue'
import type { Advertisement } from '../domain/models/advertisement'
import { advertisements } from '../data/mocks/advertisements.data'
import { locale } from '../i18n'

export class AdvertisementService {
  readonly hero = computed<Advertisement | undefined>(() => advertisements[locale.value].hero)

  readonly secondary = computed<Advertisement[]>(() => advertisements[locale.value].secondary)
}

export const advertisementService = new AdvertisementService()