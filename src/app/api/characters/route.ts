import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { characters } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { getRequiredUserId } from "@/lib/auth/session"
import { createCharacterSchema } from "@/lib/characters/types"
import { randomUUID } from "crypto"

export async function GET() {
  try {
    const userId = await getRequiredUserId()

    const result = db
      .select({
        id: characters.id,
        name: characters.name,
        description: characters.description,
        tags: characters.tags,
        avatarAssetId: characters.avatarAssetId,
        specVersion: characters.specVersion,
        createdAt: characters.createdAt,
        updatedAt: characters.updatedAt,
      })
      .from(characters)
      .where(eq(characters.userId, userId))
      .orderBy(desc(characters.updatedAt))
      .all()

    const parsed = result.map((c) => ({
      ...c,
      tags: JSON.parse(c.tags),
    }))

    return NextResponse.json({ success: true, data: parsed })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { success: false, error: "Failed to fetch characters" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getRequiredUserId()
    const body = await request.json()
    const parsed = createCharacterSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const id = randomUUID()
    const data = parsed.data

    db.insert(characters)
      .values({
        id,
        userId,
        name: data.name,
        description: data.description,
        personality: data.personality,
        scenario: data.scenario,
        firstMessage: data.firstMessage,
        messageExample: data.messageExample,
        systemPrompt: data.systemPrompt,
        creatorNotes: data.creatorNotes,
        tags: JSON.stringify(data.tags),
        extensions: JSON.stringify(data.extensions),
      })
      .run()

    const created = db
      .select()
      .from(characters)
      .where(eq(characters.id, id))
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
      { success: false, error: "Failed to create character" },
      { status: 500 }
    )
  }
}
