"use client"

import type { ComponentPropsWithoutRef } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"
import { CharacterAvatar } from "@/components/shared/character-avatar"
import type { Message } from "@/stores/chat-store"

const markdownComponents = {
  em: ({ children, ...props }: ComponentPropsWithoutRef<"em">) => (
    <em
      {...props}
      className="not-italic rounded-sm bg-violet-500/15 px-0.5 text-violet-300/90"
    >
      {children}
    </em>
  ),
}

interface MessageBubbleProps {
  message: Message
  characterName?: string
  characterAvatarUrl?: string | null
  userName?: string
}

export function MessageBubble({
  message,
  characterName = "Assistant",
  characterAvatarUrl = null,
  userName = "You",
}: MessageBubbleProps) {
  const isUser = message.role === "user"

  return (
    <div
      className={cn(
        "flex gap-2.5",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div className="mt-0.5 shrink-0">
        {isUser ? (
          <CharacterAvatar name={userName} size="sm" avatarUrl={null} />
        ) : (
          <CharacterAvatar
            name={characterName}
            size="sm"
            avatarUrl={characterAvatarUrl ?? null}
          />
        )}
      </div>

      <div
        className={cn(
          "max-w-[75%] min-w-0",
          isUser ? "items-end" : "items-start"
        )}
      >
        <p
          className={cn(
            "mb-0.5 text-[11px] font-medium",
            isUser ? "text-right text-zinc-500" : "text-zinc-400"
          )}
        >
          {isUser ? userName : characterName}
        </p>

        <div
          className={cn(
            "rounded-2xl px-3.5 py-2.5",
            isUser
              ? "rounded-tr-sm bg-zinc-700/50 text-zinc-100"
              : "rounded-tl-sm bg-zinc-800/60 text-zinc-200"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {message.content}
            </p>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-700">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface StreamingBubbleProps {
  content: string
  characterName?: string
  characterAvatarUrl?: string | null
}

export function StreamingBubble({
  content,
  characterName = "Assistant",
  characterAvatarUrl = null,
}: StreamingBubbleProps) {
  return (
    <div className="flex gap-2.5">
      <div className="mt-0.5 shrink-0">
        <CharacterAvatar
          name={characterName}
          size="sm"
          avatarUrl={characterAvatarUrl ?? null}
        />
      </div>
      <div className="max-w-[75%] min-w-0">
        <p className="mb-0.5 text-[11px] font-medium text-zinc-400">
          {characterName}
        </p>
        <div className="rounded-2xl rounded-tl-sm bg-zinc-800/60 px-3.5 py-2.5 text-zinc-200">
          {content ? (
            <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-700">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {content}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="flex items-center gap-1 py-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:300ms]" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
