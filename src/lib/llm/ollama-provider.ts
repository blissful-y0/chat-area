import type { LlmProvider, LlmRequestOptions, LlmStreamEvent } from "./types"

const DEFAULT_OLLAMA_URL = "http://localhost:11434"

function getOllamaUrl(): string {
  return process.env.OLLAMA_URL ?? DEFAULT_OLLAMA_URL
}

export const ollamaProvider: LlmProvider = {
  id: "ollama",
  name: "Ollama",

  async *streamChat(
    _apiKey: string,
    options: LlmRequestOptions
  ): AsyncIterable<LlmStreamEvent> {
    const baseUrl = getOllamaUrl()
    const url = `${baseUrl}/api/chat`

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: options.model,
        messages: options.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        options: {
          temperature: options.temperature,
          top_p: options.topP,
          stop: options.stop,
          num_predict: options.maxTokens,
        },
        stream: true,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Ollama API error ${response.status}: ${errorText}`)
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
          if (!line.trim()) continue

          try {
            const parsed = JSON.parse(line)

            if (parsed.done) break

            const text = parsed.message?.content
            if (text) {
              yield { type: "text", content: text }
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
