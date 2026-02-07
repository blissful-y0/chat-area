"use client"

import { useState, useMemo } from "react"
import { ChevronDown, ChevronRight, Search, Zap } from "lucide-react"
import { useChatContextStore } from "@/stores/chat-context-store"
import { cn } from "@/lib/utils"

export function LorebookTab() {
  const lorebooks = useChatContextStore((s) => s.lorebooks)
  const matchedEntryIds = useChatContextStore((s) => s.matchedEntryIds)
  const [search, setSearch] = useState("")
  const [showAll, setShowAll] = useState(false)

  const allEntries = useMemo(
    () => lorebooks.flatMap((lb) => lb.entries.map((e) => ({ ...e, lorebookName: lb.name }))),
    [lorebooks]
  )

  const activeEntries = useMemo(
    () => allEntries.filter((e) => matchedEntryIds.includes(e.id)),
    [allEntries, matchedEntryIds]
  )

  const filteredEntries = useMemo(() => {
    if (!search) return allEntries
    const q = search.toLowerCase()
    return allEntries.filter(
      (e) =>
        e.keys.some((k) => k.toLowerCase().includes(q)) ||
        e.content.toLowerCase().includes(q)
    )
  }, [allEntries, search])

  if (lorebooks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-4 py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800 text-zinc-500">
          <Zap size={24} />
        </div>
        <p className="text-sm text-zinc-400">No lorebooks</p>
        <p className="text-xs text-zinc-500">
          Create a lorebook to add world knowledge
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {activeEntries.length > 0 && (
        <div className="border-b border-zinc-800/50">
          <div className="flex items-center gap-2 px-4 py-2.5">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="text-xs font-medium text-emerald-400">
              Active Entries ({activeEntries.length})
            </span>
          </div>
          <div className="space-y-1 px-3 pb-3">
            {activeEntries.map((entry) => (
              <EntryCard
                key={entry.id}
                keys={entry.keys}
                content={entry.content}
                priority={entry.priority}
                position={entry.position}
                active
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <button
          onClick={() => setShowAll(!showAll)}
          className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs font-medium text-zinc-400 hover:text-zinc-300 transition-colors"
        >
          {showAll ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          All Entries ({allEntries.length})
        </button>

        {showAll && (
          <div>
            <div className="px-3 pb-2">
              <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5">
                <Search size={12} className="text-zinc-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search entries..."
                  className="flex-1 bg-transparent text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1 px-3 pb-3">
              {filteredEntries.map((entry) => (
                <EntryCard
                  key={entry.id}
                  keys={entry.keys}
                  content={entry.content}
                  priority={entry.priority}
                  position={entry.position}
                  enabled={entry.enabled}
                  active={matchedEntryIds.includes(entry.id)}
                />
              ))}
              {filteredEntries.length === 0 && (
                <p className="py-4 text-center text-xs text-zinc-500">
                  No entries found
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function EntryCard({
  keys,
  content,
  priority,
  position,
  enabled = true,
  active = false,
}: {
  keys: string[]
  content: string
  priority: number
  position: string
  enabled?: boolean
  active?: boolean
}) {
  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2 text-xs",
        active
          ? "border-emerald-500/30 bg-emerald-950/20"
          : enabled
          ? "border-zinc-800 bg-zinc-900/50"
          : "border-zinc-800/50 bg-zinc-900/30 opacity-50"
      )}
    >
      <div className="mb-1 flex flex-wrap items-center gap-1">
        {keys.map((key) => (
          <span
            key={key}
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
              active
                ? "bg-emerald-500/20 text-emerald-300"
                : "bg-zinc-700/50 text-zinc-400"
            )}
          >
            {key}
          </span>
        ))}
      </div>
      <p className="line-clamp-2 text-zinc-400">{content}</p>
      <div className="mt-1.5 flex items-center gap-2 text-[10px] text-zinc-600">
        <span>P:{priority}</span>
        <span>{position}</span>
      </div>
    </div>
  )
}
