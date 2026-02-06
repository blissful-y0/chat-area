import {
  characterCardV2Schema,
  characterCardV3Schema,
  type InternalCharacter,
  type CharacterCardV2,
  type CharacterCardV3,
  type RisuExtensions,
} from "./types"
import { readCharacterFromPng } from "./png"
import { readCharX } from "./charx"

export interface ParseResult {
  character: Omit<InternalCharacter, "id" | "userId" | "createdAt" | "updatedAt">
  avatarBuffer: Buffer | null
  additionalAssets: Map<string, Buffer>
}

export async function parseCharacterFile(
  buffer: Buffer,
  filename: string
): Promise<ParseResult> {
  const ext = filename.toLowerCase().split(".").pop()

  switch (ext) {
    case "png":
      return parsePngCharacter(buffer)
    case "charx":
      return parseCharXCharacter(buffer)
    case "json":
      return parseJsonCharacter(buffer)
    default:
      throw new Error(`Unsupported file format: .${ext}`)
  }
}

async function parsePngCharacter(buffer: Buffer): Promise<ParseResult> {
  const extracted = readCharacterFromPng(buffer)
  if (!extracted) {
    throw new Error("No character data found in PNG")
  }

  const { format, data } = extracted

  if (format === "v3") {
    const parsed = characterCardV3Schema.parse(data)
    return {
      character: v3ToInternal(parsed),
      avatarBuffer: buffer,
      additionalAssets: new Map(),
    }
  }

  if (format === "v2") {
    const parsed = characterCardV2Schema.parse(data)
    return {
      character: v2ToInternal(parsed),
      avatarBuffer: buffer,
      additionalAssets: new Map(),
    }
  }

  // V1 fallback
  return {
    character: v1ToInternal(data as Record<string, unknown>),
    avatarBuffer: buffer,
    additionalAssets: new Map(),
  }
}

async function parseCharXCharacter(buffer: Buffer): Promise<ParseResult> {
  const { card, assets } = await readCharX(buffer)
  const parsed = characterCardV3Schema.parse(card)

  // Extract avatar from assets if referenced
  let avatarBuffer: Buffer | null = null
  const avatarAsset = parsed.data.assets?.find((a) => a.type === "icon")
  if (avatarAsset) {
    const avatarPath = avatarAsset.uri.replace("embeded://", "")
    avatarBuffer = assets.get(avatarPath) ?? null
  }

  return {
    character: v3ToInternal(parsed),
    avatarBuffer,
    additionalAssets: assets,
  }
}

async function parseJsonCharacter(buffer: Buffer): Promise<ParseResult> {
  const text = buffer.toString("utf-8")
  const json = JSON.parse(text)

  if (json.spec === "chara_card_v3") {
    const parsed = characterCardV3Schema.parse(json)
    return {
      character: v3ToInternal(parsed),
      avatarBuffer: null,
      additionalAssets: new Map(),
    }
  }

  if (json.spec === "chara_card_v2") {
    const parsed = characterCardV2Schema.parse(json)
    return {
      character: v2ToInternal(parsed),
      avatarBuffer: null,
      additionalAssets: new Map(),
    }
  }

  // Try V2 data format (without spec wrapper)
  if (json.name && (json.description !== undefined || json.first_mes !== undefined)) {
    return {
      character: v1ToInternal(json),
      avatarBuffer: null,
      additionalAssets: new Map(),
    }
  }

  throw new Error("Unrecognized character card JSON format")
}

function v2ToInternal(
  card: CharacterCardV2
): Omit<InternalCharacter, "id" | "userId" | "createdAt" | "updatedAt"> {
  const d = card.data
  const risuExt = extractRisuExtensions(d.extensions)

  return {
    name: d.name,
    description: d.description,
    personality: d.personality,
    scenario: d.scenario,
    firstMessage: d.first_mes,
    messageExample: d.mes_example,
    systemPrompt: d.system_prompt,
    creatorNotes: d.creator_notes,
    postHistoryInstructions: d.post_history_instructions,
    alternateGreetings: d.alternate_greetings,
    tags: d.tags,
    creator: d.creator,
    characterVersion: d.character_version,
    avatarAssetId: null,
    specVersion: "v2",
    extensions: d.extensions,
    risuExtensions: risuExt,
    characterBook: d.character_book,
  }
}

function v3ToInternal(
  card: CharacterCardV3
): Omit<InternalCharacter, "id" | "userId" | "createdAt" | "updatedAt"> {
  const d = card.data
  const risuExt = extractRisuExtensions(d.extensions)

  return {
    name: d.name,
    description: d.description,
    personality: d.personality,
    scenario: d.scenario,
    firstMessage: d.first_mes,
    messageExample: d.mes_example,
    systemPrompt: d.system_prompt,
    creatorNotes: d.creator_notes,
    postHistoryInstructions: d.post_history_instructions,
    alternateGreetings: d.alternate_greetings,
    tags: d.tags,
    creator: d.creator,
    characterVersion: d.character_version,
    avatarAssetId: null,
    specVersion: "v3",
    extensions: d.extensions,
    risuExtensions: risuExt,
    characterBook: d.character_book,
  }
}

function v1ToInternal(
  data: Record<string, unknown>
): Omit<InternalCharacter, "id" | "userId" | "createdAt" | "updatedAt"> {
  return {
    name: String(data.name ?? data.char_name ?? "Unknown"),
    description: String(data.description ?? data.char_persona ?? ""),
    personality: String(data.personality ?? ""),
    scenario: String(data.scenario ?? data.world_scenario ?? ""),
    firstMessage: String(data.first_mes ?? data.char_greeting ?? ""),
    messageExample: String(data.mes_example ?? data.example_dialogue ?? ""),
    systemPrompt: String(data.system_prompt ?? ""),
    creatorNotes: String(data.creator_notes ?? ""),
    postHistoryInstructions: String(data.post_history_instructions ?? ""),
    alternateGreetings: [],
    tags: [],
    creator: String(data.creator ?? ""),
    characterVersion: String(data.character_version ?? ""),
    avatarAssetId: null,
    specVersion: "v1",
    extensions: {},
    risuExtensions: { regex: [], additionalAssets: [], talkativeness: 0.5, fav: false },
    characterBook: undefined,
  }
}

function extractRisuExtensions(
  extensions: Record<string, unknown>
): RisuExtensions {
  const risu = extensions.risuai ?? extensions.risu ?? {}
  if (typeof risu === "object" && risu !== null) {
    return risu as RisuExtensions
  }
  return { regex: [], additionalAssets: [], talkativeness: 0.5, fav: false }
}
