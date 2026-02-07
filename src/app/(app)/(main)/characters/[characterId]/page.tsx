"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { EditorForm } from "@/components/character/editor-form"

interface CharacterData {
  id: string
  name: string
  description: string
  personality: string
  scenario: string
  firstMessage: string
  messageExample: string
  systemPrompt: string
  creatorNotes: string
  tags: string[]
  avatarAssetId: string | null
}

export default function EditCharacterPage({
  params,
}: {
  params: Promise<{ characterId: string }>
}) {
  const { characterId } = use(params)
  const router = useRouter()
  const [character, setCharacter] = useState<CharacterData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/characters/${characterId}`)
        const data = await res.json()
        if (data.success) {
          setCharacter(data.data)
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [characterId])

  async function handleSave(
    data: Parameters<React.ComponentProps<typeof EditorForm>["onSave"]>[0],
    avatarFile: File | null
  ) {
    setSaving(true)
    try {
      if (avatarFile) {
        const formData = new FormData()
        formData.append("file", avatarFile)
        const assetRes = await fetch("/api/assets", {
          method: "POST",
          body: formData,
        })
        const assetData = await assetRes.json()
        if (assetData.success) {
          await fetch(`/api/characters/${characterId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ avatarAssetId: assetData.data.id }),
          })
        }
      }

      const res = await fetch(`/api/characters/${characterId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (result.success) {
        router.push("/characters")
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <Header title="캐릭터 편집" />
        <div className="flex-1 flex items-center justify-center text-zinc-500">
          로딩 중...
        </div>
      </>
    )
  }

  if (!character) {
    return (
      <>
        <Header title="캐릭터 편집" />
        <div className="flex-1 flex items-center justify-center text-zinc-500">
          캐릭터를 찾을 수 없습니다
        </div>
      </>
    )
  }

  return (
    <>
      <Header title={`${character.name} 편집`} />
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-4 py-6">
          <EditorForm
            initialData={character}
            avatarUrl={
              character.avatarAssetId
                ? `/api/assets/${character.avatarAssetId}`
                : null
            }
            onSave={handleSave}
            saving={saving}
          />
        </div>
      </div>
    </>
  )
}
