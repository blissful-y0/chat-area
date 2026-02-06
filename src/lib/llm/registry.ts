import type { LlmProvider } from "./types"
import { openaiProvider } from "./openai-provider"
import { anthropicProvider } from "./anthropic-provider"
import { googleProvider } from "./google-provider"
import { ollamaProvider } from "./ollama-provider"
import { openrouterProvider } from "./openrouter-provider"

const providers = new Map<string, LlmProvider>()

providers.set(openaiProvider.id, openaiProvider)
providers.set(anthropicProvider.id, anthropicProvider)
providers.set(googleProvider.id, googleProvider)
providers.set(ollamaProvider.id, ollamaProvider)
providers.set(openrouterProvider.id, openrouterProvider)

export function registerProvider(provider: LlmProvider): void {
  providers.set(provider.id, provider)
}

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

export function hasProvider(id: string): boolean {
  return providers.has(id)
}
