import { create } from "zustand"

export interface CharacterData {
  id: string
  name: string
  description: string
  personality: string
  scenario: string
  firstMessage: string
  systemPrompt: string
  creatorNotes: string
  tags: string[]
  avatarUrl: string | null
}

export interface WorldPresetData {
  id: string
  name: string
  description: string
  systemPrompt: string
  postHistoryInstructions: string
  formattingOrder: string[]
  defaultProvider: string | null
  defaultModel: string | null
  temperature: number
  maxTokens: number
  maxContext: number
}

export interface GroupMemberData {
  id: string
  characterId: string
  orderIndex: number
  probability: number
  isActive: boolean
  characterName: string
  characterAvatarUrl: string | null
}

export interface LorebookEntryData {
  id: string
  keys: string[]
  content: string
  enabled: boolean
  caseSensitive: boolean
  priority: number
  insertionOrder: number
  position: string
}

export interface LorebookWithEntries {
  id: string
  name: string
  description: string
  scanDepth: number
  tokenBudget: number
  recursive: boolean
  entries: LorebookEntryData[]
}

interface ChatContextState {
  character: CharacterData | null
  worldPreset: WorldPresetData | null
  lorebooks: LorebookWithEntries[]
  groupMembers: GroupMemberData[]
  matchedEntryIds: string[]
  isLoading: boolean
}

interface ChatContextActions {
  setCharacter: (character: CharacterData | null) => void
  setWorldPreset: (preset: WorldPresetData | null) => void
  setLorebooks: (lorebooks: LorebookWithEntries[]) => void
  setGroupMembers: (members: GroupMemberData[]) => void
  setMatchedEntryIds: (ids: string[]) => void
  setIsLoading: (loading: boolean) => void
  reset: () => void
}

const initialState: ChatContextState = {
  character: null,
  worldPreset: null,
  lorebooks: [],
  groupMembers: [],
  matchedEntryIds: [],
  isLoading: false,
}

export const useChatContextStore = create<ChatContextState & ChatContextActions>(
  (set) => ({
    ...initialState,

    setCharacter: (character) => set({ character }),
    setWorldPreset: (preset) => set({ worldPreset: preset }),
    setLorebooks: (lorebooks) => set({ lorebooks }),
    setGroupMembers: (members) => set({ groupMembers: members }),
    setMatchedEntryIds: (ids) => set({ matchedEntryIds: ids }),
    setIsLoading: (loading) => set({ isLoading: loading }),
    reset: () => set(initialState),
  })
)
