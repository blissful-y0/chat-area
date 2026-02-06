import type { LlmProvider, LlmRequestOptions, LlmStreamEvent } from "./types"

const GOOGLE_API_URL = "https://generativelanguage.googleapis.com/v1beta/models"

interface GoogleContent {
  role: "user" | "model"
  parts: Array<{ text: string }>
}

export const googleProvider: LlmProvider = {
  id: "google",
  name: "Google AI",

  async *streamChat(
    apiKey: string,
    options: LlmRequestOptions
  ): AsyncIterable<LlmStreamEvent> {
    const systemMessages = options.messages.filter((m) => m.role === "system")
    const nonSystemMessages = options.messages.filter((m) => m.role !== "system")

    const systemInstruction = systemMessages.length > 0
      ? { parts: [{ text: systemMessages.map((m) => m.content).join("\n\n") }] }
      : undefined

    const contents: GoogleContent[] = nonSystemMessages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }))

    const url = `${GOOGLE_API_URL}/${options.model}:streamGenerateContent?alt=sse&key=${apiKey}`

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        ...(systemInstruction ? { systemInstruction } : {}),
        generationConfig: {
          temperature: options.temperature,
          topP: options.topP,
          maxOutputTokens: options.maxTokens,
          stopSequences: options.stop,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Google AI API error ${response.status}: ${errorText}`)
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

          try {
            const parsed = JSON.parse(data)
            const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text
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
