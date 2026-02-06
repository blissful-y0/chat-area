import type {
  InternalCharacter,
  CharacterCardV2,
  CharacterCardV3,
} from "./types"
import { writeCharacterToPng, createBlankPng } from "./png"
import { writeCharX } from "./charx"

export function internalToV2(char: InternalCharacter): CharacterCardV2 {
  return {
    spec: "chara_card_v2",
    spec_version: "2.0",
    data: {
      name: char.name,
      description: char.description,
      personality: char.personality,
      scenario: char.scenario,
      first_mes: char.firstMessage,
      mes_example: char.messageExample,
      creator_notes: char.creatorNotes,
      system_prompt: char.systemPrompt,
      post_history_instructions: char.postHistoryInstructions ?? "",
      alternate_greetings: char.alternateGreetings ?? [],
      tags: char.tags,
      creator: char.creator ?? "",
      character_version: char.characterVersion ?? "",
      extensions: {
        ...char.extensions,
        ...(Object.keys(char.risuExtensions ?? {}).length > 0
          ? { risuai: char.risuExtensions }
          : {}),
      },
      character_book: char.characterBook,
    },
  }
}

export function internalToV3(char: InternalCharacter): CharacterCardV3 {
  return {
    spec: "chara_card_v3",
    spec_version: "3.0",
    data: {
      name: char.name,
      description: char.description,
      personality: char.personality,
      scenario: char.scenario,
      first_mes: char.firstMessage,
      mes_example: char.messageExample,
      creator_notes: char.creatorNotes,
      system_prompt: char.systemPrompt,
      post_history_instructions: char.postHistoryInstructions ?? "",
      alternate_greetings: char.alternateGreetings ?? [],
      tags: char.tags,
      creator: char.creator ?? "",
      character_version: char.characterVersion ?? "",
      extensions: {
        ...char.extensions,
        ...(Object.keys(char.risuExtensions ?? {}).length > 0
          ? { risuai: char.risuExtensions }
          : {}),
      },
      character_book: char.characterBook,
      assets: [],
      group_only_greetings: [],
    },
  }
}

export async function exportToPng(
  char: InternalCharacter,
  avatarBuffer: Buffer | null,
  format: "v2" | "v3" = "v2"
): Promise<Buffer> {
  const pngBuffer = avatarBuffer ?? createBlankPng()
  const cardData = format === "v3" ? internalToV3(char) : internalToV2(char)
  return writeCharacterToPng(pngBuffer, cardData, format)
}

export async function exportToJson(
  char: InternalCharacter,
  format: "v2" | "v3" = "v2"
): Promise<string> {
  const cardData = format === "v3" ? internalToV3(char) : internalToV2(char)
  return JSON.stringify(cardData, null, 2)
}

export async function exportToCharX(
  char: InternalCharacter,
  assets: Map<string, Buffer>
): Promise<Buffer> {
  const card = internalToV3(char)

  // If there's an avatar in assets, reference it
  if (assets.has("avatar.png")) {
    card.data.assets = [
      ...(card.data.assets ?? []),
      {
        type: "icon",
        uri: "embeded://avatar.png",
        name: "avatar",
        ext: "png",
      },
    ]
  }

  return writeCharX(card, assets)
}
