"use client"

import { useEffect } from "react"
import { useChatSettingsStore } from "@/stores/chat-settings-store"
import { useChatContextStore } from "@/stores/chat-context-store"
import { ChevronDown } from "lucide-react"

export function SettingsTab() {
  const {
    provider,
    model,
    temperature,
    maxTokens,
    providers,
    setProvider,
    setModel,
    setTemperature,
    setMaxTokens,
    setProviders,
  } = useChatSettingsStore()

  const worldPreset = useChatContextStore((s) => s.worldPreset)

  useEffect(() => {
    async function loadProviders() {
      try {
        const res = await fetch("/api/providers")
        const data = await res.json()
        if (data.success) {
          setProviders(data.data)
        }
      } catch {
        // silently fail
      }
    }
    loadProviders()
  }, [setProviders])

  const currentProvider = providers.find((p) => p.id === provider)
  const models = currentProvider?.models ?? []

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
        Generation Settings
      </h3>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-zinc-400">Provider</label>
        <div className="relative">
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="w-full appearance-none rounded-lg border border-zinc-800 bg-zinc-900 py-2 pl-3 pr-8 text-xs text-zinc-300 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
          >
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={12}
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-zinc-400">Model</label>
        <div className="relative">
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full appearance-none rounded-lg border border-zinc-800 bg-zinc-900 py-2 pl-3 pr-8 text-xs text-zinc-300 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={12}
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-zinc-400">
            Temperature
          </label>
          <span className="text-xs tabular-nums text-zinc-500">
            {temperature.toFixed(1)}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={temperature}
          onChange={(e) => setTemperature(parseFloat(e.target.value))}
          className="w-full accent-zinc-500"
        />
        <div className="flex justify-between text-[10px] text-zinc-600">
          <span>Precise</span>
          <span>Creative</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-zinc-400">Max Tokens</label>
        <input
          type="number"
          value={maxTokens}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10)
            if (!isNaN(val) && val > 0) setMaxTokens(val)
          }}
          className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
        />
      </div>

      {worldPreset && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-400">
            Max Context
          </label>
          <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/50 px-3 py-2 text-xs text-zinc-500">
            {(worldPreset.maxContext / 1000).toFixed(0)}K tokens (from world
            preset)
          </div>
        </div>
      )}
    </div>
  )
}
