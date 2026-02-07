"use client"

import { useEffect, useState, use } from "react"
import { ChatHeader } from "@/components/chat/chat-header"
import { GameStateBanner } from "@/components/chat/game-state-banner"
import { MessageList } from "@/components/chat/message-list"
import { ChatInput } from "@/components/chat/chat-input"
import {
  ContextPanel,
  CharacterTab,
  WorldTab,
  LorebookTab,
  SettingsTab,
} from "@/components/chat/context-panel"
import { useChat } from "@/hooks/use-chat"
import { useChatContext } from "@/hooks/use-chat-context"
import { useChatStore } from "@/stores/chat-store"
import { useUiStore } from "@/stores/ui-store"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"

export default function ChatPage({
  params,
}: {
  params: Promise<{ chatId: string }>
}) {
  const { chatId } = use(params)
  const { messages, isStreaming, streamingContent, loadMessages, sendMessage } =
    useChat(chatId)
  const { character, worldPreset, groupMembers } = useChatContext(chatId)
  const setActiveChatId = useChatStore((s) => s.setActiveChatId)
  const { contextPanelOpen, contextPanelTab } = useUiStore()
  const [error, setError] = useState("")

  useKeyboardShortcuts()

  useEffect(() => {
    setActiveChatId(chatId)
    loadMessages()
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

  const panelContent = (() => {
    switch (contextPanelTab) {
      case "character":
        return <CharacterTab />
      case "world":
        return <WorldTab />
      case "lorebook":
        return <LorebookTab />
      case "settings":
        return <SettingsTab />
    }
  })()

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex flex-1 flex-col overflow-hidden">
        <ChatHeader character={character} worldPreset={worldPreset} groupMembers={groupMembers} />
        {worldPreset && (
          <GameStateBanner
            worldPreset={worldPreset}
            character={character}
            messageCount={messages.length}
          />
        )}
        {error && (
          <div className="mx-4 mt-2 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </div>
        )}
        <MessageList
          messages={messages}
          isStreaming={isStreaming}
          streamingContent={streamingContent}
          characterName={character?.name}
          characterAvatarUrl={character?.avatarUrl}
          characterFirstMessage={character?.firstMessage}
        />
        <ChatInput onSend={handleSend} disabled={isStreaming} />
      </div>

      <ContextPanel>{panelContent}</ContextPanel>
    </div>
  )
}
