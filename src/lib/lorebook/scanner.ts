import { db } from "@/lib/db"
import { lorebooks, lorebookEntries } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { countTokens } from "@/lib/prompt/token-counter"

export interface MatchedEntry {
  id: string
  content: string
  position: "before_char" | "after_char"
  priority: number
  insertionOrder: number
  tokenCount: number
}

interface EntryRow {
  id: string
  lorebookId: string
  keys: string
  content: string
  enabled: boolean
  caseSensitive: boolean
  priority: number
  insertionOrder: number
  position: string
  decorators: string
  extensions: string
}

interface LorebookRow {
  id: string
  scanDepth: number
  tokenBudget: number
  recursive: boolean
}

function parseKeys(keysJson: string): string[] {
  try {
    return JSON.parse(keysJson) as string[]
  } catch {
    return []
  }
}

function matchesAnyKey(
  text: string,
  keys: string[],
  caseSensitive: boolean
): boolean {
  const searchText = caseSensitive ? text : text.toLowerCase()
  return keys.some((key) => {
    const searchKey = caseSensitive ? key : key.toLowerCase()
    return searchText.includes(searchKey)
  })
}

export function scanForEntries(
  messages: Array<{ role: string; content: string }>,
  characterId: string | null,
  userId: string,
  model = "gpt-4o"
): MatchedEntry[] {
  // Get all lorebooks for this user (global + character-specific)
  const userLorebooks = db
    .select()
    .from(lorebooks)
    .where(eq(lorebooks.userId, userId))
    .all() as LorebookRow[]

  const relevantLorebooks = userLorebooks.filter(
    (lb) => lb.id && (characterId === null || true)
  )

  if (relevantLorebooks.length === 0) return []

  const allMatched: MatchedEntry[] = []

  for (const lorebook of relevantLorebooks) {
    // Get enabled entries for this lorebook
    const entries = db
      .select()
      .from(lorebookEntries)
      .where(
        and(
          eq(lorebookEntries.lorebookId, lorebook.id),
          eq(lorebookEntries.enabled, true)
        )
      )
      .all() as EntryRow[]

    if (entries.length === 0) continue

    // Build scan text from recent messages based on scanDepth
    const recentMessages = messages.slice(-lorebook.scanDepth)
    const scanText = recentMessages.map((m) => m.content).join("\n")

    // First pass: find entries matching the scan text
    const firstPassMatches = entries.filter((entry) => {
      const keys = parseKeys(entry.keys)
      return matchesAnyKey(scanText, keys, entry.caseSensitive)
    })

    // Recursive scanning: check if matched entries trigger more entries
    let currentMatches = [...firstPassMatches]
    if (lorebook.recursive) {
      const matchedIds = new Set(currentMatches.map((m) => m.id))
      let changed = true
      let iterations = 0
      const maxIterations = 5

      while (changed && iterations < maxIterations) {
        changed = false
        iterations++

        const matchedText = currentMatches.map((m) => m.content).join("\n")
        const combinedText = `${scanText}\n${matchedText}`

        for (const entry of entries) {
          if (matchedIds.has(entry.id)) continue
          const keys = parseKeys(entry.keys)
          if (matchesAnyKey(combinedText, keys, entry.caseSensitive)) {
            currentMatches = [...currentMatches, entry]
            matchedIds.add(entry.id)
            changed = true
          }
        }
      }
    }

    // Sort by priority (higher first), then insertionOrder
    const sorted = [...currentMatches].sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority
      return a.insertionOrder - b.insertionOrder
    })

    // Apply token budget
    let usedTokens = 0
    for (const entry of sorted) {
      const tokens = countTokens(entry.content, model)
      if (usedTokens + tokens > lorebook.tokenBudget) continue

      usedTokens += tokens
      allMatched.push({
        id: entry.id,
        content: entry.content,
        position: entry.position as "before_char" | "after_char",
        priority: entry.priority,
        insertionOrder: entry.insertionOrder,
        tokenCount: tokens,
      })
    }
  }

  // Final sort across all lorebooks
  return [...allMatched].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority
    return a.insertionOrder - b.insertionOrder
  })
}
