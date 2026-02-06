"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { EditorForm } from "@/components/character/editor-form"

export default function NewCharacterPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  async function handleSave(
    data: Parameters<React.ComponentProps<typeof EditorForm>["onSave"]>[0],
    avatarFile: File | null
  ) {
    setSaving(true)
    try {
      let avatarAssetId: string | null = null

      if (avatarFile) {
        const formData = new FormData()
        formData.append("file", avatarFile)
        const assetRes = await fetch("/api/assets", {
          method: "POST",
          body: formData,
        })
        const assetData = await assetRes.json()
        if (assetData.success) {
          avatarAssetId = assetData.data.id
        }
      }

      const res = await fetch("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, avatarAssetId }),
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

  return (
    <>
      <Header title="새 캐릭터" />
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-4 py-6">
          <EditorForm onSave={handleSave} saving={saving} />
        </div>
      </div>
    </>
  )
}
