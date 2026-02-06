import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { assets } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { getRequiredUserId } from "@/lib/auth/session"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ assetId: string }> }
) {
  try {
    const userId = await getRequiredUserId()
    const { assetId } = await params

    const asset = db
      .select()
      .from(assets)
      .where(and(eq(assets.id, assetId), eq(assets.userId, userId)))
      .get()

    if (!asset) {
      return NextResponse.json(
        { success: false, error: "Asset not found" },
        { status: 404 }
      )
    }

    return new Response(new Uint8Array(asset.data as Buffer), {
      headers: {
        "Content-Type": asset.mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
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
      { success: false, error: "Failed to fetch asset" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ assetId: string }> }
) {
  try {
    const userId = await getRequiredUserId()
    const { assetId } = await params

    const existing = db
      .select()
      .from(assets)
      .where(and(eq(assets.id, assetId), eq(assets.userId, userId)))
      .get()

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Asset not found" },
        { status: 404 }
      )
    }

    db.delete(assets).where(eq(assets.id, assetId)).run()

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { success: false, error: "Failed to delete asset" },
      { status: 500 }
    )
  }
}
