import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { lorebooks } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getRequiredUserId } from "@/lib/auth/session"
import { randomUUID } from "crypto"
import { z } from "zod/v4"

const createLorebookSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).default(""),
  characterId: z.string().nullable().default(null),
  scanDepth: z.number().int().min(1).max(50).default(2),
  tokenBudget: z.number().int().min(100).max(100000).default(2048),
  recursive: z.boolean().default(false),
})

export async function GET(request: Request) {
  try {
    const userId = await getRequiredUserId()
    const { searchParams } = new URL(request.url)
    const characterId = searchParams.get("characterId")

    let query = db
      .select()
      .from(lorebooks)
      .where(eq(lorebooks.userId, userId))

    const results = query.all()

    const filtered = characterId
      ? results.filter(
          (lb) => lb.characterId === characterId || lb.characterId === null
        )
      : results

    return NextResponse.json({ success: true, data: filtered })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { success: false, error: "Failed to fetch lorebooks" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getRequiredUserId()
    const body = await request.json()
    const parsed = createLorebookSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const id = randomUUID()
    db.insert(lorebooks)
      .values({
        id,
        userId,
        ...parsed.data,
      })
      .run()

    const created = db
      .select()
      .from(lorebooks)
      .where(eq(lorebooks.id, id))
      .get()

    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { success: false, error: "Failed to create lorebook" },
      { status: 500 }
    )
  }
}
