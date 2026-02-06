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
    <div className="flex items-center gap-2">
      <div className="relative">
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className="appearance-none rounded-md border border-zinc-800 bg-zinc-900 py-1 pl-2 pr-7 text-xs text-zinc-300 focus:border-zinc-600 focus:outline-none"
        >
          {providers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <ChevronDown
          size={12}
          className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-zinc-500"
        />
      </div>
      <div className="relative">
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="appearance-none rounded-md border border-zinc-800 bg-zinc-900 py-1 pl-2 pr-7 text-xs text-zinc-300 focus:border-zinc-600 focus:outline-none"
        >
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <ChevronDown
          size={12}
          className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-zinc-500"
        />
      </div>
    </div>
  )
}
