export interface LlmMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export interface LlmRequestOptions {
  model: string
  messages: LlmMessage[]
  temperature?: number
  maxTokens?: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
  stop?: string[]
}

export interface LlmStreamEvent {
  type: "text" | "done" | "error"
  content: string
}

export interface LlmProvider {
  id: string
  name: string
  streamChat(
    apiKey: string,
    options: LlmRequestOptions
  ): AsyncIterable<LlmStreamEvent>
}
