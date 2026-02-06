import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { characters } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { getRequiredUserId } from "@/lib/auth/session"
import { updateCharacterSchema } from "@/lib/characters/types"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ characterId: string }> }
) {
  try {
    const userId = await getRequiredUserId()
    const { characterId } = await params

    const char = db
      .select()
      .from(characters)
      .where(and(eq(characters.id, characterId), eq(characters.userId, userId)))
      .get()

    if (!char) {
      return NextResponse.json(
        { success: false, error: "Character not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        ...char,
        tags: JSON.parse(char.tags),
        extensions: JSON.parse(char.extensions),
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
      { success: false, error: "Failed to fetch character" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ characterId: string }> }
) {
  try {
    const userId = await getRequiredUserId()
    const { characterId } = await params
    const body = await request.json()
    const parsed = updateCharacterSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const existing = db
      .select()
      .from(characters)
      .where(and(eq(characters.id, characterId), eq(characters.userId, userId)))
      .get()

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Character not found" },
        { status: 404 }
      )
    }

    const data = parsed.data
    const updates: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    }

    if (data.name !== undefined) updates.name = data.name
    if (data.description !== undefined) updates.description = data.description
    if (data.personality !== undefined) updates.personality = data.personality
    if (data.scenario !== undefined) updates.scenario = data.scenario
    if (data.firstMessage !== undefined) updates.firstMessage = data.firstMessage
    if (data.messageExample !== undefined) updates.messageExample = data.messageExample
    if (data.systemPrompt !== undefined) updates.systemPrompt = data.systemPrompt
    if (data.creatorNotes !== undefined) updates.creatorNotes = data.creatorNotes
    if (data.tags !== undefined) updates.tags = JSON.stringify(data.tags)
    if (data.extensions !== undefined) updates.extensions = JSON.stringify(data.extensions)

    db.update(characters)
      .set(updates)
      .where(eq(characters.id, characterId))
      .run()

    const updated = db
      .select()
      .from(characters)
      .where(eq(characters.id, characterId))
      .get()

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        tags: JSON.parse(updated!.tags),
        extensions: JSON.parse(updated!.extensions),
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
      { success: false, error: "Failed to update character" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ characterId: string }> }
) {
  try {
    const userId = await getRequiredUserId()
    const { characterId } = await params

    const existing = db
      .select()
      .from(characters)
      .where(and(eq(characters.id, characterId), eq(characters.userId, userId)))
      .get()

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Character not found" },
        { status: 404 }
      )
    }

    db.delete(characters).where(eq(characters.id, characterId)).run()

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { success: false, error: "Failed to delete character" },
      { status: 500 }
    )
  }
}
