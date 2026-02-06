"use client"

import { useState, useEffect, useCallback } from "react"
import { Header } from "@/components/layout/header"
import { Save, Eye, EyeOff } from "lucide-react"

interface SettingRow {
  key: string
  label: string
  type: "api_key" | "text" | "select"
  options?: { value: string; label: string }[]
}

const SETTINGS: SettingRow[] = [
  { key: "openai_api_key", label: "OpenAI API Key", type: "api_key" },
  { key: "anthropic_api_key", label: "Anthropic API Key", type: "api_key" },
  { key: "google_api_key", label: "Google API Key", type: "api_key" },
  { key: "openrouter_api_key", label: "OpenRouter API Key", type: "api_key" },
  {
    key: "default_provider",
    label: "Default Provider",
    type: "select",
    options: [
      { value: "openai", label: "OpenAI" },
      { value: "anthropic", label: "Anthropic" },
      { value: "google", label: "Google" },
      { value: "openrouter", label: "OpenRouter" },
    ],
  },
  { key: "default_model", label: "Default Model", type: "text" },
  { key: "display_name", label: "Display Name", type: "text" },
]

export default function SettingsPage() {
  const [values, setValues] = useState<Record<string, string>>({})
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/settings")
        const data = await res.json()
        if (data.success) {
          const map: Record<string, string> = {}
          for (const s of data.data) {
            map[s.key] = s.value
          }
          setValues(map)
        }
      } catch {
        // silently fail
      }
    }
    load()
  }, [])

  const handleSave = useCallback(async (key: string, value: string) => {
    setSaving((prev) => ({ ...prev, [key]: true }))
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      })
      const data = await res.json()
      if (data.success) {
        setSaved((prev) => ({ ...prev, [key]: true }))
        setTimeout(() => setSaved((prev) => ({ ...prev, [key]: false })), 2000)
      }
    } catch {
      // silently fail
    } finally {
      setSaving((prev) => ({ ...prev, [key]: false }))
    }
  }, [])

  return (
    <>
      <Header title="Settings" />
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
          <section>
            <h2 className="text-lg font-medium text-zinc-100">API Keys</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Configure your LLM provider API keys. Keys are encrypted at rest.
            </p>
          </section>

          <div className="space-y-4">
            {SETTINGS.map((setting) => (
              <div key={setting.key} className="space-y-1.5">
                <label className="block text-sm font-medium text-zinc-300">
                  {setting.label}
                </label>
                <div className="flex items-center gap-2">
                  {setting.type === "select" ? (
                    <select
                      value={values[setting.key] ?? ""}
                      onChange={(e) =>
                        setValues((prev) => ({
                          ...prev,
                          [setting.key]: e.target.value,
                        }))
                      }
                      className="flex-1 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
                    >
                      <option value="">Select...</option>
                      {setting.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="relative flex-1">
                      <input
                        type={
                          setting.type === "api_key" && !showKeys[setting.key]
                            ? "password"
                            : "text"
                        }
                        value={values[setting.key] ?? ""}
                        onChange={(e) =>
                          setValues((prev) => ({
                            ...prev,
                            [setting.key]: e.target.value,
                          }))
                        }
                        placeholder={
                          setting.type === "api_key"
                            ? "sk-..."
                            : `Enter ${setting.label.toLowerCase()}`
                        }
                        className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 pr-10 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
                      />
                      {setting.type === "api_key" && (
                        <button
                          onClick={() =>
                            setShowKeys((prev) => ({
                              ...prev,
                              [setting.key]: !prev[setting.key],
                            }))
                          }
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                          type="button"
                        >
                          {showKeys[setting.key] ? (
                            <EyeOff size={14} />
                          ) : (
                            <Eye size={14} />
                          )}
                        </button>
                      )}
                    </div>
                  )}
                  <button
                    onClick={() =>
                      handleSave(setting.key, values[setting.key] ?? "")
                    }
                    disabled={saving[setting.key]}
                    className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 transition-colors"
                  >
                    {saved[setting.key] ? (
                      "Saved"
                    ) : saving[setting.key] ? (
                      "..."
                    ) : (
                      <Save size={14} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
