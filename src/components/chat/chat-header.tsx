"use client"

import { PanelLeft, PanelRight } from "lucide-react"
import { useUiStore } from "@/stores/ui-store"
import { CharacterAvatar } from "@/components/shared/character-avatar"
import type {
  CharacterData,
  WorldPresetData,
  GroupMemberData,
} from "@/stores/chat-context-store"

interface ChatHeaderProps {
  character: CharacterData | null
  worldPreset: WorldPresetData | null
  groupMembers?: GroupMemberData[]
}

export function ChatHeader({
  character,
  worldPreset,
  groupMembers = [],
}: ChatHeaderProps) {
  const { toggleSidebar, toggleContextPanel } = useUiStore()

  const isGroup = groupMembers.length > 0
  const activeMembers = groupMembers.filter((m) => m.isActive)

  const subtitle = isGroup
    ? `${activeMembers.length} characters`
    : character?.scenario
      ? character.scenario.length > 60
        ? character.scenario.slice(0, 60) + "..."
        : character.scenario
      : worldPreset?.name ?? null

  const title = isGroup
    ? activeMembers
        .slice(0, 3)
        .map((m) => m.characterName)
        .join(", ") + (activeMembers.length > 3 ? ` +${activeMembers.length - 3}` : "")
    : character?.name ?? "Chat"

  return (
    <header className="flex h-12 items-center gap-3 border-b px-3" style={{ borderColor: "var(--border-primary)" }}>
      <button
        onClick={toggleSidebar}
        className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
        aria-label="Toggle sidebar"
      >
        <PanelLeft size={18} />
      </button>

      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        {isGroup ? (
          <StackedAvatars members={activeMembers} />
        ) : character ? (
          <CharacterAvatar
            name={character.name}
            size="sm"
            avatarUrl={character.avatarUrl}
          />
        ) : null}
        <div className="min-w-0">
          <h1 className="truncate text-sm font-medium text-zinc-100">
            {title}
          </h1>
          {subtitle && (
            <p className="truncate text-[11px] text-zinc-500">{subtitle}</p>
          )}
        </div>
      </div>

      <button
        onClick={toggleContextPanel}
        className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
        aria-label="Toggle context panel"
      >
        <PanelRight size={18} />
      </button>
    </header>
  )
}

function StackedAvatars({ members }: { members: GroupMemberData[] }) {
  const visible = members.slice(0, 4)
  const overflow = members.length - 4

  return (
    <div className="flex shrink-0 -space-x-2">
      {visible.map((member) => (
        <CharacterAvatar
          key={member.id}
          name={member.characterName}
          size="xs"
          avatarUrl={member.characterAvatarUrl}
          className="ring-2 ring-zinc-950"
        />
      ))}
      {overflow > 0 && (
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-[9px] font-medium text-zinc-300 ring-2 ring-zinc-950">
          +{overflow}
        </div>
      )}
    </div>
  )
}
