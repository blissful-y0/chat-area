import type { LlmProvider, LlmRequestOptions, LlmStreamEvent } from "./types"

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"

export const anthropicProvider: LlmProvider = {
  id: "anthropic",
  name: "Anthropic",

  async *streamChat(
    apiKey: string,
    options: LlmRequestOptions
  ): AsyncIterable<LlmStreamEvent> {
    const systemMessages = options.messages.filter((m) => m.role === "system")
    const nonSystemMessages = options.messages.filter((m) => m.role !== "system")

    const systemText = systemMessages.map((m) => m.content).join("\n\n")

    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: options.model,
        max_tokens: options.maxTokens ?? 4096,
        ...(systemText ? { system: systemText } : {}),
        messages: nonSystemMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        temperature: options.temperature,
        top_p: options.topP,
        stop_sequences: options.stop,
        stream: true,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Anthropic API error ${response.status}: ${errorText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error("No response body")

    const decoder = new TextDecoder()
    let buffer = ""

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() ?? ""

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          const data = line.slice(6).trim()
          if (data === "[DONE]") continue

          try {
            const parsed = JSON.parse(data)

            if (parsed.type === "content_block_delta") {
              const text = parsed.delta?.text
              if (text) {
                yield { type: "text", content: text }
              }
            } else if (parsed.type === "error") {
              yield {
                type: "error",
                content: parsed.error?.message ?? "Unknown Anthropic error",
              }
            }
          } catch {
            // Skip unparseable lines
          }
        }
      }
    } finally {
      reader.releaseLock()
    }

    yield { type: "done", content: "" }
  },
}
