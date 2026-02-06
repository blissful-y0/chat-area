import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { lorebooks, lorebookEntries } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { getRequiredUserId } from "@/lib/auth/session"
import { randomUUID } from "crypto"
import { z } from "zod/v4"

const createEntrySchema = z.object({
  keys: z.array(z.string()).min(1),
  content: z.string().min(1).max(10000),
  enabled: z.boolean().default(true),
  caseSensitive: z.boolean().default(false),
  priority: z.number().int().min(0).max(1000).default(10),
  insertionOrder: z.number().int().min(0).max(1000).default(100),
  position: z.enum(["before_char", "after_char"]).default("before_char"),
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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ lorebookId: string }> }
) {
  try {
    const userId = await getRequiredUserId()
    const { lorebookId } = await params

    if (!(await verifyOwnership(lorebookId, userId))) {
      return NextResponse.json(
        { success: false, error: "Lorebook not found" },
        { status: 404 }
      )
    }

    const entries = db
      .select()
      .from(lorebookEntries)
      .where(eq(lorebookEntries.lorebookId, lorebookId))
      .all()

    const parsed = entries.map((e) => ({
      ...e,
      keys: JSON.parse(e.keys) as string[],
      decorators: JSON.parse(e.decorators) as string[],
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
      { success: false, error: "Failed to fetch entries" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ lorebookId: string }> }
) {
  try {
    const userId = await getRequiredUserId()
    const { lorebookId } = await params

    if (!(await verifyOwnership(lorebookId, userId))) {
      return NextResponse.json(
        { success: false, error: "Lorebook not found" },
        { status: 404 }
      )
    }

    const body = await request.json()
    const parsed = createEntrySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const id = randomUUID()
    db.insert(lorebookEntries)
      .values({
        id,
        lorebookId,
        keys: JSON.stringify(parsed.data.keys),
        content: parsed.data.content,
        enabled: parsed.data.enabled,
        caseSensitive: parsed.data.caseSensitive,
        priority: parsed.data.priority,
        insertionOrder: parsed.data.insertionOrder,
        position: parsed.data.position,
      })
      .run()

    const created = db
      .select()
      .from(lorebookEntries)
      .where(eq(lorebookEntries.id, id))
      .get()

    return NextResponse.json(
      {
        success: true,
        data: created
          ? {
              ...created,
              keys: JSON.parse(created.keys) as string[],
              decorators: JSON.parse(created.decorators) as string[],
            }
          : null,
      },
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
      { success: false, error: "Failed to create entry" },
      { status: 500 }
    )
  }
}
