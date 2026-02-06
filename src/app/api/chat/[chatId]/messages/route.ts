import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { chats, messages, userSettings } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { getRequiredUserId } from "@/lib/auth/session"
import { getProvider } from "@/lib/llm/registry"
import { decrypt } from "@/lib/crypto"
import { randomUUID } from "crypto"
import { z } from "zod/v4"
import type { LlmMessage } from "@/lib/llm/types"

const sendMessageSchema = z.object({
  content: z.string().min(1),
  provider: z.string().default("openai"),
  model: z.string().default("gpt-4o"),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().optional(),
})

function getSetting(
  userId: string,
  key: string
): string | undefined {
  const row = db
    .select()
    .from(userSettings)
    .where(and(eq(userSettings.userId, userId), eq(userSettings.key, key)))
    .get()
  return row?.value
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const userId = await getRequiredUserId()
    const { chatId } = await params

    const chat = db
      .select()
      .from(chats)
      .where(and(eq(chats.id, chatId), eq(chats.userId, userId)))
      .get()

    if (!chat) {
      return NextResponse.json(
        { success: false, error: "Chat not found" },
        { status: 404 }
      )
    }

    const body = await request.json()
    const parsed = sendMessageSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { content, provider: providerId, model, temperature, maxTokens } = parsed.data

    const encryptedKey = getSetting(userId, `${providerId}_api_key`)
    if (!encryptedKey) {
      return NextResponse.json(
        { success: false, error: `No API key configured for ${providerId}` },
        { status: 400 }
      )
    }

    const apiKey = decrypt(encryptedKey)
    const provider = getProvider(providerId)

    const userMessageId = randomUUID()
    db.insert(messages)
      .values({
        id: userMessageId,
        chatId,
        role: "user",
        content,
      })
      .run()

    const existingMessages = db
      .select({ role: messages.role, content: messages.content })
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .all() as LlmMessage[]

    const assistantMessageId = randomUUID()
    let fullContent = ""

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "user_message", id: userMessageId })}\n\n`
            )
          )

          const llmStream = provider.streamChat(apiKey, {
            model,
            messages: existingMessages,
            temperature,
            maxTokens,
          })

          for await (const event of llmStream) {
            if (event.type === "text") {
              fullContent += event.content
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "text", content: event.content })}\n\n`
                )
              )
            } else if (event.type === "error") {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "error", content: event.content })}\n\n`
                )
              )
            }
          }

          db.insert(messages)
            .values({
              id: assistantMessageId,
              chatId,
              role: "assistant",
              content: fullContent,
            })
            .run()

          db.update(chats)
            .set({ updatedAt: new Date().toISOString() })
            .where(eq(chats.id, chatId))
            .run()

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "done", id: assistantMessageId })}\n\n`
            )
          )
        } catch (error) {
          const safeMessage = sanitizeErrorMessage(error)
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", content: safeMessage })}\n\n`
            )
          )
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { success: false, error: "Failed to send message" },
      { status: 500 }
    )
  }
}

const SAFE_ERROR_PATTERNS: Record<string, string> = {
  "401": "Authentication failed. Check your API key.",
  "429": "Rate limited. Please try again later.",
  "500": "Provider server error. Please try again.",
  "insufficient_quota": "API quota exceeded.",
  "model_not_found": "Model not available.",
}

function sanitizeErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : "Unknown error"
  for (const [pattern, message] of Object.entries(SAFE_ERROR_PATTERNS)) {
    if (raw.includes(pattern)) return message
  }
  return "An error occurred while generating the response."
}
