"use client"

import { useEffect, useRef } from "react"
import { MessageBubble, StreamingBubble } from "./message-bubble"
import { CharacterAvatar } from "@/components/shared/character-avatar"
import type { Message } from "@/stores/chat-store"

interface MessageListProps {
  messages: Message[]
  isStreaming: boolean
  streamingContent: string
  characterName?: string
  characterAvatarUrl?: string | null
  characterFirstMessage?: string
  userName?: string
}

export function MessageList({
  messages,
  isStreaming,
  streamingContent,
  characterName = "Assistant",
  characterAvatarUrl = null,
  characterFirstMessage,
  userName = "You",
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, streamingContent])

  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <CharacterAvatar
            name={characterName}
            size="xl"
            avatarUrl={characterAvatarUrl}
          />
          <div>
            <p className="text-lg font-medium text-zinc-200">
              {characterName}
            </p>
            <p className="mt-1 max-w-sm text-sm text-zinc-500">
              {characterFirstMessage
                ? characterFirstMessage.slice(0, 120) +
                  (characterFirstMessage.length > 120 ? "..." : "")
                : "Start your adventure"}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-6">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            characterName={characterName}
            characterAvatarUrl={characterAvatarUrl}
            userName={userName}
          />
        ))}
        {isStreaming && (
          <StreamingBubble
            content={streamingContent}
            characterName={characterName}
            characterAvatarUrl={characterAvatarUrl}
          />
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
