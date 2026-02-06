import { encodingForModel, getEncoding } from "js-tiktoken"
import type { TiktokenModel } from "js-tiktoken"

const encodingCache = new Map<string, ReturnType<typeof getEncoding>>()

function getEncoderForModel(model: string): ReturnType<typeof getEncoding> {
  const cached = encodingCache.get(model)
  if (cached) return cached

  try {
    const encoder = encodingForModel(model as TiktokenModel)
    encodingCache.set(model, encoder)
    return encoder
  } catch {
    // Unknown model: fall back to cl100k_base (GPT-4 / GPT-3.5 encoding)
    const fallback = encodingCache.get("cl100k_base")
    if (fallback) return fallback

    const encoder = getEncoding("cl100k_base")
    encodingCache.set("cl100k_base", encoder)
    encodingCache.set(model, encoder)
    return encoder
  }
}

export function countTokens(text: string, model = "gpt-4o"): number {
  if (!text) return 0
  const encoder = getEncoderForModel(model)
  return encoder.encode(text).length
}

export function countMessageTokens(
  messages: Array<{ role: string; content: string }>,
  model = "gpt-4o"
): number {
  // Each message has overhead: <|start|>{role}\n{content}<|end|>\n
  // Approximately 4 tokens per message for GPT models
  const MESSAGE_OVERHEAD = 4
  const REPLY_OVERHEAD = 3 // every reply is primed with <|start|>assistant<|message|>

  const total = messages.reduce((sum, msg) => {
    return sum + countTokens(msg.content, model) + MESSAGE_OVERHEAD
  }, REPLY_OVERHEAD)

  return total
}

export function truncateToTokenLimit(
  text: string,
  maxTokens: number,
  model = "gpt-4o"
): string {
  const encoder = getEncoderForModel(model)
  const tokens = encoder.encode(text)

  if (tokens.length <= maxTokens) return text

  const truncated = tokens.slice(0, maxTokens)
  const decoded = encoder.decode(truncated)
  if (typeof decoded === "string") return decoded
  return new TextDecoder().decode(new Uint8Array(decoded as ArrayBuffer))
}
