import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { characters, assets } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getRequiredUserId } from "@/lib/auth/session"
import { parseCharacterFile } from "@/lib/characters/parser"
import { randomUUID } from "crypto"

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

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "File too large (max 50MB)" },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await parseCharacterFile(buffer, file.name)

    let avatarAssetId: string | null = null
    if (result.avatarBuffer) {
      avatarAssetId = randomUUID()
      db.insert(assets)
        .values({
          id: avatarAssetId,
          userId,
          name: `${result.character.name}_avatar.png`,
          mimeType: "image/png",
          data: result.avatarBuffer,
        })
        .run()
    }

    // Store additional assets
    for (const [path, assetData] of result.additionalAssets) {
      const assetId = randomUUID()
      const ext = path.split(".").pop() ?? ""
      const mimeType = ext === "png" ? "image/png" : ext === "jpg" ? "image/jpeg" : "application/octet-stream"

      db.insert(assets)
        .values({
          id: assetId,
          userId,
          name: path,
          mimeType,
          data: assetData,
        })
        .run()
    }

    const characterId = randomUUID()
    const char = result.character

    db.insert(characters)
      .values({
        id: characterId,
        userId,
        name: char.name,
        description: char.description,
        personality: char.personality,
        scenario: char.scenario,
        firstMessage: char.firstMessage,
        messageExample: char.messageExample,
        systemPrompt: char.systemPrompt,
        creatorNotes: char.creatorNotes,
        tags: JSON.stringify(char.tags),
        avatarAssetId,
        specVersion: char.specVersion,
        extensions: JSON.stringify({
          ...char.extensions,
          risuai: char.risuExtensions,
        }),
      })
      .run()

    const created = db
      .select()
      .from(characters)
      .where(eq(characters.id, characterId))
      .get()

    return NextResponse.json(
      { success: true, data: created },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }
    const message =
      error instanceof Error ? error.message : "Import failed"
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    )
  }
}
