"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Plus, Globe, Trash2 } from "lucide-react"

interface WorldPreset {
  id: string
  name: string
  description: string
  systemPrompt: string
  createdAt: string
}

export default function WorldPresetsPage() {
  const router = useRouter()
  const [presets, setPresets] = useState<WorldPreset[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState("")
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/world-presets")
        const data = await res.json()
        if (data.success) setPresets(data.data)
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
      const res = await fetch("/api/world-presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        setPresets((prev) => [...prev, data.data])
        setNewName("")
        setShowCreate(false)
        router.push(`/worlds/${data.data.id}`)
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
      if (!confirm("Delete this world preset?")) return
      try {
        const res = await fetch(`/api/world-presets/${id}`, {
          method: "DELETE",
        })
        const data = await res.json()
        if (data.success) {
          setPresets((prev) => prev.filter((p) => p.id !== id))
        }
      } catch {
        // silently fail
      }
    },
    []
  )

  return (
    <>
      <Header title="World Presets" />
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-4 py-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-zinc-100">
                World Presets
              </h2>
              <p className="mt-1 text-sm text-zinc-400">
                Define world settings, RP rules, and system prompts. Combine
                with any character when starting a chat.
              </p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-700 transition-colors"
            >
              <Plus size={14} />
              New
            </button>
          </div>

          {showCreate && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 p-3">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="World preset name..."
                autoFocus
                className="flex-1 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
              />
              <button
                onClick={handleCreate}
                disabled={creating || !newName.trim()}
                className="rounded-md bg-zinc-700 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-600 disabled:opacity-50 transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowCreate(false)
                  setNewName("")
                }}
                className="rounded-md px-2 py-1.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          <div className="space-y-2">
            {presets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => router.push(`/worlds/${preset.id}`)}
                className="flex w-full items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-left hover:border-zinc-700 hover:bg-zinc-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Globe size={18} className="shrink-0 text-zinc-500" />
                  <div>
                    <p className="text-sm font-medium text-zinc-200">
                      {preset.name}
                    </p>
                    {preset.description && (
                      <p className="mt-0.5 text-xs text-zinc-500 line-clamp-1">
                        {preset.description}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => handleDelete(preset.id, e)}
                  className="rounded p-1 text-zinc-500 hover:bg-zinc-700 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </button>
            ))}

            {presets.length === 0 && !showCreate && (
              <p className="py-8 text-center text-sm text-zinc-500">
                No world presets yet. Create one to define RP rules and world
                settings.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
