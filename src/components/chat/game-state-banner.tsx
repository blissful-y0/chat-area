"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Globe, MessageSquare } from "lucide-react"
import type { WorldPresetData, CharacterData } from "@/stores/chat-context-store"

interface GameStateBannerProps {
  worldPreset: WorldPresetData
  character: CharacterData | null
  messageCount: number
}

export function GameStateBanner({
  worldPreset,
  character,
  messageCount,
}: GameStateBannerProps) {
  const [collapsed, setCollapsed] = useState(false)

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="flex w-full items-center justify-center border-b border-zinc-800/50 py-0.5 text-zinc-600 hover:text-zinc-400 transition-colors"
      >
        <ChevronDown size={12} />
      </button>
    )
  }

  return (
    <div className="flex items-center gap-3 border-b border-zinc-800/50 bg-zinc-900/30 px-4 py-1.5">
      <div className="flex flex-1 items-center gap-3 overflow-hidden text-[11px] text-zinc-500">
        <span className="flex items-center gap-1 shrink-0">
          <Globe size={11} />
          {worldPreset.name}
        </span>
        {character && (
          <>
            <span className="text-zinc-700">|</span>
            <span className="truncate">{character.scenario || "No scenario"}</span>
          </>
        )}
        <span className="text-zinc-700">|</span>
        <span className="flex items-center gap-1 shrink-0">
          <MessageSquare size={10} />
          {messageCount}
        </span>
      </div>
      <button
        onClick={() => setCollapsed(true)}
        className="shrink-0 text-zinc-600 hover:text-zinc-400 transition-colors"
      >
        <ChevronUp size={12} />
      </button>
    </div>
  )
}
