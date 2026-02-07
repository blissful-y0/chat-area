"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react"
import { useChatContextStore } from "@/stores/chat-context-store"
import { cn } from "@/lib/utils"

export function WorldTab() {
  const worldPreset = useChatContextStore((s) => s.worldPreset)

  if (!worldPreset) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-4 py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800 text-zinc-500">
          <span className="text-2xl">W</span>
        </div>
        <p className="text-sm text-zinc-400">No world preset linked</p>
        <p className="text-xs text-zinc-500">
          Link a world preset when starting a new chat
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      <div className="border-b border-zinc-800/50 px-4 py-4">
        <h3 className="text-sm font-semibold text-zinc-100">
          {worldPreset.name}
        </h3>
        {worldPreset.description && (
          <p className="mt-1 text-xs text-zinc-400">
            {worldPreset.description}
          </p>
        )}
      </div>

      <WorldSection title="System Prompt" content={worldPreset.systemPrompt} />
      <WorldSection
        title="Post-History Instructions"
        content={worldPreset.postHistoryInstructions}
      />

      {worldPreset.formattingOrder.length > 0 && (
        <WorldSection title="Formatting Order">
          <div className="space-y-1 px-4 pb-3">
            {worldPreset.formattingOrder.map((slot, i) => (
              <div
                key={slot}
                className="flex items-center gap-2 text-xs text-zinc-400"
              >
                <span className="w-4 text-right text-zinc-600">{i + 1}</span>
                <span className="rounded bg-zinc-800/70 px-1.5 py-0.5 font-mono text-[10px]">
                  {slot}
                </span>
              </div>
            ))}
          </div>
        </WorldSection>
      )}

      <div className="border-b border-zinc-800/30 px-4 py-3">
        <h4 className="mb-2 text-xs font-medium text-zinc-400">
          Generation Defaults
        </h4>
        <div className="space-y-1.5 text-xs">
          <InfoRow label="Temperature" value={String(worldPreset.temperature)} />
          <InfoRow label="Max Tokens" value={String(worldPreset.maxTokens)} />
          <InfoRow label="Max Context" value={`${(worldPreset.maxContext / 1000).toFixed(0)}K`} />
          {worldPreset.defaultProvider && (
            <InfoRow label="Provider" value={worldPreset.defaultProvider} />
          )}
          {worldPreset.defaultModel && (
            <InfoRow label="Model" value={worldPreset.defaultModel} />
          )}
        </div>
      </div>

      <div className="px-4 py-3">
        <a
          href={`/worlds/${worldPreset.id}`}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          Edit World Preset
          <ExternalLink size={11} />
        </a>
      </div>
    </div>
  )
}

function WorldSection({
  title,
  content,
  children,
}: {
  title: string
  content?: string
  children?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  if (!content && !children) return null

  return (
    <div className="border-b border-zinc-800/30">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs font-medium text-zinc-400 hover:text-zinc-300 transition-colors"
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        {title}
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          open ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        {content && (
          <p className="whitespace-pre-wrap px-4 pb-3 text-xs leading-relaxed text-zinc-300">
            {content}
          </p>
        )}
        {children}
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-zinc-500">{label}</span>
      <span className="text-zinc-300">{value}</span>
    </div>
  )
}
