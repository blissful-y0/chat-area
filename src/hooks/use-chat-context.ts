"use client"

import { useEffect, useCallback } from "react"
import { useChatContextStore } from "@/stores/chat-context-store"

export function useChatContext(chatId: string) {
  const {
    character,
    worldPreset,
    lorebooks,
    groupMembers,
    matchedEntryIds,
    isLoading,
    setCharacter,
    setWorldPreset,
    setLorebooks,
    setGroupMembers,
    setIsLoading,
    reset,
  } = useChatContextStore()

  const loadContext = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/chat/${chatId}/context`)
      const data = await res.json()
      if (data.success) {
        setCharacter(data.data.character)
        setWorldPreset(data.data.worldPreset)
        setLorebooks(data.data.lorebooks)
        setGroupMembers(data.data.groupMembers ?? [])
      }
    } catch {
      // Context load failure is non-fatal
    } finally {
      setIsLoading(false)
    }
  }, [chatId, setCharacter, setWorldPreset, setLorebooks, setGroupMembers, setIsLoading])

  useEffect(() => {
    loadContext()
    return () => reset()
  }, [loadContext, reset])

  return {
    character,
    worldPreset,
    lorebooks,
    groupMembers,
    matchedEntryIds,
    isLoading,
    reload: loadContext,
  }
}
