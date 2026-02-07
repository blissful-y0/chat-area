"use client"

import { useState, useRef, useCallback } from "react"
import { Send, Cpu } from "lucide-react"
import { useChatSettingsStore } from "@/stores/chat-settings-store"
import { useUiStore } from "@/stores/ui-store"

interface ChatInputProps {
  onSend: (content: string) => void
  disabled?: boolean
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const model = useChatSettingsStore((s) => s.model)
  const setContextPanelTab = useUiStore((s) => s.setContextPanelTab)

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue("")
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }, [value, disabled, onSend])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit]
  )

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setValue(e.target.value)
      const el = e.target
      el.style.height = "auto"
      el.style.height = Math.min(el.scrollHeight, 200) + "px"
    },
    []
  )

  const handleModelBadgeClick = useCallback(() => {
    setContextPanelTab("settings")
  }, [setContextPanelTab])

  return (
    <div className="border-t border-zinc-800 px-4 py-5">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center gap-3 rounded-2xl border border-zinc-700 bg-zinc-900 px-5 py-4 min-h-[56px]">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Send a message..."
            disabled={disabled}
            rows={1}
            className="flex-1 resize-none bg-transparent text-[15px] leading-relaxed text-zinc-100 placeholder-zinc-500 focus:outline-none disabled:opacity-50 min-h-[24px]"
          />
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={handleModelBadgeClick}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
              title="Change model settings"
            >
              <Cpu size={11} />
              <span className="max-w-[80px] truncate">{model}</span>
            </button>
            <button
              onClick={handleSubmit}
              disabled={disabled || !value.trim()}
              className="rounded-lg p-2.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-400 transition-colors"
              aria-label="Send message"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
