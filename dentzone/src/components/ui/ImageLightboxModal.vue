<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { resolveMediaUrl } from '../../utils/media'
import { locale, t } from '../../i18n'
import AppIcon from './AppIcon.vue'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    images: string[]
    initialIndex?: number
    title?: string
  }>(),
  {
    initialIndex: 0,
    title: '',
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'change', index: number): void
}>()

const currentIndex = ref(props.initialIndex)
const zoomLevel = ref(1)
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const translate = ref({ x: 0, y: 0 })
const isFullscreen = ref(false)
const dialogRef = ref<HTMLDivElement | null>(null)
let previouslyFocused: HTMLElement | null = null

const currentImage = computed(() => {
  if (!props.images.length) return ''
  const idx = Math.min(Math.max(0, currentIndex.value), props.images.length - 1)
  return props.images[idx]
})

const resolvedImageSrc = computed(() => {
  return resolveMediaUrl(currentImage.value)
})

const totalImages = computed(() => props.images.length)

watch(
  () => props.modelValue,
  async (visible) => {
    if (visible) {
      previouslyFocused = document.activeElement as HTMLElement | null
      currentIndex.value = Math.min(Math.max(0, props.initialIndex), Math.max(0, props.images.length - 1))
      resetTransform()
      document.body.style.overflow = 'hidden'
      await nextTick()
      dialogRef.value?.focus()
    } else {
      document.body.style.overflow = ''
      resetTransform()
      if (previouslyFocused) {
        previouslyFocused.focus()
        previouslyFocused = null
      }
    }
  },
)

watch(
  () => props.initialIndex,
  (val) => {
    currentIndex.value = val
    resetTransform()
  },
)

const resetTransform = () => {
  zoomLevel.value = 1
  translate.value = { x: 0, y: 0 }
}

const close = () => {
  emit('update:modelValue', false)
}

const prevImage = () => {
  if (props.images.length <= 1) return
  currentIndex.value = (currentIndex.value - 1 + props.images.length) % props.images.length
  resetTransform()
  emit('change', currentIndex.value)
}

const nextImage = () => {
  if (props.images.length <= 1) return
  currentIndex.value = (currentIndex.value + 1) % props.images.length
  resetTransform()
  emit('change', currentIndex.value)
}

const selectImage = (index: number) => {
  if (index === currentIndex.value) return
  currentIndex.value = index
  resetTransform()
  emit('change', currentIndex.value)
}

const zoomIn = () => {
  zoomLevel.value = Math.min(3, +(zoomLevel.value + 0.5).toFixed(1))
}

const zoomOut = () => {
  zoomLevel.value = Math.max(1, +(zoomLevel.value - 0.5).toFixed(1))
  if (zoomLevel.value === 1) {
    translate.value = { x: 0, y: 0 }
  }
}

const toggleZoom = () => {
  if (zoomLevel.value > 1) {
    resetTransform()
  } else {
    zoomLevel.value = 2
  }
}

const toggleFullscreen = async () => {
  try {
    if (!document.fullscreenElement) {
      await dialogRef.value?.requestFullscreen?.()
      isFullscreen.value = true
    } else {
      await document.exitFullscreen?.()
      isFullscreen.value = false
    }
  } catch {
    isFullscreen.value = !isFullscreen.value
  }
}

const onMouseDown = (e: MouseEvent) => {
  if (zoomLevel.value <= 1) return
  isDragging.value = true
  dragStart.value = {
    x: e.clientX - translate.value.x,
    y: e.clientY - translate.value.y,
  }
}

const onMouseMove = (e: MouseEvent) => {
  if (!isDragging.value || zoomLevel.value <= 1) return
  translate.value = {
    x: e.clientX - dragStart.value.x,
    y: e.clientY - dragStart.value.y,
  }
}

const onMouseUp = () => {
  isDragging.value = false
}

const onKeydown = (e: KeyboardEvent) => {
  if (!props.modelValue) return

  switch (e.key) {
    case 'Escape':
      e.preventDefault()
      close()
      break
    case 'ArrowLeft':
      e.preventDefault()
      prevImage()
      break
    case 'ArrowRight':
      e.preventDefault()
      nextImage()
      break
    case '+':
    case '=':
      e.preventDefault()
      zoomIn()
      break
    case '-':
    case '_':
      e.preventDefault()
      zoomOut()
      break
    case '0':
      e.preventDefault()
      resetTransform()
      break
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="lightbox">
      <div
        v-if="modelValue && resolvedImageSrc"
        ref="dialogRef"
        class="lightbox"
        role="dialog"
        aria-modal="true"
        :aria-label="title || t('products.viewImage', { n: currentIndex + 1 })"
        tabindex="-1"
        @click.self="close"
        @mouseup="onMouseUp"
      >
        <!-- Top Toolbar -->
        <header class="lightbox__toolbar" @click.stop>
          <div class="lightbox__meta">
            <span v-if="title" class="lightbox__title">{{ title }}</span>
            <span v-if="totalImages > 1" class="lightbox__counter">
              {{ currentIndex + 1 }} / {{ totalImages }}
            </span>
          </div>

          <div class="lightbox__actions">
            <button
              type="button"
              class="lightbox__btn"
              :disabled="zoomLevel >= 3"
              :aria-label="locale === 'ar' ? 'تكبير' : 'Zoom In'"
              title="Zoom In (+)"
              @click="zoomIn"
            >
              <AppIcon name="zoom-in" :size="18" />
            </button>

            <button
              type="button"
              class="lightbox__btn"
              :disabled="zoomLevel <= 1"
              :aria-label="locale === 'ar' ? 'تصغير' : 'Zoom Out'"
              title="Zoom Out (-)"
              @click="zoomOut"
            >
              <AppIcon name="zoom-out" :size="18" />
            </button>

            <button
              type="button"
              class="lightbox__btn"
              :aria-label="isFullscreen ? (locale === 'ar' ? 'إلغاء ملء الشاشة' : 'Exit Fullscreen') : (locale === 'ar' ? 'ملء الشاشة' : 'Fullscreen')"
              :title="isFullscreen ? (locale === 'ar' ? 'إلغاء ملء الشاشة' : 'Exit Fullscreen') : (locale === 'ar' ? 'ملء الشاشة' : 'Fullscreen')"
              @click="toggleFullscreen"
            >
              <AppIcon :name="isFullscreen ? 'minimize' : 'maximize'" :size="18" />
            </button>

            <button
              type="button"
              class="lightbox__btn lightbox__btn--close"
              :aria-label="locale === 'ar' ? 'إغلاق' : 'Close'"
              title="Close (Esc)"
              @click="close"
            >
              <AppIcon name="close" :size="20" />
            </button>
          </div>
        </header>

        <!-- Main Stage -->
        <main
          class="lightbox__stage"
          :class="{ 'lightbox__stage--zoomed': zoomLevel > 1, 'lightbox__stage--dragging': isDragging }"
          @click.self="close"
          @mousedown="onMouseDown"
          @mousemove="onMouseMove"
        >
          <!-- Nav Prev -->
          <button
            v-if="totalImages > 1"
            type="button"
            class="lightbox__nav lightbox__nav--prev"
            :aria-label="t('home.previousPage')"
            title="Previous (Arrow Left)"
            @click.stop="prevImage"
          >
            <AppIcon name="chevron-left" :size="24" />
          </button>

          <!-- Image Canvas -->
          <div
            class="lightbox__canvas"
            :style="{
              transform: `translate(${translate.x}px, ${translate.y}px) scale(${zoomLevel})`,
              cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
            }"
            @dblclick="toggleZoom"
          >
            <img
              :src="resolvedImageSrc"
              :alt="title || ''"
              class="lightbox__image"
              draggable="false"
            />
          </div>

          <!-- Nav Next -->
          <button
            v-if="totalImages > 1"
            type="button"
            class="lightbox__nav lightbox__nav--next"
            :aria-label="t('home.nextPage')"
            title="Next (Arrow Right)"
            @click.stop="nextImage"
          >
            <AppIcon name="chevron-right" :size="24" />
          </button>
        </main>

        <!-- Bottom Thumbnails -->
        <footer v-if="totalImages > 1" class="lightbox__thumbs" @click.stop>
          <div class="lightbox__thumbs-track">
            <button
              v-for="(img, idx) in images"
              :key="img"
              type="button"
              class="lightbox__thumb"
              :class="{ 'lightbox__thumb--active': idx === currentIndex }"
              :aria-label="t('products.viewImage', { n: idx + 1 })"
              :aria-current="idx === currentIndex ? 'true' : undefined"
              @click="selectImage(idx)"
            >
              <img :src="resolveMediaUrl(img)" alt="" />
            </button>
          </div>
        </footer>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.lightbox {
  position: fixed;
  inset: 0;
  z-index: 300;
  display: flex;
  flex-direction: column;
  background: rgba(8, 15, 23, 0.92);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  user-select: none;
  overflow: hidden;
}

.lightbox:focus {
  outline: none;
}

/* Toolbar */
.lightbox__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1.25rem;
  background: rgba(0, 0, 0, 0.4);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 10;
}

.lightbox__meta {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  min-width: 0;
}

.lightbox__title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lightbox__counter {
  font-size: 0.82rem;
  font-weight: 700;
  padding: 0.2rem 0.6rem;
  border-radius: var(--dz-radius-full);
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  flex-shrink: 0;
}

.lightbox__actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.lightbox__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: var(--dz-radius-full);
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  cursor: pointer;
  transition:
    background-color 0.2s,
    transform 0.15s,
    border-color 0.2s;
}

.lightbox__btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.22);
  border-color: rgba(255, 255, 255, 0.35);
  transform: translateY(-1px);
}

.lightbox__btn:focus-visible {
  outline: 3px solid var(--dz-primary);
  outline-offset: 2px;
}

.lightbox__btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.lightbox__btn--close {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.4);
}

.lightbox__btn--close:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.4);
  border-color: rgba(239, 68, 68, 0.6);
}

/* Stage */
.lightbox__stage {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  overflow: hidden;
}

.lightbox__canvas {
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease-out;
  transform-origin: center center;
}

.lightbox__image {
  max-width: 90vw;
  max-height: 75vh;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: var(--dz-radius);
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.6);
  pointer-events: none;
}

/* Navigation Buttons */
.lightbox__nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.25rem;
  height: 3.25rem;
  border-radius: var(--dz-radius-full);
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  cursor: pointer;
  transition:
    background-color 0.2s,
    transform 0.15s,
    border-color 0.2s;
}

.lightbox__nav:hover {
  background: rgba(0, 0, 0, 0.8);
  border-color: rgba(255, 255, 255, 0.4);
  transform: translateY(-50%) scale(1.08);
}

.lightbox__nav:focus-visible {
  outline: 3px solid var(--dz-primary);
  outline-offset: 2px;
}

.lightbox__nav--prev {
  inset-inline-start: 1.25rem;
}

.lightbox__nav--next {
  inset-inline-end: 1.25rem;
}

/* Thumbnails */
.lightbox__thumbs {
  display: flex;
  justify-content: center;
  padding: 0.75rem 1rem 1rem;
  background: rgba(0, 0, 0, 0.4);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  overflow-x: auto;
}

.lightbox__thumbs-track {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.lightbox__thumb {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.5rem;
  height: 3.5rem;
  padding: 0.2rem;
  border-radius: var(--dz-radius);
  border: 2px solid transparent;
  background: rgba(255, 255, 255, 0.1);
  cursor: pointer;
  overflow: hidden;
  opacity: 0.6;
  transition:
    opacity 0.2s,
    border-color 0.2s,
    transform 0.15s;
}

.lightbox__thumb:hover {
  opacity: 0.9;
  transform: translateY(-2px);
}

.lightbox__thumb:focus-visible {
  outline: 3px solid var(--dz-primary);
  outline-offset: 2px;
}

.lightbox__thumb--active {
  opacity: 1;
  border-color: var(--dz-gold);
  background: rgba(255, 255, 255, 0.25);
  box-shadow: 0 0 12px rgba(247, 147, 59, 0.4);
}

.lightbox__thumb img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* Transitions */
.lightbox-enter-active,
.lightbox-leave-active {
  transition: opacity 0.25s ease;
}

.lightbox-enter-active .lightbox__canvas,
.lightbox-leave-active .lightbox__canvas {
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.lightbox-enter-from,
.lightbox-leave-to {
  opacity: 0;
}

.lightbox-enter-from .lightbox__canvas,
.lightbox-leave-to .lightbox__canvas {
  transform: scale(0.92);
}

/* Responsive */
@media (max-width: 600px) {
  .lightbox__toolbar {
    padding: 0.5rem 0.75rem;
  }

  .lightbox__btn {
    width: 2.35rem;
    height: 2.35rem;
  }

  .lightbox__nav {
    width: 2.75rem;
    height: 2.75rem;
  }

  .lightbox__nav--prev {
    inset-inline-start: 0.5rem;
  }

  .lightbox__nav--next {
    inset-inline-end: 0.5rem;
  }

  .lightbox__thumb {
    width: 3rem;
    height: 3rem;
  }
}
</style>
