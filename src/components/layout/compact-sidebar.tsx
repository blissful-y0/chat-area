"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  Plus,
  MessageSquare,
  User,
  Globe,
  BookOpen,
  Settings,
  LogOut,
  Sun,
  Moon,
} from "lucide-react"
import { signOut } from "next-auth/react"
import { useChatStore } from "@/stores/chat-store"
import { useUiStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"
import { NewChatDialog } from "@/components/chat/new-chat-dialog"
import { CharacterAvatar } from "@/components/shared/character-avatar"

export function CompactSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { chats, setChats, activeChatId } = useChatStore()
  const { sidebarOpen, theme, setTheme } = useUiStore()
  const [showNewChat, setShowNewChat] = useState(false)

  useEffect(() => {
    async function fetchChats() {
      try {
        const res = await fetch("/api/chat")
        const data = await res.json()
        if (data.success) {
          setChats(data.data)
        }
      } catch {
        // silently fail
      }
    }
    fetchChats()
  }, [setChats])

  const handleStartChat = useCallback(
    async (characterId: string | null, worldPresetId: string | null) => {
      setShowNewChat(false)
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ characterId, worldPresetId }),
        })
        const data = await res.json()
        if (data.success) {
          setChats([data.data, ...chats])
          router.push(`/chat/${data.data.id}`)
        }
      } catch {
        // silently fail
      }
    },
    [chats, setChats, router]
  )

  if (!sidebarOpen) return null

  return (
    <>
      <aside className="flex h-full w-14 flex-col border-r" style={{ borderColor: "var(--border-primary)", backgroundColor: "var(--bg-primary)" }}>
        {/* Logo + New Chat */}
        <div className="flex flex-col items-center gap-1 px-1.5 py-3">
          <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-xs font-bold text-zinc-300">
            CA
          </div>
          <button
            onClick={() => setShowNewChat(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
            aria-label="New chat"
            title="New chat"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Chat list (avatar thumbnails) */}
        <nav className="flex-1 overflow-y-auto px-1.5 py-1 scrollbar-none">
          <div className="space-y-1">
            {chats.map((chat) => {
              const isActive =
                activeChatId === chat.id || pathname === `/chat/${chat.id}`
              return (
                <button
                  key={chat.id}
                  onClick={() => router.push(`/chat/${chat.id}`)}
                  className={cn(
                    "group relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors mx-auto",
                    isActive
                      ? "bg-zinc-700 text-zinc-100"
                      : "text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-300"
                  )}
                  title={chat.title}
                >
                  {isActive && (
                    <div className="absolute left-[-7px] h-5 w-1 rounded-r-full bg-zinc-300" />
                  )}
                  {chat.characterName ? (
                    <CharacterAvatar
                      name={chat.characterName}
                      size="xs"
                      avatarUrl={chat.characterAvatarUrl ?? null}
                    />
                  ) : (
                    <MessageSquare size={15} />
                  )}
                </button>
              )
            })}
          </div>
        </nav>

        {/* Bottom nav icons */}
        <div className="border-t px-1.5 py-2 space-y-1" style={{ borderColor: "var(--border-primary)" }}>
          <NavIconButton
            icon={<User size={15} />}
            label="Characters"
            active={pathname.startsWith("/characters")}
            onClick={() => router.push("/characters")}
          />
          <NavIconButton
            icon={<Globe size={15} />}
            label="Worlds"
            active={pathname.startsWith("/worlds")}
            onClick={() => router.push("/worlds")}
          />
          <NavIconButton
            icon={<BookOpen size={15} />}
            label="Lorebooks"
            active={pathname.startsWith("/lorebooks")}
            onClick={() => router.push("/lorebooks")}
          />
          <NavIconButton
            icon={<Settings size={15} />}
            label="Settings"
            active={pathname === "/settings"}
            onClick={() => router.push("/settings")}
          />
          <NavIconButton
            icon={theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            label={theme === "dark" ? "Light mode" : "Dark mode"}
            active={false}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          />
          <NavIconButton
            icon={<LogOut size={15} />}
            label="Sign out"
            active={false}
            onClick={() => signOut({ callbackUrl: "/login" })}
          />
        </div>
      </aside>

      <NewChatDialog
        open={showNewChat}
        onClose={() => setShowNewChat(false)}
        onStart={handleStartChat}
      />
    </>
  )
}

function NavIconButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-lg transition-colors mx-auto",
        active
          ? "bg-zinc-800 text-zinc-100"
          : "text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300"
      )}
      title={label}
      aria-label={label}
    >
      {icon}
    </button>
  )
}
