import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { chats, characters } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { getRequiredUserId } from "@/lib/auth/session"
import { resolveAvatarUrl } from "@/lib/assets/resolve-url"
import { randomUUID } from "crypto"
import { z } from "zod/v4"

const createChatSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  characterId: z.string().nullable().optional(),
  worldPresetId: z.string().nullable().optional(),
})

export async function GET() {
  try {
    const userId = await getRequiredUserId()

    const rows = db
      .select({
        id: chats.id,
        title: chats.title,
        characterId: chats.characterId,
        updatedAt: chats.updatedAt,
        characterName: characters.name,
        characterAvatarAssetId: characters.avatarAssetId,
      })
      .from(chats)
      .leftJoin(characters, eq(chats.characterId, characters.id))
      .where(eq(chats.userId, userId))
      .orderBy(desc(chats.updatedAt))
      .all()

    const result = rows.map((row) => ({
      id: row.id,
      title: row.title,
      characterId: row.characterId,
      updatedAt: row.updatedAt,
      characterName: row.characterName ?? null,
      characterAvatarUrl: resolveAvatarUrl(row.characterAvatarAssetId ?? null),
    }))

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
      worldPresetId: parsed.data.worldPresetId ?? null,
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
