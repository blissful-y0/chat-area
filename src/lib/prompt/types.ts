export interface PromptSlot {
  id: string
  label: string
  content: string
  role: "system" | "user" | "assistant"
  enabled: boolean
  tokenCount: number
}

export interface FormattingOrder {
  slots: string[]
}

export const DEFAULT_FORMATTING_ORDER: FormattingOrder = {
  slots: [
    "system_prompt",
    "description",
    "personality",
    "scenario",
    "lorebook_before",
    "message_example",
    "messages",
    "lorebook_after",
    "post_history_instructions",
  ],
}

export interface PromptContext {
  characterName: string
  characterDescription: string
  characterPersonality: string
  characterScenario: string
  characterFirstMessage: string
  characterMessageExample: string
  systemPrompt: string
  postHistoryInstructions: string
  userName: string
  messages: Array<{ role: "user" | "assistant"; content: string }>
  lorebookEntries: Array<{
    content: string
    position: "before_char" | "after_char"
    tokenCount: number
  }>
  maxContextTokens: number
  formattingOrder: FormattingOrder
}

export interface BuiltPrompt {
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>
  totalTokens: number
  truncatedMessages: number
}

export interface MacroContext {
  char: string
  user: string
  date: string
  time: string
  idle_duration?: string
  random?: string
  roll?: string
  [key: string]: string | undefined
}
