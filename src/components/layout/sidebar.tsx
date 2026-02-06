"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  Plus,
  MessageSquare,
  Settings,
  LogOut,
  User,
  BookOpen,
  Globe,
} from "lucide-react"
import { signOut } from "next-auth/react"
import { useChatStore } from "@/stores/chat-store"
import { useUiStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"
import { NewChatDialog } from "@/components/chat/new-chat-dialog"

export function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { chats, setChats, activeChatId } = useChatStore()
  const { sidebarOpen } = useUiStore()
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
        // silently fail, user will see empty list
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
      <aside className="flex h-full w-64 flex-col border-r border-zinc-800 bg-zinc-950">
        <div className="flex items-center justify-between p-3">
          <span className="text-sm font-semibold text-zinc-100">ChatArea</span>
          <button
            onClick={() => setShowNewChat(true)}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
            aria-label="New chat"
          >
            <Plus size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-1">
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => router.push(`/chat/${chat.id}`)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                activeChatId === chat.id || pathname === `/chat/${chat.id}`
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
              )}
            >
              <MessageSquare size={14} className="shrink-0" />
              <span className="truncate">{chat.title}</span>
            </button>
          ))}

          {chats.length === 0 && (
            <p className="px-2 py-4 text-center text-xs text-zinc-500">
              No chats yet
            </p>
          )}
        </nav>

        <div className="border-t border-zinc-800 p-2 space-y-0.5">
          <button
            onClick={() => router.push("/characters")}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
              pathname.startsWith("/characters")
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
            )}
          >
            <User size={14} />
            <span>Characters</span>
          </button>
          <button
            onClick={() => router.push("/worlds")}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
              pathname.startsWith("/worlds")
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
            )}
          >
            <Globe size={14} />
            <span>Worlds</span>
          </button>
          <button
            onClick={() => router.push("/lorebooks")}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
              pathname.startsWith("/lorebooks")
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
            )}
          >
            <BookOpen size={14} />
            <span>Lorebooks</span>
          </button>
          <button
            onClick={() => router.push("/settings")}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
              pathname === "/settings"
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
            )}
          >
            <Settings size={14} />
            <span>Settings</span>
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 transition-colors"
          >
            <LogOut size={14} />
            <span>Sign out</span>
          </button>
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
