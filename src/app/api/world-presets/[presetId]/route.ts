import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { worldPresets } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { getRequiredUserId } from "@/lib/auth/session"
import { z } from "zod/v4"

const updatePresetSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  systemPrompt: z.string().max(50000).optional(),
  postHistoryInstructions: z.string().max(10000).optional(),
  formattingOrder: z.array(z.string()).optional(),
  defaultProvider: z.string().nullable().optional(),
  defaultModel: z.string().nullable().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().optional(),
  maxContext: z.number().int().positive().optional(),
})

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ presetId: string }> }
) {
  try {
    const userId = await getRequiredUserId()
    const { presetId } = await params

    const preset = db
      .select()
      .from(worldPresets)
      .where(
        and(eq(worldPresets.id, presetId), eq(worldPresets.userId, userId))
      )
      .get()

    if (!preset) {
      return NextResponse.json(
        { success: false, error: "Preset not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: preset })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { success: false, error: "Failed to fetch preset" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ presetId: string }> }
) {
  try {
    const userId = await getRequiredUserId()
    const { presetId } = await params
    const body = await request.json()
    const parsed = updatePresetSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const existing = db
      .select()
      .from(worldPresets)
      .where(
        and(eq(worldPresets.id, presetId), eq(worldPresets.userId, userId))
      )
      .get()

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Preset not found" },
        { status: 404 }
      )
    }

    const { formattingOrder, ...rest } = parsed.data
    const updates: Record<string, unknown> = {
      ...rest,
      updatedAt: new Date().toISOString(),
    }
    if (formattingOrder !== undefined) {
      updates.formattingOrder = JSON.stringify(formattingOrder)
    }

    db.update(worldPresets)
      .set(updates)
      .where(eq(worldPresets.id, presetId))
      .run()

    const updated = db
      .select()
      .from(worldPresets)
      .where(eq(worldPresets.id, presetId))
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
      { success: false, error: "Failed to update preset" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ presetId: string }> }
) {
  try {
    const userId = await getRequiredUserId()
    const { presetId } = await params

    const existing = db
      .select()
      .from(worldPresets)
      .where(
        and(eq(worldPresets.id, presetId), eq(worldPresets.userId, userId))
      )
      .get()

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Preset not found" },
        { status: 404 }
      )
    }

    db.delete(worldPresets).where(eq(worldPresets.id, presetId)).run()

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { success: false, error: "Failed to delete preset" },
      { status: 500 }
    )
  }
}
