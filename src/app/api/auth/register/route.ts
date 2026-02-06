import { NextResponse } from "next/server"
import { hash } from "bcrypt"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod/v4"
import { randomUUID } from "crypto"

const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(32, "Username must be at most 32 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, hyphens, and underscores"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters"),
  displayName: z
    .string()
    .min(1, "Display name is required")
    .max(64, "Display name must be at most 64 characters"),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { username, password, displayName } = parsed.data

    const existing = db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .get()

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Username already taken" },
        { status: 409 }
      )
    }

    const passwordHash = await hash(password, 12)
    const id = randomUUID()

    db.insert(users)
      .values({ id, username, passwordHash, displayName })
      .run()

    return NextResponse.json(
      { success: true, data: { id, username, displayName } },
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration failed:", error)
    return NextResponse.json(
      { success: false, error: "Registration failed" },
      { status: 500 }
    )
  }
}
