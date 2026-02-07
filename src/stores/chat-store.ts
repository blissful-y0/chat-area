import { create } from "zustand"

export interface ChatSummary {
  id: string
  title: string
  characterId: string | null
  updatedAt: string
  characterName: string | null
  characterAvatarUrl: string | null
}

export interface Message {
  id: string
  chatId: string
  role: string
  content: string
  characterId: string | null
  activeIndex: number
  alternatives: string[]
  emotion: string | null
  tokenCount: number | null
  createdAt: string
}

interface ChatState {
  chats: ChatSummary[]
  activeChatId: string | null
  messages: Message[]
  isStreaming: boolean
  streamingContent: string
}

interface ChatActions {
  setChats: (chats: ChatSummary[]) => void
  setActiveChatId: (id: string | null) => void
  setMessages: (messages: Message[]) => void
  addMessage: (message: Message) => void
  updateMessage: (id: string, updates: Partial<Message>) => void
  setIsStreaming: (streaming: boolean) => void
  setStreamingContent: (content: string) => void
  appendStreamingContent: (chunk: string) => void
}

export const useChatStore = create<ChatState & ChatActions>((set) => ({
  chats: [],
  activeChatId: null,
  messages: [],
  isStreaming: false,
  streamingContent: "",

  setChats: (chats) => set({ chats }),
  setActiveChatId: (id) => set({ activeChatId: id }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    })),
  setIsStreaming: (streaming) => set({ isStreaming: streaming }),
  setStreamingContent: (content) => set({ streamingContent: content }),
  appendStreamingContent: (chunk) =>
    set((state) => ({
      streamingContent: state.streamingContent + chunk,
    })),
}))
