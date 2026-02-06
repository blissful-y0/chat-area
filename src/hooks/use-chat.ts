"use client"

import { useCallback } from "react"
import { useChatStore } from "@/stores/chat-store"
import { useChatSettingsStore } from "@/stores/chat-settings-store"
import type { Message } from "@/stores/chat-store"

export function useChat(chatId: string) {
  const {
    messages,
    isStreaming,
    streamingContent,
    setMessages,
    addMessage,
    setIsStreaming,
    setStreamingContent,
    appendStreamingContent,
  } = useChatStore()

  const loadMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/chat/${chatId}`)
      const data = await res.json()
      if (data.success) {
        setMessages(data.data.messages)
      }
    } catch {
      // silently fail
    }
  }, [chatId, setMessages])

  const sendMessage = useCallback(
    async (content: string) => {
      if (isStreaming) return

      setIsStreaming(true)
      setStreamingContent("")

      const { provider, model, temperature, maxTokens } =
        useChatSettingsStore.getState()

      try {
        const res = await fetch(`/api/chat/${chatId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content,
            provider,
            model,
            temperature,
            maxTokens,
          }),
        })

        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error ?? "Failed to send message")
        }

        const reader = res.body?.getReader()
        if (!reader) throw new Error("No response body")

        const decoder = new TextDecoder()
        let buffer = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() ?? ""

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue
            const json = line.slice(6)
            try {
              const event = JSON.parse(json)
              switch (event.type) {
                case "user_message": {
                  const userMsg: Message = {
                    id: event.id,
                    chatId,
                    role: "user",
                    content,
                    activeIndex: 0,
                    alternatives: [],
                    emotion: null,
                    tokenCount: null,
                    createdAt: new Date().toISOString(),
                  }
                  addMessage(userMsg)
                  break
                }
                case "text":
                  appendStreamingContent(event.content)
                  break
                case "done": {
                  const assistantMsg: Message = {
                    id: event.id,
                    chatId,
                    role: "assistant",
                    content: useChatStore.getState().streamingContent,
                    activeIndex: 0,
                    alternatives: [],
                    emotion: null,
                    tokenCount: null,
                    createdAt: new Date().toISOString(),
                  }
                  addMessage(assistantMsg)
                  setStreamingContent("")
                  break
                }
                case "error":
                  throw new Error(event.content)
              }
            } catch (e) {
              if (e instanceof SyntaxError) continue
              throw e
            }
          }
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to send message"
        setStreamingContent("")
        throw new Error(message)
      } finally {
        setIsStreaming(false)
      }
    },
    [
      chatId,
      isStreaming,
      setIsStreaming,
      setStreamingContent,
      appendStreamingContent,
      addMessage,
    ]
  )

  return {
    messages,
    isStreaming,
    streamingContent,
    loadMessages,
    sendMessage,
  }
}
