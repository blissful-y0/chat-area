import { z } from "zod/v4"

// ─── Character Card V2 (TavernAI / SillyTavern spec) ───

export const characterBookEntrySchema = z.object({
  keys: z.array(z.string()).default([]),
  content: z.string().default(""),
  extensions: z.record(z.string(), z.unknown()).default({}),
  enabled: z.boolean().default(true),
  insertion_order: z.number().default(100),
  case_sensitive: z.boolean().optional().default(false),
  name: z.string().optional().default(""),
  priority: z.number().optional().default(10),
  id: z.number().optional(),
  comment: z.string().optional().default(""),
  selective: z.boolean().optional().default(false),
  secondary_keys: z.array(z.string()).optional().default([]),
  constant: z.boolean().optional().default(false),
  position: z.string().optional().default("before_char"),
})

export const characterBookSchema = z.object({
  name: z.string().optional().default(""),
  description: z.string().optional().default(""),
  scan_depth: z.number().optional().default(2),
  token_budget: z.number().optional().default(2048),
  recursive_scanning: z.boolean().optional().default(false),
  extensions: z.record(z.string(), z.unknown()).default({}),
  entries: z.array(characterBookEntrySchema).default([]),
})

export const characterCardV2Schema = z.object({
  spec: z.literal("chara_card_v2").default("chara_card_v2"),
  spec_version: z.string().default("2.0"),
  data: z.object({
    name: z.string().min(1),
    description: z.string().default(""),
    personality: z.string().default(""),
    scenario: z.string().default(""),
    first_mes: z.string().default(""),
    mes_example: z.string().default(""),
    creator_notes: z.string().default(""),
    system_prompt: z.string().default(""),
    post_history_instructions: z.string().default(""),
    alternate_greetings: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    creator: z.string().default(""),
    character_version: z.string().default(""),
    extensions: z.record(z.string(), z.unknown()).default({}),
    character_book: characterBookSchema.optional(),
  }),
})

// ─── Character Card V3 (ccv3 spec) ───

export const characterCardV3AssetSchema = z.object({
  type: z.string(),
  uri: z.string(),
  name: z.string().default(""),
  ext: z.string().default(""),
})

export const characterCardV3Schema = z.object({
  spec: z.literal("chara_card_v3").default("chara_card_v3"),
  spec_version: z.string().default("3.0"),
  data: z.object({
    name: z.string().min(1),
    description: z.string().default(""),
    personality: z.string().default(""),
    scenario: z.string().default(""),
    first_mes: z.string().default(""),
    mes_example: z.string().default(""),
    creator_notes: z.string().default(""),
    system_prompt: z.string().default(""),
    post_history_instructions: z.string().default(""),
    alternate_greetings: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    creator: z.string().default(""),
    character_version: z.string().default(""),
    extensions: z.record(z.string(), z.unknown()).default({}),
    character_book: characterBookSchema.optional(),
    assets: z.array(characterCardV3AssetSchema).optional().default([]),
    group_only_greetings: z.array(z.string()).optional().default([]),
    creation_date: z.number().optional(),
    modification_date: z.number().optional(),
  }),
})

// ─── RisuAI Extensions ───

export const risuExtensionsSchema = z.object({
  emotion: z
    .object({
      enabled: z.boolean().default(false),
      images: z
        .array(
          z.object({
            name: z.string(),
            path: z.string(),
          })
        )
        .default([]),
    })
    .optional(),
  regex: z
    .array(
      z.object({
        name: z.string(),
        findRegex: z.string(),
        replaceString: z.string().default(""),
        placement: z.array(z.string()).default([]),
        flags: z.string().default("g"),
      })
    )
    .optional()
    .default([]),
  additionalAssets: z
    .array(
      z.object({
        name: z.string(),
        uri: z.string(),
        ext: z.string().default(""),
      })
    )
    .optional()
    .default([]),
  depth_prompt: z
    .object({
      prompt: z.string().default(""),
      depth: z.number().default(4),
    })
    .optional(),
  talkativeness: z.number().optional().default(0.5),
  fav: z.boolean().optional().default(false),
}).passthrough()

// ─── Internal Character Representation ───

export const internalCharacterSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string().min(1),
  description: z.string().default(""),
  personality: z.string().default(""),
  scenario: z.string().default(""),
  firstMessage: z.string().default(""),
  messageExample: z.string().default(""),
  systemPrompt: z.string().default(""),
  creatorNotes: z.string().default(""),
  postHistoryInstructions: z.string().default(""),
  alternateGreetings: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  creator: z.string().default(""),
  characterVersion: z.string().default(""),
  avatarAssetId: z.string().nullable().default(null),
  specVersion: z.enum(["v1", "v2", "v3"]).default("v2"),
  extensions: z.record(z.string(), z.unknown()).default({}),
  risuExtensions: risuExtensionsSchema.default({ regex: [], additionalAssets: [], talkativeness: 0.5, fav: false }),
  characterBook: characterBookSchema.optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

// ─── API Schemas ───

export const createCharacterSchema = z.object({
  name: z.string().min(1, "캐릭터 이름은 필수입니다").max(200),
  description: z.string().max(100000).default(""),
  personality: z.string().max(100000).default(""),
  scenario: z.string().max(100000).default(""),
  firstMessage: z.string().max(100000).default(""),
  messageExample: z.string().max(100000).default(""),
  systemPrompt: z.string().max(100000).default(""),
  creatorNotes: z.string().max(10000).default(""),
  postHistoryInstructions: z.string().max(100000).default(""),
  alternateGreetings: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  creator: z.string().max(200).default(""),
  characterVersion: z.string().max(50).default(""),
  extensions: z.record(z.string(), z.unknown()).default({}),
})

export const updateCharacterSchema = createCharacterSchema.partial()

// ─── Inferred Types ───

export type CharacterCardV2 = z.infer<typeof characterCardV2Schema>
export type CharacterCardV3 = z.infer<typeof characterCardV3Schema>
export type CharacterBookEntry = z.infer<typeof characterBookEntrySchema>
export type CharacterBook = z.infer<typeof characterBookSchema>
export type RisuExtensions = z.infer<typeof risuExtensionsSchema>
export type InternalCharacter = z.infer<typeof internalCharacterSchema>
export type CreateCharacterInput = z.infer<typeof createCharacterSchema>
export type UpdateCharacterInput = z.infer<typeof updateCharacterSchema>
