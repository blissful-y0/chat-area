import type { LlmProvider, LlmRequestOptions, LlmStreamEvent } from "./types"

export function createCustomProvider(
  id: string,
  name: string,
  baseUrl: string
): LlmProvider {
  return {
    id,
    name,

    async *streamChat(
      apiKey: string,
      options: LlmRequestOptions
    ): AsyncIterable<LlmStreamEvent> {
      // Ensure base URL doesn't end with slash
      const url = `${baseUrl.replace(/\/$/, "")}/v1/chat/completions`

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: options.model,
          messages: options.messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          temperature: options.temperature,
          max_tokens: options.maxTokens,
          top_p: options.topP,
          frequency_penalty: options.frequencyPenalty,
          presence_penalty: options.presencePenalty,
          stop: options.stop,
          stream: true,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`${name} API error ${response.status}: ${errorText}`)
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
              const content = parsed.choices?.[0]?.delta?.content
              if (content) {
                yield { type: "text", content }
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
}
