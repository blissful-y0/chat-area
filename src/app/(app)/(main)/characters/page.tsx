"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Plus, Upload, Download, Trash2, MessageSquare, User } from "lucide-react"

interface CharacterSummary {
  id: string
  name: string
  description: string
  tags: string[]
  avatarAssetId: string | null
  specVersion: string
  createdAt: string
}

export default function CharactersPage() {
  const router = useRouter()
  const [characters, setCharacters] = useState<CharacterSummary[]>([])
  const [loading, setLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadCharacters = useCallback(async () => {
    try {
      const res = await fetch("/api/characters")
      const data = await res.json()
      if (data.success) {
        setCharacters(data.data)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCharacters()
  }, [loadCharacters])

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/characters/import", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (data.success) {
        await loadCharacters()
      }
    } catch {
      // silently fail
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`"${name}" 캐릭터를 삭제하시겠습니까?`)) return

    try {
      await fetch(`/api/characters/${id}`, { method: "DELETE" })
      setCharacters((prev) => prev.filter((c) => c.id !== id))
    } catch {
      // silently fail
    }
  }

  async function handleExport(id: string) {
    const link = document.createElement("a")
    link.href = `/api/characters/${id}/export?format=png`
    link.download = ""
    link.click()
  }

  async function handleStartChat(characterId: string) {
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId }),
      })
      const data = await res.json()
      if (data.success) {
        router.push(`/chat/${data.data.id}`)
      }
    } catch {
      // silently fail
    }
  }

  return (
    <>
      <Header title="Characters" />
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-zinc-100">
              캐릭터 갤러리
            </h2>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.json,.charx"
                onChange={handleImport}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 transition-colors"
              >
                <Upload size={14} />
                임포트
              </button>
              <button
                onClick={() => router.push("/characters/new")}
                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 transition-colors"
              >
                <Plus size={14} />
                새 캐릭터
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-zinc-500">로딩 중...</div>
          ) : characters.length === 0 ? (
            <div className="text-center py-12">
              <User size={40} className="mx-auto text-zinc-600 mb-3" />
              <p className="text-zinc-400">아직 캐릭터가 없습니다</p>
              <p className="text-sm text-zinc-500 mt-1">
                캐릭터를 임포트하거나 새로 만들어보세요
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {characters.map((char) => (
                <div
                  key={char.id}
                  className="group relative rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden hover:border-zinc-700 transition-colors"
                >
                  <div
                    className="aspect-[3/4] cursor-pointer"
                    onClick={() => router.push(`/characters/${char.id}`)}
                  >
                    {char.avatarAssetId ? (
                      <img
                        src={`/api/assets/${char.avatarAssetId}`}
                        alt={char.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-zinc-800">
                        <User size={48} className="text-zinc-600" />
                      </div>
                    )}
                  </div>

                  <div className="p-3.5">
                    <h3
                      className="font-medium text-sm text-zinc-100 truncate cursor-pointer hover:text-zinc-300"
                      onClick={() => router.push(`/characters/${char.id}`)}
                    >
                      {char.name}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
                      {char.description || "설명 없음"}
                    </p>

                    {char.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {char.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleStartChat(char.id)}
                      className="rounded-lg bg-zinc-900/80 p-2 text-zinc-400 hover:text-zinc-100 backdrop-blur-sm"
                      title="채팅 시작"
                    >
                      <MessageSquare size={14} />
                    </button>
                    <button
                      onClick={() => handleExport(char.id)}
                      className="rounded-lg bg-zinc-900/80 p-2 text-zinc-400 hover:text-zinc-100 backdrop-blur-sm"
                      title="익스포트"
                    >
                      <Download size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(char.id, char.name)}
                      className="rounded-lg bg-zinc-900/80 p-2 text-zinc-400 hover:text-red-400 backdrop-blur-sm"
                      title="삭제"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
