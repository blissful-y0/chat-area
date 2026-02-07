"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react"
import { useChatContextStore } from "@/stores/chat-context-store"
import { CharacterAvatar } from "@/components/shared/character-avatar"
import { cn } from "@/lib/utils"

export function CharacterTab() {
  const character = useChatContextStore((s) => s.character)

  if (!character) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-4 py-12 text-center">
        <CharacterAvatar name="?" size="xl" avatarUrl={null} />
        <p className="text-sm text-zinc-400">No character linked</p>
        <p className="text-xs text-zinc-500">
          Start a new chat with a character to see details here
        </p>
      </div>
    )
  }

  const tags: string[] = character.tags ?? []

  return (
    <div className="space-y-0">
      {/* Character header */}
      <div className="flex flex-col items-center gap-3 border-b border-zinc-800/50 px-4 py-5">
        <CharacterAvatar
          name={character.name}
          size="xl"
          avatarUrl={character.avatarUrl}
        />
        <div className="text-center">
          <h3 className="text-sm font-semibold text-zinc-100">
            {character.name}
          </h3>
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap justify-center gap-1">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <CollapsibleSection title="Description" content={character.description} />
      <CollapsibleSection title="Personality" content={character.personality} />
      <CollapsibleSection title="Scenario" content={character.scenario} />
      <CollapsibleSection
        title="System Prompt"
        content={character.systemPrompt}
      />
      <CollapsibleSection
        title="First Message"
        content={character.firstMessage}
      />
      {character.creatorNotes && (
        <CollapsibleSection
          title="Creator Notes"
          content={character.creatorNotes}
        />
      )}

      <div className="border-t border-zinc-800/50 px-4 py-3">
        <a
          href={`/characters/${character.id}`}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          Edit Character
          <ExternalLink size={11} />
        </a>
      </div>
    </div>
  )
}

function CollapsibleSection({
  title,
  content,
}: {
  title: string
  content: string
}) {
  const [open, setOpen] = useState(false)

  if (!content) return null

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
        <p className="whitespace-pre-wrap px-4 pb-3 text-xs leading-relaxed text-zinc-300">
          {content}
        </p>
      </div>
    </div>
  )
}
