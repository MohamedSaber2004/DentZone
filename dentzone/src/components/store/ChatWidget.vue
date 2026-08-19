<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { chatService } from '../../application/chat.service'
import { t } from '../../i18n'
import AppIcon from '../ui/AppIcon.vue'

const draft = ref('')
const listEl = ref<HTMLElement | null>(null)

const agentName = computed(() => t('chat.agentName'))
const statusLabel = computed(() => (chatService.typing.value ? t('chat.typing') : t('chat.online')))

const quickReplies = computed(() => [
  t('chat.quickOrder'),
  t('chat.quickShipping'),
  t('chat.quickProducts'),
])

const scrollToBottom = () => {
  void nextTick(() => {
    if (listEl.value) listEl.value.scrollTop = listEl.value.scrollHeight
  })
}

watch(
  () => [chatService.messages.value.length, chatService.typing.value],
  () => scrollToBottom(),
)

onMounted(() => {
  chatService.seedGreeting(t('chat.greeting'))
  scrollToBottom()
})

const sendMessage = () => {
  const text = draft.value.trim()
  if (!text || chatService.typing.value) return
  chatService.send(text)
  draft.value = ''
}

const sendQuick = (text: string) => {
  chatService.send(text)
}

const formatTime = (time: number) =>
  new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(new Date(time))
</script>

<template>
  <div class="chat-widget" :class="{ 'chat-widget--open': chatService.open.value }">
    <Transition name="chat-panel">
      <section v-if="chatService.open.value" class="chat-widget__panel" aria-label="Chat">
        <header class="chat-widget__header">
          <span class="chat-widget__avatar" aria-hidden="true">
            <AppIcon name="message-circle" :size="18" />
          </span>
          <div class="chat-widget__agent">
            <strong>{{ agentName }}</strong>
            <span class="chat-widget__status">
              <span class="chat-widget__dot" />
              {{ statusLabel }}
            </span>
          </div>
          <button
            class="chat-widget__close"
            type="button"
            :aria-label="t('chat.close')"
            @click="chatService.close()"
          >
            <AppIcon name="close" :size="18" />
          </button>
        </header>

        <div ref="listEl" class="chat-widget__list">
          <div
            v-for="message in chatService.messages.value"
            :key="message.id"
            class="chat-widget__row"
            :class="`chat-widget__row--${message.from}`"
          >
            <div class="chat-widget__bubble">
              <p>{{ message.text }}</p>
              <time class="chat-widget__time">{{ formatTime(message.time) }}</time>
            </div>
          </div>
          <div v-if="chatService.typing.value" class="chat-widget__row chat-widget__row--agent">
            <div class="chat-widget__bubble chat-widget__bubble--typing" aria-label="Typing">
              <span class="chat-widget__typing-dot" />
              <span class="chat-widget__typing-dot" />
              <span class="chat-widget__typing-dot" />
            </div>
          </div>
        </div>

        <div class="chat-widget__quick">
          <button
            v-for="reply in quickReplies"
            :key="reply"
            class="chat-widget__quick-chip"
            type="button"
            @click="sendQuick(reply)"
          >
            {{ reply }}
          </button>
        </div>

        <form class="chat-widget__composer" @submit.prevent="sendMessage">
          <input
            v-model="draft"
            class="chat-widget__input"
            type="text"
            :placeholder="t('chat.placeholder')"
            :aria-label="t('chat.placeholder')"
            maxlength="500"
          />
          <button class="chat-widget__send" type="submit" :disabled="!draft.trim() || chatService.typing.value">
            <AppIcon name="send" :size="16" />
          </button>
        </form>
      </section>
    </Transition>

    <div class="chat-widget__launchers">
      <a
        class="chat-widget__launcher chat-widget__launcher--whatsapp"
        href="https://wa.me/15550142026"
        target="_blank"
        rel="noopener noreferrer"
        :aria-label="t('chat.whatsapp')"
        :title="t('chat.whatsapp')"
      >
        <AppIcon name="whatsapp" :size="22" filled />
      </a>
      <button
        class="chat-widget__launcher chat-widget__launcher--chat"
        type="button"
        :aria-label="t('chat.open')"
        :title="t('chat.open')"
        @click="chatService.toggle()"
      >
        <AppIcon v-if="chatService.open.value" name="close" :size="20" />
        <AppIcon v-else name="message-circle" :size="20" />
        <span v-if="!chatService.open.value && chatService.unread.value > 0" class="chat-widget__badge">
          {{ chatService.unread.value > 9 ? '9+' : chatService.unread.value }}
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.chat-widget {
  position: fixed;
  inset-inline-end: 1.25rem;
  bottom: 1.25rem;
  z-index: 90;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.75rem;
}

.chat-widget__panel {
  display: flex;
  flex-direction: column;
  width: 340px;
  max-width: calc(100vw - 2.5rem);
  height: 460px;
  max-height: calc(100vh - 8rem);
  background: var(--dz-surface);
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius-lg);
  box-shadow: var(--dz-shadow-lg);
  overflow: hidden;
}

.chat-widget__header {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.9rem 1rem;
  background: var(--dz-primary);
  color: var(--dz-on-primary);
}

.chat-widget__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.4rem;
  height: 2.4rem;
  flex-shrink: 0;
  border-radius: 50%;
  background: color-mix(in srgb, var(--dz-on-primary) 15%, transparent);
}

.chat-widget__agent {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  flex: 1;
  min-width: 0;
  font-size: 0.9rem;
}

.chat-widget__status {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.72rem;
  color: color-mix(in srgb, var(--dz-on-primary) 78%, transparent);
}

.chat-widget__dot {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 50%;
  background: #4ade80;
}

.chat-widget__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  color: var(--dz-on-primary);
  transition: background-color 0.2s;
}

.chat-widget__close:hover {
  background: color-mix(in srgb, var(--dz-on-primary) 15%, transparent);
}

.chat-widget__list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 1rem;
  flex: 1;
  overflow-y: auto;
  background: var(--dz-surface-soft);
}

.chat-widget__row {
  display: flex;
}

.chat-widget__row--user {
  justify-content: flex-end;
}

.chat-widget__row--agent {
  justify-content: flex-start;
}

.chat-widget__bubble {
  max-width: 80%;
  padding: 0.55rem 0.8rem;
  border-radius: var(--dz-radius);
  font-size: 0.85rem;
  line-height: 1.45;
  color: var(--dz-ink-soft);
  box-shadow: var(--dz-shadow-sm);
}

.chat-widget__row--agent .chat-widget__bubble {
  background: var(--dz-surface);
  border: 1px solid var(--dz-border);
  border-bottom-left-radius: var(--dz-radius-sm);
}

.chat-widget__row--user .chat-widget__bubble {
  background: var(--dz-primary);
  color: var(--dz-on-primary);
  border-bottom-right-radius: var(--dz-radius-sm);
}

html[dir='rtl'] .chat-widget__row--agent .chat-widget__bubble {
  border-bottom-left-radius: var(--dz-radius);
  border-bottom-right-radius: var(--dz-radius-sm);
}

html[dir='rtl'] .chat-widget__row--user .chat-widget__bubble {
  border-bottom-right-radius: var(--dz-radius);
  border-bottom-left-radius: var(--dz-radius-sm);
}

.chat-widget__bubble p {
  white-space: pre-wrap;
  word-break: break-word;
}

.chat-widget__time {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.65rem;
  opacity: 0.65;
}

.chat-widget__bubble--typing {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.chat-widget__typing-dot {
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 50%;
  background: var(--dz-muted);
  animation: typing-bounce 1.2s ease-in-out infinite;
}

.chat-widget__typing-dot:nth-child(2) {
  animation-delay: 0.15s;
}

.chat-widget__typing-dot:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes typing-bounce {
  0%,
  60%,
  100% {
    transform: translateY(0);
    opacity: 0.5;
  }

  30% {
    transform: translateY(-4px);
    opacity: 1;
  }
}

.chat-widget__quick {
  display: flex;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  overflow-x: auto;
  border-top: 1px solid var(--dz-border);
  scrollbar-width: none;
}

.chat-widget__quick::-webkit-scrollbar {
  display: none;
}

.chat-widget__quick-chip {
  flex-shrink: 0;
  padding: 0.35rem 0.75rem;
  border: 1px solid var(--dz-primary-soft);
  border-radius: var(--dz-radius-full);
  background: var(--dz-primary-faint);
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--dz-primary-strong);
  transition:
    background-color 0.2s,
    color 0.2s;
}

.chat-widget__quick-chip:hover {
  background: var(--dz-primary-soft);
}

.chat-widget__composer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--dz-border);
}

.chat-widget__input {
  flex: 1;
  min-width: 0;
  padding: 0.55rem 0.9rem;
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius-full);
  background: var(--dz-surface-soft);
  font-size: 0.85rem;
  color: var(--dz-ink);
}

.chat-widget__input:focus {
  outline: none;
  border-color: var(--dz-primary);
  background: var(--dz-surface);
}

.chat-widget__send {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.4rem;
  height: 2.4rem;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--dz-primary);
  color: var(--dz-on-primary);
  box-shadow: var(--dz-shadow-primary);
  transition:
    transform 0.15s,
    background-color 0.2s;
}

.chat-widget__send:hover:not(:disabled) {
  transform: scale(1.08);
  background: var(--dz-primary-strong);
}

.chat-widget__send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.chat-widget__launchers {
  display: flex;
  gap: 0.75rem;
  align-items: flex-end;
}

.chat-widget__launcher {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  color: var(--dz-on-primary);
  box-shadow: var(--dz-shadow-lg);
  transition:
    transform 0.2s,
    filter 0.2s;
}

.chat-widget__launcher:hover {
  transform: translateY(-3px);
  filter: brightness(1.06);
}

.chat-widget__launcher--whatsapp {
  background: #25d366;
}

.chat-widget__launcher--chat {
  position: relative;
  background: var(--dz-primary);
}

.chat-widget__badge {
  position: absolute;
  top: -4px;
  inset-inline-end: -4px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 1.1rem;
  height: 1.1rem;
  padding: 0 0.25rem;
  border-radius: var(--dz-radius-full);
  background: var(--dz-danger);
  font-size: 0.62rem;
  font-weight: 700;
  box-shadow: var(--dz-shadow-sm);
}

.chat-panel-enter-active,
.chat-panel-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.chat-panel-enter-from,
.chat-panel-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

@media (max-width: 480px) {
  .chat-widget {
    inset-inline-end: 0.9rem;
    bottom: 0.9rem;
  }

  .chat-widget__panel {
    position: fixed;
    inset-inline: 0.9rem;
    bottom: 5.25rem;
    width: auto;
    height: min(460px, calc(100vh - 8rem));
  }
}
</style>