import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { worldPresets } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getRequiredUserId } from "@/lib/auth/session"
import { randomUUID } from "crypto"
import { z } from "zod/v4"

const createPresetSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).default(""),
  systemPrompt: z.string().max(50000).default(""),
  postHistoryInstructions: z.string().max(10000).default(""),
  formattingOrder: z.array(z.string()).optional(),
  defaultProvider: z.string().nullable().default(null),
  defaultModel: z.string().nullable().default(null),
  temperature: z.number().min(0).max(2).default(0.8),
  maxTokens: z.number().int().positive().default(4096),
  maxContext: z.number().int().positive().default(128000),
})

export async function GET() {
  try {
    const userId = await getRequiredUserId()

    const presets = db
      .select()
      .from(worldPresets)
      .where(eq(worldPresets.userId, userId))
      .all()

    return NextResponse.json({ success: true, data: presets })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { success: false, error: "Failed to fetch presets" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getRequiredUserId()
    const body = await request.json()
    const parsed = createPresetSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const id = randomUUID()
    const { formattingOrder, ...rest } = parsed.data

    db.insert(worldPresets)
      .values({
        id,
        userId,
        ...rest,
        formattingOrder: formattingOrder
          ? JSON.stringify(formattingOrder)
          : undefined,
      })
      .run()

    const created = db
      .select()
      .from(worldPresets)
      .where(eq(worldPresets.id, id))
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
      { success: false, error: "Failed to create preset" },
      { status: 500 }
    )
  }
}
