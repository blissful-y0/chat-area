import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import {
  chats,
  characters,
  worldPresets,
  lorebooks,
  lorebookEntries,
  groupMembers,
} from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { getRequiredUserId } from "@/lib/auth/session"
import { resolveAvatarUrl } from "@/lib/assets/resolve-url"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const userId = await getRequiredUserId()
    const { chatId } = await params

    const chat = db
      .select()
      .from(chats)
      .where(and(eq(chats.id, chatId), eq(chats.userId, userId)))
      .get()

    if (!chat) {
      return NextResponse.json(
        { success: false, error: "Chat not found" },
        { status: 404 }
      )
    }

    const character = chat.characterId
      ? db
          .select()
          .from(characters)
          .where(eq(characters.id, chat.characterId))
          .get()
      : null

    const characterData = character
      ? {
          id: character.id,
          name: character.name,
          description: character.description,
          personality: character.personality,
          scenario: character.scenario,
          firstMessage: character.firstMessage,
          systemPrompt: character.systemPrompt,
          creatorNotes: character.creatorNotes,
          tags: safeParse(character.tags, []),
          avatarUrl: resolveAvatarUrl(character.avatarAssetId),
        }
      : null

    const worldPreset = chat.worldPresetId
      ? db
          .select()
          .from(worldPresets)
          .where(eq(worldPresets.id, chat.worldPresetId))
          .get()
      : null

    const worldPresetData = worldPreset
      ? {
          id: worldPreset.id,
          name: worldPreset.name,
          description: worldPreset.description,
          systemPrompt: worldPreset.systemPrompt,
          postHistoryInstructions: worldPreset.postHistoryInstructions,
          formattingOrder: safeParse(worldPreset.formattingOrder, []),
          defaultProvider: worldPreset.defaultProvider,
          defaultModel: worldPreset.defaultModel,
          temperature: worldPreset.temperature,
          maxTokens: worldPreset.maxTokens,
          maxContext: worldPreset.maxContext,
        }
      : null

    const userLorebooks = db
      .select()
      .from(lorebooks)
      .where(eq(lorebooks.userId, userId))
      .all()

    const lorebooksData = userLorebooks.map((lb) => {
      const entries = db
        .select()
        .from(lorebookEntries)
        .where(eq(lorebookEntries.lorebookId, lb.id))
        .all()

      return {
        id: lb.id,
        name: lb.name,
        description: lb.description,
        scanDepth: lb.scanDepth,
        tokenBudget: lb.tokenBudget,
        recursive: lb.recursive,
        entries: entries.map((e) => ({
          id: e.id,
          keys: safeParse(e.keys, []),
          content: e.content,
          enabled: e.enabled,
          caseSensitive: e.caseSensitive,
          priority: e.priority,
          insertionOrder: e.insertionOrder,
          position: e.position,
        })),
      }
    })

    const members = chat.isGroup
      ? db
          .select({
            id: groupMembers.id,
            characterId: groupMembers.characterId,
            orderIndex: groupMembers.orderIndex,
            probability: groupMembers.probability,
            isActive: groupMembers.isActive,
            characterName: characters.name,
            characterAvatarAssetId: characters.avatarAssetId,
          })
          .from(groupMembers)
          .leftJoin(characters, eq(groupMembers.characterId, characters.id))
          .where(eq(groupMembers.chatId, chatId))
          .all()
      : []

    const groupMembersData = members.map((m) => ({
      id: m.id,
      characterId: m.characterId,
      orderIndex: m.orderIndex,
      probability: m.probability,
      isActive: m.isActive,
      characterName: m.characterName ?? "Unknown",
      characterAvatarUrl: resolveAvatarUrl(m.characterAvatarAssetId ?? null),
    }))

    return NextResponse.json({
      success: true,
      data: {
        character: characterData,
        worldPreset: worldPresetData,
        lorebooks: lorebooksData,
        groupMembers: groupMembersData,
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
      { success: false, error: "Failed to fetch chat context" },
      { status: 500 }
    )
  }
}

function safeParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T
  } catch {
    return fallback
  }
}
