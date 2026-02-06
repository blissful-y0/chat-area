import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { lorebooks } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { getRequiredUserId } from "@/lib/auth/session"
import { z } from "zod/v4"

const updateLorebookSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  characterId: z.string().nullable().optional(),
  scanDepth: z.number().int().min(1).max(50).optional(),
  tokenBudget: z.number().int().min(100).max(100000).optional(),
  recursive: z.boolean().optional(),
})

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ lorebookId: string }> }
) {
  try {
    const userId = await getRequiredUserId()
    const { lorebookId } = await params

    const lorebook = db
      .select()
      .from(lorebooks)
      .where(and(eq(lorebooks.id, lorebookId), eq(lorebooks.userId, userId)))
      .get()

    if (!lorebook) {
      return NextResponse.json(
        { success: false, error: "Lorebook not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: lorebook })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { success: false, error: "Failed to fetch lorebook" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ lorebookId: string }> }
) {
  try {
    const userId = await getRequiredUserId()
    const { lorebookId } = await params
    const body = await request.json()
    const parsed = updateLorebookSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const existing = db
      .select()
      .from(lorebooks)
      .where(and(eq(lorebooks.id, lorebookId), eq(lorebooks.userId, userId)))
      .get()

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Lorebook not found" },
        { status: 404 }
      )
    }

    db.update(lorebooks)
      .set(parsed.data)
      .where(eq(lorebooks.id, lorebookId))
      .run()

    const updated = db
      .select()
      .from(lorebooks)
      .where(eq(lorebooks.id, lorebookId))
      .get()

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { success: false, error: "Failed to update lorebook" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ lorebookId: string }> }
) {
  try {
    const userId = await getRequiredUserId()
    const { lorebookId } = await params

    const existing = db
      .select()
      .from(lorebooks)
      .where(and(eq(lorebooks.id, lorebookId), eq(lorebooks.userId, userId)))
      .get()

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Lorebook not found" },
        { status: 404 }
      )
    }

    db.delete(lorebooks).where(eq(lorebooks.id, lorebookId)).run()

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { success: false, error: "Failed to delete lorebook" },
      { status: 500 }
    )
  }
}
