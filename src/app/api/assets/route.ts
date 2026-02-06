import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { assets } from "@/lib/db/schema"
import { getRequiredUserId } from "@/lib/auth/session"
import { randomUUID } from "crypto"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(request: Request) {
  try {
    const userId = await getRequiredUserId()

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "File too large (max 10MB)" },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const id = randomUUID()

    db.insert(assets)
      .values({
        id,
        userId,
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        data: buffer,
      })
      .run()

    return NextResponse.json(
      { success: true, data: { id, name: file.name, mimeType: file.type } },
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
      { success: false, error: "Failed to upload asset" },
      { status: 500 }
    )
  }
}
