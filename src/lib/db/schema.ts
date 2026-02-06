import { sqliteTable, text, integer, blob, real } from "drizzle-orm/sqlite-core"
import { sql } from "drizzle-orm"

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
})

export const userSettings = sqliteTable("user_settings", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  key: text("key").notNull(),
  value: text("value").notNull(),
})

export const characters = sqliteTable("characters", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  personality: text("personality").notNull().default(""),
  scenario: text("scenario").notNull().default(""),
  firstMessage: text("first_message").notNull().default(""),
  messageExample: text("message_example").notNull().default(""),
  systemPrompt: text("system_prompt").notNull().default(""),
  creatorNotes: text("creator_notes").notNull().default(""),
  tags: text("tags").notNull().default("[]"),
  avatarAssetId: text("avatar_asset_id"),
  specVersion: text("spec_version").notNull().default("v2"),
  extensions: text("extensions").notNull().default("{}"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
})

export const lorebooks = sqliteTable("lorebooks", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  characterId: text("character_id").references(() => characters.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  scanDepth: integer("scan_depth").notNull().default(2),
  tokenBudget: integer("token_budget").notNull().default(2048),
  recursive: integer("recursive", { mode: "boolean" }).notNull().default(false),
  extensions: text("extensions").notNull().default("{}"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
})

export const lorebookEntries = sqliteTable("lorebook_entries", {
  id: text("id").primaryKey(),
  lorebookId: text("lorebook_id")
    .notNull()
    .references(() => lorebooks.id, { onDelete: "cascade" }),
  keys: text("keys").notNull().default("[]"),
  content: text("content").notNull().default(""),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  caseSensitive: integer("case_sensitive", { mode: "boolean" })
    .notNull()
    .default(false),
  priority: integer("priority").notNull().default(10),
  insertionOrder: integer("insertion_order").notNull().default(100),
  position: text("position").notNull().default("before_char"),
  decorators: text("decorators").notNull().default("[]"),
  extensions: text("extensions").notNull().default("{}"),
})

export const chats = sqliteTable("chats", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  characterId: text("character_id").references(() => characters.id, {
    onDelete: "set null",
  }),
  title: text("title").notNull().default("New Chat"),
  isGroup: integer("is_group", { mode: "boolean" }).notNull().default(false),
  memoryState: text("memory_state").notNull().default("{}"),
  settings: text("settings").notNull().default("{}"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
})

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  chatId: text("chat_id")
    .notNull()
    .references(() => chats.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  activeIndex: integer("active_index").notNull().default(0),
  alternatives: text("alternatives").notNull().default("[]"),
  emotion: text("emotion"),
  tokenCount: integer("token_count"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
})

export const groupMembers = sqliteTable("group_members", {
  id: text("id").primaryKey(),
  chatId: text("chat_id")
    .notNull()
    .references(() => chats.id, { onDelete: "cascade" }),
  characterId: text("character_id")
    .notNull()
    .references(() => characters.id, { onDelete: "cascade" }),
  orderIndex: integer("order_index").notNull().default(0),
  probability: real("probability").notNull().default(1.0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
})

export const assets = sqliteTable("assets", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  mimeType: text("mime_type").notNull(),
  data: blob("data").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
})

export const embeddings = sqliteTable("embeddings", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  sourceType: text("source_type").notNull(),
  sourceId: text("source_id").notNull(),
  content: text("content").notNull(),
  vector: text("vector").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
})

export const plugins = sqliteTable("plugins", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  version: text("version").notNull().default("1.0.0"),
  code: text("code").notNull(),
  manifest: text("manifest").notNull().default("{}"),
  settings: text("settings").notNull().default("{}"),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
})

export const regexScripts = sqliteTable("regex_scripts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  characterId: text("character_id").references(() => characters.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  findRegex: text("find_regex").notNull(),
  replaceString: text("replace_string").notNull().default(""),
  trimStrings: text("trim_strings").notNull().default("[]"),
  placement: text("placement").notNull().default("[]"),
  flags: text("flags").notNull().default("g"),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  orderIndex: integer("order_index").notNull().default(0),
})
