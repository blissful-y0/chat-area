"use client"

import { useEffect, useRef } from "react"
import { MessageBubble, StreamingBubble } from "./message-bubble"
import type { Message } from "@/stores/chat-store"

interface MessageListProps {
  messages: Message[]
  isStreaming: boolean
  streamingContent: string
}

export function MessageList({
  messages,
  isStreaming,
  streamingContent,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, streamingContent])

  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-zinc-400">
            Start a conversation
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            Send a message to begin
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-6">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {isStreaming && <StreamingBubble content={streamingContent} />}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
