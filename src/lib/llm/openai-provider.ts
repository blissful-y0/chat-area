import OpenAI from "openai"
import type { LlmProvider, LlmRequestOptions, LlmStreamEvent } from "./types"

export const openaiProvider: LlmProvider = {
  id: "openai",
  name: "OpenAI",

  async *streamChat(
    apiKey: string,
    options: LlmRequestOptions
  ): AsyncIterable<LlmStreamEvent> {
    const client = new OpenAI({ apiKey })

    const stream = await client.chat.completions.create({
      model: options.model,
      messages: options.messages,
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      top_p: options.topP,
      frequency_penalty: options.frequencyPenalty,
      presence_penalty: options.presencePenalty,
      stop: options.stop,
      stream: true,
    })

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content
      if (content) {
        yield { type: "text", content }
      }
    }

    yield { type: "done", content: "" }
  },
}
