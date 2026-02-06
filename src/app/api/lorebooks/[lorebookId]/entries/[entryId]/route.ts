import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { lorebooks, lorebookEntries } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { getRequiredUserId } from "@/lib/auth/session"
import { z } from "zod/v4"

const updateEntrySchema = z.object({
  keys: z.array(z.string()).min(1).optional(),
  content: z.string().min(1).max(10000).optional(),
  enabled: z.boolean().optional(),
  caseSensitive: z.boolean().optional(),
  priority: z.number().int().min(0).max(1000).optional(),
  insertionOrder: z.number().int().min(0).max(1000).optional(),
  position: z.enum(["before_char", "after_char"]).optional(),
})

async function verifyOwnership(
  lorebookId: string,
  userId: string
): Promise<boolean> {
  const lorebook = db
    .select()
    .from(lorebooks)
    .where(and(eq(lorebooks.id, lorebookId), eq(lorebooks.userId, userId)))
    .get()
  return !!lorebook
}

export async function PATCH(
  request: Request,
  {
    params,
  }: { params: Promise<{ lorebookId: string; entryId: string }> }
) {
  try {
    const userId = await getRequiredUserId()
    const { lorebookId, entryId } = await params

    if (!(await verifyOwnership(lorebookId, userId))) {
      return NextResponse.json(
        { success: false, error: "Lorebook not found" },
        { status: 404 }
      )
    }

    const body = await request.json()
    const parsed = updateEntrySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const existing = db
      .select()
      .from(lorebookEntries)
      .where(
        and(
          eq(lorebookEntries.id, entryId),
          eq(lorebookEntries.lorebookId, lorebookId)
        )
      )
      .get()

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Entry not found" },
        { status: 404 }
      )
    }

    const updates: Record<string, unknown> = {}
    if (parsed.data.keys !== undefined) {
      updates.keys = JSON.stringify(parsed.data.keys)
    }
    if (parsed.data.content !== undefined) updates.content = parsed.data.content
    if (parsed.data.enabled !== undefined) updates.enabled = parsed.data.enabled
    if (parsed.data.caseSensitive !== undefined)
      updates.caseSensitive = parsed.data.caseSensitive
    if (parsed.data.priority !== undefined) updates.priority = parsed.data.priority
    if (parsed.data.insertionOrder !== undefined)
      updates.insertionOrder = parsed.data.insertionOrder
    if (parsed.data.position !== undefined) updates.position = parsed.data.position

    db.update(lorebookEntries)
      .set(updates)
      .where(eq(lorebookEntries.id, entryId))
      .run()

    const updated = db
      .select()
      .from(lorebookEntries)
      .where(eq(lorebookEntries.id, entryId))
      .get()

    return NextResponse.json({
      success: true,
      data: updated
        ? {
            ...updated,
            keys: JSON.parse(updated.keys) as string[],
            decorators: JSON.parse(updated.decorators) as string[],
          }
        : null,
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { success: false, error: "Failed to update entry" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: Request,
  {
    params,
  }: { params: Promise<{ lorebookId: string; entryId: string }> }
) {
  try {
    const userId = await getRequiredUserId()
    const { lorebookId, entryId } = await params

    if (!(await verifyOwnership(lorebookId, userId))) {
      return NextResponse.json(
        { success: false, error: "Lorebook not found" },
        { status: 404 }
      )
    }

    const existing = db
      .select()
      .from(lorebookEntries)
      .where(
        and(
          eq(lorebookEntries.id, entryId),
          eq(lorebookEntries.lorebookId, lorebookId)
        )
      )
      .get()

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Entry not found" },
        { status: 404 }
      )
    }

    db.delete(lorebookEntries)
      .where(eq(lorebookEntries.id, entryId))
      .run()

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { success: false, error: "Failed to delete entry" },
      { status: 500 }
    )
  }
}
