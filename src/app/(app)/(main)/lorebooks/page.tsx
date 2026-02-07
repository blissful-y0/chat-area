"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Plus, BookOpen, Trash2 } from "lucide-react"

interface Lorebook {
  id: string
  name: string
  description: string
  characterId: string | null
  scanDepth: number
  tokenBudget: number
  recursive: boolean
  createdAt: string
}

export default function LorebooksPage() {
  const router = useRouter()
  const [lorebooks, setLorebooks] = useState<Lorebook[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState("")
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/lorebooks")
        const data = await res.json()
        if (data.success) setLorebooks(data.data)
      } catch {
        // silently fail
      }
    }
    load()
  }, [])

  const handleCreate = useCallback(async () => {
    if (!newName.trim() || creating) return
    setCreating(true)
    try {
      const res = await fetch("/api/lorebooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        setLorebooks((prev) => [...prev, data.data])
        setNewName("")
        setShowCreate(false)
        router.push(`/lorebooks/${data.data.id}`)
      }
    } catch {
      // silently fail
    } finally {
      setCreating(false)
    }
  }, [newName, creating, router])

  const handleDelete = useCallback(
    async (id: string, e: React.MouseEvent) => {
      e.stopPropagation()
      if (!confirm("Delete this lorebook and all its entries?")) return
      try {
        const res = await fetch(`/api/lorebooks/${id}`, { method: "DELETE" })
        const data = await res.json()
        if (data.success) {
          setLorebooks((prev) => prev.filter((lb) => lb.id !== id))
        }
      } catch {
        // silently fail
      }
    },
    []
  )

  return (
    <>
      <Header title="Lorebooks" />
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-4 py-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-zinc-100">
                World Info / Lorebooks
              </h2>
              <p className="mt-1 text-sm text-zinc-400">
                Define world lore that gets injected into context when keywords
                are detected.
              </p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 transition-colors"
            >
              <Plus size={14} />
              New
            </button>
          </div>

          {showCreate && (
            <div className="mb-4 flex items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-900 p-4">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="Lorebook name..."
                autoFocus
                className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
              />
              <button
                onClick={handleCreate}
                disabled={creating || !newName.trim()}
                className="rounded-lg bg-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-600 disabled:opacity-50 transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowCreate(false)
                  setNewName("")
                }}
                className="rounded-lg px-3 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          <div className="space-y-2.5">
            {lorebooks.map((lb) => (
              <div
                key={lb.id}
                onClick={() => router.push(`/lorebooks/${lb.id}`)}
                className="flex cursor-pointer items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3.5 text-left hover:border-zinc-700 hover:bg-zinc-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <BookOpen size={18} className="shrink-0 text-zinc-500" />
                  <div>
                    <p className="text-sm font-medium text-zinc-200">
                      {lb.name}
                    </p>
                    {lb.description && (
                      <p className="mt-0.5 text-xs text-zinc-500 line-clamp-1">
                        {lb.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-500">
                    {lb.tokenBudget} tokens
                  </span>
                  <button
                    onClick={(e) => handleDelete(lb.id, e)}
                    className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-700 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}

            {lorebooks.length === 0 && !showCreate && (
              <p className="py-8 text-center text-sm text-zinc-500">
                No lorebooks yet. Create one to define world lore for your
                characters.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
