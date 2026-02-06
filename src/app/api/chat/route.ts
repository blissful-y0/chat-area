import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { chats } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { getRequiredUserId } from "@/lib/auth/session"
import { randomUUID } from "crypto"
import { z } from "zod/v4"

const createChatSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  characterId: z.string().uuid().nullable().optional(),
})

export async function GET() {
  try {
    const userId = await getRequiredUserId()

    const result = db
      .select({
        id: chats.id,
        title: chats.title,
        characterId: chats.characterId,
        updatedAt: chats.updatedAt,
      })
      .from(chats)
      .where(eq(chats.userId, userId))
      .orderBy(desc(chats.updatedAt))
      .all()

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { success: false, error: "Failed to fetch chats" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getRequiredUserId()
    const body = await request.json()
    const parsed = createChatSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const id = randomUUID()
    const chat = {
      id,
      userId,
      title: parsed.data.title ?? "New Chat",
      characterId: parsed.data.characterId ?? null,
    }

    db.insert(chats).values(chat).run()

    const created = db
      .select()
      .from(chats)
      .where(eq(chats.id, id))
      .get()

    return NextResponse.json(
      { success: true, data: created },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { success: false, error: "Failed to create chat" },
      { status: 500 }
    )
  }
}
