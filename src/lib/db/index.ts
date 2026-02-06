import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import * as schema from "./schema"
import { existsSync, mkdirSync } from "fs"
import { dirname } from "path"

const dbPath = process.env.DATABASE_URL ?? "./data/chatarea.db"

let _db: ReturnType<typeof createDb> | null = null

function createDb() {
  const dir = dirname(dbPath)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }

  const sqlite = new Database(dbPath)
  sqlite.pragma("journal_mode = WAL")
  sqlite.pragma("foreign_keys = ON")
  sqlite.pragma("busy_timeout = 5000")

  return drizzle(sqlite, { schema })
}

export function getDb() {
  if (!_db) {
    _db = createDb()
  }
  return _db
}

export const db = new Proxy({} as ReturnType<typeof createDb>, {
  get(_target, prop) {
    const instance = getDb()
    const value = instance[prop as keyof typeof instance]
    if (typeof value === "function") {
      return value.bind(instance)
    }
    return value
  },
})

export type DbClient = ReturnType<typeof createDb>
