"use client"

import { useState, useEffect, useCallback } from "react"
import { X, User, Globe, MessageSquare } from "lucide-react"

interface Character {
  id: string
  name: string
  description: string
  avatarAssetId: string | null
}

interface WorldPreset {
  id: string
  name: string
  description: string
}

interface NewChatDialogProps {
  open: boolean
  onClose: () => void
  onStart: (characterId: string | null, worldPresetId: string | null) => void
}

export function NewChatDialog({ open, onClose, onStart }: NewChatDialogProps) {
  const [characters, setCharacters] = useState<Character[]>([])
  const [presets, setPresets] = useState<WorldPreset[]>([])
  const [selectedChar, setSelectedChar] = useState<string | null>(null)
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    async function load() {
      const [charRes, presetRes] = await Promise.all([
        fetch("/api/characters").then((r) => r.json()),
        fetch("/api/world-presets").then((r) => r.json()),
      ])
      if (charRes.success) setCharacters(charRes.data)
      if (presetRes.success) setPresets(presetRes.data)
    }
    load()
  }, [open])

  const handleStart = useCallback(() => {
    onStart(selectedChar, selectedPreset)
    setSelectedChar(null)
    setSelectedPreset(null)
  }, [selectedChar, selectedPreset, onStart])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <h2 className="text-sm font-medium text-zinc-100">New Chat</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-5 space-y-5">
          {/* Character selection */}
          <div>
            <label className="mb-2.5 flex items-center gap-1.5 text-xs font-medium text-zinc-400">
              <User size={12} />
              Character (optional)
            </label>
            <div className="space-y-1.5">
              <button
                onClick={() => setSelectedChar(null)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                  selectedChar === null
                    ? "border border-zinc-600 bg-zinc-800 text-zinc-100"
                    : "border border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300"
                }`}
              >
                <MessageSquare size={14} className="shrink-0" />
                <span>No character (plain chat)</span>
              </button>
              {characters.map((char) => (
                <button
                  key={char.id}
                  onClick={() => setSelectedChar(char.id)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                    selectedChar === char.id
                      ? "border border-zinc-600 bg-zinc-800 text-zinc-100"
                      : "border border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300"
                  }`}
                >
                  <User size={14} className="shrink-0" />
                  <div className="min-w-0">
                    <p className="truncate">{char.name}</p>
                    {char.description && (
                      <p className="truncate text-xs text-zinc-500">
                        {char.description}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* World preset selection */}
          <div>
            <label className="mb-2.5 flex items-center gap-1.5 text-xs font-medium text-zinc-400">
              <Globe size={12} />
              World Preset (optional)
            </label>
            <div className="space-y-1.5">
              <button
                onClick={() => setSelectedPreset(null)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                  selectedPreset === null
                    ? "border border-zinc-600 bg-zinc-800 text-zinc-100"
                    : "border border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300"
                }`}
              >
                <Globe size={14} className="shrink-0" />
                <span>No world preset</span>
              </button>
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setSelectedPreset(preset.id)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                    selectedPreset === preset.id
                      ? "border border-zinc-600 bg-zinc-800 text-zinc-100"
                      : "border border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300"
                  }`}
                >
                  <Globe size={14} className="shrink-0" />
                  <div className="min-w-0">
                    <p className="truncate">{preset.name}</p>
                    {preset.description && (
                      <p className="truncate text-xs text-zinc-500">
                        {preset.description}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-zinc-800 px-5 py-3.5">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleStart}
            className="rounded-lg bg-zinc-700 px-5 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-600 transition-colors"
          >
            Start Chat
          </button>
        </div>
      </div>
    </div>
  )
}
