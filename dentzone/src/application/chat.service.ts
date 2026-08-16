import { computed, reactive } from 'vue'

export interface ChatMessage {
  id: number
  from: 'user' | 'agent'
  text: string
  time: number
}

export type ChatReplyResolver = (userText: string) => string

const STORAGE_KEY = 'dentzone.chat.v1'

const loadPersistedMessages = (): ChatMessage[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ChatMessage[]
    return parsed.filter(
      (message) =>
        typeof message.text === 'string' && (message.from === 'user' || message.from === 'agent'),
    )
  } catch {
    return []
  }
}

export class ChatService {
  private state = reactive<{
    open: boolean
    typing: boolean
    unread: number
    messages: ChatMessage[]
  }>({
    open: false,
    typing: false,
    unread: 0,
    messages: loadPersistedMessages(),
  })

  private nextId = 1
  private replyTimers = new Set<ReturnType<typeof setTimeout>>()
  private replyResolver: ChatReplyResolver = () => ''

  readonly open = computed(() => this.state.open)
  readonly typing = computed(() => this.state.typing)
  readonly unread = computed(() => this.state.unread)
  readonly messages = computed(() => this.state.messages)

  configure(resolver: ChatReplyResolver): void {
    this.replyResolver = resolver
  }

  seedGreeting(text: string): void {
    if (this.state.messages.length === 0) {
      this.state.messages.push({ id: this.nextId++, from: 'agent', text, time: Date.now() })
    }
  }

  toggle(): void {
    if (this.state.open) {
      this.close()
    } else {
      this.openChat()
    }
  }

  openChat(): void {
    this.state.open = true
    this.state.unread = 0
  }

  close(): void {
    this.state.open = false
    this.persist()
  }

  send(text: string): void {
    const trimmed = text.trim()
    if (!trimmed || this.state.typing) return

    this.state.messages.push({ id: this.nextId++, from: 'user', text: trimmed, time: Date.now() })
    this.persist()

    this.state.typing = true
    const timer = setTimeout(() => {
      const reply = this.replyResolver(trimmed)
      this.state.messages.push({ id: this.nextId++, from: 'agent', text: reply, time: Date.now() })
      this.state.typing = false
      this.replyTimers.delete(timer)
      this.persist()
    }, 900 + Math.min(900, trimmed.length * 10))
    this.replyTimers.add(timer)
  }

  private persist(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state.messages))
  }
}

export const chatService = new ChatService()