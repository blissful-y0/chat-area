import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { characters, assets } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { getRequiredUserId } from "@/lib/auth/session"
import { exportToPng, exportToJson } from "@/lib/characters/exporter"
import type { InternalCharacter } from "@/lib/characters/types"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ characterId: string }> }
) {
  try {
    const userId = await getRequiredUserId()
    const { characterId } = await params

    const url = new URL(request.url)
    const format = url.searchParams.get("format") ?? "png"

    const char = db
      .select()
      .from(characters)
      .where(and(eq(characters.id, characterId), eq(characters.userId, userId)))
      .get()

    if (!char) {
      return NextResponse.json(
        { success: false, error: "Character not found" },
        { status: 404 }
      )
    }

    const internal: InternalCharacter = {
      ...char,
      specVersion: char.specVersion as "v1" | "v2" | "v3",
      tags: JSON.parse(char.tags) as string[],
      extensions: JSON.parse(char.extensions) as Record<string, unknown>,
      risuExtensions: { regex: [], additionalAssets: [], talkativeness: 0.5, fav: false },
      postHistoryInstructions: "",
      alternateGreetings: [],
      creator: "",
      characterVersion: "",
      characterBook: undefined,
    }

    // Extract risuExtensions from extensions
    const ext = internal.extensions as Record<string, unknown>
    if (ext.risuai && typeof ext.risuai === "object") {
      internal.risuExtensions = ext.risuai as InternalCharacter["risuExtensions"]
    }

    let avatarBuffer: Buffer | null = null
    if (char.avatarAssetId) {
      const avatar = db
        .select()
        .from(assets)
        .where(eq(assets.id, char.avatarAssetId))
        .get()
      if (avatar) {
        avatarBuffer = avatar.data as Buffer
      }
    }

    if (format === "json") {
      const json = await exportToJson(internal, "v2")
      return new Response(json, {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(char.name)}.json"`,
        },
      })
    }

    // Default: PNG
    const specFormat = char.specVersion === "v3" ? "v3" : "v2"
    const png = await exportToPng(internal, avatarBuffer, specFormat)
    return new Response(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(char.name)}.png"`,
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
      { success: false, error: "Export failed" },
      { status: 500 }
    )
  }
}
