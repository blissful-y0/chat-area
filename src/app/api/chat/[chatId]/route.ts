import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { chats, messages } from "@/lib/db/schema"
import { eq, and, asc } from "drizzle-orm"
import { getRequiredUserId } from "@/lib/auth/session"
import { z } from "zod/v4"

const updateChatSchema = z.object({
  title: z.string().min(1).max(200).optional(),
})

export async function GET(
  _request: Request,
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

    const chatMessages = db
      .select()
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(asc(messages.createdAt))
      .all()

    const parsedMessages = chatMessages.map((m) => ({
      ...m,
      alternatives: JSON.parse(m.alternatives) as string[],
    }))

    return NextResponse.json({
      success: true,
      data: { ...chat, messages: parsedMessages },
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { success: false, error: "Failed to fetch chat" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const userId = await getRequiredUserId()
    const { chatId } = await params
    const body = await request.json()
    const parsed = updateChatSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const existing = db
      .select()
      .from(chats)
      .where(and(eq(chats.id, chatId), eq(chats.userId, userId)))
      .get()

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Chat not found" },
        { status: 404 }
      )
    }

    db.update(chats)
      .set({
        ...parsed.data,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(chats.id, chatId))
      .run()

    const updated = db.select().from(chats).where(eq(chats.id, chatId)).get()

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { success: false, error: "Failed to update chat" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const userId = await getRequiredUserId()
    const { chatId } = await params

    const existing = db
      .select()
      .from(chats)
      .where(and(eq(chats.id, chatId), eq(chats.userId, userId)))
      .get()

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Chat not found" },
        { status: 404 }
      )
    }

    db.delete(chats).where(eq(chats.id, chatId)).run()

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { success: false, error: "Failed to delete chat" },
      { status: 500 }
    )
  }
}
