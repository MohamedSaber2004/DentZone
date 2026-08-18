import { computed, ref } from 'vue'
import { toastService } from './toast.service'
import { t } from '../i18n'

class RequestTracker {
  private pending = ref(0)
  private batchHadError = ref(false)
  private batchHadSilentError = ref(false)

  readonly isLoading = computed(() => this.pending.value > 0)

  begin(): void {
    this.pending.value += 1
  }

  settle(ok: boolean, silent = false): void {
    if (!ok && !silent) this.batchHadError.value = true
    if (!ok && silent) this.batchHadSilentError.value = true

    this.pending.value -= 1
    if (this.pending.value > 0) return

    const hadError = this.batchHadError.value
    const hadSilentError = this.batchHadSilentError.value
    this.batchHadError.value = false
    this.batchHadSilentError.value = false

    if (hadError) {
      toastService.error(t('common.loadFailed'))
    } else if (!hadSilentError) {
      toastService.info(t('common.dataLoaded'))
    }
  }
}

export const requestTracker = new RequestTracker()