"use client"

import { useState, useEffect, useCallback, use } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { ArrowLeft, Save } from "lucide-react"

interface WorldPreset {
  id: string
  name: string
  description: string
  systemPrompt: string
  postHistoryInstructions: string
  formattingOrder: string
  defaultProvider: string | null
  defaultModel: string | null
  temperature: number
  maxTokens: number
  maxContext: number
}

const SLOT_LABELS: Record<string, string> = {
  system_prompt: "System Prompt",
  world_lore: "Character Instructions",
  description: "Character Description",
  personality: "Character Personality",
  scenario: "Scenario",
  lorebook_before: "Lorebook (Before)",
  message_example: "Example Messages",
  messages: "Chat History",
  lorebook_after: "Lorebook (After)",
  post_history_instructions: "Post-History Instructions",
}

export default function WorldPresetEditPage({
  params,
}: {
  params: Promise<{ presetId: string }>
}) {
  const { presetId } = use(params)
  const router = useRouter()
  const [preset, setPreset] = useState<WorldPreset | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Form state
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [systemPrompt, setSystemPrompt] = useState("")
  const [postHistory, setPostHistory] = useState("")
  const [temperature, setTemperature] = useState(0.8)
  const [maxTokens, setMaxTokens] = useState(4096)
  const [maxContext, setMaxContext] = useState(128000)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/world-presets/${presetId}`)
        const data = await res.json()
        if (data.success) {
          const p = data.data
          setPreset(p)
          setName(p.name)
          setDescription(p.description)
          setSystemPrompt(p.systemPrompt)
          setPostHistory(p.postHistoryInstructions)
          setTemperature(p.temperature)
          setMaxTokens(p.maxTokens)
          setMaxContext(p.maxContext)
        }
      } catch {
        // silently fail
      }
    }
    load()
  }, [presetId])

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/world-presets/${presetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          systemPrompt,
          postHistoryInstructions: postHistory,
          temperature,
          maxTokens,
          maxContext,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setPreset(data.data)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false)
    }
  }, [
    presetId,
    name,
    description,
    systemPrompt,
    postHistory,
    temperature,
    maxTokens,
    maxContext,
  ])

  if (!preset) {
    return (
      <>
        <Header title="Loading..." />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-zinc-500">Loading preset...</p>
        </div>
      </>
    )
  }

  // Parse formatting order for display
  const slots: string[] = (() => {
    try {
      return JSON.parse(preset.formattingOrder)
    } catch {
      return []
    }
  })()

  return (
    <>
      <Header title={preset.name} />
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <button
            onClick={() => router.push("/worlds")}
            className="mb-4 flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <ArrowLeft size={14} />
            Back to presets
          </button>

          <div className="space-y-6">
            {/* Basic Info */}
            <section className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900 p-5">
              <h3 className="text-sm font-medium text-zinc-300">Basic Info</h3>
              <div>
                <label className="mb-1 block text-xs text-zinc-500">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-500">
                  Description
                </label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                />
              </div>
            </section>

            {/* System Prompt */}
            <section className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900 p-5">
              <h3 className="text-sm font-medium text-zinc-300">
                System Prompt (World Rules)
              </h3>
              <p className="text-xs text-zinc-500">
                Global RP rules, writing style instructions, and world-level
                context. Use {"{{char}}"} and {"{{user}}"} macros.
              </p>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={10}
                placeholder="You are an expert roleplayer. Write in third person, descriptive style..."
                className="w-full resize-y rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-zinc-600 focus:outline-none font-mono"
              />
            </section>

            {/* Post-History Instructions */}
            <section className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900 p-5">
              <h3 className="text-sm font-medium text-zinc-300">
                Post-History Instructions
              </h3>
              <p className="text-xs text-zinc-500">
                Injected after chat history as a final reminder. Useful for
                enforcing rules or style.
              </p>
              <textarea
                value={postHistory}
                onChange={(e) => setPostHistory(e.target.value)}
                rows={4}
                placeholder="[Remember to stay in character as {{char}}. Respond with detailed descriptions.]"
                className="w-full resize-y rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-zinc-600 focus:outline-none font-mono"
              />
            </section>

            {/* Generation Settings */}
            <section className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900 p-5">
              <h3 className="text-sm font-medium text-zinc-300">
                Generation Defaults
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-zinc-500">
                    Temperature
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={2}
                    step={0.1}
                    value={temperature}
                    onChange={(e) => setTemperature(Number(e.target.value))}
                    className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-zinc-500">
                    Max Tokens
                  </label>
                  <input
                    type="number"
                    min={256}
                    max={32768}
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(Number(e.target.value))}
                    className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-zinc-500">
                    Max Context
                  </label>
                  <input
                    type="number"
                    min={4096}
                    max={2097152}
                    value={maxContext}
                    onChange={(e) => setMaxContext(Number(e.target.value))}
                    className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                  />
                </div>
              </div>
            </section>

            {/* Formatting Order (read-only for now) */}
            <section className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900 p-5">
              <h3 className="text-sm font-medium text-zinc-300">
                Prompt Formatting Order
              </h3>
              <p className="text-xs text-zinc-500">
                The order in which prompt sections are assembled.
              </p>
              <div className="space-y-1">
                {slots.map((slot, i) => (
                  <div
                    key={slot}
                    className="flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1.5"
                  >
                    <span className="text-xs text-zinc-500 w-5">{i + 1}</span>
                    <span className="text-sm text-zinc-300">
                      {SLOT_LABELS[slot] ?? slot}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Save */}
            <div className="flex justify-end pb-6">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-200 hover:bg-zinc-600 disabled:opacity-50 transition-colors"
              >
                <Save size={14} />
                {saved ? "Saved!" : saving ? "Saving..." : "Save Preset"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
