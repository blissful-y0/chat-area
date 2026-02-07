"use client"

import { useState, useEffect, useCallback, use } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  ToggleLeft,
  ToggleRight,
} from "lucide-react"

interface Lorebook {
  id: string
  name: string
  description: string
  scanDepth: number
  tokenBudget: number
  recursive: boolean
}

interface LorebookEntry {
  id: string
  keys: string[]
  content: string
  enabled: boolean
  caseSensitive: boolean
  priority: number
  insertionOrder: number
  position: string
}

export default function LorebookDetailPage({
  params,
}: {
  params: Promise<{ lorebookId: string }>
}) {
  const { lorebookId } = use(params)
  const router = useRouter()
  const [lorebook, setLorebook] = useState<Lorebook | null>(null)
  const [entries, setEntries] = useState<LorebookEntry[]>([])
  const [editingEntry, setEditingEntry] = useState<string | null>(null)
  const [savingLb, setSavingLb] = useState(false)
  const [savedLb, setSavedLb] = useState(false)

  // Lorebook settings form
  const [lbName, setLbName] = useState("")
  const [lbDescription, setLbDescription] = useState("")
  const [lbScanDepth, setLbScanDepth] = useState(2)
  const [lbTokenBudget, setLbTokenBudget] = useState(2048)
  const [lbRecursive, setLbRecursive] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [lbRes, entriesRes] = await Promise.all([
          fetch(`/api/lorebooks/${lorebookId}`),
          fetch(`/api/lorebooks/${lorebookId}/entries`),
        ])
        const lbData = await lbRes.json()
        const entriesData = await entriesRes.json()

        if (lbData.success) {
          setLorebook(lbData.data)
          setLbName(lbData.data.name)
          setLbDescription(lbData.data.description)
          setLbScanDepth(lbData.data.scanDepth)
          setLbTokenBudget(lbData.data.tokenBudget)
          setLbRecursive(lbData.data.recursive)
        }
        if (entriesData.success) {
          setEntries(entriesData.data)
        }
      } catch {
        // silently fail
      }
    }
    load()
  }, [lorebookId])

  const saveLorebook = useCallback(async () => {
    setSavingLb(true)
    try {
      const res = await fetch(`/api/lorebooks/${lorebookId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: lbName,
          description: lbDescription,
          scanDepth: lbScanDepth,
          tokenBudget: lbTokenBudget,
          recursive: lbRecursive,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setLorebook(data.data)
        setSavedLb(true)
        setTimeout(() => setSavedLb(false), 2000)
      }
    } catch {
      // silently fail
    } finally {
      setSavingLb(false)
    }
  }, [lorebookId, lbName, lbDescription, lbScanDepth, lbTokenBudget, lbRecursive])

  const addEntry = useCallback(async () => {
    try {
      const res = await fetch(`/api/lorebooks/${lorebookId}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keys: ["new keyword"],
          content: "",
        }),
      })
      const data = await res.json()
      if (data.success) {
        setEntries((prev) => [...prev, data.data])
        setEditingEntry(data.data.id)
      }
    } catch {
      // silently fail
    }
  }, [lorebookId])

  const updateEntry = useCallback(
    async (entryId: string, updates: Partial<LorebookEntry>) => {
      try {
        const res = await fetch(
          `/api/lorebooks/${lorebookId}/entries/${entryId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
          }
        )
        const data = await res.json()
        if (data.success) {
          setEntries((prev) =>
            prev.map((e) => (e.id === entryId ? { ...e, ...data.data } : e))
          )
        }
      } catch {
        // silently fail
      }
    },
    [lorebookId]
  )

  const deleteEntry = useCallback(
    async (entryId: string) => {
      try {
        const res = await fetch(
          `/api/lorebooks/${lorebookId}/entries/${entryId}`,
          { method: "DELETE" }
        )
        const data = await res.json()
        if (data.success) {
          setEntries((prev) => prev.filter((e) => e.id !== entryId))
        }
      } catch {
        // silently fail
      }
    },
    [lorebookId]
  )

  if (!lorebook) {
    return (
      <>
        <Header title="Loading..." />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-zinc-500">Loading lorebook...</p>
        </div>
      </>
    )
  }

  return (
    <>
      <Header title={lorebook.name} />
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6">
          {/* Back + Title */}
          <button
            onClick={() => router.push("/lorebooks")}
            className="mb-4 flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <ArrowLeft size={14} />
            Back to lorebooks
          </button>

          {/* Lorebook Settings */}
          <section className="mb-8 space-y-4 rounded-lg border border-zinc-800 bg-zinc-900 p-5">
            <h3 className="text-sm font-medium text-zinc-300">Settings</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="mb-1 block text-xs text-zinc-500">Name</label>
                <input
                  value={lbName}
                  onChange={(e) => setLbName(e.target.value)}
                  className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs text-zinc-500">
                  Description
                </label>
                <input
                  value={lbDescription}
                  onChange={(e) => setLbDescription(e.target.value)}
                  className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-500">
                  Scan Depth (messages)
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={lbScanDepth}
                  onChange={(e) => setLbScanDepth(Number(e.target.value))}
                  className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-500">
                  Token Budget
                </label>
                <input
                  type="number"
                  min={100}
                  max={100000}
                  value={lbTokenBudget}
                  onChange={(e) => setLbTokenBudget(Number(e.target.value))}
                  className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                />
              </div>
              <div className="col-span-2 flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-300">Recursive Scanning</p>
                  <p className="text-xs text-zinc-500">
                    Matched entries can trigger additional entries
                  </p>
                </div>
                <button
                  onClick={() => setLbRecursive(!lbRecursive)}
                  className="text-zinc-400 hover:text-zinc-200"
                >
                  {lbRecursive ? (
                    <ToggleRight size={24} className="text-emerald-500" />
                  ) : (
                    <ToggleLeft size={24} />
                  )}
                </button>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={saveLorebook}
                disabled={savingLb}
                className="flex items-center gap-2 rounded-lg bg-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-600 disabled:opacity-50 transition-colors"
              >
                <Save size={14} />
                {savedLb ? "Saved!" : savingLb ? "Saving..." : "Save"}
              </button>
            </div>
          </section>

          {/* Entries */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium text-zinc-300">
                Entries ({entries.length})
              </h3>
              <button
                onClick={addEntry}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 transition-colors"
              >
                <Plus size={14} />
                Add Entry
              </button>
            </div>

            <div className="space-y-2">
              {entries.map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  isEditing={editingEntry === entry.id}
                  onToggleEdit={() =>
                    setEditingEntry(
                      editingEntry === entry.id ? null : entry.id
                    )
                  }
                  onUpdate={(updates) => updateEntry(entry.id, updates)}
                  onDelete={() => deleteEntry(entry.id)}
                />
              ))}

              {entries.length === 0 && (
                <p className="py-6 text-center text-sm text-zinc-500">
                  No entries yet. Add one to define world lore.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  )
}

function EntryCard({
  entry,
  isEditing,
  onToggleEdit,
  onUpdate,
  onDelete,
}: {
  entry: LorebookEntry
  isEditing: boolean
  onToggleEdit: () => void
  onUpdate: (updates: Partial<LorebookEntry>) => void
  onDelete: () => void
}) {
  const [keys, setKeys] = useState(entry.keys.join(", "))
  const [content, setContent] = useState(entry.content)
  const [priority, setPriority] = useState(entry.priority)
  const [position, setPosition] = useState(entry.position)

  const handleSave = useCallback(() => {
    onUpdate({
      keys: keys
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
      content,
      priority,
      position: position as "before_char" | "after_char",
    })
    onToggleEdit()
  }, [keys, content, priority, position, onUpdate, onToggleEdit])

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden">
      {/* Header bar */}
      <div
        onClick={onToggleEdit}
        className="flex cursor-pointer items-center justify-between px-4 py-2.5 hover:bg-zinc-800/50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onUpdate({ enabled: !entry.enabled })
            }}
            className="shrink-0"
          >
            {entry.enabled ? (
              <ToggleRight size={20} className="text-emerald-500" />
            ) : (
              <ToggleLeft size={20} className="text-zinc-500" />
            )}
          </button>
          <div className="flex flex-wrap items-center gap-1 min-w-0">
            {entry.keys.map((key, i) => (
              <span
                key={i}
                className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-300"
              >
                {key}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-zinc-500">P:{entry.priority}</span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (confirm("Delete this entry?")) onDelete()
            }}
            className="rounded p-1 text-zinc-500 hover:bg-zinc-700 hover:text-red-400 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Edit panel */}
      {isEditing && (
        <div className="border-t border-zinc-800 p-5 space-y-4">
          <div>
            <label className="mb-1 block text-xs text-zinc-500">
              Keywords (comma separated)
            </label>
            <input
              value={keys}
              onChange={(e) => setKeys(e.target.value)}
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="w-full resize-y rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-zinc-500">
                Priority
              </label>
              <input
                type="number"
                min={0}
                max={1000}
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">
                Position
              </label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
              >
                <option value="before_char">Before Character</option>
                <option value="after_char">After Character</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={onToggleEdit}
              className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="rounded-lg bg-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-600 transition-colors"
            >
              Save Entry
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
