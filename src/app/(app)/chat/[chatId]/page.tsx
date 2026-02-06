"use client"

import { useEffect, useState, use } from "react"
import { Header } from "@/components/layout/header"
import { MessageList } from "@/components/chat/message-list"
import { ChatInput } from "@/components/chat/chat-input"
import { useChat } from "@/hooks/use-chat"
import { useChatStore } from "@/stores/chat-store"

export default function ChatPage({
  params,
}: {
  params: Promise<{ chatId: string }>
}) {
  const { chatId } = use(params)
  const { messages, isStreaming, streamingContent, loadMessages, sendMessage } =
    useChat(chatId)
  const setActiveChatId = useChatStore((s) => s.setActiveChatId)
  const [error, setError] = useState("")
  const [title, setTitle] = useState("Chat")

  useEffect(() => {
    setActiveChatId(chatId)
    loadMessages().then(() => {
      fetch(`/api/chat/${chatId}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.success) setTitle(d.data.title)
        })
        .catch(() => {})
    })
    return () => setActiveChatId(null)
  }, [chatId, loadMessages, setActiveChatId])

  async function handleSend(content: string) {
    setError("")
    try {
      await sendMessage(content)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send")
    }
  }

  return (
    <>
      <Header title={title} />
      <div className="flex flex-1 flex-col overflow-hidden">
        {error && (
          <div className="mx-4 mt-2 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </div>
        )}
        <MessageList
          messages={messages}
          isStreaming={isStreaming}
          streamingContent={streamingContent}
        />
        <ChatInput onSend={handleSend} disabled={isStreaming} />
      </div>
    </>
  )
}
