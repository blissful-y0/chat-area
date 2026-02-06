"use client"

import { PanelLeft } from "lucide-react"
import { useUiStore } from "@/stores/ui-store"

interface HeaderProps {
  title?: string
}

export function Header({ title }: HeaderProps) {
  const { toggleSidebar } = useUiStore()

  return (
    <header className="flex h-12 items-center gap-3 border-b border-zinc-800 px-4">
      <button
        onClick={toggleSidebar}
        className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
        aria-label="Toggle sidebar"
      >
        <PanelLeft size={18} />
      </button>
      {title && (
        <h1 className="text-sm font-medium text-zinc-200 truncate">
          {title}
        </h1>
      )}
    </header>
  )
}
