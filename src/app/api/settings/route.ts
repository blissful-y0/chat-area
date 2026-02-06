import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { userSettings } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { getRequiredUserId } from "@/lib/auth/session"
import { encrypt, decrypt } from "@/lib/crypto"
import { z } from "zod/v4"
import { randomUUID } from "crypto"

const SENSITIVE_KEYS = new Set([
  "openai_api_key",
  "anthropic_api_key",
  "google_api_key",
  "openrouter_api_key",
  "custom_api_key",
])

const updateSettingSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.string().max(10000),
})

export async function GET() {
  try {
    const userId = await getRequiredUserId()

    const settings = db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .all()

    const result = settings.map((s) => {
      if (SENSITIVE_KEYS.has(s.key)) {
        try {
          const decrypted = decrypt(s.value)
          return {
            ...s,
            value: maskApiKey(decrypted),
          }
        } catch {
          return { ...s, value: "***invalid***" }
        }
      }
      return s
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { success: false, error: "Failed to fetch settings" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const userId = await getRequiredUserId()
    const body = await request.json()
    const parsed = updateSettingSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { key, value } = parsed.data
    const storedValue = SENSITIVE_KEYS.has(key) ? encrypt(value) : value

    const existing = db
      .select()
      .from(userSettings)
      .where(and(eq(userSettings.userId, userId), eq(userSettings.key, key)))
      .get()

    if (existing) {
      db.update(userSettings)
        .set({ value: storedValue })
        .where(eq(userSettings.id, existing.id))
        .run()
    } else {
      db.insert(userSettings)
        .values({
          id: randomUUID(),
          userId,
          key,
          value: storedValue,
        })
        .run()
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { success: false, error: "Failed to update setting" },
      { status: 500 }
    )
  }
}

function maskApiKey(key: string): string {
  if (key.length <= 8) return "****"
  return key.slice(0, 4) + "****" + key.slice(-4)
}
