import type { LlmProvider } from "./types"
import { openaiProvider } from "./openai-provider"

const providers = new Map<string, LlmProvider>()

providers.set(openaiProvider.id, openaiProvider)

export function getProvider(id: string): LlmProvider {
  const provider = providers.get(id)
  if (!provider) {
    throw new Error(`Unknown LLM provider: ${id}`)
  }
  return provider
}

export function listProviders(): LlmProvider[] {
  return Array.from(providers.values())
}
