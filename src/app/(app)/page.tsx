"use client"

import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { MessageSquare, Plus } from "lucide-react"
import { useChatStore } from "@/stores/chat-store"

export default function HomePage() {
  const router = useRouter()
  const { chats, setChats } = useChatStore()

  async function handleNewChat() {
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (data.success) {
        setChats([data.data, ...chats])
        router.push(`/chat/${data.data.id}`)
      }
    } catch {
      // silently fail
    }
  }

  return (
    <>
      <Header />
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800/50">
            <MessageSquare size={28} className="text-zinc-400" />
          </div>
          <div>
            <h2 className="text-xl font-medium text-zinc-200">
              Welcome to ChatArea
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              Start a new chat or select one from the sidebar
            </p>
          </div>
          <button
            onClick={handleNewChat}
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 transition-colors"
          >
            <Plus size={16} />
            New Chat
          </button>
        </div>
      </div>
    </>
  )
}
