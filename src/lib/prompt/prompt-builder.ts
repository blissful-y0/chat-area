import type { PromptContext, BuiltPrompt } from "./types"
import { countTokens, countMessageTokens } from "./token-counter"
import { processMacros, createMacroContext } from "./macro-processor"
import type { MacroContext } from "./types"

interface SlotContent {
  id: string
  text: string
  role: "system" | "user" | "assistant"
}

function resolveSlotContent(
  slotId: string,
  context: PromptContext,
  macroCtx: MacroContext
): SlotContent | null {
  switch (slotId) {
    case "system_prompt": {
      // World preset system prompt takes priority, fallback to character's
      const raw = context.worldSystemPrompt || context.characterSystemPrompt
      const text = processMacros(raw, macroCtx)
      return text ? { id: slotId, text, role: "system" } : null
    }
    case "world_lore": {
      // World-level system prompt when both world and character have system prompts
      if (context.worldSystemPrompt && context.characterSystemPrompt) {
        const text = processMacros(context.characterSystemPrompt, macroCtx)
        return text
          ? { id: slotId, text: `[Character Instructions: ${text}]`, role: "system" }
          : null
      }
      return null
    }
    case "description": {
      const text = processMacros(context.characterDescription, macroCtx)
      return text
        ? {
            id: slotId,
            text: `[${context.characterName}'s Description: ${text}]`,
            role: "system",
          }
        : null
    }
    case "personality": {
      const text = processMacros(context.characterPersonality, macroCtx)
      return text
        ? {
            id: slotId,
            text: `[${context.characterName}'s Personality: ${text}]`,
            role: "system",
          }
        : null
    }
    case "scenario": {
      const text = processMacros(context.characterScenario, macroCtx)
      return text
        ? { id: slotId, text: `[Scenario: ${text}]`, role: "system" }
        : null
    }
    case "message_example": {
      const text = processMacros(context.characterMessageExample, macroCtx)
      return text
        ? { id: slotId, text: `[Example dialogue:\n${text}]`, role: "system" }
        : null
    }
    case "post_history_instructions": {
      const text = processMacros(context.postHistoryInstructions, macroCtx)
      return text ? { id: slotId, text, role: "system" } : null
    }
    case "lorebook_before": {
      const entries = context.lorebookEntries
        .filter((e) => e.position === "before_char")
        .map((e) => processMacros(e.content, macroCtx))
        .filter(Boolean)
      return entries.length > 0
        ? { id: slotId, text: entries.join("\n"), role: "system" }
        : null
    }
    case "lorebook_after": {
      const entries = context.lorebookEntries
        .filter((e) => e.position === "after_char")
        .map((e) => processMacros(e.content, macroCtx))
        .filter(Boolean)
      return entries.length > 0
        ? { id: slotId, text: entries.join("\n"), role: "system" }
        : null
    }
    default:
      return null
  }
}

export function buildPrompt(
  context: PromptContext,
  model = "gpt-4o"
): BuiltPrompt {
  const macroCtx = createMacroContext(
    context.characterName,
    context.userName
  )

  // Resolve all non-message slots in formatting order
  const resolvedSlots: SlotContent[] = []
  for (const slotId of context.formattingOrder.slots) {
    if (slotId === "messages") continue
    const slot = resolveSlotContent(slotId, context, macroCtx)
    if (slot) resolvedSlots.push(slot)
  }

  // Build system message from all system slots
  const systemSlots = resolvedSlots.filter((s) => s.role === "system")
  const systemMessage = systemSlots.map((s) => s.text).join("\n\n")
  const systemTokens = countTokens(systemMessage, model)

  // Process chat messages with macro substitution
  const processedMessages = context.messages.map((msg) => ({
    role: msg.role,
    content: processMacros(msg.content, macroCtx),
  }))

  // Calculate available tokens for messages
  const availableForMessages =
    context.maxContextTokens - systemTokens - 100

  // Truncate messages from the beginning if needed, keeping recent ones
  let truncatedCount = 0
  let messageTokens = countMessageTokens(
    processedMessages.map((m) => ({ role: m.role, content: m.content })),
    model
  )

  const trimmedMessages = [...processedMessages]
  while (messageTokens > availableForMessages && trimmedMessages.length > 1) {
    trimmedMessages.shift()
    truncatedCount++
    messageTokens = countMessageTokens(
      trimmedMessages.map((m) => ({ role: m.role, content: m.content })),
      model
    )
  }

  // Find post_history_instructions slot
  const postHistorySlot = resolvedSlots.find(
    (s) => s.id === "post_history_instructions"
  )

  // Build final message array
  const finalMessages: Array<{
    role: "system" | "user" | "assistant"
    content: string
  }> = []

  // System prompt (combined from all system slots except post_history)
  const mainSystemText = systemSlots
    .filter((s) => s.id !== "post_history_instructions")
    .map((s) => s.text)
    .join("\n\n")

  if (mainSystemText) {
    finalMessages.push({ role: "system", content: mainSystemText })
  }

  // Chat messages
  for (const msg of trimmedMessages) {
    finalMessages.push({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })
  }

  // Post-history instructions (injected as system message after chat history)
  if (postHistorySlot) {
    finalMessages.push({
      role: "system",
      content: postHistorySlot.text,
    })
  }

  const totalTokens = countMessageTokens(finalMessages, model)

  return {
    messages: finalMessages,
    totalTokens,
    truncatedMessages: truncatedCount,
  }
}
