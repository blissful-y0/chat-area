import { create } from "zustand"
import { persist } from "zustand/middleware"

interface ProviderModel {
  id: string
  name: string
  contextLength: number
}

interface ProviderInfo {
  id: string
  name: string
  models: ProviderModel[]
}

interface ChatSettingsState {
  provider: string
  model: string
  temperature: number
  maxTokens: number
  providers: ProviderInfo[]
}

interface ChatSettingsActions {
  setProvider: (provider: string) => void
  setModel: (model: string) => void
  setTemperature: (temperature: number) => void
  setMaxTokens: (maxTokens: number) => void
  setProviders: (providers: ProviderInfo[]) => void
  getContextLength: () => number
}

export const useChatSettingsStore = create<
  ChatSettingsState & ChatSettingsActions
>()(
  persist(
    (set, get) => ({
      provider: "openai",
      model: "gpt-4o",
      temperature: 0.8,
      maxTokens: 4096,
      providers: [],

      setProvider: (provider) => {
        const state = get()
        const providerInfo = state.providers.find((p) => p.id === provider)
        const firstModel = providerInfo?.models[0]?.id ?? ""
        set({ provider, model: firstModel })
      },
      setModel: (model) => set({ model }),
      setTemperature: (temperature) => set({ temperature }),
      setMaxTokens: (maxTokens) => set({ maxTokens }),
      setProviders: (providers) => set({ providers }),
      getContextLength: () => {
        const state = get()
        const providerInfo = state.providers.find(
          (p) => p.id === state.provider
        )
        const modelInfo = providerInfo?.models.find(
          (m) => m.id === state.model
        )
        return modelInfo?.contextLength ?? 4096
      },
    }),
    {
      name: "chatarea-chat-settings",
      partialize: (state) => ({
        provider: state.provider,
        model: state.model,
        temperature: state.temperature,
        maxTokens: state.maxTokens,
      }),
    }
  )
)
