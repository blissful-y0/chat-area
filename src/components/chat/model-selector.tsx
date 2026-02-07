"use client"

import { useEffect } from "react"
import { useChatSettingsStore } from "@/stores/chat-settings-store"
import { ChevronDown } from "lucide-react"

export function ModelSelector() {
  const {
    provider,
    model,
    providers,
    setProvider,
    setModel,
    setProviders,
  } = useChatSettingsStore()

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
    <div className="flex items-center gap-3">
      <div className="relative">
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className="appearance-none rounded-lg border border-zinc-800 bg-zinc-900 py-1.5 pl-3 pr-8 text-xs text-zinc-300 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
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
      <div className="relative">
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="appearance-none rounded-lg border border-zinc-800 bg-zinc-900 py-1.5 pl-3 pr-8 text-xs text-zinc-300 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
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
  )
}
