"use client"

import { useState, useRef } from "react"
import { Upload, User } from "lucide-react"

interface CharacterFormData {
  name: string
  description: string
  personality: string
  scenario: string
  firstMessage: string
  messageExample: string
  systemPrompt: string
  creatorNotes: string
  tags: string[]
}

interface EditorFormProps {
  initialData?: CharacterFormData
  avatarUrl?: string | null
  onSave: (data: CharacterFormData, avatarFile: File | null) => Promise<void>
  saving?: boolean
}

const TABS = [
  { id: "basic", label: "기본 정보" },
  { id: "personality", label: "성격" },
  { id: "messages", label: "메시지" },
  { id: "advanced", label: "고급" },
] as const

type TabId = (typeof TABS)[number]["id"]

const DEFAULT_DATA: CharacterFormData = {
  name: "",
  description: "",
  personality: "",
  scenario: "",
  firstMessage: "",
  messageExample: "",
  systemPrompt: "",
  creatorNotes: "",
  tags: [],
}

export function EditorForm({
  initialData,
  avatarUrl,
  onSave,
  saving,
}: EditorFormProps) {
  const [form, setForm] = useState<CharacterFormData>({
    ...DEFAULT_DATA,
    ...initialData,
  })
  const [activeTab, setActiveTab] = useState<TabId>("basic")
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    avatarUrl ?? null
  )
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [tagInput, setTagInput] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  function updateField<K extends keyof CharacterFormData>(
    key: K,
    value: CharacterFormData[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  function handleAddTag() {
    const tag = tagInput.trim()
    if (tag && !form.tags.includes(tag)) {
      updateField("tags", [...form.tags, tag])
    }
    setTagInput("")
  }

  function handleRemoveTag(tag: string) {
    updateField(
      "tags",
      form.tags.filter((t) => t !== tag)
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await onSave(form, avatarFile)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar + Name row */}
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          <div
            className="h-24 w-24 rounded-xl overflow-hidden border border-zinc-700 cursor-pointer hover:border-zinc-600 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Avatar"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-zinc-800">
                <User size={32} className="text-zinc-600" />
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 rounded-full bg-zinc-700 p-1 text-zinc-300 hover:bg-zinc-600"
          >
            <Upload size={12} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>
        <div className="flex-1 space-y-2">
          <label className="block text-sm font-medium text-zinc-300">
            이름 *
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            required
            className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
            placeholder="캐릭터 이름"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-800">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 text-sm transition-colors ${
              activeTab === tab.id
                ? "border-b-2 border-zinc-100 text-zinc-100"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="space-y-4">
        {activeTab === "basic" && (
          <>
            <TextArea
              label="설명"
              value={form.description}
              onChange={(v) => updateField("description", v)}
              placeholder="캐릭터 설명 (외모, 배경 등)"
              rows={6}
            />
            <TextArea
              label="시나리오"
              value={form.scenario}
              onChange={(v) => updateField("scenario", v)}
              placeholder="RP 시나리오 설정"
              rows={4}
            />
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-300">
                태그
              </label>
              <div className="flex flex-wrap gap-1 mb-2">
                {form.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-zinc-500 hover:text-zinc-300"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddTag()
                    }
                  }}
                  className="flex-1 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
                  placeholder="태그 입력 후 Enter"
                />
              </div>
            </div>
          </>
        )}

        {activeTab === "personality" && (
          <>
            <TextArea
              label="성격"
              value={form.personality}
              onChange={(v) => updateField("personality", v)}
              placeholder="캐릭터 성격 특성"
              rows={6}
            />
          </>
        )}

        {activeTab === "messages" && (
          <>
            <TextArea
              label="첫 메시지"
              value={form.firstMessage}
              onChange={(v) => updateField("firstMessage", v)}
              placeholder="채팅 시작 시 캐릭터의 첫 메시지"
              rows={6}
            />
            <TextArea
              label="대화 예시"
              value={form.messageExample}
              onChange={(v) => updateField("messageExample", v)}
              placeholder="<START>\n{{user}}: 안녕!\n{{char}}: 반가워요!"
              rows={8}
            />
          </>
        )}

        {activeTab === "advanced" && (
          <>
            <TextArea
              label="시스템 프롬프트"
              value={form.systemPrompt}
              onChange={(v) => updateField("systemPrompt", v)}
              placeholder="LLM에 전달할 시스템 프롬프트"
              rows={6}
            />
            <TextArea
              label="크리에이터 노트"
              value={form.creatorNotes}
              onChange={(v) => updateField("creatorNotes", v)}
              placeholder="사용자를 위한 참고사항"
              rows={4}
            />
          </>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving || !form.name.trim()}
          className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-50 transition-colors"
        >
          {saving ? "저장 중..." : "저장"}
        </button>
      </div>
    </form>
  )
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-zinc-300">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600 resize-y"
      />
    </div>
  )
}
